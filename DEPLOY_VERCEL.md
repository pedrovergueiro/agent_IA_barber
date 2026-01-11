# 🚀 Deploy no Vercel - Guia Completo

## 📋 **Pré-requisitos**

### 1. **Conta no Vercel**
- Acesse: https://vercel.com
- Faça login com GitHub/GitLab/Bitbucket
- Instale Vercel CLI: `npm i -g vercel`

### 2. **Repositório Git**
- Código deve estar em repositório Git
- GitHub, GitLab ou Bitbucket
- Branch principal (main/master)

---

## 🛠️ **PASSO A PASSO - DEPLOY**

### **Método 1: Via Vercel Dashboard (Recomendado)**

#### 1. **Conectar Repositório**
1. Acesse https://vercel.com/dashboard
2. Clique em "New Project"
3. Conecte seu repositório Git
4. Selecione o repositório do bot

#### 2. **Configurar Projeto**
```
Project Name: whatsapp-barber-bot
Framework Preset: Other
Root Directory: ./
Build Command: (deixe vazio)
Output Directory: (deixe vazio)
Install Command: npm install
```

#### 3. **Variáveis de Ambiente**
Adicione estas variáveis no painel:

```env
MP_ACCESS_TOKEN=seu_token_real_aqui
MP_USER_ID=seu_user_id_aqui
MP_APPLICATION_ID=seu_application_id_aqui
WEBHOOK_URL=https://seu-app.vercel.app
NODE_ENV=production
VERCEL=1
ADMIN_PASSWORD=sua_senha_aqui
ADMIN_NUMBERS=5535999999999@c.us
```

#### 4. **Deploy**
- Clique em "Deploy"
- Aguarde o build (2-3 minutos)
- Acesse a URL gerada

### **Método 2: Via CLI**

```bash
# 1. Login no Vercel
vercel login

# 2. Deploy
vercel

# 3. Configurar variáveis
vercel env add MP_ACCESS_TOKEN
vercel env add MP_USER_ID
vercel env add MP_APPLICATION_ID
vercel env add WEBHOOK_URL
vercel env add ADMIN_PASSWORD
vercel env add ADMIN_NUMBERS

# 4. Deploy em produção
vercel --prod
```

---

## 🔧 **CONFIGURAÇÕES IMPORTANTES**

### **1. Webhook do Mercado Pago**
Após deploy, configure no Mercado Pago:
```
URL: https://seu-app.vercel.app/webhook/mercadopago
Eventos: payment
```

### **2. Números de Admin**
Formato correto:
```
ADMIN_NUMBERS=5535999999999@c.us,5535888888888@c.us
```

### **3. URL do Webhook**
Substitua pela URL real do Vercel:
```
WEBHOOK_URL=https://whatsapp-barber-bot.vercel.app
```

---

## 📱 **ACESSANDO O SISTEMA**

### **URLs Principais:**
- **Home**: `https://seu-app.vercel.app`
- **QR Code**: `https://seu-app.vercel.app/qr`
- **Status**: `https://seu-app.vercel.app/status`
- **Health**: `https://seu-app.vercel.app/health`

### **Primeira Conexão:**
1. Acesse: `https://seu-app.vercel.app/qr`
2. Escaneie QR Code com WhatsApp
3. Aguarde confirmação de conexão
4. Teste enviando mensagem para o bot

---

## ⚠️ **LIMITAÇÕES DO VERCEL**

### **1. Serverless Functions**
- Máximo 30 segundos por execução
- Sem estado persistente entre chamadas
- Reinicia a cada requisição

### **2. Armazenamento**
- Arquivos em `/tmp` são temporários
- Banco SQLite recriado a cada cold start
- Use banco externo para produção (recomendado)

### **3. WhatsApp Session**
- Sessão pode ser perdida em cold starts
- Necessário reconectar periodicamente
- QR Code pode ser solicitado frequentemente

---

## 🔄 **SOLUÇÕES PARA LIMITAÇÕES**

### **1. Banco de Dados Externo (Recomendado)**

#### **PlanetScale (MySQL):**
```bash
# Instalar
npm install @planetscale/database

# Configurar
PLANETSCALE_HOST=your-host
PLANETSCALE_USERNAME=your-username  
PLANETSCALE_PASSWORD=your-password
```

#### **Supabase (PostgreSQL):**
```bash
# Instalar
npm install @supabase/supabase-js

# Configurar
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

### **2. Manter Sessão Ativa**

#### **Cron Jobs (Vercel Pro):**
```javascript
// api/cron.js
export default function handler(req, res) {
    // Ping para manter ativo
    res.status(200).json({ status: 'alive' });
}
```

#### **External Monitoring:**
- UptimeRobot
- Pingdom  
- StatusCake

### **3. Armazenamento de Sessão**

#### **Redis (Upstash):**
```bash
npm install @upstash/redis

# Variáveis
UPSTASH_REDIS_REST_URL=your-url
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## 📊 **MONITORAMENTO NO VERCEL**

### **1. Logs em Tempo Real**
```bash
vercel logs --follow
```

### **2. Analytics**
- Acesse dashboard do Vercel
- Veja métricas de performance
- Monitor de erros integrado

### **3. Alertas**
- Configure notificações
- Slack/Discord/Email
- Erros e downtime

---

## 🚀 **OTIMIZAÇÕES PARA PRODUÇÃO**

### **1. Banco Externo**
```javascript
// Exemplo PlanetScale
const mysql = require('mysql2/promise');

const connection = mysql.createConnection({
    host: process.env.PLANETSCALE_HOST,
    username: process.env.PLANETSCALE_USERNAME,
    password: process.env.PLANETSCALE_PASSWORD,
    ssl: { rejectUnauthorized: true }
});
```

### **2. Cache Redis**
```javascript
// Exemplo Upstash
const { Redis } = require('@upstash/redis');

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

### **3. Webhook Reliability**
```javascript
// Retry logic
const retry = async (fn, retries = 3) => {
    try {
        return await fn();
    } catch (error) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 1000));
            return retry(fn, retries - 1);
        }
        throw error;
    }
};
```

---

## 🔧 **TROUBLESHOOTING**

### **❌ "Function timeout"**
**Solução:**
- Otimizar código
- Usar async/await corretamente
- Dividir em funções menores

### **❌ "WhatsApp desconecta sempre"**
**Solução:**
- Usar banco externo para sessão
- Implementar keep-alive
- Considerar VPS para WhatsApp

### **❌ "Webhook não funciona"**
**Solução:**
- Verificar URL no Mercado Pago
- Testar endpoint manualmente
- Verificar logs do Vercel

### **❌ "Banco de dados vazio"**
**Solução:**
- Migrar para banco externo
- Implementar seed automático
- Usar variáveis de ambiente

---

## 📈 **ESCALABILIDADE**

### **Vercel Pro Features:**
- Cron Jobs
- Edge Functions
- Analytics avançado
- Mais tempo de execução

### **Arquitetura Híbrida:**
- Vercel: API e webhooks
- VPS: WhatsApp client
- Banco: Externo (PlanetScale/Supabase)
- Cache: Redis (Upstash)

---

## 💰 **CUSTOS ESTIMADOS**

### **Vercel:**
- **Hobby**: Grátis (limitado)
- **Pro**: $20/mês (recomendado)

### **Banco Externo:**
- **PlanetScale**: $29/mês
- **Supabase**: $25/mês

### **Cache:**
- **Upstash Redis**: $0.2/100k requests

### **Total Estimado:** $50-75/mês

---

## ✅ **CHECKLIST DE DEPLOY**

- [ ] Repositório Git configurado
- [ ] Variáveis de ambiente definidas
- [ ] Webhook Mercado Pago configurado
- [ ] Números de admin corretos
- [ ] Deploy realizado com sucesso
- [ ] QR Code acessível
- [ ] WhatsApp conectado
- [ ] Teste de agendamento
- [ ] Webhook de pagamento testado
- [ ] Monitoramento configurado

---

## 🎉 **DEPLOY CONCLUÍDO!**

**URLs importantes:**
- **App**: https://seu-app.vercel.app
- **QR Code**: https://seu-app.vercel.app/qr
- **Admin**: Envie `/admin` no WhatsApp

**Próximos passos:**
1. Conectar WhatsApp via QR Code
2. Testar agendamento completo
3. Configurar monitoramento
4. Considerar banco externo para produção

**🚀 Seu bot está na nuvem e funcionando!**