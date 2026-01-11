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
            // Buscar todos os clientes únicos dos últimos 6 meses
            const sixMonthsAgo = moment().subtract(6, 'months').format('YYYY-MM-DD');
            const recentClients = await this.db.getRecentClients(sixMonthsAgo);
            
            for (const client of recentClients) {
                await this.processClientReminder(client.user_id);
            }
        } catch (error) {
            console.error('Erro ao verificar lembretes:', error);
        }
    }

    async processClientReminder(userId) {
        try {
            // Verificar se deve enviar lembrete
            const shouldRemind = await this.ai.shouldSendReminder(userId);
            
            if (!shouldRemind) return;
            
            // Evitar spam - só enviar uma vez por dia
            const reminderKey = `${userId}_${moment().format('YYYY-MM-DD')}`;
            if (this.remindersSent.has(reminderKey)) return;
            
            // Gerar lembrete personalizado
            const reminder = await this.generateSmartReminder(userId);
            
            // Enviar lembrete
            await this.client.sendMessage(userId, reminder);
            
            // Marcar como enviado
            this.remindersSent.add(reminderKey);
            
            console.log(`📨 Lembrete enviado para ${userId.replace('@c.us', '')}`);
            
        } catch (error) {
            console.error(`Erro ao processar lembrete para ${userId}:`, error);
        }
    }

    async generateSmartReminder(userId) {
        const profile = await this.ai.analyzeClient(userId);
        const prediction = await this.ai.predictNextVisit(userId);
        const recommendations = await this.ai.getSmartRecommendations(userId);
        
        let reminderText = '';
        
        // Saudação personalizada
        switch (profile.loyaltyLevel) {
            case 'vip':
                reminderText = `E aí, campeão! 👑 Sentimos sua falta aqui na barbearia!`;
                break;
            case 'loyal':
                reminderText = `Opa! Nosso cliente fiel! 🔥 Tá na hora de dar aquela renovada no visual!`;
                break;
            default:
                reminderText = `Oi! Que tal dar uma passadinha aqui na barbearia? 😊`;
        }
        
        // Informação sobre timing
        if (prediction && prediction.daysUntil <= 0) {
            reminderText += `\n\n⏰ Pelo seu histórico, já passou da hora do seu corte habitual!`;
        } else if (prediction && prediction.daysUntil <= 2) {
            reminderText += `\n\n⏰ Baseado no seu padrão, você costuma vir por essa época!`;
        }
        
        // Recomendações personalizadas
        if (recommendations.length > 0) {
            reminderText += `\n\n🤖 *SUGESTÕES ESPECIAIS PARA VOCÊ:*\n`;
            
            recommendations.slice(0, 2).forEach((rec, index) => {
                reminderText += `\n${index + 1}. *${rec.service.name}* - ${rec.service.price}`;
                reminderText += `\n   💡 ${rec.reason}`;
            });
        }
        
        // Incentivo para agendar
        const incentives = [
            '\n\nQue tal garantir seu horário? Responda esta mensagem para agendar! 📱',
            '\n\nVamos renovar esse visual? É só responder aqui! ✂️',
            '\n\nTô aqui esperando você! Responde aí para marcarmos! 😄'
        ];
        
        reminderText += incentives[Math.floor(Math.random() * incentives.length)];
        
        return reminderText;
    }

    startReminderService() {
        // Verificar lembretes a cada 2 horas
        setInterval(() => {
            this.checkAndSendReminders();
        }, 2 * 60 * 60 * 1000);
        
        // Primeira verificação após 1 minuto
        setTimeout(() => {
            this.checkAndSendReminders();
        }, 60 * 1000);
        
        console.log('🤖 Sistema de lembretes inteligentes ativado!');
    }
}

module.exports = SmartReminders;