# 🛡️ Política de Segurança - BarberBot AI

> **Segurança em primeiro lugar!** Protegemos dados de clientes e garantimos operação segura do sistema.

---

## 🎯 **Versões Suportadas**

Mantemos suporte de segurança para as seguintes versões:

| Versão | Suporte de Segurança |
|--------|---------------------|
| 2.8.x  | ✅ **Suporte Total** |
| 2.7.x  | ✅ **Suporte Total** |
| 2.6.x  | ⚠️ **Críticos Apenas** |
| 2.5.x  | ❌ **Sem Suporte** |
| < 2.5  | ❌ **Sem Suporte** |

### 📅 **Ciclo de Vida das Versões**
- **Versão Atual**: Suporte completo por 12 meses
- **Versão Anterior**: Patches críticos por 6 meses
- **Versões Antigas**: Sem suporte de segurança

---

## 🚨 **Reportar Vulnerabilidades**

### 📧 **Contato Seguro**
**NÃO** abra issues públicas para vulnerabilidades de segurança.

**Contatos Seguros:**
- 📧 **Email**: security@barberbotai.com
- 🔐 **PGP Key**: [Download](https://barberbotai.com/pgp-key.asc)
- 📱 **WhatsApp**: +55 35 99999-9999 (apenas emergências)

### 📋 **Informações Necessárias**
Inclua as seguintes informações no seu relatório:

```markdown
## 🚨 Relatório de Vulnerabilidade

### 📊 Classificação
- [ ] Crítica (acesso não autorizado a dados)
- [ ] Alta (bypass de autenticação)
- [ ] Média (exposição de informações)
- [ ] Baixa (vazamento menor)

### 📝 Descrição
[Descrição detalhada da vulnerabilidade]

### 🔄 Reprodução
1. Passo 1
2. Passo 2
3. Resultado

### 💥 Impacto
[Qual o impacto potencial?]

### 🛠️ Sugestão de Correção
[Se tiver sugestões]

### 🖥️ Ambiente
- Versão: [versão do BarberBot]
- OS: [sistema operacional]
- Node.js: [versão]
```

### ⏰ **Tempo de Resposta**
- **Confirmação**: 24 horas
- **Avaliação Inicial**: 72 horas
- **Correção Crítica**: 7 dias
- **Correção Normal**: 30 dias
- **Divulgação**: Após correção + 90 dias

---

## 🔒 **Medidas de Segurança Implementadas**

### 🛡️ **Autenticação e Autorização**
```javascript
// ✅ Implementado
- Isolamento de sessões por usuário
- Validação de tokens de admin
- Timeout automático de sessões
- Verificação de permissões por endpoint
```

### 🔐 **Proteção de Dados**
```javascript
// ✅ Implementado
- Criptografia de dados sensíveis
- Sanitização de inputs
- Validação de tipos de dados
- Logs sem informações sensíveis
```

### 🚫 **Prevenção de Ataques**
```javascript
// ✅ Implementado
- Rate limiting por IP
- Validação de origem (CORS)
- Sanitização SQL (prepared statements)
- Filtro de grupos WhatsApp
- Validação de webhooks
```

### 📊 **Monitoramento**
```javascript
// ✅ Implementado
- Logs de segurança detalhados
- Monitoramento de tentativas de acesso
- Alertas automáticos para atividades suspeitas
- Backup automático de dados
```

---

## 🔧 **Configurações de Segurança**

### 🌐 **Variáveis de Ambiente Seguras**
```env
# 🔐 NUNCA commitar estas variáveis
MP_ACCESS_TOKEN=APP_USR-production-token
MP_PUBLIC_KEY=APP_USR-production-key
ADMIN_PASSWORD=senha-super-segura-aqui
JWT_SECRET=chave-jwt-aleatoria-256-bits

# 🛡️ Configurações de segurança
RATE_LIMIT_WINDOW=900000    # 15 minutos
RATE_LIMIT_MAX=100          # 100 requests por janela
SESSION_TIMEOUT=3600000     # 1 hora
WEBHOOK_SECRET=webhook-secret-key
```

### 🔒 **Headers de Segurança**
```javascript
// Implementado automaticamente
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

### 🛡️ **Validação de Entrada**
```javascript
// Exemplo de validação segura
const validateBookingInput = (data) => {
    const schema = Joi.object({
        customer_name: Joi.string().min(2).max(100).required(),
        service_id: Joi.number().integer().positive().required(),
        date: Joi.date().min('now').required(),
        time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
    });
    
    return schema.validate(data);
};
```

---

## 🚨 **Vulnerabilidades Conhecidas**

### 📋 **Histórico de Segurança**

#### **CVE-2026-0001** (Corrigido em v2.7.1)
- **Severidade**: Média
- **Descrição**: Possível bypass de rate limiting
- **Correção**: Implementação de rate limiting por token
- **Status**: ✅ **Corrigido**

#### **CVE-2026-0002** (Corrigido em v2.8.0)
- **Severidade**: Baixa
- **Descrição**: Exposição de logs em ambiente de desenvolvimento
- **Correção**: Sanitização de logs em produção
- **Status**: ✅ **Corrigido**

### 🔄 **Atualizações de Segurança**
```bash
# Verificar versão atual
npm list barberbot-ai

# Atualizar para versão segura
npm update barberbot-ai

# Verificar vulnerabilidades
npm audit
npm audit fix
```

---

## 🛠️ **Boas Práticas de Segurança**

### 🔐 **Para Administradores**

#### **1. Configuração Inicial**
```bash
# ✅ Alterar senha padrão
/admin → Configurações → Alterar Senha

# ✅ Configurar HTTPS
certbot --nginx -d seu-dominio.com

# ✅ Firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

#### **2. Monitoramento**
```bash
# ✅ Logs de segurança
tail -f /var/log/barber-security.log

# ✅ Tentativas de login
grep "admin login" /var/log/barber.log

# ✅ Atividade suspeita
grep "SECURITY" /var/log/barber.log
```

#### **3. Backup Seguro**
```bash
# ✅ Backup criptografado
gpg --cipher-algo AES256 --compress-algo 1 --s2k-cipher-algo AES256 \
    --s2k-digest-algo SHA512 --s2k-mode 3 --s2k-count 65536 \
    --symmetric --output barber-backup.gpg barber.db

# ✅ Armazenamento seguro
aws s3 cp barber-backup.gpg s3://backup-bucket/ --sse
```

### 🖥️ **Para Desenvolvedores**

#### **1. Desenvolvimento Seguro**
```javascript
// ✅ Sempre validar entrada
const sanitizedInput = validator.escape(userInput);

// ✅ Usar prepared statements
const query = 'SELECT * FROM bookings WHERE user_id = ?';
db.prepare(query).get(userId);

// ✅ Não logar dados sensíveis
console.log(`Payment processed for user: ${userId.substring(0, 4)}***`);

// ❌ NUNCA fazer isso
const query = `SELECT * FROM bookings WHERE user_id = '${userId}'`;
console.log(`Payment data: ${JSON.stringify(paymentData)}`);
```

#### **2. Testes de Segurança**
```javascript
// Exemplo de teste de segurança
describe('Security Tests', () => {
    it('should prevent SQL injection', async () => {
        const maliciousInput = "'; DROP TABLE bookings; --";
        const result = await bookingService.create({
            customer_name: maliciousInput
        });
        
        expect(result.error).toBeDefined();
        expect(result.error.code).toBe('INVALID_INPUT');
    });
    
    it('should rate limit requests', async () => {
        const requests = Array(101).fill().map(() => 
            request(app).get('/api/bookings')
        );
        
        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);
        
        expect(rateLimited.length).toBeGreaterThan(0);
    });
});
```

---

## 🔍 **Auditoria de Segurança**

### 📊 **Checklist de Segurança**

#### **🔐 Autenticação**
- [ ] Senhas fortes obrigatórias
- [ ] Timeout de sessão configurado
- [ ] Tentativas de login limitadas
- [ ] Logs de acesso mantidos

#### **🛡️ Autorização**
- [ ] Isolamento de usuários implementado
- [ ] Validação de permissões por endpoint
- [ ] Sessões admin separadas
- [ ] Tokens com expiração

#### **📊 Dados**
- [ ] Criptografia em trânsito (HTTPS)
- [ ] Sanitização de entrada
- [ ] Validação de tipos
- [ ] Backup criptografado

#### **🌐 Rede**
- [ ] Rate limiting ativo
- [ ] CORS configurado
- [ ] Headers de segurança
- [ ] Firewall configurado

#### **📋 Monitoramento**
- [ ] Logs de segurança ativos
- [ ] Alertas configurados
- [ ] Monitoramento de recursos
- [ ] Backup automático

### 🧪 **Ferramentas de Auditoria**
```bash
# Análise de dependências
npm audit

# Análise de código estático
npm run lint:security

# Teste de penetração
npm run test:security

# Verificação de configuração
npm run security:check
```

---

## 🚨 **Resposta a Incidentes**

### 📋 **Plano de Resposta**

#### **1. Detecção**
- Monitoramento automático 24/7
- Alertas em tempo real
- Análise de logs contínua

#### **2. Contenção**
```bash
# Isolar sistema comprometido
pm2 stop barber-bot

# Bloquear IPs suspeitos
ufw deny from IP_SUSPEITO

# Revogar tokens comprometidos
# Via admin panel ou banco de dados
```

#### **3. Erradicação**
- Identificar causa raiz
- Aplicar patches de segurança
- Atualizar configurações

#### **4. Recuperação**
```bash
# Restaurar de backup seguro
cp /backup/barber-clean.db /app/data/barber.db

# Reiniciar serviços
pm2 restart barber-bot

# Verificar integridade
npm run integrity:check
```

#### **5. Lições Aprendidas**
- Documentar incidente
- Atualizar procedimentos
- Melhorar monitoramento
- Treinar equipe

---

## 📞 **Contatos de Emergência**

### 🚨 **Equipe de Segurança**
- **Líder de Segurança**: Pedro Vergueiro
- **Email**: security@barberbotai.com
- **Telefone**: +55 35 99999-9999
- **Disponibilidade**: 24/7 para incidentes críticos

### 🔐 **Canais Seguros**
- **PGP Key**: [Download](https://barberbotai.com/pgp-key.asc)
- **Signal**: +55 35 99999-9999
- **Telegram**: @barberbotai_security

---

## 📚 **Recursos de Segurança**

### 📖 **Documentação**
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [WhatsApp Security](https://www.whatsapp.com/security/)
- [Mercado Pago Security](https://www.mercadopago.com.br/developers/pt/guides/security)

### 🛠️ **Ferramentas**
- **Helmet.js**: Headers de segurança
- **Rate Limiter**: Controle de taxa
- **Joi**: Validação de entrada
- **Bcrypt**: Hash de senhas
- **JWT**: Tokens seguros

---

## 🏆 **Programa de Recompensas**

### 💰 **Bug Bounty**
Oferecemos recompensas para descobertas de vulnerabilidades:

| Severidade | Recompensa | Critérios |
|------------|------------|-----------|
| **Crítica** | R$ 1.000 | RCE, SQLi, Auth Bypass |
| **Alta** | R$ 500 | XSS, CSRF, Info Disclosure |
| **Média** | R$ 200 | Rate Limit Bypass, DoS |
| **Baixa** | R$ 50 | Configuração, Logs |

### 📋 **Regras do Programa**
- Não cause danos aos sistemas
- Não acesse dados de terceiros
- Reporte responsavelmente
- Aguarde correção antes de divulgar
- Uma recompensa por vulnerabilidade única

---

<div align="center">

### 🛡️ **Segurança é Prioridade**

**Protegemos dados de clientes e garantimos operação segura 24/7**

[![Security Score](https://img.shields.io/badge/Security-A+-green?style=for-the-badge&logo=shield)](https://barberbotai.com/security)
[![Uptime](https://img.shields.io/badge/Uptime-99.9%25-brightgreen?style=for-the-badge)](https://status.barberbotai.com)

**🔐 Relatórios**: security@barberbotai.com  
**🚨 Emergências**: +55 35 99999-9999  
**📊 Status**: [status.barberbotai.com](https://status.barberbotai.com)

</div>

---

<div align="center">
<sub>Última atualização: Janeiro 2026 • Versão 2.8</sub>
</div>