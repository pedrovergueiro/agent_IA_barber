require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const BarberBot = require('./bot/BarberBot');
const Database = require('./database/Database');
const SmartReminders = require('./ai/SmartReminders');
const Scheduler = require('./utils/Scheduler');

const app = express();
app.use(express.json());

// Inicializar banco de dados
const db = new Database();

// Inicializar agendador de tarefas
const scheduler = new Scheduler(db);

// Configurar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Inicializar bot
const bot = new BarberBot(client, db);

// Inicializar sistema de lembretes inteligentes
const smartReminders = new SmartReminders(client, db);

// Eventos do WhatsApp
client.on('qr', (qr) => {
    console.log('📱 Escaneie o QR Code para conectar:');
    qrcode.generate(qr, { small: true });
    
    // Salvar QR code para acesso via web
    global.currentQR = qr;
    global.qrTimestamp = new Date();
    
    console.log('🌐 QR Code também disponível em: http://localhost:' + (process.env.PORT || 3000) + '/qr');
});

client.on('ready', () => {
    console.log('✅ Bot conectado ao WhatsApp!');
    console.log('🏪 Barbearia - Sistema de Agendamento Ativo');
    console.log('🔧 Painel Admin: Digite /admin para acessar');
    
    // Limpar QR code quando conectado
    global.currentQR = null;
    
    // Iniciar sistema de lembretes inteligentes
    smartReminders.startReminderService();
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    console.log('🔄 Tentando reconectar...');
    
    // Tentar reconectar após 5 segundos
    setTimeout(() => {
        console.log('🔄 Reiniciando cliente WhatsApp...');
        client.initialize();
    }, 5000);
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    console.log('📱 Será necessário escanear o QR Code novamente');
    
    // Reinicializar após falha de auth
    setTimeout(() => {
        client.initialize();
    }, 3000);
});

client.on('message', async (message) => {
    // Só responde mensagens recebidas (não enviadas pelo bot)
    if (!message.fromMe) {
        await bot.handleMessage(message);
    }
});

// Servidor web para webhooks do Mercado Pago
app.post('/webhook/mercadopago', (req, res) => {
    bot.handlePaymentWebhook(req.body);
    res.status(200).send('OK');
});

// Rota para visualizar QR Code
app.get('/qr', (req, res) => {
    if (!global.currentQR) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>WhatsApp Bot - Status</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .status { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                    .info { color: #666; margin-bottom: 20px; }
                    .refresh { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 WhatsApp Bot</h1>
                    <div class="status">✅ Conectado!</div>
                    <div class="info">O bot está funcionando normalmente.</div>
                    <button class="refresh" onclick="location.reload()">🔄 Atualizar</button>
                </div>
            </body>
            </html>
        `);
    }

    const qrSvg = require('qrcode').toString(global.currentQR, { type: 'svg', width: 300 });
    
    qrSvg.then(svg => {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>WhatsApp Bot - Conectar</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; background: #f5f5f5; }
                    .container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .qr-code { margin: 20px 0; }
                    .instructions { color: #666; margin: 20px 0; text-align: left; }
                    .refresh { background: #25d366; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 10px; }
                    .timestamp { color: #999; font-size: 12px; }
                </style>
                <script>
                    // Auto refresh a cada 30 segundos
                    setTimeout(() => location.reload(), 30000);
                </script>
            </head>
            <body>
                <div class="container">
                    <h1>📱 Conectar WhatsApp</h1>
                    <div class="qr-code">${svg}</div>
                    
                    <div class="instructions">
                        <strong>Como conectar:</strong>
                        <ol>
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Toque em "Mais opções" (⋮) ou "Configurações"</li>
                            <li>Toque em "Aparelhos conectados"</li>
                            <li>Toque em "Conectar um aparelho"</li>
                            <li>Aponte a câmera para este QR Code</li>
                        </ol>
                    </div>
                    
                    <button class="refresh" onclick="location.reload()">🔄 Atualizar QR Code</button>
                    
                    <div class="timestamp">
                        Gerado em: ${global.qrTimestamp ? global.qrTimestamp.toLocaleString('pt-BR') : 'Agora'}
                    </div>
                </div>
            </body>
            </html>
        `);
    }).catch(err => {
        res.send('Erro ao gerar QR Code: ' + err.message);
    });
});

// Rota para forçar reconexão
app.post('/reconnect', (req, res) => {
    console.log('🔄 Reconexão forçada via web...');
    
    try {
        client.destroy().then(() => {
            setTimeout(() => {
                client.initialize();
                res.json({ success: true, message: 'Reconexão iniciada' });
            }, 2000);
        });
    } catch (error) {
        client.initialize();
        res.json({ success: true, message: 'Reconexão iniciada (força bruta)' });
    }
});

// Rota para status do sistema
app.get('/status', (req, res) => {
    const isConnected = client.info ? true : false;
    
    res.json({
        status: isConnected ? 'connected' : 'disconnected',
        hasQR: !!global.currentQR,
        timestamp: new Date().toISOString(),
        system: 'Barbearia Bot WhatsApp',
        qrUrl: global.currentQR ? '/qr' : null
    });
});

// Inicializar aplicação
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

client.initialize();