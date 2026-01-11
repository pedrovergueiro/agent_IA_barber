#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`
🏪 ===============================================
   CONFIGURAÇÃO AUTOMÁTICA - AGENT IA BARBER
===============================================

Este script vai configurar seu sistema automaticamente.
Tenha em mãos suas credenciais do Mercado Pago.

`);

const config = {};

function pergunta(texto) {
    return new Promise((resolve) => {
        rl.question(texto, (resposta) => {
            resolve(resposta.trim());
        });
    });
}

async function coletarDados() {
    console.log('📋 DADOS DA BARBEARIA\n');
    
    config.businessName = await pergunta('🏪 Nome da barbearia: ');
    config.businessAddress = await pergunta('📍 Endereço completo: ');
    config.businessCity = await pergunta('🏙️  Cidade: ');
    config.businessCep = await pergunta('📮 CEP: ');
    config.businessPhone = await pergunta('📞 Telefone: ');
    
    console.log('\n💳 CREDENCIAIS MERCADO PAGO\n');
    console.log('ℹ️  Obtenha em: https://www.mercadopago.com.br/developers/panel/app\n');
    
    config.mpAccessToken = await pergunta('🔑 Access Token: ');
    config.mpUserId = await pergunta('👤 User ID: ');
    config.mpApplicationId = await pergunta('📱 Application ID: ');
    
    console.log('\n🔐 CONFIGURAÇÕES DE SEGURANÇA\n');
    
    const senhaAdmin = await pergunta('🔒 Senha do admin (deixe vazio para "admin123"): ');
    config.adminPassword = senhaAdmin || 'admin123';
}

function criarEnv() {
    const envContent = `# Configuração do Agent IA Barber
# Gerado automaticamente em ${new Date().toLocaleString('pt-BR')}

# Mercado Pago (OBRIGATÓRIO)
MP_ACCESS_TOKEN=${config.mpAccessToken}
MP_USER_ID=${config.mpUserId}
MP_APPLICATION_ID=${config.mpApplicationId}

# Configuração do servidor
PORT=3000
NODE_ENV=production

# Webhook (será configurado automaticamente)
WEBHOOK_URL=https://seu-dominio.vercel.app
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Arquivo .env criado com sucesso!');
}

function criarSettings() {
    const settings = {
        businessInfo: {
            name: config.businessName,
            address: config.businessAddress,
            city: config.businessCity,
            cep: config.businessCep,
            phone: config.businessPhone
        },
        adminPassword: config.adminPassword,
        services: [
            {
                id: 1,
                name: "Corte Simples",
                price: "R$ 25,00",
                popular: true
            },
            {
                id: 2,
                name: "Corte + Barba",
                price: "R$ 45,00",
                popular: true
            },
            {
                id: 3,
                name: "Barba",
                price: "R$ 20,00",
                popular: false
            },
            {
                id: 4,
                name: "Sobrancelha",
                price: "R$ 10,00",
                popular: false
            }
        ],
        schedule: {
            1: { name: "Segunda-feira", periods: [{ start: "08:00", end: "18:00" }] },
            2: { name: "Terça-feira", periods: [{ start: "08:00", end: "18:00" }] },
            3: { name: "Quarta-feira", periods: [{ start: "08:00", end: "18:00" }] },
            4: { name: "Quinta-feira", periods: [{ start: "08:00", end: "18:00" }] },
            5: { name: "Sexta-feira", periods: [{ start: "08:00", end: "18:00" }] },
            6: { name: "Sábado", periods: [{ start: "08:00", end: "17:00" }] },
            0: { name: "Domingo", periods: [] }
        },
        messages: {
            welcome: [
                "Oi! Bem-vindo! 😊",
                "E aí! Que bom te ver aqui! 👋",
                "Olá! Como posso te ajudar hoje? 😄"
            ],
            thinking: [
                "Deixa eu ver aqui... 🤔",
                "Aguarda só um segundinho... ⏰",
                "Vou verificar para você... 🔍"
            ],
            success: [
                "Perfeito! 👌",
                "Ótima escolha! 🎯",
                "Excelente! ✨"
            ],
            error: [
                "Opa! Algo deu errado... 😅",
                "Eita! Tenta de novo aí! 🤦‍♂️",
                "Putz! Vamos tentar novamente? 😬"
            ]
        }
    };

    // Criar diretório data se não existir
    if (!fs.existsSync('data')) {
        fs.mkdirSync('data');
    }

    fs.writeFileSync('data/settings.json', JSON.stringify(settings, null, 2));
    console.log('✅ Configurações da barbearia salvas!');
}

function criarVercelJson() {
    const vercelConfig = {
        "version": 2,
        "builds": [
            {
                "src": "api/index.js",
                "use": "@vercel/node"
            }
        ],
        "routes": [
            {
                "src": "/(.*)",
                "dest": "/api/index.js"
            }
        ],
        "env": {
            "MP_ACCESS_TOKEN": "@mp_access_token",
            "MP_USER_ID": "@mp_user_id", 
            "MP_APPLICATION_ID": "@mp_application_id"
        }
    };

    fs.writeFileSync('vercel.json', JSON.stringify(vercelConfig, null, 2));
    console.log('✅ Configuração do Vercel criada!');
}

function mostrarProximosPassos() {
    console.log(`
🎉 ===============================================
   CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!
===============================================

📋 PRÓXIMOS PASSOS:

1. 🚀 DEPLOY NO VERCEL:
   • Acesse: https://vercel.com
   • Conecte este repositório
   • Configure as variáveis de ambiente:
     - MP_ACCESS_TOKEN: ${config.mpAccessToken}
     - MP_USER_ID: ${config.mpUserId}
     - MP_APPLICATION_ID: ${config.mpApplicationId}

2. 📱 CONECTAR WHATSAPP:
   • Acesse: https://seu-projeto.vercel.app/qr
   • Escaneie o QR Code
   • Aguarde confirmação de conexão

3. 🎛️ ACESSAR PAINEL ADMIN:
   • Digite /admin no WhatsApp
   • Senha: ${config.adminPassword}
   • Configure serviços e horários

4. 💳 TESTAR PAGAMENTOS:
   • Faça um agendamento teste
   • Verifique se o PIX é gerado
   • Confirme o pagamento

📞 SUPORTE:
   • WhatsApp: [Seu número de suporte]
   • Email: [Seu email de suporte]
   • Documentação: README.md

🏪 BARBEARIA CONFIGURADA:
   • Nome: ${config.businessName}
   • Endereço: ${config.businessAddress}
   • Telefone: ${config.businessPhone}

✅ Sistema pronto para uso!

===============================================
`);
}

async function main() {
    try {
        await coletarDados();
        
        console.log('\n🔧 Criando arquivos de configuração...\n');
        
        criarEnv();
        criarSettings();
        criarVercelJson();
        
        mostrarProximosPassos();
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error.message);
    } finally {
        rl.close();
    }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main };