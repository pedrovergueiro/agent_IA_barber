# 🚀 Guia de Instalação - BarberBot AI

> **Instalação completa em 10 minutos!** Siga este guia passo a passo para ter seu bot funcionando.

---

## 📋 **Pré-requisitos**

### ✅ **Obrigatórios:**
- **Node.js 16+** - [Download aqui](https://nodejs.org)
- **NPM ou Yarn** - Vem com Node.js
- **Conta Mercado Pago** - [Criar conta](https://mercadopago.com.br)
- **WhatsApp Business** - [Download](https://business.whatsapp.com)

### 🔧 **Verificar instalação:**
```bash
node --version    # v16.0.0 ou superior
npm --version     # 8.0.0 ou superior
```

---

## 🎯 **Instalação Rápida**

### 1️⃣ **Clone o Repositório**
```bash
# Via HTTPS
git clone https://github.com/pedrovergueiro/agent_IA_barber.git

# Via SSH (se configurado)
git clone git@github.com:pedrovergueiro/agent_IA_barber.git

# Entrar na pasta
cd agent_IA_barber
```

### 2️⃣ **Instalar Dependências**
```bash
# Com NPM
npm install

# Com Yarn (alternativo)
yarn install
```

### 3️⃣ **Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
# ou
code .env
```

### 4️⃣ **Configurar .env**
```env
# 🏦 MERCADO PAGO (OBRIGATÓRIO)
MP_ACCESS_TOKEN=APP_USR-seu-access-token-aqui
MP_PUBLIC_KEY=APP_USR-sua-public-key-aqui

# ⚙️ CONFIGURAÇÕES DO SERVIDOR
PORT=3000
NODE_ENV=development
WEBHOOK_URL=http://localhost:3000

# 🗄️ BANCO DE DADOS (OPCIONAL)
DATABASE_PATH=./data/barber.db

# 🔐 ADMIN (OPCIONAL)
ADMIN_PASSWORD=admin123
```

### 5️⃣ **Executar o Sistema**
```bash
# Desenvolvimento
npm run dev

# Produção
npm start

# Com PM2 (recomendado para produção)
npm install -g pm2
pm2 start src/index.js --name "barber-bot"
```

### 6️⃣ **Conectar WhatsApp**
1. **Acesse**: `http://localhost:3000/qr`
2. **Abra WhatsApp** no celular
3. **Vá em**: Configurações → Aparelhos Conectados
4. **Toque**: "Conectar um aparelho"
5. **Escaneie** o QR Code da tela
6. **Aguarde** confirmação de conexão

---

## 🔧 **Configuração do Mercado Pago**

### 📝 **Obter Credenciais:**

1. **Acesse**: [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
2. **Faça login** com sua conta
3. **Vá em**: "Suas integrações"
4. **Clique**: "Criar aplicação"
5. **Preencha** os dados:
   - **Nome**: BarberBot AI
   - **Categoria**: Serviços
   - **Modelo**: Marketplace
6. **Anote** as credenciais:
   - **Access Token**: `APP_USR-xxxxxxxxx`
   - **Public Key**: `APP_USR-xxxxxxxxx`

### 🔗 **Configurar Webhook (Opcional):**
```
URL: https://seu-dominio.com/webhook/mercadopago
Eventos: payment.created, payment.updated
```

### 🧪 **Testar Credenciais:**
```bash
# Executar teste
npm run test:payment

# Ou manualmente
curl -X GET \
  'https://api.mercadopago.com/v1/payment_methods' \
  -H 'Authorization: Bearer SEU_ACCESS_TOKEN'
```

---

## 🗄️ **Configuração do Banco de Dados**

### 📊 **SQLite (Padrão):**
```bash
# Criar estrutura do banco
npm run db:setup

# Verificar tabelas
npm run db:check
```

### 🔄 **Migração de Dados:**
```bash
# Backup do banco atual
cp data/barber.db data/barber_backup.db

# Executar migrações
npm run db:migrate
```

---

## 🎛️ **Configuração Inicial do Admin**

### 🔐 **Primeiro Acesso:**
1. **Envie** `/admin` para o WhatsApp conectado
2. **Digite** a senha: `admin123`
3. **Acesse** o painel administrativo

### ⚙️ **Configurações Essenciais:**

#### 🏪 **Informações da Barbearia:**
```
NOME Paulinho Barbearia
ENDERECO Rua Antônio Scodeler, 885 - Faisqueira
CIDADE Pouso Alegre/MG
CEP 37555-100
TELEFONE (35) 99999-9999
```

#### 🕐 **Horários de Funcionamento:**
```
HORARIO 1 09:00-12:00 13:00-20:00  # Segunda
HORARIO 2 09:00-12:00 13:00-14:00  # Terça
HORARIO 3 09:00-12:00 13:00-20:00  # Quarta
HORARIO 4 09:00-12:00 13:00-20:00  # Quinta
HORARIO 5 09:00-12:00 13:00-20:00  # Sexta
HORARIO 6 09:00-12:00 12:00-15:00  # Sábado
HORARIO 0                          # Domingo (fechado)
```

#### ✂️ **Serviços Populares:**
```
POPULAR 7   # Corte Degradê
POPULAR 10  # Corte + Barba
POPULAR 2   # Barba
POPULAR 14  # Sobrancelha
```

---

## 🔍 **Verificação da Instalação**

### ✅ **Checklist de Funcionamento:**

- [ ] **Servidor rodando** em `http://localhost:3000`
- [ ] **QR Code** aparece em `/qr`
- [ ] **WhatsApp conectado** (sem erros no console)
- [ ] **Banco de dados** criado em `data/barber.db`
- [ ] **Admin panel** acessível via `/admin`
- [ ] **Mercado Pago** configurado (teste de pagamento)

### 🧪 **Testes Básicos:**

#### 1. **Teste de Conexão:**
```bash
curl http://localhost:3000/status
# Resposta esperada: {"status": "ok", "whatsapp": "connected"}
```

#### 2. **Teste do Bot:**
- Envie "oi" para o WhatsApp
- Deve receber menu de boas-vindas

#### 3. **Teste de Agendamento:**
- Faça um agendamento completo
- Verifique se aparece no painel admin

#### 4. **Teste de Pagamento:**
- Use credenciais de teste do Mercado Pago
- Simule um pagamento PIX

---

## 🚨 **Solução de Problemas**

### ❌ **Problemas Comuns:**

#### **1. Erro: "Cannot find module"**
```bash
# Solução: Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

#### **2. WhatsApp não conecta**
```bash
# Solução: Limpar cache
rm -rf .wwebjs_auth .wwebjs_cache
npm restart
```

#### **3. Erro de permissão no banco**
```bash
# Solução: Ajustar permissões
chmod 755 data/
chmod 644 data/barber.db
```

#### **4. Mercado Pago retorna erro**
```bash
# Verificar credenciais
echo $MP_ACCESS_TOKEN
# Deve começar com APP_USR-
```

### 📞 **Suporte:**
- 🐛 **Issues**: [GitHub Issues](https://github.com/pedrovergueiro/agent_IA_barber/issues)
- 📧 **Email**: suporte@barberbotai.com
- 📱 **WhatsApp**: (35) 99999-9999

---

## 🎯 **Próximos Passos**

### 🚀 **Após Instalação:**
1. 📖 **Leia**: [DEPLOYMENT.md](DEPLOYMENT.md) para produção
2. 🎨 **Personalize**: [CUSTOMIZATION.md](CUSTOMIZATION.md) para ajustes
3. 📊 **Configure**: Relatórios e métricas
4. 🔔 **Ative**: Sistema de lembretes
5. 🎯 **Otimize**: IA e recomendações

### 💡 **Dicas Importantes:**
- 🔄 **Backup regular** do banco de dados
- 📊 **Monitor** logs de erro
- 🔐 **Altere** senha padrão do admin
- 🌐 **Configure** domínio para produção
- 📱 **Teste** em diferentes dispositivos

---

<div align="center">

### ✅ **Instalação Concluída!**

**Seu BarberBot AI está pronto para revolucionar sua barbearia!**

[![Próximo: Deploy](https://img.shields.io/badge/Próximo-Deploy_em_Produção-blue?style=for-the-badge)](DEPLOYMENT.md)
[![Suporte](https://img.shields.io/badge/Precisa_de_Ajuda-Suporte-green?style=for-the-badge)](https://wa.me/5535999999999)

</div>