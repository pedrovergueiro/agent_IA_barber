# 🍕 Bot WhatsApp para Lanchonete

Bot completo para lanchonetes com sistema de pedidos, delivery e painel administrativo.

## 🚀 Funcionalidades

### 👥 Para Clientes:
- 🍕 **Cardápio Digital** - Lanches, pizzas, bebidas e porções
- 🛒 **Carrinho de Compras** - Adicionar/remover produtos
- 📱 **Pedidos via WhatsApp** - Interface simples e intuitiva
- 🚚 **Sistema de Delivery** - Cálculo automático de taxa
- 📋 **Histórico de Pedidos** - Acompanhar status dos pedidos
- 💳 **Múltiplas Formas de Pagamento** - Dinheiro, PIX, cartão

### 🔧 Para Administradores:
- 📊 **Painel Administrativo Completo**
- 🍕 **Gerenciar Produtos** - Adicionar, editar, excluir produtos
- 💰 **Controle de Preços** - Atualizar preços em tempo real
- 📋 **Gerenciar Pedidos** - Acompanhar e atualizar status
- 📈 **Relatórios** - Vendas, faturamento, estatísticas
- ⚙️ **Configurações** - Dados da lanchonete, delivery

## 📦 Instalação

### 1. Clonar e Instalar
```bash
cd bot_lanchonete
npm install
```

### 2. Configurar Variáveis
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Dados da Lanchonete
LANCHONETE_NAME="Sua Lanchonete"
LANCHONETE_ADDRESS="Seu Endereço"
LANCHONETE_PHONE="(11) 99999-9999"

# Configurações de Delivery
DELIVERY_FEE=5.00
MIN_ORDER_VALUE=15.00
FREE_DELIVERY_VALUE=50.00

# Admin
ADMIN_PASSWORD=suasenha123
ADMIN_NUMBERS=5511999999999@c.us
```

### 3. Iniciar o Bot
```bash
npm start
```

### 4. Conectar WhatsApp
- Acesse: `http://localhost:3001/qr`
- Escaneie o QR Code com seu WhatsApp

## 🎯 Como Usar

### Para Clientes:
1. **Envie qualquer mensagem** para o WhatsApp da lanchonete
2. **Navegue pelo cardápio** usando os botões ou números
3. **Adicione produtos ao carrinho**
4. **Finalize o pedido** informando nome e endereço
5. **Acompanhe o status** do seu pedido

### Para Administradores:
1. **Digite `/admin`** no WhatsApp
2. **Informe a senha** configurada no `.env`
3. **Use o painel** para gerenciar produtos e pedidos

## 🛠️ Comandos Administrativos

### Gerenciar Produtos:
```
produto adicionar [nome] [preço] [categoria] [descrição]
produto [ID] editar [campo] [valor]
produto [ID] excluir
produto [ID] popular true/false
produto [ID] disponivel true/false
```

### Gerenciar Pedidos:
```
pedido [ID] status [novo_status]
pedido [ID] detalhes
```

### Status Disponíveis:
- `pending` - Pendente
- `confirmed` - Confirmado
- `preparing` - Preparando
- `delivering` - Saiu para entrega
- `delivered` - Entregue
- `cancelled` - Cancelado

## 📊 Categorias de Produtos

- **🍔 Lanches** - Hambúrgueres, sanduíches, etc.
- **🍕 Pizzas** - Pizzas tradicionais e especiais
- **🥤 Bebidas** - Refrigerantes, sucos, cervejas
- **🍟 Porções** - Batata frita, nuggets, etc.

## 💡 Exemplos de Uso

### Adicionar Produto:
```
produto adicionar X-Bacon 20.00 lanches Hambúrguer com bacon crocante
```

### Editar Preço:
```
produto 5 editar price 22.00
```

### Marcar como Popular:
```
produto 3 popular true
```

### Atualizar Status do Pedido:
```
pedido 15 status preparing
```

## 🔧 Configurações Avançadas

### Horários de Funcionamento:
- Configurado via variáveis `OPEN_TIME` e `CLOSE_TIME`
- Padrão: 18:00 às 23:30

### Taxa de Delivery:
- Taxa padrão: R$ 5,00
- Grátis acima de: R$ 50,00
- Pedido mínimo: R$ 15,00

### Produtos Padrão:
O sistema vem com um cardápio pré-configurado:
- 7 tipos de lanches
- 7 tipos de pizzas
- 6 tipos de bebidas
- 4 tipos de porções

## 📱 Interface do Cliente

### Menu Principal:
1. 🍕 Ver Cardápio
2. 🛒 Meu Carrinho
3. 📋 Meus Pedidos
4. 📞 Contato

### Fluxo de Pedido:
1. **Escolher categoria** (Lanches, Pizzas, etc.)
2. **Selecionar produto** e ver detalhes
3. **Adicionar ao carrinho**
4. **Finalizar pedido** com dados pessoais
5. **Confirmar** e aguardar entrega

## 🛡️ Segurança

- ✅ **Autenticação de admin** com senha
- ✅ **Números autorizados** para administração
- ✅ **Validação de dados** em todas as operações
- ✅ **Isolamento de sessões** por usuário
- ✅ **Filtro de grupos** (só funciona em conversas privadas)

## 📈 Relatórios Disponíveis

- **📊 Estatísticas gerais** - Total de pedidos e faturamento
- **📅 Relatório diário** - Pedidos e vendas do dia
- **💰 Ticket médio** - Valor médio por pedido
- **📋 Lista de pedidos** - Histórico completo

## 🚀 Deploy e Produção

### Requisitos:
- Node.js 16+
- WhatsApp Business (recomendado)
- Servidor com IP fixo (para webhooks)

### Recomendações:
- Use PM2 para manter o bot rodando
- Configure backup automático do banco
- Monitore logs regularmente
- Mantenha o sistema atualizado

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Confirme as configurações do `.env`
3. Teste a conexão do WhatsApp
4. Verifique se o banco de dados está funcionando

## 🎉 Pronto para Usar!

Seu bot de lanchonete está configurado e pronto para receber pedidos! 

**Principais benefícios:**
- ✅ **Automatização completa** dos pedidos
- ✅ **Interface amigável** para clientes
- ✅ **Painel administrativo** poderoso
- ✅ **Relatórios detalhados** de vendas
- ✅ **Fácil gerenciamento** de produtos
- ✅ **Sistema profissional** de delivery

**🍕 Boas vendas!**