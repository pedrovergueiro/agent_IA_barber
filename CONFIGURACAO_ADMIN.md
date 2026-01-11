# 🔧 Configuração de Administrador

## Como configurar seu número como administrador

### 1. Descobrir seu número WhatsApp no formato correto

Quando o bot estiver rodando, envie uma mensagem qualquer para ele e observe o console. Você verá algo como:

```
Mensagem recebida de: 5535999999999@c.us
```

### 2. Configurar o número

Edite o arquivo `src/config/admin.js` e substitua o número exemplo pelo seu:

```javascript
const ADMIN_NUMBERS = [
    '5535999999999@c.us', // SEU NÚMERO AQUI
];
```

### 3. Formato do número

- **55** = Código do Brasil
- **35** = DDD da sua cidade (Pouso Alegre = 35)
- **999999999** = Seu número sem o 9 inicial
- **@c.us** = Sufixo obrigatório do WhatsApp

### 4. Exemplos de números

```javascript
// Pouso Alegre (DDD 35)
'5535987654321@c.us'

// São Paulo (DDD 11)  
'5511987654321@c.us'

// Rio de Janeiro (DDD 21)
'5521987654321@c.us'
```

### 5. Adicionar múltiplos administradores

```javascript
const ADMIN_NUMBERS = [
    '5535999999999@c.us', // Barbeiro principal
    '5535888888888@c.us', // Segundo barbeiro
    '5535777777777@c.us', // Gerente
];
```

## 🔧 Comandos de Administrador

Após configurar seu número, você terá acesso aos comandos:

### Comandos Básicos
- `/admin` - Menu administrativo
- `/admin agenda` - Ver agendamentos de hoje
- `/admin relatorio` - Relatório do dia

### Gestão de Horários
- `/admin bloquear DD/MM HH:MM` - Bloquear horário
- `/admin desbloquear DD/MM HH:MM` - Desbloquear horário

### Gestão de Agendamentos
- `/admin cancelar ID` - Cancelar agendamento

### Exemplos de Uso

```
/admin bloquear 15/01 14:30
/admin desbloquear 15/01 14:30
/admin cancelar 123
```

## ⚠️ Importante

1. **Reinicie o bot** após alterar o arquivo de configuração
2. **Teste os comandos** enviando `/admin` para verificar se funcionam
3. **Mantenha o arquivo seguro** - não compartilhe os números de admin

## 🆘 Solução de Problemas

### Comandos não funcionam?
1. Verifique se o número está no formato correto
2. Certifique-se de que reiniciou o bot
3. Teste enviando uma mensagem normal primeiro

### Como descobrir meu número?
1. Inicie o bot
2. Envie qualquer mensagem
3. Observe o console para ver o formato correto
4. Copie e cole no arquivo de configuração

### Múltiplos barbeiros?
Adicione todos os números no array `ADMIN_NUMBERS` no arquivo `src/config/admin.js`