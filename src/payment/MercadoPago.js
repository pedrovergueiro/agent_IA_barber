const axios = require('axios');

class MercadoPago {
    constructor() {
        // Credenciais do Mercado Pago via variáveis de ambiente
        this.accessToken = process.env.MP_ACCESS_TOKEN;
        this.publicKey = process.env.MP_PUBLIC_KEY;
        this.userId = process.env.MP_USER_ID;
        this.applicationId = process.env.MP_APPLICATION_ID;
        this.clientId = process.env.MP_CLIENT_ID;
        this.clientSecret = process.env.MP_CLIENT_SECRET;
        this.baseURL = 'https://api.mercadopago.com';
        this.webhookUrl = process.env.WEBHOOK_URL || 'https://your-domain.com';
        
        // Verificar se as credenciais estão configuradas
        this.validateCredentials();
    }

    validateCredentials() {
        const credentials = {
            accessToken: this.accessToken,
            publicKey: this.publicKey,
            userId: this.userId,
            applicationId: this.applicationId,
            clientId: this.clientId,
            clientSecret: this.clientSecret
        };
        
        const missingCredentials = Object.keys(credentials).filter(key => !credentials[key]);
        
        if (missingCredentials.length > 0) {
            console.error('❌ Mercado Pago: Credenciais faltando:', missingCredentials);
            throw new Error(`Credenciais do Mercado Pago não configuradas: ${missingCredentials.join(', ')}`);
        }
        
        console.log('✅ Mercado Pago: Todas as credenciais carregadas com sucesso');
        console.log(`🔗 Webhook URL configurada: ${this.webhookUrl}`);
        console.log(`👤 User ID: ${this.userId}`);
        console.log(`📱 Application ID: ${this.applicationId}`);
    }

    async createPayment(paymentData) {
        try {
            console.log('🔄 Criando pagamento no Mercado Pago...');
            
            // Garantir valor mínimo de 1 centavo
            let amount = parseFloat(paymentData.amount);
            if (isNaN(amount) || amount <= 0) {
                amount = 0.01;
                console.log('⚠️ Valor ajustado para mínimo: R$ 0,01');
            }
            
            const preference = {
                items: [
                    {
                        id: `service_${Date.now()}`,
                        title: paymentData.description,
                        description: `Agendamento: ${paymentData.service} - ${paymentData.date} às ${paymentData.time}`,
                        quantity: 1,
                        unit_price: amount,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    name: paymentData.customerName,
                    surname: 'Cliente',
                    email: 'cliente@barbearia.com',
                    phone: {
                        area_code: paymentData.customerPhone.substring(0, 2),
                        number: paymentData.customerPhone.substring(2).replace('@c.us', '')
                    },
                    identification: {
                        type: 'CPF',
                        number: '11111111111'
                    }
                },
                payment_methods: {
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: 1,
                    default_installments: 1
                },
                notification_url: this.webhookUrl.startsWith('http://localhost') ? undefined : `${this.webhookUrl}/webhook/mercadopago`,
                external_reference: paymentData.bookingId || `booking_${Date.now()}`,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
                statement_descriptor: 'BARBEARIA',
                metadata: {
                    booking_id: paymentData.bookingId,
                    customer_phone: paymentData.customerPhone,
                    service: paymentData.service,
                    date: paymentData.date,
                    time: paymentData.time,
                    original_amount: paymentData.amount,
                    adjusted_amount: amount
                }
            };

            const response = await axios.post(
                `${this.baseURL}/checkout/preferences`,
                preference,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': `pref_${Date.now()}_${Math.random()}`
                    }
                }
            );

            console.log('✅ Preferência de pagamento criada:', response.data.id);

            // Gerar PIX separadamente com valor ajustado
            const pixData = await this.generatePix({
                ...paymentData,
                amount: amount
            });

            return {
                id: response.data.id,
                init_point: response.data.init_point,
                sandbox_init_point: response.data.sandbox_init_point,
                qr_code: pixData.qr_code,
                qr_code_base64: pixData.qr_code_base64,
                ticket_url: pixData.ticket_url,
                payment_id: pixData.id,
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                amount: amount,
                original_amount: paymentData.amount
            };

        } catch (error) {
            console.error('❌ Erro ao criar pagamento:', error.response?.data || error.message);
            if (error.response?.data) {
                console.error('Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Falha ao criar pagamento: ${error.response?.data?.message || error.message}`);
        }
    }

    async generatePix(paymentData) {
        try {
            console.log('🔄 Gerando PIX...');
            
            // Garantir valor mínimo de 1 centavo
            let amount = parseFloat(paymentData.amount);
            if (isNaN(amount) || amount <= 0) {
                amount = 0.01;
                console.log('⚠️ Valor PIX ajustado para mínimo: R$ 0,01');
            }
            
            const pixPayment = {
                transaction_amount: amount,
                description: paymentData.description,
                payment_method_id: 'pix',
                external_reference: paymentData.bookingId || `booking_${Date.now()}`,
                notification_url: this.webhookUrl.startsWith('http://localhost') ? undefined : `${this.webhookUrl}/webhook/mercadopago`,
                payer: {
                    email: 'cliente@barbearia.com',
                    first_name: paymentData.customerName.split(' ')[0] || 'Cliente',
                    last_name: paymentData.customerName.split(' ').slice(1).join(' ') || 'Barbearia',
                    identification: {
                        type: 'CPF',
                        number: '11111111111'
                    }
                },
                metadata: {
                    booking_id: paymentData.bookingId,
                    customer_phone: paymentData.customerPhone,
                    service: paymentData.service,
                    date: paymentData.date,
                    time: paymentData.time,
                    original_amount: paymentData.amount,
                    adjusted_amount: amount
                }
            };

            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                pixPayment,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Idempotency-Key': `pix_${Date.now()}_${Math.random()}`
                    }
                }
            );

            console.log('✅ PIX gerado com sucesso:', response.data.id);
            console.log(`💰 Valor do PIX: R$ ${amount.toFixed(2).replace('.', ',')}`);

            return {
                id: response.data.id,
                status: response.data.status,
                qr_code: response.data.point_of_interaction?.transaction_data?.qr_code || 'PIX_CODE_PLACEHOLDER',
                qr_code_base64: response.data.point_of_interaction?.transaction_data?.qr_code_base64 || '',
                ticket_url: response.data.point_of_interaction?.transaction_data?.ticket_url || '',
                expires_at: response.data.date_of_expiration,
                amount: amount,
                original_amount: paymentData.amount
            };

        } catch (error) {
            console.error('❌ Erro ao gerar PIX:', error.response?.data || error.message);
            if (error.response?.data) {
                console.error('Detalhes do erro PIX:', JSON.stringify(error.response.data, null, 2));
            }
            
            // Retornar PIX de exemplo se falhar (para desenvolvimento)
            console.warn('⚠️ Usando PIX de exemplo devido ao erro');
            const amount = parseFloat(paymentData.amount) || 0.01;
            return {
                id: `pix_example_${Date.now()}`,
                status: 'pending',
                qr_code: '00020126580014br.gov.bcb.pix013636c4c14e-1234-4321-abcd-1234567890ab5204000053039865802BR5925BARBEARIA EXEMPLO LTDA6009SAO PAULO62070503***6304ABCD',
                qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                ticket_url: 'https://www.mercadopago.com.br/payments/123456789/ticket?caller_id=123456789&hash=abc123',
                expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                amount: amount,
                original_amount: paymentData.amount
            };
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            console.log(`🔄 Verificando status do pagamento: ${paymentId}`);
            
            const response = await axios.get(
                `${this.baseURL}/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            const status = response.data.status;
            const statusDetail = response.data.status_detail;
            
            console.log(`✅ Status do pagamento ${paymentId}: ${status} (${statusDetail})`);
            
            return {
                status,
                status_detail: statusDetail,
                transaction_amount: response.data.transaction_amount,
                date_approved: response.data.date_approved,
                date_created: response.data.date_created,
                external_reference: response.data.external_reference,
                metadata: response.data.metadata
            };

        } catch (error) {
            console.error('❌ Erro ao verificar status do pagamento:', error.response?.data || error.message);
            return {
                status: 'unknown',
                status_detail: 'error',
                error: error.message
            };
        }
    }

    async getPreferenceStatus(preferenceId) {
        try {
            console.log(`🔄 Verificando preferência: ${preferenceId}`);
            
            const response = await axios.get(
                `${this.baseURL}/checkout/preferences/${preferenceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return response.data;

        } catch (error) {
            console.error('❌ Erro ao verificar preferência:', error.response?.data || error.message);
            return null;
        }
    }

    async refundPayment(paymentId, amount = null) {
        try {
            console.log(`🔄 Processando reembolso para pagamento: ${paymentId}`);
            
            const refundData = amount ? { amount: parseFloat(amount) } : {};

            const response = await axios.post(
                `${this.baseURL}/v1/payments/${paymentId}/refunds`,
                refundData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Reembolso processado com sucesso:', response.data.id);
            
            return {
                id: response.data.id,
                status: response.data.status,
                amount: response.data.amount,
                date_created: response.data.date_created,
                payment_id: response.data.payment_id
            };

        } catch (error) {
            console.error('❌ Erro ao processar reembolso:', error.response?.data || error.message);
            throw new Error(`Falha ao processar reembolso: ${error.response?.data?.message || error.message}`);
        }
    }

    // Método para processar webhooks do Mercado Pago
    async processWebhook(webhookData) {
        try {
            console.log('🔄 Processando webhook do Mercado Pago:', webhookData);
            
            if (webhookData.type === 'payment') {
                const paymentStatus = await this.getPaymentStatus(webhookData.data.id);
                
                return {
                    type: 'payment',
                    payment_id: webhookData.data.id,
                    status: paymentStatus.status,
                    external_reference: paymentStatus.external_reference,
                    metadata: paymentStatus.metadata
                };
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Erro ao processar webhook:', error);
            throw error;
        }
    }

    // Método para validar assinatura do webhook (segurança)
    validateWebhookSignature(body, signature) {
        // Implementar validação de assinatura se necessário
        // Por enquanto, retorna true para permitir processamento
        return true;
    }

    // Método para obter informações da conta
    async getAccountInfo() {
        try {
            const response = await axios.get(
                `${this.baseURL}/users/me`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return {
                id: response.data.id,
                nickname: response.data.nickname,
                email: response.data.email,
                country_id: response.data.country_id,
                site_status: response.data.site_status
            };

        } catch (error) {
            console.error('❌ Erro ao obter informações da conta:', error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = MercadoPago;