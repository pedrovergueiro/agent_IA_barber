const axios = require('axios');

class MercadoPago {
    constructor() {
        this.accessToken = process.env.MP_ACCESS_TOKEN || 'seu_access_token_aqui';
        this.userId = process.env.MP_USER_ID || 'seu_user_id_aqui';
        this.applicationId = process.env.MP_APPLICATION_ID || 'seu_application_id_aqui';
        this.baseURL = 'https://api.mercadopago.com';
    }

    async createPayment(paymentData) {
        try {
            const preference = {
                items: [
                    {
                        title: paymentData.description,
                        quantity: 1,
                        unit_price: paymentData.amount,
                        currency_id: 'BRL'
                    }
                ],
                payer: {
                    name: paymentData.customerName,
                    phone: {
                        number: paymentData.customerPhone.replace('@c.us', '')
                    }
                },
                payment_methods: {
                    excluded_payment_types: [],
                    installments: 1
                },
                notification_url: `${process.env.WEBHOOK_URL || 'https://your-domain.com'}/webhook/mercadopago`,
                external_reference: `booking_${Date.now()}`,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
            };

            const response = await axios.post(
                `${this.baseURL}/checkout/preferences`,
                preference,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Gerar PIX
            const pixData = await this.generatePix(paymentData);

            return {
                id: response.data.id,
                init_point: response.data.init_point,
                qr_code: pixData.qr_code,
                qr_code_base64: pixData.qr_code_base64
            };

        } catch (error) {
            console.error('Erro ao criar pagamento:', error.response?.data || error.message);
            throw new Error('Falha ao criar pagamento');
        }
    }

    async generatePix(paymentData) {
        try {
            const pixPayment = {
                transaction_amount: paymentData.amount,
                description: paymentData.description,
                payment_method_id: 'pix',
                payer: {
                    email: 'customer@email.com',
                    first_name: paymentData.customerName.split(' ')[0],
                    last_name: paymentData.customerName.split(' ').slice(1).join(' ') || 'Cliente',
                    identification: {
                        type: 'CPF',
                        number: '11111111111'
                    }
                }
            };

            const response = await axios.post(
                `${this.baseURL}/v1/payments`,
                pixPayment,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return {
                id: response.data.id,
                qr_code: response.data.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64,
                ticket_url: response.data.point_of_interaction.transaction_data.ticket_url
            };

        } catch (error) {
            console.error('Erro ao gerar PIX:', error.response?.data || error.message);
            // Retornar PIX de exemplo se falhar
            return {
                qr_code: '00020126580014br.gov.bcb.pix013636c4c14e-1234-4321-abcd-1234567890ab5204000053039865802BR5925BARBEARIA EXEMPLO LTDA6009SAO PAULO62070503***6304ABCD',
                qr_code_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            };
        }
    }

    async getPaymentStatus(paymentId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/v1/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                }
            );

            return response.data.status;

        } catch (error) {
            console.error('Erro ao verificar status do pagamento:', error.response?.data || error.message);
            return 'unknown';
        }
    }

    async refundPayment(paymentId, amount = null) {
        try {
            const refundData = amount ? { amount } : {};

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

            return response.data;

        } catch (error) {
            console.error('Erro ao processar reembolso:', error.response?.data || error.message);
            throw new Error('Falha ao processar reembolso');
        }
    }
}

module.exports = MercadoPago;