const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const BarberBot = require('../src/bot/BarberBot');
const Database = require('../src/database/Database');
const SmartReminders = require('../src/ai/SmartReminders');

const app = express();
app.use(express.json());

// Variáveis globais para manter estado
let client = null;
let bot = null;
let db = null;
let smartReminders = null;
let isInitialized = false;

// Inicializar sistema apenas uma vez
async function initializeSystem() {
    if (isInitialized) return;
    
    try {
        console.log('🚀 Inicializando sistema no Vercel...');
        
        // Inicializar banco de dados
        db = new Database();
        console.log('✅ Banco de dados inicializado');
        
        // Configurar cliente WhatsApp para Vercel
        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: '/tmp/.wwebjs_auth'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process',
                    '--disable-gpu'
                ]
            }
        });
        
        // Inicializar bot
        bot = new BarberBot(client, db);
        
        // Inicializar sistema de lembretes
        smartReminders = new SmartReminders(client, db);
        
        // Eventos do WhatsApp
        client.on('qr', (qr) => {
            console.log('📱 QR Code gerado para conexão');
            qrcode.generate(qr, { small: true });
            global.currentQR = qr;
            global.qrTimestamp = new Date();
        });
        
        client.on('ready', () => {
            console.log('✅ WhatsApp conectado no Vercel!');
            global.currentQR = null;
            smartReminders.startReminderService();
        });
        
        client.on('disconnected', (reason) => {
            console.log('❌ WhatsApp desconectado:', reason);
            // No Vercel, não tentamos reconectar automaticamente
            // pois as funções são stateless
        });
        
        client.on('message', async (message) => {
            if (!message.fromMe) {
                await bot.handleMessage(message);
            }
        });
        
        // Inicializar cliente
        await client.initialize();
        
        isInitialized = true;
        console.log('🎉 Sistema inicializado com sucesso no Vercel!');
        
    } catch (error) {
        console.error('❌ Erro ao inicializar sistema:', error);
        throw error;
    }
}

// Middleware para inicializar sistema
app.use(async (req, res, next) => {
    try {
        if (!isInitialized) {
            await initializeSystem();
        }
        next();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        res.status(500).json({ 
            error: 'Sistema em inicialização', 
            message: 'Tente novamente em alguns segundos' 
        });
    }
});

// Rota principal
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: '🤖 WhatsApp Barber Bot - Vercel Deploy',
        timestamp: new Date().toISOString(),
        endpoints: {
            status: '/status',
            qr: '/qr',
            webhook: '/webhook/mercadopago'
        }
    });
});

// Rota para visualizar QR Code
app.get('/qr', async (req, res) => {
    if (!global.currentQR) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>WhatsApp Bot - Vercel</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
                    .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .status { color: #28a745; font-size: 24px; margin-bottom: 20px; }
                    .info { color: #666; margin-bottom: 20px; }
                    .refresh { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
                    .vercel { background: #000; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🤖 WhatsApp Bot</h1>
                    <div class="vercel">Powered by Vercel</div>
                    <div class="status">✅ Conectado!</div>
                    <div class="info">O bot está funcionando normalmente na nuvem.</div>
                    <button class="refresh" onclick="location.reload()">🔄 Atualizar</button>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const qrSvg = await require('qrcode').toString(global.currentQR, { type: 'svg', width: 300 });
        
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
                    .vercel { background: #000; color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; margin-bottom: 20px; }
                </style>
                <script>
                    setTimeout(() => location.reload(), 30000);
                </script>
            </head>
            <body>
                <div class="container">
                    <div class="vercel">Powered by Vercel</div>
                    <h1>📱 Conectar WhatsApp</h1>
                    <div class="qr-code">${qrSvg}</div>
                    
                    <div class="instructions">
                        <strong>Como conectar:</strong>
                        <ol>
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Toque em "Mais opções" (⋮)</li>
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
    } catch (err) {
        res.status(500).send('Erro ao gerar QR Code: ' + err.message);
    }
});

// Webhook do Mercado Pago
app.post('/webhook/mercadopago', async (req, res) => {
    try {
        if (bot) {
            await bot.handlePaymentWebhook(req.body);
        }
        res.status(200).send('OK');
    } catch (error) {
        console.error('Erro no webhook:', error);
        res.status(500).send('Erro interno');
    }
});

// Status do sistema
app.get('/status', (req, res) => {
    const isConnected = client && client.info ? true : false;
    
    res.json({
        status: isConnected ? 'connected' : 'disconnected',
        hasQR: !!global.currentQR,
        timestamp: new Date().toISOString(),
        system: 'WhatsApp Barber Bot',
        platform: 'Vercel Serverless',
        qrUrl: global.currentQR ? '/qr' : null,
        initialized: isInitialized
    });
});

// Rota para forçar reconexão (limitada no Vercel)
app.post('/reconnect', async (req, res) => {
    try {
        if (client) {
            console.log('🔄 Tentando reconexão no Vercel...');
            await client.initialize();
            res.json({ success: true, message: 'Reconexão iniciada' });
        } else {
            res.json({ success: false, message: 'Cliente não inicializado' });
        }
    } catch (error) {
        console.error('Erro na reconexão:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Exportar para Vercel
module.exports = app;