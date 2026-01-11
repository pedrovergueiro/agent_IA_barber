# 🤝 Contribuindo para o WhatsApp Barber Bot

Obrigado por considerar contribuir para este projeto! Sua ajuda é muito bem-vinda.

## 📋 Como Contribuir

### 1. **Fork do Repositório**
- Faça um fork do projeto
- Clone seu fork localmente
- Crie uma branch para sua feature

### 2. **Configuração Local**
```bash
# Clone o repositório
git clone https://github.com/SEU-USUARIO/agent_IA_barber.git
cd agent_IA_barber

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# Execute localmente
npm start
```

### 3. **Desenvolvimento**
- Siga os padrões de código existentes
- Adicione comentários em português
- Teste suas alterações localmente
- Mantenha commits pequenos e descritivos

### 4. **Pull Request**
- Faça push da sua branch
- Abra um Pull Request
- Descreva claramente as mudanças
- Aguarde review e feedback

## 🎯 Áreas que Precisam de Ajuda

### **🤖 Inteligência Artificial**
- Melhorar algoritmos de recomendação
- Adicionar novos padrões de comportamento
- Otimizar previsões de retorno

### **💳 Pagamentos**
- Integração com outros gateways
- Melhorar tratamento de erros
- Adicionar mais métodos de pagamento

### **📱 Interface**
- Melhorar experiência do usuário
- Adicionar mais opções de navegação
- Otimizar para diferentes dispositivos

### **🔧 Infraestrutura**
- Melhorar performance
- Adicionar testes automatizados
- Otimizar para produção

### **📚 Documentação**
- Traduzir para outros idiomas
- Adicionar mais exemplos
- Melhorar guias de instalação

## 🐛 Reportando Bugs

### **Antes de Reportar:**
- Verifique se já existe uma issue similar
- Teste com a versão mais recente
- Colete informações do erro

### **Informações Necessárias:**
- Versão do Node.js
- Sistema operacional
- Logs de erro completos
- Passos para reproduzir
- Comportamento esperado vs atual

### **Template de Bug Report:**
```markdown
**Descrição do Bug**
Descrição clara e concisa do problema.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '....'
3. Execute '....'
4. Veja o erro

**Comportamento Esperado**
O que deveria acontecer.

**Screenshots**
Se aplicável, adicione screenshots.

**Ambiente:**
- OS: [ex: Windows 10]
- Node.js: [ex: 18.0.0]
- Versão do Bot: [ex: 1.0.0]

**Informações Adicionais**
Qualquer outro contexto sobre o problema.
```

## 💡 Sugerindo Features

### **Template de Feature Request:**
```markdown
**Sua feature resolve que problema?**
Descrição clara do problema que a feature resolveria.

**Descreva a solução desejada**
Descrição clara e concisa do que você quer que aconteça.

**Descreva alternativas consideradas**
Outras soluções ou features que você considerou.

**Informações Adicionais**
Qualquer outro contexto ou screenshots sobre a feature.
```

## 📝 Padrões de Código

### **JavaScript/Node.js**
- Use `const` e `let` ao invés de `var`
- Prefira async/await ao invés de callbacks
- Use template literals para strings
- Mantenha funções pequenas e focadas
- Adicione comentários em português

### **Estrutura de Arquivos**
```
src/
├── ai/          # Inteligência Artificial
├── admin/       # Painel Administrativo
├── bot/         # Core do Bot
├── config/      # Configurações
├── data/        # Dados e Modelos
├── database/    # Banco de Dados
├── payment/     # Sistema de Pagamento
└── utils/       # Utilitários
```

### **Commits**
- Use mensagens descritivas em português
- Prefixe com tipo: `feat:`, `fix:`, `docs:`, `refactor:`
- Mantenha commits atômicos

**Exemplos:**
```
feat: adicionar recomendações sazonais na IA
fix: corrigir erro de reconexão do WhatsApp
docs: atualizar guia de instalação
refactor: otimizar consultas do banco de dados
```

## 🧪 Testes

### **Executando Testes**
```bash
# Testes unitários
npm test

# Testes de integração
npm run test:integration

# Coverage
npm run test:coverage
```

### **Adicionando Testes**
- Adicione testes para novas features
- Mantenha coverage acima de 80%
- Use Jest para testes unitários
- Teste cenários de erro

## 📦 Versionamento

Seguimos [Semantic Versioning](https://semver.org/):
- **MAJOR**: Mudanças incompatíveis na API
- **MINOR**: Novas funcionalidades compatíveis
- **PATCH**: Correções de bugs compatíveis

## 🏷️ Labels das Issues

- `bug` - Algo não está funcionando
- `enhancement` - Nova feature ou melhoria
- `documentation` - Melhorias na documentação
- `good first issue` - Boa para iniciantes
- `help wanted` - Ajuda extra é bem-vinda
- `question` - Mais informações são necessárias

## 👥 Código de Conduta

### **Nosso Compromisso**
Estamos comprometidos em fazer da participação neste projeto uma experiência livre de assédio para todos.

### **Nossos Padrões**
**Comportamentos que contribuem para um ambiente positivo:**
- Usar linguagem acolhedora e inclusiva
- Respeitar diferentes pontos de vista
- Aceitar críticas construtivas graciosamente
- Focar no que é melhor para a comunidade
- Mostrar empatia com outros membros

**Comportamentos inaceitáveis:**
- Uso de linguagem ou imagens sexualizadas
- Trolling, comentários insultuosos/depreciativos
- Assédio público ou privado
- Publicar informações privadas de outros
- Outras condutas consideradas inapropriadas

### **Aplicação**
Instâncias de comportamento abusivo podem ser reportadas entrando em contato com a equipe do projeto. Todas as reclamações serão revisadas e investigadas.

## 📞 Contato

- **Issues**: Use o sistema de issues do GitHub
- **Discussões**: Use as discussões do GitHub
- **Email**: pedro@example.com (para questões sensíveis)

## 🎉 Reconhecimento

Todos os contribuidores serão reconhecidos no README.md e releases notes.

---

**Obrigado por contribuir! 🚀**