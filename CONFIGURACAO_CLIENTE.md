# 🏪 GUIA DE CONFIGURAÇÃO - CLIENTE

## 🚀 CONFIGURAÇÃO RÁPIDA EM 5 MINUTOS

### 📋 PRÉ-REQUISITOS

Antes de começar, você precisa ter:
- [ ] **Conta no Mercado Pago** (gratuita)
- [ ] **WhatsApp Business** (recomendado)
- [ ] **Conta no GitHub** (gratuita)
- [ ] **Conta no Vercel** (gratuita)

## 🔧 PASSO A PASSO

### 1. 🔑 **OBTER CREDENCIAIS MERCADO PAGO**

#### Acesse o Painel de Desenvolvedores:
1. Vá para: https://www.mercadopago.com.br/developers/panel/app
2. Faça login com sua conta Mercado Pago
3. Clique em "Criar aplicação"
4. Escolha "Pagamentos online e marketplace"
5. Preencha os dados da sua barbearia

#### Copie as Credenciais:
- **Access Token** (começa com APP_USR...)
- **User ID** (número)
- **Application ID** (número)

⚠️ **IMPORTANTE**: Use as credenciais de **PRODUÇÃO** para receber pagamentos reais!

### 2. 📁 **CONFIGURAR O PROJETO**

#### Opção A: Configuração Automática (Recomendado)
```bash
# 1. Clone o repositório
git clone https://github.com/pedrovergueiro/agent_IA_barber
cd agent_IA_barber

# 2. Execute o configurador
node setup-cliente.js

# 3. Siga as instruções na tela
```

#### Opção B: Configuração Manual
1. Copie o arquivo `.env.example` para `.env`
2. Edite o `.env` com suas credenciais:
```env
MP_ACCESS_TOKEN=seu_access_token_aqui
MP_USER_ID=seu_user_id_aqui
MP_APPLICATION_ID=seu_application_id_aqui
```

### 3. 🚀 **DEPLOY NO VERCEL**

#### Conectar Repositório:
1. Acesse: https://vercel.com
2. Clique em "New Project"
3. Conecte com GitHub
4. Selecione o repositório `agent_IA_barber`
5. Clique em "Deploy"

#### Configurar Variáveis de Ambiente:
1. Vá em "Settings" > "Environment Variables"
2. Adicione as variáveis:
   - `MP_ACCESS_TOKEN`: Seu access token
   - `MP_USER_ID`: Seu user ID
   - `MP_APPLICATION_ID`: Seu application ID

#### Aguardar Deploy:
- Deploy leva 2-3 minutos
- URL será gerada: `https://seu-projeto.vercel.app`

### 4. 📱 **CONECTAR WHATSAPP**

#### Primeira Conexão:
1. Acesse: `https://seu-projeto.vercel.app/qr`
2. Abra WhatsApp no celular
3. Vá em "Configurações" > "Aparelhos Conectados"
4. Toque em "Conectar um aparelho"
5. Escaneie o QR Code da tela
6. Aguarde mensagem de confirmação

#### Verificar Conexão:
- Envie uma mensagem para o número conectado
- Deve receber resposta automática
- Se não funcionar, recarregue a página do QR

### 5. 🎛️ **CONFIGURAR PAINEL ADMIN**

#### Acessar Painel:
1. Envie `/admin` para o WhatsApp
2. Digite a senha (padrão: `admin123`)
3. Acesse o menu administrativo

#### Configurações Essenciais:
- **Informações da Barbearia**: Nome, endereço, telefone
- **Serviços**: Adicione seus serviços e preços
- **Horários**: Configure dias e horários de funcionamento
- **Alterar Senha**: Mude a senha padrão

### 6. 💳 **TESTAR PAGAMENTOS**

#### Teste Completo:
1. Faça um agendamento pelo WhatsApp
2. Verifique se o PIX é gerado
3. Pague com PIX (valor mínimo)
4. Confirme se agendamento é aprovado
5. Verifique no painel admin

#### Problemas Comuns:
- **PIX não gera**: Verifique credenciais MP
- **Pagamento não confirma**: Aguarde até 2 minutos
- **Erro de webhook**: Verifique URL no Mercado Pago

## 🛠️ CONFIGURAÇÕES AVANÇADAS

### 🏪 **Personalizar Barbearia**

#### Informações Básicas:
```
Nome: Barbearia do João
Endereço: Rua das Flores, 123
Cidade: São Paulo/SP
CEP: 01234-567
Telefone: (11) 99999-9999
```

#### Serviços Sugeridos:
```
1. Corte Simples - R$ 25,00 🔥
2. Corte + Barba - R$ 45,00 🔥
3. Barba - R$ 20,00
4. Sobrancelha - R$ 10,00
5. Corte Degradê - R$ 35,00 🔥
6. Barba + Bigode - R$ 25,00
```

#### Horários Padrão:
```
Segunda a Sexta: 08:00 - 18:00
Sábado: 08:00 - 17:00
Domingo: Fechado
```

### 💬 **Personalizar Mensagens**

#### Tom de Voz:
- **Formal**: "Bom dia! Como posso ajudá-lo?"
- **Casual**: "E aí! Beleza? Vamos agendar?"
- **Amigável**: "Oi! Que bom te ver aqui! 😊"

#### Promoções:
- "Toda segunda: 20% OFF em corte + barba!"
- "Cliente novo: Sobrancelha grátis!"
- "Indique um amigo e ganhe desconto!"

### 🔧 **Manutenção**

#### Backup Diário:
- Dados salvos automaticamente
- Configurações em `data/settings.json`
- Agendamentos no banco SQLite

#### Monitoramento:
- Acesse: `https://seu-projeto.vercel.app/status`
- Verifique logs no painel Vercel
- Monitor de uptime automático

#### Atualizações:
- Sistema atualiza automaticamente
- Novas funcionalidades via GitHub
- Sem interrupção do serviço

## 🆘 SUPORTE E TROUBLESHOOTING

### ❓ **Problemas Comuns**

#### WhatsApp Desconecta:
1. Acesse: `https://seu-projeto.vercel.app/qr`
2. Escaneie novo QR Code
3. Ou use painel admin > "Status WhatsApp" > "Reconectar"

#### Pagamentos Não Funcionam:
1. Verifique credenciais do Mercado Pago
2. Confirme se está usando credenciais de PRODUÇÃO
3. Teste com valor mínimo (R$ 0,01)

#### Bot Não Responde:
1. Verifique se WhatsApp está conectado
2. Teste enviando `/admin`
3. Reinicie via painel Vercel

#### Erro de Deploy:
1. Verifique se todas as variáveis estão configuradas
2. Confirme se o repositório está atualizado
3. Tente fazer novo deploy

### 📞 **Canais de Suporte**

#### Suporte Técnico:
- **WhatsApp**: [Número do suporte]
- **Email**: [Email do suporte]
- **Horário**: Segunda a Sexta, 9h às 18h

#### Documentação:
- **Manual Completo**: README.md
- **Guias Técnicos**: pasta `/docs`
- **Vídeos Tutoriais**: [Link dos vídeos]

#### Comunidade:
- **Grupo WhatsApp**: [Link do grupo]
- **Telegram**: [Link do canal]
- **Discord**: [Link do servidor]

## 📊 MÉTRICAS E RELATÓRIOS

### 📈 **Dashboard Incluso**
- Agendamentos por dia/semana/mês
- Receita total e por serviço
- Horários mais procurados
- Clientes mais frequentes
- Taxa de no-show

### 📋 **Relatórios Disponíveis**
- Faturamento mensal
- Serviços mais vendidos
- Performance por barbeiro
- Análise de horários
- Retenção de clientes

## 🎯 **DICAS DE SUCESSO**

### 💡 **Melhores Práticas**
1. **Responda rápido**: IA responde instantaneamente
2. **Mantenha atualizado**: Serviços e preços sempre atuais
3. **Use promoções**: Mensagens estratégicas aumentam vendas
4. **Monitore métricas**: Dashboard mostra o que funciona
5. **Treine equipe**: Todos devem saber usar o painel

### 🚀 **Crescimento**
- **Divulgue o WhatsApp**: Coloque em redes sociais
- **QR Code na loja**: Facilita agendamento presencial
- **Promoções exclusivas**: Só pelo bot
- **Programa de fidelidade**: IA identifica clientes VIP

---

## ✅ **SISTEMA CONFIGURADO COM SUCESSO!**

Agora sua barbearia tem:
- ✅ **Agendamento 24/7** via WhatsApp
- ✅ **Pagamentos automáticos** via PIX
- ✅ **IA personalizada** para cada cliente
- ✅ **Lembretes automáticos** reduzem no-show
- ✅ **Painel completo** para gestão
- ✅ **Relatórios detalhados** para crescimento

### 🎉 **Parabéns! Sua barbearia agora é digital!**