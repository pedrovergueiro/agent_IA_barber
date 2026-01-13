const moment = require('moment');
const Settings = require('../config/settings');

class SmartRecommendations {
    constructor(database) {
        this.db = database;
        this.servicePatterns = new Map();
        this.clientProfiles = new Map();
        this.initializePatterns();
    }

    initializePatterns() {
        // Padrões de comportamento por tipo de serviço
        this.servicePatterns.set('corte', {
            frequency: 30, // dias
            combos: ['barba', 'sobrancelha'],
            seasonality: { summer: 1.2, winter: 0.9 },
            timePreference: ['morning', 'afternoon']
        });

        this.servicePatterns.set('barba', {
            frequency: 15,
            combos: ['corte', 'bigode'],
            seasonality: { summer: 0.8, winter: 1.3 },
            timePreference: ['morning']
        });

        this.servicePatterns.set('especial', {
            frequency: 60,
            combos: ['corte', 'barba'],
            seasonality: { summer: 1.1, winter: 1.1 },
            timePreference: ['weekend']
        });
    }

    async analyzeClient(userId) {
        try {
            const bookings = await this.db.getBookingsByCustomer(userId, 20);
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
            
            if (confirmedBookings.length === 0) {
                return this.getNewClientProfile();
            }

            const profile = {
                totalVisits: confirmedBookings.length,
                favoriteServices: this.getFavoriteServices(confirmedBookings),
                averageInterval: this.calculateAverageInterval(confirmedBookings),
                preferredTimes: this.getPreferredTimes(confirmedBookings),
                lastVisit: confirmedBookings[0] ? moment(confirmedBookings[0].date) : null,
                spendingPattern: this.analyzeSpending(confirmedBookings),
                loyaltyLevel: this.calculateLoyalty(confirmedBookings)
            };

            this.clientProfiles.set(userId, profile);
            return profile;
        } catch (error) {
            console.error('Erro ao analisar cliente:', error);
            return this.getNewClientProfile();
        }
    }

    getNewClientProfile() {
        return {
            totalVisits: 0,
            favoriteServices: [],
            averageInterval: 30,
            preferredTimes: [],
            lastVisit: null,
            spendingPattern: 'unknown',
            loyaltyLevel: 'new'
        };
    }

    getFavoriteServices(bookings) {
        const serviceCount = {};
        bookings.forEach(booking => {
            const serviceName = booking.service_name.toLowerCase();
            serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
        });

        return Object.entries(serviceCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([service, count]) => ({ service, count }));
    }

    calculateAverageInterval(bookings) {
        if (bookings.length < 2) return 30;

        const intervals = [];
        for (let i = 0; i < bookings.length - 1; i++) {
            const current = moment(bookings[i].date);
            const next = moment(bookings[i + 1].date);
            intervals.push(current.diff(next, 'days'));
        }

        return Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }

    getPreferredTimes(bookings) {
        const timeSlots = { morning: 0, afternoon: 0, evening: 0 };
        
        bookings.forEach(booking => {
            const hour = parseInt(booking.time.split(':')[0]);
            if (hour < 12) timeSlots.morning++;
            else if (hour < 17) timeSlots.afternoon++;
            else timeSlots.evening++;
        });

        return Object.entries(timeSlots)
            .sort(([,a], [,b]) => b - a)
            .map(([time]) => time);
    }

    analyzeSpending(bookings) {
        const services = Settings.get('services');
        let totalSpent = 0;
        let serviceCount = 0;

        bookings.forEach(booking => {
            const service = services.find(s => s.id === booking.service_id);
            if (service) {
                const price = parseFloat(service.price.replace(/[^\d,]/g, '').replace(',', '.'));
                totalSpent += price;
                serviceCount++;
            }
        });

        const avgSpending = totalSpent / serviceCount;
        
        if (avgSpending > 60) return 'premium';
        if (avgSpending > 35) return 'standard';
        return 'budget';
    }

    calculateLoyalty(bookings) {
        const monthsActive = this.getMonthsActive(bookings);
        const frequency = bookings.length / Math.max(monthsActive, 1);

        if (bookings.length >= 10 && frequency >= 1) return 'vip';
        if (bookings.length >= 5 && frequency >= 0.5) return 'loyal';
        if (bookings.length >= 2) return 'regular';
        return 'new';
    }

    getMonthsActive(bookings) {
        if (bookings.length === 0) return 0;
        
        const firstVisit = moment(bookings[bookings.length - 1].date);
        const lastVisit = moment(bookings[0].date);
        
        return Math.max(1, lastVisit.diff(firstVisit, 'months'));
    }

    async getSmartRecommendations(userId) {
        const profile = await this.analyzeClient(userId);
        const services = Settings.get('services');
        
        // Usar apenas serviços populares para recomendações mais focadas
        const popularServices = services.filter(s => s.popular);
        const recommendations = [];

        // Recomendação baseada no perfil
        if (profile.loyaltyLevel === 'new') {
            recommendations.push(...this.getNewClientRecommendations(popularServices));
        } else {
            recommendations.push(...this.getReturningClientRecommendations(profile, popularServices));
        }

        // Recomendações sazonais (apenas serviços populares)
        const seasonalRecs = this.getSeasonalRecommendations(popularServices);
        recommendations.push(...seasonalRecs);

        // Recomendações de combo (apenas serviços populares)
        const comboRecs = this.getComboRecommendations(profile, popularServices);
        recommendations.push(...comboRecs);

        return this.rankRecommendations(recommendations, profile);
    }

    getNewClientRecommendations(services) {
        // Para novos clientes, recomendar serviços populares e de entrada
        return services
            .filter(s => s.popular || s.name.toLowerCase().includes('corte'))
            .map(service => ({
                service,
                reason: 'Perfeito para começar! 😊',
                confidence: 0.8,
                type: 'popular'
            }));
    }

    getReturningClientRecommendations(profile, services) {
        const recommendations = [];

        // Baseado no histórico
        profile.favoriteServices.forEach(fav => {
            const service = services.find(s => 
                s.name.toLowerCase().includes(fav.service.split(' ')[0])
            );
            if (service) {
                recommendations.push({
                    service,
                    reason: `Seu favorito! Já fez ${fav.count}x 🔥`,
                    confidence: 0.9,
                    type: 'favorite'
                });
            }
        });

        // Baseado no tempo desde última visita
        if (profile.lastVisit && moment().diff(profile.lastVisit, 'days') >= profile.averageInterval) {
            const urgentServices = services.filter(s => 
                profile.favoriteServices.some(fav => 
                    s.name.toLowerCase().includes(fav.service.split(' ')[0])
                )
            );
            
            urgentServices.forEach(service => {
                recommendations.push({
                    service,
                    reason: 'Tá na hora! ⏰',
                    confidence: 0.85,
                    type: 'timing'
                });
            });
        }

        return recommendations;
    }

    getSeasonalRecommendations(services) {
        const month = moment().month();
        const season = this.getCurrentSeason(month);
        const recommendations = [];

        // Recomendações de verão
        if (season === 'summer') {
            const summerServices = services.filter(s => 
                s.name.toLowerCase().includes('degradê') || 
                s.name.toLowerCase().includes('navalhado')
            );
            
            summerServices.forEach(service => {
                recommendations.push({
                    service,
                    reason: 'Perfeito para o verão! ☀️',
                    confidence: 0.7,
                    type: 'seasonal'
                });
            });
        }

        // Recomendações de inverno
        if (season === 'winter') {
            const winterServices = services.filter(s => 
                s.name.toLowerCase().includes('barba') ||
                s.name.toLowerCase().includes('bigode')
            );
            
            winterServices.forEach(service => {
                recommendations.push({
                    service,
                    reason: 'Ideal para o inverno! 🧥',
                    confidence: 0.7,
                    type: 'seasonal'
                });
            });
        }

        return recommendations;
    }

    getCurrentSeason(month) {
        if (month >= 11 || month <= 2) return 'summer'; // Verão no Brasil
        if (month >= 3 && month <= 5) return 'autumn';
        if (month >= 6 && month <= 8) return 'winter';
        return 'spring';
    }

    getComboRecommendations(profile, services) {
        const recommendations = [];

        // Se fez corte, recomendar barba
        if (profile.favoriteServices.some(fav => fav.service.includes('corte'))) {
            const comboServices = services.filter(s => 
                s.name.toLowerCase().includes('corte') && 
                s.name.toLowerCase().includes('barba')
            );
            
            comboServices.forEach(service => {
                recommendations.push({
                    service,
                    reason: 'Combo perfeito! 💪',
                    confidence: 0.8,
                    type: 'combo'
                });
            });
        }

        return recommendations;
    }

    rankRecommendations(recommendations, profile) {
        // Remover duplicatas
        const unique = recommendations.filter((rec, index, self) => 
            index === self.findIndex(r => r.service.id === rec.service.id)
        );

        // Ordenar por confiança e tipo
        return unique
            .sort((a, b) => {
                // Priorizar favoritos para clientes fiéis
                if (profile.loyaltyLevel === 'vip' || profile.loyaltyLevel === 'loyal') {
                    if (a.type === 'favorite' && b.type !== 'favorite') return -1;
                    if (b.type === 'favorite' && a.type !== 'favorite') return 1;
                }
                
                return b.confidence - a.confidence;
            })
            .slice(0, 3); // Top 3 recomendações
    }

    async generateSmartWelcome(userId) {
        const profile = await this.analyzeClient(userId);
        const recommendations = await this.getSmartRecommendations(userId);
        
        let welcomeText = '';

        // Mensagem personalizada baseada no perfil
        switch (profile.loyaltyLevel) {
            case 'vip':
                welcomeText = `E aí, ${this.getVipGreeting()}! 👑 Que bom te ver de novo!`;
                break;
            case 'loyal':
                welcomeText = `Opa! Nosso cliente fiel chegou! 🔥`;
                break;
            case 'regular':
                welcomeText = `Olá! Bem-vindo de volta! 😊`;
                break;
            default:
                welcomeText = `Oi! Seja muito bem-vindo! 👋`;
        }

        // Adicionar recomendações inteligentes
        if (recommendations.length > 0) {
            welcomeText += `\n\n🤖 *IA RECOMENDA PARA VOCÊ:*\n`;
            
            recommendations.forEach((rec, index) => {
                welcomeText += `\n${index + 1}. *${rec.service.name}* - ${rec.service.price}`;
                welcomeText += `\n   💡 ${rec.reason}\n`;
            });
        }

        return welcomeText;
    }

    getVipGreeting() {
        const greetings = ['campeão', 'parceiro', 'mestre', 'chefe', 'fera'];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    async predictNextVisit(userId) {
        const profile = await this.analyzeClient(userId);
        
        if (!profile.lastVisit) return null;
        
        const nextVisit = profile.lastVisit.clone().add(profile.averageInterval, 'days');
        const daysUntil = nextVisit.diff(moment(), 'days');
        
        return {
            date: nextVisit,
            daysUntil,
            confidence: profile.totalVisits >= 3 ? 0.8 : 0.5
        };
    }

    async shouldSendReminder(userId) {
        const prediction = await this.predictNextVisit(userId);
        
        if (!prediction) return false;
        
        // Enviar lembrete 2 dias antes da data prevista
        return prediction.daysUntil <= 2 && prediction.daysUntil >= 0 && prediction.confidence >= 0.7;
    }
}

module.exports = SmartRecommendations;