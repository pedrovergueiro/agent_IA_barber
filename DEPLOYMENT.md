# 🌐 Guia de Deploy - BarberBot AI

> **Deploy profissional em produção!** Hospede seu bot na nuvem com alta disponibilidade e performance.

---

## 🎯 **Opções de Hospedagem**

<table>
<tr>
<td width="25%">

### 🚀 **Vercel**
**⭐ Recomendado para iniciantes**

✅ **Grátis**  
✅ **Deploy automático**  
✅ **SSL incluso**  
✅ **CDN global**  
❌ **Limitações serverless**

</td>
<td width="25%">

### 🚂 **Railway**
**⭐ Melhor custo-benefício**

✅ **$5/mês**  
✅ **Sempre online**  
✅ **Banco persistente**  
✅ **Logs detalhados**  
✅ **Fácil configuração**

</td>
<td width="25%">

### 🎨 **Render**
**⭐ Boa alternativa gratuita**

✅ **Plano gratuito**  
✅ **SSL automático**  
✅ **Deploy via Git**  
✅ **Monitoramento**  
❌ **Sleep após inatividade**

</td>
<td width="25%">

### 🖥️ **VPS**
**⭐ Máximo controle**

✅ **Controle total**  
✅ **Performance máxima**  
✅ **Escalabilidade**  
✅ **Sem limitações**  
❌ **Requer conhecimento**

</td>
</tr>
</table>

---

## 🚀 **Deploy no Vercel**

### 📋 **Pré-requisitos:**
- Conta no [Vercel](https://vercel.com)
- Repositório no GitHub
- Credenciais do Mercado Pago

### 🔧 **Configuração:**

#### 1️⃣ **Preparar o Projeto:**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Configurar projeto
vercel
```

#### 2️⃣ **Configurar vercel.json:**
```json
{
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
    "NODE_ENV": "production"
  }
}
```

#### 3️⃣ **Configurar Variáveis de Ambiente:**
```bash
# Via CLI
vercel env add MP_ACCESS_TOKEN
vercel env add MP_PUBLIC_KEY
vercel env add WEBHOOK_URL

# Ou via Dashboard Vercel
# Settings → Environment Variables
```

#### 4️⃣ **Deploy:**
```bash
# Deploy de produção
vercel --prod

# URL gerada: https://seu-projeto.vercel.app
```

### ⚙️ **Configurações Específicas:**
```env
# Vercel Environment Variables
MP_ACCESS_TOKEN=APP_USR-production-token
MP_PUBLIC_KEY=APP_USR-production-key
WEBHOOK_URL=https://seu-projeto.vercel.app
DATABASE_PATH=/tmp/barber.db
NODE_ENV=production
```

---

## 🚂 **Deploy no Railway**

### 📋 **Configuração:**

#### 1️⃣ **Conectar Repositório:**
1. Acesse [Railway](https://railway.app)
2. Clique "New Project"
3. Selecione "Deploy from GitHub repo"
4. Escolha seu repositório

#### 2️⃣ **Configurar Variáveis:**
```env
# Railway Environment Variables
MP_ACCESS_TOKEN=APP_USR-production-token
MP_PUBLIC_KEY=APP_USR-production-key
WEBHOOK_URL=https://seu-app.up.railway.app
PORT=3000
NODE_ENV=production
```

#### 3️⃣ **Configurar Build:**
```json
// package.json
{
  "scripts": {
    "build": "npm install",
    "start": "node src/index.js"
  }
}
```

#### 4️⃣ **Deploy Automático:**
- Push para `main` → Deploy automático
- Logs em tempo real
- Domínio personalizado disponível

---

## 🎨 **Deploy no Render**

### 📋 **Configuração:**

#### 1️⃣ **Criar Web Service:**
1. Acesse [Render](https://render.com)
2. Clique "New +" → "Web Service"
3. Conecte repositório GitHub

#### 2️⃣ **Configurações do Build:**
```
Build Command: npm install
Start Command: npm start
Environment: Node
```

#### 3️⃣ **Variáveis de Ambiente:**
```env
MP_ACCESS_TOKEN=APP_USR-production-token
MP_PUBLIC_KEY=APP_USR-production-key
WEBHOOK_URL=https://seu-app.onrender.com
NODE_ENV=production
```

#### 4️⃣ **Configurações Avançadas:**
```yaml
# render.yaml (opcional)
services:
  - type: web
    name: barber-bot
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

## 🖥️ **Deploy em VPS**

### 📋 **Pré-requisitos:**
- VPS com Ubuntu 20.04+
- Acesso SSH
- Domínio configurado

### 🔧 **Configuração Completa:**

#### 1️⃣ **Preparar Servidor:**
```bash
# Conectar via SSH
ssh root@seu-servidor.com

# Atualizar sistema
apt update && apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Instalar PM2
npm install -g pm2

# Instalar Nginx
apt install nginx -y
```

#### 2️⃣ **Clonar e Configurar:**
```bash
# Clonar repositório
git clone https://github.com/pedrovergueiro/agent_IA_barber.git
cd agent_IA_barber

# Instalar dependências
npm install --production

# Configurar .env
cp .env.example .env
nano .env
```

#### 3️⃣ **Configurar PM2:**
```bash
# Criar ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'barber-bot',
    script: 'src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Configurar inicialização automática
pm2 startup
pm2 save
```

#### 4️⃣ **Configurar Nginx:**
```bash
# Criar configuração
cat > /etc/nginx/sites-available/barber-bot << EOF
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/barber-bot /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

#### 5️⃣ **Configurar SSL (Certbot):**
```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
certbot --nginx -d seu-dominio.com

# Renovação automática
crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔧 **Configurações de Produção**

### 🌐 **Variáveis de Ambiente:**
```env
# 🏦 MERCADO PAGO PRODUÇÃO
MP_ACCESS_TOKEN=APP_USR-production-token
MP_PUBLIC_KEY=APP_USR-production-key

# 🌐 SERVIDOR
NODE_ENV=production
PORT=3000
WEBHOOK_URL=https://seu-dominio.com

# 🗄️ BANCO DE DADOS
DATABASE_PATH=/app/data/barber.db

# 🔐 SEGURANÇA
ADMIN_PASSWORD=senha-super-segura-aqui

# 📊 LOGS
LOG_LEVEL=info
LOG_FILE=/app/logs/barber.log
```

### 🛡️ **Configurações de Segurança:**
```bash
# Firewall
ufw allow ssh
ufw allow 80
ufw allow 443
ufw enable

# Fail2ban
apt install fail2ban -y
systemctl enable fail2ban
```

### 📊 **Monitoramento:**
```bash
# PM2 Monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Status do sistema
pm2 status
pm2 logs barber-bot
pm2 monit
```

---

## 🔗 **Configuração de Webhook**

### 📡 **Mercado Pago Webhook:**
```bash
# URL do webhook
https://seu-dominio.com/webhook/mercadopago

# Eventos necessários
- payment.created
- payment.updated
```

### 🧪 **Testar Webhook:**
```bash
# Teste local com ngrok
npm install -g ngrok
ngrok http 3000

# URL temporária: https://abc123.ngrok.io
# Webhook: https://abc123.ngrok.io/webhook/mercadopago
```

---

## 📊 **Monitoramento e Logs**

### 📈 **Métricas Importantes:**
- **Uptime**: > 99.9%
- **Response Time**: < 2s
- **Memory Usage**: < 512MB
- **CPU Usage**: < 50%
- **Disk Space**: > 1GB livre

### 📋 **Logs Essenciais:**
```bash
# PM2 Logs
pm2 logs barber-bot --lines 100

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Sistema
journalctl -u nginx -f
```

### 🚨 **Alertas:**
```bash
# Script de monitoramento
cat > /opt/monitor-barber.sh << EOF
#!/bin/bash
if ! pm2 describe barber-bot | grep -q "online"; then
    echo "BarberBot offline!" | mail -s "ALERT" admin@email.com
    pm2 restart barber-bot
fi
EOF

# Cron job (a cada 5 minutos)
*/5 * * * * /opt/monitor-barber.sh
```

---

## 🔄 **Backup e Recuperação**

### 💾 **Backup Automático:**
```bash
# Script de backup
cat > /opt/backup-barber.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/barber"
mkdir -p \$BACKUP_DIR

# Backup banco de dados
cp /app/data/barber.db \$BACKUP_DIR/barber_\$DATE.db

# Backup configurações
tar -czf \$BACKUP_DIR/config_\$DATE.tar.gz /app/.env /app/data/settings.json

# Limpar backups antigos (> 30 dias)
find \$BACKUP_DIR -name "*.db" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
EOF

# Executar diariamente às 2h
0 2 * * * /opt/backup-barber.sh
```

### 🔄 **Recuperação:**
```bash
# Restaurar banco
cp /backups/barber/barber_20260112_020000.db /app/data/barber.db
pm2 restart barber-bot

# Restaurar configurações
tar -xzf /backups/barber/config_20260112_020000.tar.gz -C /
```

---

## 🚨 **Solução de Problemas**

### ❌ **Problemas Comuns:**

#### **1. Bot não responde após deploy**
```bash
# Verificar logs
pm2 logs barber-bot

# Verificar WhatsApp
curl https://seu-dominio.com/status

# Reconectar WhatsApp
curl https://seu-dominio.com/reconnect
```

#### **2. Pagamentos não funcionam**
```bash
# Verificar webhook
curl -X POST https://seu-dominio.com/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verificar credenciais
echo $MP_ACCESS_TOKEN | grep APP_USR
```

#### **3. Performance lenta**
```bash
# Verificar recursos
htop
df -h
pm2 monit

# Otimizar banco
sqlite3 /app/data/barber.db "VACUUM;"
```

---

## 📈 **Otimização de Performance**

### ⚡ **Configurações PM2:**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'barber-bot',
    script: 'src/index.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
}
```

### 🗄️ **Otimização do Banco:**
```sql
-- Índices para performance
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
```

### 🌐 **Cache Nginx:**
```nginx
# Cache estático
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

---

## ✅ **Checklist de Deploy**

### 🎯 **Pré-Deploy:**
- [ ] **Testes locais** passando
- [ ] **Credenciais** de produção configuradas
- [ ] **Domínio** apontando para servidor
- [ ] **SSL** configurado
- [ ] **Backup** do ambiente atual

### 🚀 **Pós-Deploy:**
- [ ] **Status** do servidor OK
- [ ] **WhatsApp** conectado
- [ ] **Webhook** funcionando
- [ ] **Pagamentos** testados
- [ ] **Admin panel** acessível
- [ ] **Monitoramento** ativo
- [ ] **Backup** configurado

---

<div align="center">

### 🎉 **Deploy Concluído!**

**Seu BarberBot AI está rodando em produção!**

[![Monitorar](https://img.shields.io/badge/Monitorar-Status-green?style=for-the-badge)](https://seu-dominio.com/status)
[![Admin](https://img.shields.io/badge/Admin-Panel-blue?style=for-the-badge)](https://wa.me/seunumero)

**🔗 URL de Produção**: `https://seu-dominio.com`  
**📱 WhatsApp**: Conectado e funcionando  
**💳 Pagamentos**: Mercado Pago ativo  
**📊 Monitoramento**: PM2 + Logs

</div>