#!/usr/bin/env node

const axios = require('axios');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const CHECK_INTERVAL = 30000; // 30 segundos

console.log('🔍 Monitor do WhatsApp Bot iniciado');
console.log(`📊 Verificando status a cada ${CHECK_INTERVAL/1000} segundos`);

async function checkStatus() {
    try {
        const response = await axios.get(`http://localhost:${PORT}/status`, { timeout: 5000 });
        const status = response.data;
        
        const timestamp = new Date().toLocaleString('pt-BR');
        
        if (status.status === 'connected') {
            console.log(`✅ [${timestamp}] WhatsApp conectado - Sistema funcionando`);
        } else if (status.hasQR) {
            console.log(`⏳ [${timestamp}] WhatsApp desconectado - QR Code disponível em: http://localhost:${PORT}/qr`);
        } else {
            console.log(`❌ [${timestamp}] WhatsApp desconectado - Tentando reconectar...`);
            
            // Tentar forçar reconexão
            try {
                await axios.post(`http://localhost:${PORT}/reconnect`);
                console.log(`🔄 [${timestamp}] Reconexão forçada iniciada`);
            } catch (reconnectError) {
                console.log(`⚠️ [${timestamp}] Erro ao forçar reconexão:`, reconnectError.message);
            }
        }
        
    } catch (error) {
        const timestamp = new Date().toLocaleString('pt-BR');
        
        if (error.code === 'ECONNREFUSED') {
            console.log(`🔴 [${timestamp}] Servidor offline - Tentando reiniciar...`);
            
            // Tentar reiniciar o servidor
            exec('npm start', (err, stdout, stderr) => {
                if (err) {
                    console.log(`❌ [${timestamp}] Erro ao reiniciar servidor:`, err.message);
                } else {
                    console.log(`🚀 [${timestamp}] Servidor reiniciado`);
                }
            });
            
        } else {
            console.log(`⚠️ [${timestamp}] Erro na verificação:`, error.message);
        }
    }
}

// Verificação inicial
checkStatus();

// Verificações periódicas
setInterval(checkStatus, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Monitor finalizado');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Monitor finalizado');
    process.exit(0);
});