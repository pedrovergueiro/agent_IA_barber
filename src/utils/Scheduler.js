const cron = require('node-cron');
const moment = require('moment');

class Scheduler {
    constructor(database) {
        this.db = database;
        this.init();
    }

    init() {
        // Limpar reservas expiradas a cada 5 minutos
        cron.schedule('*/5 * * * *', async () => {
            await this.cleanExpiredReservations();
        });

        // Enviar lembretes diários às 8h
        cron.schedule('0 8 * * *', async () => {
            await this.sendDailyReminders();
        });

        console.log('✅ Agendador de tarefas iniciado');
    }

    async cleanExpiredReservations() {
        try {
            const thirtyMinutesAgo = moment().subtract(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            
            const query = `
                DELETE FROM time_reservations 
                WHERE status = 'reserved' 
                AND created_at < ?
            `;

            await new Promise((resolve, reject) => {
                this.db.db.run(query, [thirtyMinutesAgo], function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        if (this.changes > 0) {
                            console.log(`🧹 Limpeza: ${this.changes} reservas expiradas removidas`);
                        }
                        resolve();
                    }
                });
            });

        } catch (error) {
            console.error('Erro ao limpar reservas expiradas:', error);
        }
    }

    async sendDailyReminders() {
        try {
            const today = moment().format('YYYY-MM-DD');
            const bookings = await this.db.getBookingsByDate(today);
            
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
            
            if (confirmedBookings.length > 0) {
                console.log(`📅 ${confirmedBookings.length} agendamentos confirmados para hoje`);
            }

        } catch (error) {
            console.error('Erro ao enviar lembretes:', error);
        }
    }
}

module.exports = Scheduler;