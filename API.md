# 🔌 API Documentation - BarberBot AI

> **Documentação completa da API REST** para integração e desenvolvimento avançado.

---

## 🎯 **Visão Geral**

O BarberBot AI expõe uma API REST para integração com sistemas externos, monitoramento e automação. Todas as rotas são protegidas e seguem padrões RESTful.

### 📋 **Base URL:**
```
Desenvolvimento: http://localhost:3000
Produção: https://seu-dominio.com
```

### 🔐 **Autenticação:**
```http
Authorization: Bearer SEU_TOKEN_AQUI
Content-Type: application/json
```

---

## 📊 **Status & Monitoramento**

### `GET /status`
**Verificar status geral do sistema**

#### **Request:**
```http
GET /status
```

#### **Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T10:30:00.000Z",
  "uptime": 86400,
  "whatsapp": {
    "connected": true,
    "number": "5535999999999",
    "battery": 85,
    "platform": "android"
  },
  "database": {
    "connected": true,
    "size": "2.5MB",
    "tables": 4
  },
  "mercadopago": {
    "configured": true,
    "webhook": "active"
  },
  "memory": {
    "used": "156MB",
    "total": "512MB"
  }
}
```

### `GET /health`
**Health check simplificado**

#### **Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T10:30:00.000Z"
}
```

---

## 📱 **WhatsApp Management**

### `GET /qr`
**Obter QR Code para conexão**

#### **Response:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>BarberBot AI - QR Code</title>
</head>
<body>
    <div id="qr-container">
        <img src="data:image/png;base64,..." alt="QR Code">
        <p>Escaneie com WhatsApp</p>
    </div>
</body>
</html>
```

### `POST /reconnect`
**Forçar reconexão do WhatsApp**

#### **Request:**
```http
POST /reconnect
Authorization: Bearer TOKEN
```

#### **Response:**
```json
{
  "success": true,
  "message": "Reconexão iniciada",
  "timestamp": "2026-01-12T10:30:00.000Z"
}
```

### `GET /whatsapp/info`
**Informações detalhadas do WhatsApp**

#### **Response:**
```json
{
  "connected": true,
  "info": {
    "wid": {
      "user": "5535999999999",
      "server": "c.us"
    },
    "pushname": "Paulinho Barbearia",
    "platform": "android",
    "battery": 85,
    "plugged": false
  },
  "lastSeen": "2026-01-12T10:25:00.000Z"
}
```

---

## 📅 **Agendamentos**

### `GET /api/bookings`
**Listar agendamentos**

#### **Query Parameters:**
```
?date=2026-01-12          # Filtrar por data
?status=confirmed         # Filtrar por status
?customer=João            # Filtrar por cliente
?limit=10                 # Limitar resultados
?offset=0                 # Paginação
```

#### **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "customer_name": "João Silva",
      "user_id": "5535999999999@c.us",
      "service_id": 7,
      "service_name": "Corte Degradê",
      "date": "2026-01-12",
      "time": "14:00",
      "status": "confirmed",
      "total_amount": 35.00,
      "payment_id": "12345678",
      "created_at": "2026-01-11T15:30:00.000Z",
      "updated_at": "2026-01-11T15:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "pages": 15
  }
}
```

### `POST /api/bookings`
**Criar novo agendamento**

#### **Request:**
```json
{
  "customer_name": "Maria Santos",
  "customer_phone": "5535888888888",
  "service_id": 10,
  "date": "2026-01-15",
  "time": "16:00",
  "notes": "Cliente preferencial"
}
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "id": 124,
    "customer_name": "Maria Santos",
    "service_name": "Corte + Barba",
    "date": "2026-01-15",
    "time": "16:00",
    "status": "pending",
    "payment_url": "https://mercadopago.com/checkout/v1/redirect?pref_id=..."
  }
}
```

### `GET /api/bookings/:id`
**Obter agendamento específico**

#### **Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "customer_name": "João Silva",
    "user_id": "5535999999999@c.us",
    "service": {
      "id": 7,
      "name": "Corte Degradê",
      "price": "R$ 35,00"
    },
    "date": "2026-01-12",
    "time": "14:00",
    "status": "confirmed",
    "payment": {
      "id": "12345678",
      "status": "approved",
      "amount": 35.00,
      "method": "pix"
    },
    "created_at": "2026-01-11T15:30:00.000Z"
  }
}
```

### `PUT /api/bookings/:id`
**Atualizar agendamento**

#### **Request:**
```json
{
  "status": "cancelled",
  "notes": "Cliente cancelou por motivo pessoal"
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Agendamento atualizado",
  "data": {
    "id": 123,
    "status": "cancelled",
    "updated_at": "2026-01-12T10:30:00.000Z"
  }
}
```

### `DELETE /api/bookings/:id`
**Cancelar agendamento**

#### **Response:**
```json
{
  "success": true,
  "message": "Agendamento cancelado e cliente notificado"
}
```

---

## ✂️ **Serviços**

### `GET /api/services`
**Listar todos os serviços**

#### **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 7,
      "name": "Corte Degradê",
      "price": "R$ 35,00",
      "price_numeric": 35.00,
      "popular": true,
      "active": true
    },
    {
      "id": 10,
      "name": "Corte + Barba",
      "price": "R$ 60,00",
      "price_numeric": 60.00,
      "popular": true,
      "active": true
    }
  ]
}
```

### `POST /api/services`
**Criar novo serviço**

#### **Request:**
```json
{
  "name": "Corte Infantil",
  "price": "R$ 25,00",
  "popular": false
}
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "Corte Infantil",
    "price": "R$ 25,00",
    "popular": false,
    "active": true
  }
}
```

### `PUT /api/services/:id`
**Atualizar serviço**

#### **Request:**
```json
{
  "name": "Corte Infantil Premium",
  "price": "R$ 30,00",
  "popular": true
}
```

---

## 📊 **Relatórios**

### `GET /api/reports/dashboard`
**Dashboard com métricas do dia**

#### **Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "date": "2026-01-12",
      "bookings": {
        "total": 8,
        "confirmed": 6,
        "pending": 1,
        "cancelled": 1
      },
      "revenue": {
        "total": 420.00,
        "confirmed": 360.00,
        "pending": 60.00
      }
    },
    "next_bookings": [
      {
        "id": 125,
        "customer_name": "Ana Costa",
        "service_name": "Barba",
        "time": "15:30"
      }
    ],
    "popular_services": [
      {
        "service_name": "Corte Degradê",
        "count": 15,
        "revenue": 525.00
      }
    ]
  }
}
```

### `GET /api/reports/period`
**Relatório por período**

#### **Query Parameters:**
```
?start_date=2026-01-01
?end_date=2026-01-31
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "summary": {
      "total_bookings": 156,
      "confirmed_bookings": 142,
      "cancelled_bookings": 14,
      "total_revenue": 8520.00,
      "average_ticket": 60.00
    },
    "by_service": [
      {
        "service_name": "Corte Degradê",
        "count": 45,
        "revenue": 1575.00
      }
    ],
    "by_day": [
      {
        "date": "2026-01-01",
        "bookings": 5,
        "revenue": 300.00
      }
    ]
  }
}
```

---

## 💳 **Pagamentos**

### `GET /api/payments`
**Listar pagamentos**

#### **Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "12345678",
      "booking_id": 123,
      "amount": 35.00,
      "status": "approved",
      "method": "pix",
      "created_at": "2026-01-11T15:35:00.000Z",
      "approved_at": "2026-01-11T15:36:00.000Z"
    }
  ]
}
```

### `POST /api/payments`
**Criar link de pagamento**

#### **Request:**
```json
{
  "booking_id": 124,
  "amount": 60.00,
  "description": "Sinal - Corte + Barba",
  "customer_email": "cliente@email.com"
}
```

#### **Response:**
```json
{
  "success": true,
  "data": {
    "payment_id": "87654321",
    "checkout_url": "https://mercadopago.com/checkout/v1/redirect?pref_id=...",
    "qr_code": "00020126580014br.gov.bcb.pix...",
    "expires_at": "2026-01-11T16:05:00.000Z"
  }
}
```

### `GET /api/payments/:id/status`
**Verificar status do pagamento**

#### **Response:**
```json
{
  "success": true,
  "data": {
    "id": "12345678",
    "status": "approved",
    "status_detail": "accredited",
    "amount": 35.00,
    "net_amount": 33.25,
    "fee": 1.75,
    "approved_at": "2026-01-11T15:36:00.000Z"
  }
}
```

---

## 🔔 **Webhooks**

### `POST /webhook/mercadopago`
**Webhook do Mercado Pago**

#### **Request Headers:**
```
x-signature: signature
x-request-id: request-id
```

#### **Request Body:**
```json
{
  "id": 12345,
  "live_mode": true,
  "type": "payment",
  "date_created": "2026-01-11T15:36:00.000Z",
  "application_id": 123456789,
  "user_id": 987654321,
  "version": 1,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "12345678"
  }
}
```

#### **Response:**
```json
{
  "success": true,
  "message": "Webhook processado"
}
```

---

## 🤖 **IA & Recomendações**

### `GET /api/ai/recommendations/:user_id`
**Obter recomendações personalizadas**

#### **Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "5535999999999@c.us",
    "loyalty_level": "regular",
    "recommendations": [
      {
        "service": {
          "id": 7,
          "name": "Corte Degradê",
          "price": "R$ 35,00"
        },
        "reason": "Baseado no seu histórico, este é o serviço perfeito!",
        "confidence": 0.85
      }
    ],
    "next_suggested_date": "2026-01-20",
    "last_visit": "2025-12-15"
  }
}
```

### `POST /api/ai/behavior`
**Registrar comportamento do usuário**

#### **Request:**
```json
{
  "user_id": "5535999999999@c.us",
  "action": "service_selected",
  "service_id": 7,
  "timestamp": "2026-01-12T10:30:00.000Z",
  "metadata": {
    "session_duration": 120,
    "steps_to_complete": 5
  }
}
```

---

## 📱 **Mensagens**

### `POST /api/messages/send`
**Enviar mensagem via WhatsApp**

#### **Request:**
```json
{
  "to": "5535999999999@c.us",
  "message": "Olá! Seu agendamento foi confirmado para amanhã às 14:00.",
  "type": "text"
}
```

#### **Response:**
```json
{
  "success": true,
  "message_id": "msg_123456789",
  "timestamp": "2026-01-12T10:30:00.000Z"
}
```

### `POST /api/messages/broadcast`
**Enviar mensagem em massa**

#### **Request:**
```json
{
  "recipients": [
    "5535999999999@c.us",
    "5535888888888@c.us"
  ],
  "message": "Promoção especial: 20% de desconto em todos os serviços!",
  "schedule_for": "2026-01-15T09:00:00.000Z"
}
```

---

## ⚙️ **Configurações**

### `GET /api/settings`
**Obter configurações do sistema**

#### **Response:**
```json
{
  "success": true,
  "data": {
    "business_info": {
      "name": "Paulinho Barbearia",
      "address": "Rua Antônio Scodeler, 885 - Faisqueira",
      "phone": "(35) 99999-9999"
    },
    "schedule": {
      "1": {
        "name": "Segunda-feira",
        "periods": [
          {"start": "09:00", "end": "12:00"},
          {"start": "13:00", "end": "20:00"}
        ]
      }
    },
    "features": {
      "ai_recommendations": true,
      "automatic_reminders": true,
      "payment_required": true
    }
  }
}
```

### `PUT /api/settings`
**Atualizar configurações**

#### **Request:**
```json
{
  "business_info": {
    "name": "Paulinho Barbearia Premium",
    "phone": "(35) 99999-9999"
  }
}
```

---

## 🚨 **Códigos de Erro**

### **HTTP Status Codes:**

| Código | Descrição | Exemplo |
|--------|-----------|---------|
| `200` | Sucesso | Operação realizada |
| `201` | Criado | Recurso criado |
| `400` | Bad Request | Dados inválidos |
| `401` | Unauthorized | Token inválido |
| `403` | Forbidden | Sem permissão |
| `404` | Not Found | Recurso não encontrado |
| `409` | Conflict | Conflito de dados |
| `422` | Unprocessable Entity | Validação falhou |
| `500` | Internal Server Error | Erro interno |

### **Formato de Erro:**
```json
{
  "success": false,
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Agendamento não encontrado",
    "details": {
      "booking_id": 999,
      "timestamp": "2026-01-12T10:30:00.000Z"
    }
  }
}
```

---

## 🔐 **Autenticação**

### **API Token:**
```bash
# Gerar token (admin panel)
/admin → Configurações → API Token

# Usar token
curl -H "Authorization: Bearer SEU_TOKEN" \
     https://seu-dominio.com/api/bookings
```

### **Rate Limiting:**
```
100 requests por minuto por IP
1000 requests por hora por token
```

---

## 📚 **SDKs e Exemplos**

### **JavaScript/Node.js:**
```javascript
const BarberBotAPI = require('barberbot-api');

const client = new BarberBotAPI({
  baseURL: 'https://seu-dominio.com',
  token: 'SEU_TOKEN'
});

// Listar agendamentos
const bookings = await client.bookings.list({
  date: '2026-01-12'
});

// Criar agendamento
const booking = await client.bookings.create({
  customer_name: 'João Silva',
  service_id: 7,
  date: '2026-01-15',
  time: '14:00'
});
```

### **Python:**
```python
import requests

class BarberBotAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_bookings(self, date=None):
        params = {'date': date} if date else {}
        response = requests.get(
            f'{self.base_url}/api/bookings',
            headers=self.headers,
            params=params
        )
        return response.json()

# Uso
api = BarberBotAPI('https://seu-dominio.com', 'SEU_TOKEN')
bookings = api.get_bookings('2026-01-12')
```

### **cURL:**
```bash
# Listar agendamentos
curl -H "Authorization: Bearer SEU_TOKEN" \
     "https://seu-dominio.com/api/bookings?date=2026-01-12"

# Criar agendamento
curl -X POST \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"customer_name":"João","service_id":7,"date":"2026-01-15","time":"14:00"}' \
     "https://seu-dominio.com/api/bookings"
```

---

<div align="center">

### 🔌 **API Completa e Documentada**

**Integre o BarberBot AI com qualquer sistema!**

[![Postman Collection](https://img.shields.io/badge/Postman-Collection-orange?style=for-the-badge&logo=postman)](https://postman.com/collections/barberbot-ai)
[![OpenAPI Spec](https://img.shields.io/badge/OpenAPI-3.0-green?style=for-the-badge&logo=swagger)](https://seu-dominio.com/api/docs)

**📖 Documentação Interativa**: `https://seu-dominio.com/api/docs`  
**🔧 Playground**: `https://seu-dominio.com/api/playground`  
**📊 Status**: `https://seu-dominio.com/status`

</div>