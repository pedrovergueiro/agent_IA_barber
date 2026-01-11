# 📱 Guia de Reconexão do WhatsApp Bot

## 🚨 **E se o WhatsApp desconectar?**

### 🔍 **Como Identificar Desconexão:**
- Bot para de responder mensagens
- Clientes não conseguem agendar
- Console mostra "WhatsApp desconectado"

---

## 🛠️ **FORMAS DE RECONECTAR**

### 1. **🌐 Via Navegador (MAIS FÁCIL)**

**Acesse:** `http://localhost:3000/qr`

**O que você verá:**
- ✅ **Se conectado**: "Conectado! O bot está funcionando"
- 📱 **Se desconectado**: QR Code para escanear
- 🔄 **Botão**: "Atualizar QR Code"

**Como usar:**
1. Abra o link no navegador
2. Se aparecer QR Code, escaneie com WhatsApp
3. Se não aparecer, clique em "Atualizar"

### 2. **📱 Via Painel Admin (WhatsApp)**

**No WhatsApp, digite:**
```
/admin
[sua senha]
8 (Status WhatsApp)
```

**Opções disponíveis:**
- `1` - 🔄 Forçar Reconexão
- `2` - 📱 Ver QR Code  
- `3` - 📊 Status Detalhado

### 3. **💻 Via Terminal/Console**

**Verificar status:**
```bash
npm run status
```

**Ver QR Code:**
```bash
npm run qr
# Depois acesse: http://localhost:3000/qr
```

**Forçar reconexão:**
```bash
npm run reconnect
```

**Monitor automático:**
```bash
npm run monitor
```

### 4. **🔄 Reiniciar Completamente**

**Se nada funcionar:**
```bash
# Parar o bot
Ctrl+C

# Reiniciar
npm start
```

---

## 🤖 **RECONEXÃO AUTOMÁTICA**

### ✅ **O Sistema Já Faz Automaticamente:**
- Detecta desconexão
- Tenta reconectar em 5 segundos
- Gera novo QR Code se necessário
- Mantém dados salvos

### 📊 **Monitor Inteligente:**
```bash
npm run monitor
```
- Verifica status a cada 30 segundos
- Força reconexão se necessário
- Reinicia servidor se offline
- Logs detalhados

---

## 📱 **COMO ESCANEAR QR CODE**

### **No WhatsApp:**
1. Abra WhatsApp no celular
2. Toque em **"⋮"** (3 pontinhos) ou **"Configurações"**
3. Toque em **"Aparelhos conectados"**
4. Toque em **"Conectar um aparelho"**
5. Aponte câmera para o QR Code
6. Aguarde confirmação

### **Dicas Importantes:**
- ✅ Use o mesmo celular que sempre usou
- ✅ Certifique-se que tem internet
- ✅ QR Code expira em alguns minutos
- ✅ Se não funcionar, gere um novo

---

## 🔧 **TROUBLESHOOTING**

### **❌ "QR Code não aparece"**
**Soluções:**
1. Acesse: `http://localhost:3000/qr`
2. Clique em "Atualizar QR Code"
3. Force reconexão via admin: `/admin` → `8` → `1`
4. Reinicie o bot: `Ctrl+C` → `npm start`

### **❌ "Escaneei mas não conecta"**
**Soluções:**
1. Gere novo QR Code
2. Verifique se é o mesmo celular
3. Teste com internet móvel
4. Reinicie WhatsApp no celular

### **❌ "Bot não responde nada"**
**Soluções:**
1. Verifique se servidor está rodando: `npm run status`
2. Veja logs no terminal
3. Acesse painel admin: `/admin`
4. Reinicie completamente: `Ctrl+C` → `npm start`

### **❌ "Erro de autenticação"**
**Soluções:**
1. Delete pasta `.wwebjs_auth`
2. Reinicie bot: `npm start`
3. Escaneie novo QR Code
4. **ATENÇÃO**: Vai precisar reconectar tudo

---

## 📊 **MONITORAMENTO CONTÍNUO**

### **🔍 Script de Monitor:**
```bash
npm run monitor
```

**O que faz:**
- ✅ Verifica status a cada 30s
- 🔄 Reconecta automaticamente
- 📱 Mostra link do QR Code
- 🚀 Reinicia servidor se necessário

### **📈 Logs do Monitor:**
```
✅ [10/01 14:30] WhatsApp conectado - Sistema funcionando
⏳ [10/01 14:35] WhatsApp desconectado - QR Code disponível
🔄 [10/01 14:36] Reconexão forçada iniciada
✅ [10/01 14:37] WhatsApp conectado - Sistema funcionando
```

---

## 🚀 **DEPLOY EM PRODUÇÃO**

### **VPS/Servidor:**
```bash
# Instalar PM2
npm install -g pm2

# Rodar bot
pm2 start src/index.js --name "whatsapp-bot"

# Rodar monitor
pm2 start monitor.js --name "whatsapp-monitor"

# Auto-start
pm2 startup
pm2 save
```

### **Acessar QR Code Remotamente:**
```
http://SEU-IP:3000/qr
http://SEU-DOMINIO.com/qr
```

---

## 📞 **SUPORTE RÁPIDO**

### **🆘 Em Caso de Emergência:**

1. **Acesse:** `http://localhost:3000/qr`
2. **WhatsApp Admin:** `/admin` → `8`
3. **Terminal:** `npm run monitor`
4. **Reiniciar:** `Ctrl+C` → `npm start`

### **📱 Status Rápido:**
- 🌐 **Web**: `http://localhost:3000/status`
- 📱 **Admin**: `/admin` → `8` → `3`
- 💻 **Terminal**: `npm run status`

---

## ✅ **CHECKLIST DE RECONEXÃO**

**Quando desconectar, faça nesta ordem:**

- [ ] 1. Acesse `http://localhost:3000/qr`
- [ ] 2. Se tem QR Code → Escaneie
- [ ] 3. Se não tem QR → Clique "Atualizar"
- [ ] 4. Se não funciona → `/admin` → `8` → `1`
- [ ] 5. Se ainda não → `npm run reconnect`
- [ ] 6. Último recurso → `Ctrl+C` → `npm start`

**✅ Pronto! Bot funcionando novamente!**

---

**💡 Dica:** Deixe o monitor rodando sempre: `npm run monitor`