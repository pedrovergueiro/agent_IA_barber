# 🤝 Guia de Contribuição - BarberBot AI

> **Junte-se à nossa comunidade!** Ajude a tornar o BarberBot AI ainda melhor para barbearias do mundo todo.

---

## 🎯 **Como Contribuir**

Existem várias maneiras de contribuir com o projeto:

<table>
<tr>
<td width="25%">

### 🐛 **Reportar Bugs**
- Encontrou um problema?
- Abra uma issue detalhada
- Inclua logs e screenshots
- Ajude outros usuários

</td>
<td width="25%">

### ✨ **Sugerir Funcionalidades**
- Tem uma ideia incrível?
- Descreva o caso de uso
- Explique os benefícios
- Discuta a implementação

</td>
<td width="25%">

### 💻 **Contribuir com Código**
- Corrija bugs existentes
- Implemente novas features
- Melhore a performance
- Adicione testes

</td>
<td width="25%">

### 📚 **Melhorar Documentação**
- Corrija erros de texto
- Adicione exemplos
- Traduza conteúdo
- Crie tutoriais

</td>
</tr>
</table>

---

## 🚀 **Primeiros Passos**

### 1️⃣ **Fork do Repositório**
```bash
# 1. Clique em "Fork" no GitHub
# 2. Clone seu fork
git clone https://github.com/SEU_USUARIO/agent_IA_barber.git
cd agent_IA_barber

# 3. Adicione o repositório original como upstream
git remote add upstream https://github.com/pedrovergueiro/agent_IA_barber.git
```

### 2️⃣ **Configurar Ambiente**
```bash
# Instalar dependências
npm install

# Copiar configurações
cp .env.example .env

# Executar em modo desenvolvimento
npm run dev
```

### 3️⃣ **Criar Branch**
```bash
# Sempre crie uma branch para sua contribuição
git checkout -b feature/nova-funcionalidade
# ou
git checkout -b fix/correcao-bug
# ou
git checkout -b docs/melhoria-documentacao
```

---

## 📋 **Padrões de Desenvolvimento**

### 🏗️ **Estrutura do Projeto**
```
src/
├── 🤖 bot/              # Lógica do bot WhatsApp
├── 🎛️ admin/            # Painel administrativo
├── 🧠 ai/               # Sistema de IA
├── 💳 payment/          # Integração pagamentos
├── 🗄️ database/         # Gerenciamento de dados
├── ⚙️ config/           # Configurações
├── 🛠️ utils/            # Utilitários
└── 🧪 tests/            # Testes automatizados
```

### 📝 **Convenções de Código**

#### **JavaScript/Node.js:**
```javascript
// ✅ Bom
class BarberBot {
    constructor(client, database) {
        this.client = client;
        this.db = database;
        this.userSessions = new Map();
    }

    async handleMessage(message) {
        const userId = message.from;
        
        // Verificar se é grupo
        if (message.from.includes('@g.us')) {
            console.log(`🚫 Mensagem ignorada de grupo: ${message.from}`);
            return;
        }
        
        // Processar mensagem
        await this.processUserMessage(message);
    }
}

// ❌ Evitar
function handle_message(msg) {
    var user = msg.from
    if(user.includes('@g.us'))return
    // código sem estrutura...
}
```

#### **Nomenclatura:**
- **Classes**: `PascalCase` → `BarberBot`, `AdminPanel`
- **Funções**: `camelCase` → `handleMessage`, `processPayment`
- **Variáveis**: `camelCase` → `userId`, `paymentId`
- **Constantes**: `UPPER_CASE` → `MAX_ATTEMPTS`, `DEFAULT_TIMEOUT`
- **Arquivos**: `PascalCase` → `BarberBot.js`, `MercadoPago.js`

#### **Comentários:**
```javascript
// ✅ Comentários úteis
// 🚫 IGNORAR GRUPOS - Só responder em conversas privadas
if (message.from.includes('@g.us')) {
    console.log(`🚫 Mensagem ignorada de grupo: ${message.from}`);
    return;
}

// 💰 Calcular sinal de 50% com valor mínimo de 1 centavo
const depositAmount = Math.max(servicePrice * 0.5, 0.01);

// ❌ Comentários desnecessários
const userId = message.from; // pega o id do usuário
```

### 🎨 **Formatação**
```javascript
// Usar Prettier com estas configurações:
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 4,
  "trailingComma": "none"
}
```

---

## 🧪 **Testes**

### 📊 **Cobertura de Testes**
- **Unitários**: Funções individuais
- **Integração**: Fluxos completos
- **E2E**: Experiência do usuário
- **Performance**: Carga e stress

### 🔧 **Executar Testes**
```bash
# Todos os testes
npm test

# Testes específicos
npm run test:unit
npm run test:integration
npm run test:e2e

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch
```

### ✍️ **Escrever Testes**
```javascript
// tests/bot/BarberBot.test.js
const BarberBot = require('../../src/bot/BarberBot');
const MockDatabase = require('../mocks/Database');

describe('BarberBot', () => {
    let bot;
    let mockDb;
    let mockClient;

    beforeEach(() => {
        mockDb = new MockDatabase();
        mockClient = {
            sendMessage: jest.fn(),
            info: { wid: { user: '5535999999999' } }
        };
        bot = new BarberBot(mockClient, mockDb);
    });

    describe('handleMessage', () => {
        it('should ignore group messages', async () => {
            const groupMessage = {
                from: '123456789@g.us',
                body: 'oi'
            };

            await bot.handleMessage(groupMessage);
            
            expect(mockClient.sendMessage).not.toHaveBeenCalled();
        });

        it('should respond to private messages', async () => {
            const privateMessage = {
                from: '5535999999999@c.us',
                body: 'oi'
            };

            await bot.handleMessage(privateMessage);
            
            expect(mockClient.sendMessage).toHaveBeenCalled();
        });
    });
});
```

---

## 📝 **Padrões de Commit**

### 🏷️ **Conventional Commits**
```bash
# Formato
<tipo>(<escopo>): <descrição>

# Exemplos
feat(bot): adicionar comando de cancelamento
fix(payment): corrigir verificação de PIX
docs(readme): atualizar guia de instalação
style(admin): melhorar layout do dashboard
refactor(ai): otimizar algoritmo de recomendações
test(booking): adicionar testes de agendamento
chore(deps): atualizar dependências
```

### 📋 **Tipos de Commit**
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação, UI/UX
- **refactor**: Refatoração de código
- **test**: Testes
- **chore**: Manutenção, dependências

### 💡 **Exemplos Práticos**
```bash
# ✅ Bons commits
feat(ai): implementar sistema de fidelidade com 4 níveis
fix(whatsapp): corrigir reconexão automática após desconexão
docs(api): adicionar documentação de endpoints de pagamento
style(admin): melhorar responsividade do painel em mobile
refactor(database): otimizar queries de relatórios
test(payment): adicionar testes para webhook do Mercado Pago

# ❌ Commits ruins
fix: bug
update: changes
new feature
correção
```

---

## 🔄 **Processo de Pull Request**

### 1️⃣ **Antes de Submeter**
```bash
# Sincronizar com upstream
git fetch upstream
git checkout main
git merge upstream/main

# Rebase sua branch
git checkout feature/nova-funcionalidade
git rebase main

# Executar testes
npm test
npm run lint
npm run build
```

### 2️⃣ **Criar Pull Request**

#### **Template de PR:**
```markdown
## 📋 Descrição
Breve descrição das mudanças implementadas.

## 🎯 Tipo de Mudança
- [ ] 🐛 Bug fix
- [ ] ✨ Nova funcionalidade
- [ ] 💥 Breaking change
- [ ] 📚 Documentação
- [ ] 🎨 Melhoria de UI/UX

## 🧪 Testes
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Testado manualmente
- [ ] Cobertura de testes mantida/melhorada

## 📸 Screenshots (se aplicável)
[Adicione screenshots das mudanças visuais]

## 📝 Checklist
- [ ] Código segue os padrões do projeto
- [ ] Documentação atualizada
- [ ] Testes adicionados/atualizados
- [ ] Commits seguem conventional commits
- [ ] Branch está atualizada com main
```

### 3️⃣ **Review Process**
1. **Automated Checks**: CI/CD executa testes
2. **Code Review**: Maintainers revisam código
3. **Feedback**: Discussão e melhorias
4. **Approval**: Aprovação final
5. **Merge**: Integração ao projeto

---

## 🐛 **Reportar Issues**

### 📋 **Template de Bug Report**
```markdown
## 🐛 Descrição do Bug
Descrição clara e concisa do problema.

## 🔄 Passos para Reproduzir
1. Vá para '...'
2. Clique em '...'
3. Execute '...'
4. Veja o erro

## ✅ Comportamento Esperado
O que deveria acontecer.

## ❌ Comportamento Atual
O que está acontecendo.

## 📸 Screenshots
[Adicione screenshots se aplicável]

## 🖥️ Ambiente
- OS: [Windows/Linux/macOS]
- Node.js: [versão]
- NPM: [versão]
- Navegador: [se aplicável]

## 📋 Logs
```
[Cole os logs de erro aqui]
```

## 📝 Informações Adicionais
Qualquer contexto adicional sobre o problema.
```

### 💡 **Template de Feature Request**
```markdown
## 🚀 Funcionalidade Solicitada
Descrição clara da funcionalidade desejada.

## 🎯 Problema que Resolve
Qual problema esta funcionalidade resolveria?

## 💡 Solução Proposta
Como você imagina que isso funcionaria?

## 🔄 Alternativas Consideradas
Outras soluções que você considerou?

## 📊 Impacto
- [ ] Melhoria de UX
- [ ] Performance
- [ ] Segurança
- [ ] Funcionalidade nova
- [ ] Integração

## 📝 Contexto Adicional
Qualquer informação adicional relevante.
```

---

## 🏆 **Reconhecimento de Contribuidores**

### 🎖️ **Tipos de Contribuição**
- 💻 **Code**: Contribuições de código
- 📖 **Documentation**: Melhorias na documentação
- 🐛 **Bug Reports**: Relatórios de bugs detalhados
- 💡 **Ideas**: Sugestões de funcionalidades
- 🎨 **Design**: Melhorias de UI/UX
- 🧪 **Testing**: Testes e QA
- 🌍 **Translation**: Traduções
- 📢 **Outreach**: Divulgação do projeto

### 🏅 **Hall da Fama**
Contribuidores são reconhecidos no README.md e recebem badges especiais baseados em suas contribuições.

---

## 📚 **Recursos para Desenvolvedores**

### 🔧 **Ferramentas Recomendadas**
- **IDE**: VS Code com extensões
- **Git**: GitKraken ou SourceTree
- **API Testing**: Postman ou Insomnia
- **Database**: DB Browser for SQLite
- **Monitoring**: PM2 Monit

### 📖 **Documentação Técnica**
- [WhatsApp Web.js](https://wwebjs.dev/)
- [Mercado Pago API](https://www.mercadopago.com.br/developers)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [SQLite Documentation](https://sqlite.org/docs.html)

### 🎓 **Aprendizado**
- [JavaScript Moderno](https://javascript.info/)
- [Node.js Guides](https://nodejs.org/en/docs/guides/)
- [Git Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 🤝 **Código de Conduta**

### 🌟 **Nossos Valores**
- **Respeito**: Trate todos com cortesia e profissionalismo
- **Inclusão**: Bem-vindos desenvolvedores de todos os níveis
- **Colaboração**: Trabalhe junto para soluções melhores
- **Aprendizado**: Compartilhe conhecimento e aprenda com outros
- **Qualidade**: Mantenha altos padrões de código e documentação

### ✅ **Comportamentos Esperados**
- Use linguagem acolhedora e inclusiva
- Respeite diferentes pontos de vista
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

### ❌ **Comportamentos Inaceitáveis**
- Linguagem ou imagens sexualizadas
- Trolling, insultos ou ataques pessoais
- Assédio público ou privado
- Publicar informações privadas sem permissão
- Conduta não profissional

---

## 📞 **Suporte e Comunicação**

### 💬 **Canais de Comunicação**
- 🐛 **Issues**: [GitHub Issues](https://github.com/pedrovergueiro/agent_IA_barber/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/pedrovergueiro/agent_IA_barber/discussions)
- 📧 **Email**: contribuicoes@barberbotai.com
- 📱 **WhatsApp**: (35) 99999-9999 (apenas para contribuidores ativos)

### 🕐 **Tempo de Resposta**
- **Issues**: 24-48 horas
- **Pull Requests**: 2-5 dias úteis
- **Discussions**: 1-3 dias
- **Email**: 1-2 dias úteis

---

## 🎉 **Primeiras Contribuições**

### 🌱 **Good First Issues**
Procure por issues marcadas com:
- `good first issue`: Perfeitas para iniciantes
- `help wanted`: Precisamos de ajuda
- `documentation`: Melhorias na documentação
- `bug`: Bugs simples de corrigir

### 🎯 **Sugestões para Iniciantes**
1. **Corrigir typos** na documentação
2. **Adicionar exemplos** de uso
3. **Melhorar mensagens** de erro
4. **Traduzir** documentação
5. **Adicionar testes** simples
6. **Otimizar** performance

---

<div align="center">

### 🚀 **Junte-se à Nossa Comunidade!**

**Toda contribuição, por menor que seja, faz a diferença!**

[![Contributors](https://img.shields.io/github/contributors/pedrovergueiro/agent_IA_barber?style=for-the-badge)](https://github.com/pedrovergueiro/agent_IA_barber/graphs/contributors)
[![Issues](https://img.shields.io/github/issues/pedrovergueiro/agent_IA_barber?style=for-the-badge)](https://github.com/pedrovergueiro/agent_IA_barber/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/pedrovergueiro/agent_IA_barber?style=for-the-badge)](https://github.com/pedrovergueiro/agent_IA_barber/pulls)

**🤝 Vamos construir o futuro dos agendamentos juntos!**

[Começar a Contribuir](https://github.com/pedrovergueiro/agent_IA_barber/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) • [Discussões](https://github.com/pedrovergueiro/agent_IA_barber/discussions) • [Roadmap](https://github.com/pedrovergueiro/agent_IA_barber/projects)

</div>

---

<div align="center">
<sub>Obrigado por contribuir com o BarberBot AI! 🙏</sub>
</div>