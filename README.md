# 🤖 Bot WhatsApp - Barbearia

Agente de IA completo para WhatsApp para agendamento de serviços de barbearia com integração ao Mercado Pago.

## 🚀 Funcionalidades

- ✅ **Agendamento Inteligente**: Sistema completo de agendamento via WhatsApp
- 💳 **Pagamento Integrado**: Cobrança de 50% de sinal via Mercado Pago (PIX/Cartão)
- 📅 **Gestão de Horários**: Controle automático de disponibilidade
- 🗄️ **Banco de Dados**: Armazenamento de agendamentos e clientes
- 📱 **QR Code**: Geração automática para conexão WhatsApp
- 🔔 **Notificações**: Confirmação automática após pagamento

## 🏪 Serviços Disponíveis

| Serviço | Preço | Duração |
|---------|-------|---------|
| Alizamento Botox | A partir de R$ 50,00 | 30 min |
| Barba | R$ 25,00 | 20 min |
| Bigode | R$ 10,00 | 20 min |
| Corte + Barba + Pigmentação | R$ 75,00 | 30 min |
| Corte + Sobrancelha | R$ 45,00 | 30 min |
| Corte + Alizamento Botox | R$ 65,00 | 40 min |
| Corte Degradê | A partir de R$ 35,00 | 30 min |
| Corte Navalhado | R$ 40,00 | 30 min |
| Corte + Pigmentação | A partir de R$ 60,00 | 30 min |
| Corte + Barba (Sobrancelha cortesia) | R$ 60,00 | 30 min |
| Luzes (consultar valor) | A partir de R$ 0,00 | 70 min |
| Pacote Mensalista | R$ 0,00 | 30 min |
| Platinado (consultar valor) | A partir de R$ 0,00 | 90 min |
| Sobrancelha | R$ 10,00 | 15 min |

## 🕐 Horários de Funcionamento

- **Segunda-feira**: 09:00 - 12:00 | 13:00 - 20:00
- **Terça-feira**: 09:00 - 12:00 | 13:00 - 14:00
- **Quarta-feira**: 09:00 - 12:00 | 13:00 - 20:00
- **Quinta-feira**: 09:00 - 12:00 | 13:00 - 20:00
- **Sexta-feira**: 09:00 - 12:00 | 13:00 - 20:00
- **Sábado**: 09:00 - 12:00 | 12:00 - 15:00
- **Domingo**: FECHADO

## 📍 Localização

**Endereço**: Rua Antônio Scodeler, 885 - Faisqueira  
**Cidade**: Pouso Alegre/MG  
**CEP**: 37555-100

## ⚙️ Instalação

### 1. Clone o repositório
\`\`\`bash
git clone <repository-url>
cd whatsapp-barber-bot
\`\`\`

### 2. Instale as dependências
\`\`\`bash
npm install
\`\`\`

### 3. Configure as variáveis de ambiente
\`\`\`bash
cp .env.example .env
\`\`\`

Edite o arquivo \`.env\` com suas configurações:
\`\`\`env
MP_ACCESS_TOKEN=seu_access_token_do_mercado_pago
WEBHOOK_URL=https://seu-dominio.com
PORT=3000
\`\`\`

### 4. Execute o bot
\`\`\`bash
# Desenvolvimento
npm run dev

# Produção
npm start
\`\`\`

### 5. Conecte ao WhatsApp
1. Execute o bot
2. Escaneie o QR Code que aparecerá no terminal
3. Aguarde a confirmação de conexão

## 🔧 Configuração do Mercado Pago

### 1. Obtenha suas credenciais
- Acesse: https://www.mercadopago.com.br/developers
- Vá em "Suas integrações" > "Criar aplicação"
- Anote o **Access Token** e **Application ID**

### 2. Configure o Webhook
- URL do webhook: \`https://seu-dominio.com/webhook/mercadopago\`
- Eventos: \`payment\`

### 3. Credenciais fornecidas
- **User ID**: 804200106
- **Application ID**: 4385731270595563

## 📱 Como usar

### Para clientes:
1. Envie qualquer mensagem para o WhatsApp da barbearia
2. Escolha a opção "Agendar Serviço"
3. Selecione o serviço desejado
4. Escolha data e horário
5. Informe seu nome
6. Confirme o agendamento
7. Realize o pagamento de 50% via PIX ou cartão
8. Receba a confirmação automática

### Fluxo de conversa:
\`\`\`
Cliente: Oi
Bot: Bem-vindo! Como posso ajudar?
     1️⃣ Agendar Serviço
     2️⃣ Ver Horários
     3️⃣ Localização

Cliente: 1
Bot: Escolha o serviço:
     1️⃣ Corte Degradê - R$ 35,00
     2️⃣ Barba - R$ 25,00
     ...

Cliente: 1
Bot: Escolha a data:
     1️⃣ 11/01/2026 - Segunda
     2️⃣ 12/01/2026 - Terça
     ...
\`\`\`

## 🗄️ Estrutura do Banco de Dados

### Tabelas:
- **bookings**: Agendamentos
- **customers**: Clientes
- **payments**: Pagamentos
- **blocked_times**: Horários bloqueados

## 🔒 Segurança

- ✅ Validação de horários disponíveis
- ✅ Controle de sessões por usuário
- ✅ Verificação de pagamentos via webhook
- ✅ Prevenção de agendamentos duplicados
- ✅ Timeout de pagamento (30 minutos)

## 📊 Recursos Avançados

### Gestão de Agendamentos:
- Verificação automática de disponibilidade
- Bloqueio de horários ocupados
- Histórico de agendamentos por cliente
- Status de pagamento em tempo real

### Pagamentos:
- PIX instantâneo
- Cartão de crédito/débito
- Cobrança de 50% de sinal
- Confirmação automática
- Sistema de reembolso

### Notificações:
- Confirmação de agendamento
- Status de pagamento
- Lembretes (futuro)

## 🚀 Deploy

### Heroku:
\`\`\`bash
heroku create seu-app-name
heroku config:set MP_ACCESS_TOKEN=seu_token
heroku config:set WEBHOOK_URL=https://seu-app.herokuapp.com
git push heroku main
\`\`\`

### VPS/Servidor:
\`\`\`bash
# Instalar PM2
npm install -g pm2

# Executar em produção
pm2 start src/index.js --name "barber-bot"
pm2 startup
pm2 save
\`\`\`

## 🛠️ Desenvolvimento

### Estrutura do projeto:
\`\`\`
src/
├── bot/
│   └── BarberBot.js          # Lógica principal do bot
├── data/
│   ├── Services.js           # Serviços disponíveis
│   └── Schedule.js           # Horários de funcionamento
├── database/
│   └── Database.js           # Gerenciamento do banco
├── payment/
│   └── MercadoPago.js        # Integração pagamentos
└── index.js                  # Arquivo principal
\`\`\`

### Adicionar novos serviços:
Edite \`src/data/Services.js\` e adicione:
\`\`\`javascript
{
    id: 15,
    name: 'Novo Serviço',
    price: 'R$ 30,00',
    duration: 25
}
\`\`\`

### Modificar horários:
Edite \`src/data/Schedule.js\` para alterar horários de funcionamento.

## 📞 Suporte

Para dúvidas ou problemas:
- 📱 WhatsApp: (35) 99999-9999
- 📧 Email: contato@barbearia.com
- 🏪 Endereço: Rua Antônio Scodeler, 885 - Pouso Alegre/MG

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para facilitar o agendamento na sua barbearia!**