#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando deploy para Vercel...\n');

// Verificar se está logado no Vercel
try {
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('✅ Logado no Vercel');
} catch (error) {
    console.log('❌ Não logado no Vercel. Execute: vercel login');
    process.exit(1);
}

// Verificar arquivos necessários
const requiredFiles = [
    'vercel.json',
    'api/index.js',
    '.vercelignore',
    'package.json'
];

console.log('\n📋 Verificando arquivos necessários...');
for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - ARQUIVO OBRIGATÓRIO AUSENTE!`);
        process.exit(1);
    }
}

// Verificar variáveis de ambiente
console.log('\n🔧 Verificando variáveis de ambiente...');
const requiredEnvs = [
    'MP_ACCESS_TOKEN',
    'MP_USER_ID', 
    'MP_APPLICATION_ID',
    'ADMIN_NUMBERS'
];

const envExample = fs.readFileSync('.env.example', 'utf8');
for (const env of requiredEnvs) {
    if (envExample.includes(env)) {
        console.log(`✅ ${env} definido em .env.example`);
    } else {
        console.log(`⚠️ ${env} não encontrado em .env.example`);
    }
}

// Executar testes básicos
console.log('\n🧪 Executando testes básicos...');
try {
    // Verificar sintaxe dos arquivos principais
    require('./api/index.js');
    console.log('✅ api/index.js - sintaxe OK');
    
    require('./src/bot/BarberBot.js');
    console.log('✅ BarberBot.js - sintaxe OK');
    
    require('./src/database/Database.js');
    console.log('✅ Database.js - sintaxe OK');
    
} catch (error) {
    console.log('❌ Erro de sintaxe:', error.message);
    process.exit(1);
}

// Deploy
console.log('\n🚀 Iniciando deploy...');
try {
    const deployOutput = execSync('vercel --prod --yes', { 
        encoding: 'utf8',
        stdio: 'pipe'
    });
    
    // Extrair URL do deploy
    const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
    const deployUrl = urlMatch ? urlMatch[0] : 'URL não encontrada';
    
    console.log('✅ Deploy realizado com sucesso!');
    console.log(`🌐 URL: ${deployUrl}`);
    
    // Instruções pós-deploy
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Configure as variáveis de ambiente no dashboard do Vercel');
    console.log('2. Acesse: ' + deployUrl + '/qr');
    console.log('3. Escaneie o QR Code com WhatsApp');
    console.log('4. Configure webhook do Mercado Pago: ' + deployUrl + '/webhook/mercadopago');
    console.log('5. Teste o sistema enviando uma mensagem');
    
    console.log('\n🔧 VARIÁVEIS NECESSÁRIAS NO VERCEL:');
    requiredEnvs.forEach(env => {
        console.log(`- ${env}`);
    });
    console.log('- WEBHOOK_URL=' + deployUrl);
    
} catch (error) {
    console.log('❌ Erro no deploy:', error.message);
    process.exit(1);
}

console.log('\n🎉 Deploy concluído com sucesso!');
console.log('📚 Consulte DEPLOY_VERCEL.md para mais detalhes');