require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const LanchoneteBot = require('./bot/LanchoneteBot');
const Database = require('./database/Database');

const app = express();
app.use(express.json());

console.log('🍕 Iniciando Bot da Lanchonete...');

// Inicializar banco de dados
const db = new Database();

// Configurar cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Inicializar bot
const bot = new LanchoneteBot(client, db);

// Eventos do WhatsApp
client.on('qr', (qr) => {
    console.log('📱 Escaneie o QR Code para conectar:');
    qrcode.generate(qr, { small: true });
    
    // Salvar QR code para acesso via web
    global.currentQR = qr;
    global.qrTimestamp = new Date();
    
    console.log('🌐 QR Code também disponível em: http://localhost:' + (process.env.PORT || 3001) + '/qr');
});

client.on('ready', () => {
    console.log('✅ Bot conectado ao WhatsApp!');
    console.log('🍕 Lanchonete - Sistema de Pedidos Ativo');
    console.log('🔧 Painel Admin: Digite /admin para acessar');
    console.log('📱 Delivery funcionando das 18:00 às 23:30');
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    console.log('🔄 Tentando reconectar...');
    
    setTimeout(() => {
        console.log('🔄 Reiniciando cliente WhatsApp...');
        client.initialize();
    }, 5000);
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
    console.log('📱 Será necessário escanear o QR Code novamente');
    
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

// Rota para visualizar QR Code
app.get('/qr', (req, res) => {
    if (!global.currentQR) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Lanchonete Bot - Status</title>
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
                    <h1>🍕 Lanchonete Bot</h1>
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
                <title>Lanchonete Bot - Conectar</title>
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

// Rota para status do sistema
app.get('/status', (req, res) => {
    const isConnected = client.info ? true : false;
    
    res.json({
        status: isConnected ? 'connected' : 'disconnected',
        hasQR: !!global.currentQR,
        timestamp: new Date().toISOString(),
        system: 'Lanchonete Bot WhatsApp',
        qrUrl: global.currentQR ? '/qr' : null
    });
});

// Inicializar aplicação
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

client.initialize();