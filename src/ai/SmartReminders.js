const moment = require('moment');
const SmartRecommendations = require('./SmartRecommendations');

class SmartReminders {
    constructor(client, database) {
        this.client = client;
        this.db = database;
        this.ai = new SmartRecommendations(database);
        this.remindersSent = new Set();
    }

    async checkAndSendReminders() {
        try {
            // 1. Verificar lembretes de agendamento (2h antes)
            await this.checkAppointmentReminders();
            
            // 2. Verificar lembretes mensais para clientes que já pagaram
            await this.checkMonthlyReminders();
            
        } catch (error) {
            console.error('Erro ao verificar lembretes:', error);
        }
    }

    // Lembretes 2h antes do agendamento
    async checkAppointmentReminders() {
        try {
            const today = moment().format('YYYY-MM-DD');
            const currentTime = moment();
            
            // Buscar agendamentos de hoje
            const todayBookings = await this.db.getBookingsByDate(today);
            
            for (const booking of todayBookings) {
                if (booking.status !== 'confirmed') continue;
                
                // Calcular horário do agendamento
                const appointmentTime = moment(`${booking.date} ${booking.time}`, 'YYYY-MM-DD HH:mm');
                const reminderTime = appointmentTime.clone().subtract(2, 'hours');
                
                // Verificar se é hora de enviar lembrete (2h antes)
                const timeDiff = Math.abs(currentTime.diff(reminderTime, 'minutes'));
                
                if (timeDiff <= 15) { // Janela de 15 minutos
                    const reminderKey = `appointment_${booking.id}_${today}`;
                    
                    if (!this.remindersSent.has(reminderKey)) {
                        await this.sendAppointmentReminder(booking);
                        this.remindersSent.add(reminderKey);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao verificar lembretes de agendamento:', error);
        }
    }

    // Lembretes mensais para clientes que já pagaram
    async checkMonthlyReminders() {
        try {
            // Buscar clientes que fizeram agendamentos confirmados no último mês
            const oneMonthAgo = moment().subtract(1, 'month').format('YYYY-MM-DD');
            const paidClients = await this.db.getPaidClientsAfterDate(oneMonthAgo);
            
            for (const client of paidClients) {
                // Verificar se já passou 1 mês desde o último agendamento
                const lastBooking = moment(client.last_booking_date);
                const daysSinceLastBooking = moment().diff(lastBooking, 'days');
                
                if (daysSinceLastBooking >= 28) { // 4 semanas
                    const reminderKey = `monthly_${client.user_id}_${moment().format('YYYY-MM')}`;
                    
                    if (!this.remindersSent.has(reminderKey)) {
                        await this.sendMonthlyReminder(client);
                        this.remindersSent.add(reminderKey);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao verificar lembretes mensais:', error);
        }
    }

    async sendAppointmentReminder(booking) {
        try {
            const appointmentTime = moment(`${booking.date} ${booking.time}`, 'YYYY-MM-DD HH:mm');
            const timeFormatted = appointmentTime.format('HH:mm');
            const dateFormatted = appointmentTime.format('DD/MM/YYYY');
            
            const reminderMessages = [
                `🕐 *LEMBRETE DE AGENDAMENTO*\n\nOi ${booking.customer_name}! Seu horário é daqui a 2 horas:\n\n✂️ ${booking.service_name}\n📅 ${dateFormatted}\n🕐 ${timeFormatted}\n\nTe esperamos na barbearia! 😊`,
                
                `⏰ *SEU HORÁRIO ESTÁ CHEGANDO!*\n\nE aí ${booking.customer_name}! Lembrete amigável:\n\n✂️ ${booking.service_name}\n📅 Hoje às ${timeFormatted}\n\nJá tá a caminho? Te aguardamos! 🚀`,
                
                `🔔 *LEMBRETE IMPORTANTE*\n\nOpa ${booking.customer_name}! Seu agendamento é em 2 horas:\n\n✂️ ${booking.service_name}\n🕐 ${timeFormatted}\n\nQualquer imprevisto, me avisa! 📱`
            ];
            
            const message = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
            
            // 🚫 Não enviar lembretes para grupos
            if (booking.user_id.includes('@g.us')) {
                console.log(`🚫 Lembrete ignorado para grupo: ${booking.user_id}`);
                return;
            }
            
            await this.client.sendMessage(booking.user_id, message);
            console.log(`⏰ Lembrete de agendamento enviado para ${booking.customer_name}`);
            
        } catch (error) {
            console.error('Erro ao enviar lembrete de agendamento:', error);
        }
    }

    async sendMonthlyReminder(client) {
        try {
            const profile = await this.ai.analyzeClient(client.user_id);
            const recommendations = await this.ai.getSmartRecommendations(client.user_id);
            
            let reminderText = '';
            
            // Saudação personalizada baseada no perfil
            switch (profile.loyaltyLevel) {
                case 'vip':
                    reminderText = `👑 *E aí, nosso cliente VIP!*\n\nSentimos sua falta aqui na barbearia! Já faz um tempinho que você não aparece...`;
                    break;
                case 'loyal':
                    reminderText = `🔥 *Opa, nosso cliente fiel!*\n\nQue tal dar uma passadinha aqui? Tá na hora de renovar esse visual!`;
                    break;
                default:
                    reminderText = `😊 *Oi! Que saudade!*\n\nQue tal dar uma passadinha aqui na barbearia? Já passou da hora de cuidar do visual!`;
            }
            
            // Adicionar informações sobre o último serviço
            if (client.last_service_name) {
                reminderText += `\n\n💭 Lembro que da última vez você fez: *${client.last_service_name}*`;
                reminderText += `\nFicou show! Que tal repetir a dose?`;
            }
            
            // Recomendações personalizadas
            if (recommendations.length > 0) {
                reminderText += `\n\n🎯 *SUGESTÕES ESPECIAIS:*`;
                
                recommendations.slice(0, 2).forEach((rec, index) => {
                    reminderText += `\n\n${index + 1}️⃣ *${rec.service.name}* - ${rec.service.price}`;
                    if (rec.service.popular) {
                        reminderText += ` 🔥`;
                    }
                });
            }
            
            // Call to action
            const callToActions = [
                '\n\n📱 *Responde aí para agendar!* Tô aqui esperando você! 😄',
                '\n\n✂️ *Vamos marcar?* É só responder esta mensagem! 🚀',
                '\n\n🗓️ *Que tal garantir seu horário?* Responde aqui que eu te ajudo! 😊'
            ];
            
            reminderText += callToActions[Math.floor(Math.random() * callToActions.length)];
            
            // 🚫 Não enviar lembretes para grupos
            if (client.user_id.includes('@g.us')) {
                console.log(`🚫 Lembrete mensal ignorado para grupo: ${client.user_id}`);
                return;
            }
            
            await this.client.sendMessage(client.user_id, reminderText);
            console.log(`📅 Lembrete mensal enviado para ${client.customer_name || client.user_id.replace('@c.us', '')}`);
            
        } catch (error) {
            console.error('Erro ao enviar lembrete mensal:', error);
        }
    }

    startReminderService() {
        // Verificar lembretes a cada 30 minutos
        setInterval(() => {
            this.checkAndSendReminders();
        }, 30 * 60 * 1000);
        
        // Primeira verificação após 1 minuto
        setTimeout(() => {
            this.checkAndSendReminders();
        }, 60 * 1000);
        
        console.log('🤖 Sistema de lembretes inteligentes ativado!');
        console.log('   ⏰ Lembretes de agendamento: 2h antes');
        console.log('   📅 Lembretes mensais: clientes que já pagaram');
    }
}

module.exports = SmartReminders;