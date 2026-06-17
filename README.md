# Agente IA — Paulinho Barbearia

Desenvolvi esse agente pra Paulinho Barbearia, localizada no bairro Faisqueira em Pouso Alegre (MG). O problema do cliente era simples: ele recebia mensagens o tempo todo no WhatsApp perguntando horários, preços e disponibilidade — e não dava conta de responder tudo enquanto atendia.

O agente resolve isso automaticamente.

## O que o agente faz

- Responde dúvidas sobre serviços e preços sem intervenção humana
- Verifica disponibilidade de horários e faz agendamentos direto pelo WhatsApp
- Manda lembretes automáticos de confirmação de agendamento
- Encaminha pro Paulinho só quando o cliente tem uma situação que o bot não consegue resolver

O resultado foi direto: o Paulinho parou de perder clientes que mandavam mensagem e não recebiam resposta.

## Como funciona por dentro

O bot roda via WhatsApp Business API integrado com um modelo de linguagem. Tem uma camada de contexto que mantém a conversa coerente mesmo quando o cliente demora pra responder, e uma agenda integrada pra checar e bloquear horários em tempo real.

## Stack
JavaScript · Node.js · WhatsApp Business API

## Cliente
Paulinho Barbearia — Pouso Alegre, MG
