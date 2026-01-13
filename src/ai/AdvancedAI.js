const moment = require('moment');
const Settings = require('../config/settings');

class AdvancedAI {
    constructor(database) {
        this.db = database;
        this.clientProfiles = new Map();
        this.behaviorPatterns = new Map();
        this.predictionCache = new Map();
        this.conversationContext = new Map();
        
        // Inicializar padrões de ML
        this.initializeMLPatterns();
    }

    initializeMLPatterns() {
        // Padrões de clustering para segmentação de clientes
        this.clientClusters = {
            'executivo_apressado': {
                characteristics: ['morning_preference', 'quick_services', 'high_frequency'],
                services: ['corte', 'barba_express'],
                communication_style: 'formal',
                time_sensitivity: 'high'
            },
            'jovem_moderno': {
                characteristics: ['afternoon_preference', 'trendy_services', 'social_media'],
                services: ['degradê', 'navalhado', 'pigmentação'],
                communication_style: 'casual',
                time_sensitivity: 'medium'
            },
            'cliente_tradicional': {
                characteristics: ['fixed_schedule', 'classic_services', 'loyalty'],
                services: ['corte_tradicional', 'barba'],
                communication_style: 'friendly',
                time_sensitivity: 'low'
            },
            'ocasional_especial': {
                characteristics: ['event_driven', 'premium_services', 'irregular'],
                services: ['corte_especial', 'alizamento', 'combo_completo'],
                communication_style: 'enthusiastic',
                time_sensitivity: 'event_based'
            }
        };

        // Padrões de comportamento para ML
        this.behaviorWeights = {
            frequency: 0.3,
            recency: 0.25,
            monetary: 0.2,
            service_variety: 0.15,
            time_consistency: 0.1
        };
    }

    // ========== ANÁLISE COMPORTAMENTAL AVANÇADA ==========

    async analyzeClientBehavior(userId) {
        try {
            const bookings = await this.db.getBookingsByCustomer(userId, 50);
            const conversations = await this.getConversationHistory(userId);
            
            const behavior = {
                // Padrões temporais
                timePatterns: this.analyzeTimePatterns(bookings),
                
                // Padrões de serviço
                servicePatterns: this.analyzeServicePatterns(bookings),
                
                // Padrões de comunicação
                communicationPatterns: this.analyzeCommunicationPatterns(conversations),
                
                // Padrões de decisão
                decisionPatterns: this.analyzeDecisionPatterns(bookings, conversations),
                
                // Scoring comportamental
                behaviorScore: this.calculateBehaviorScore(bookings, conversations)
            };

            // Salvar no cache e banco
            this.behaviorPatterns.set(userId, behavior);
            await this.saveBehaviorData(userId, behavior);
            
            return behavior;
        } catch (error) {
            console.error('Erro na análise comportamental:', error);
            return this.getDefaultBehavior();
        }
    }

    analyzeTimePatterns(bookings) {
        const patterns = {
            preferredDays: {},
            preferredHours: {},
            seasonality: {},
            consistency: 0
        };

        bookings.forEach(booking => {
            const date = moment(booking.date);
            const hour = parseInt(booking.time.split(':')[0]);
            const dayOfWeek = date.day();
            const month = date.month();

            // Dias preferidos
            patterns.preferredDays[dayOfWeek] = (patterns.preferredDays[dayOfWeek] || 0) + 1;
            
            // Horários preferidos
            const timeSlot = this.getTimeSlot(hour);
            patterns.preferredHours[timeSlot] = (patterns.preferredHours[timeSlot] || 0) + 1;
            
            // Sazonalidade
            const season = this.getSeason(month);
            patterns.seasonality[season] = (patterns.seasonality[season] || 0) + 1;
        });

        // Calcular consistência
        patterns.consistency = this.calculateTimeConsistency(bookings);

        return patterns;
    }

    analyzeServicePatterns(bookings) {
        const patterns = {
            favoriteServices: {},
            serviceEvolution: [],
            comboPreference: {},
            priceSegment: 'standard'
        };

        let totalSpent = 0;
        const services = Settings.get('services');

        bookings.forEach((booking, index) => {
            // Serviços favoritos
            patterns.favoriteServices[booking.service_name] = 
                (patterns.favoriteServices[booking.service_name] || 0) + 1;

            // Evolução dos serviços
            patterns.serviceEvolution.push({
                date: booking.date,
                service: booking.service_name,
                order: index
            });

            // Análise de preços
            const service = services.find(s => s.id === booking.service_id);
            if (service) {
                const price = this.extractPrice(service.price);
                totalSpent += price;
            }
        });

        // Determinar segmento de preço
        const avgSpent = totalSpent / bookings.length;
        if (avgSpent > 70) patterns.priceSegment = 'premium';
        else if (avgSpent > 45) patterns.priceSegment = 'standard';
        else patterns.priceSegment = 'budget';

        return patterns;
    }

    analyzeCommunicationPatterns(conversations) {
        return {
            responseTime: this.calculateAvgResponseTime(conversations),
            messageLength: this.calculateAvgMessageLength(conversations),
            emojiUsage: this.analyzeEmojiUsage(conversations),
            questionFrequency: this.analyzeQuestionFrequency(conversations),
            communicationStyle: this.determineCommunicationStyle(conversations)
        };
    }

    analyzeDecisionPatterns(bookings, conversations) {
        return {
            decisionSpeed: this.calculateDecisionSpeed(conversations),
            changeFrequency: this.calculateChangeFrequency(bookings),
            priceConsciousness: this.analyzePriceConsciousness(conversations),
            planningHorizon: this.calculatePlanningHorizon(bookings)
        };
    }

    // ========== MACHINE LEARNING BÁSICO ==========

    async predictClientCluster(userId) {
        const behavior = await this.analyzeClientBehavior(userId);
        const scores = {};

        // Calcular score para cada cluster
        Object.keys(this.clientClusters).forEach(clusterName => {
            scores[clusterName] = this.calculateClusterScore(behavior, this.clientClusters[clusterName]);
        });

        // Retornar cluster com maior score
        const bestCluster = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        );

        return {
            cluster: bestCluster,
            confidence: scores[bestCluster],
            allScores: scores
        };
    }

    calculateClusterScore(behavior, clusterPattern) {
        let score = 0;
        let factors = 0;

        // Analisar padrões temporais
        if (clusterPattern.characteristics.includes('morning_preference')) {
            score += (behavior.timePatterns.preferredHours.morning || 0) * 0.2;
            factors++;
        }

        if (clusterPattern.characteristics.includes('afternoon_preference')) {
            score += (behavior.timePatterns.preferredHours.afternoon || 0) * 0.2;
            factors++;
        }

        // Analisar consistência
        if (clusterPattern.characteristics.includes('fixed_schedule')) {
            score += behavior.timePatterns.consistency * 0.3;
            factors++;
        }

        // Analisar frequência
        if (clusterPattern.characteristics.includes('high_frequency')) {
            score += behavior.behaviorScore.frequency * 0.25;
            factors++;
        }

        // Analisar segmento de preço
        if (behavior.servicePatterns.priceSegment === 'premium' && 
            clusterPattern.characteristics.includes('premium_services')) {
            score += 0.3;
            factors++;
        }

        return factors > 0 ? score / factors : 0;
    }

    // ========== PREVISÕES AVANÇADAS ==========

    async predictNextVisit(userId) {
        const behavior = await this.analyzeClientBehavior(userId);
        const bookings = await this.db.getBookingsByCustomer(userId, 10);
        
        if (bookings.length < 2) {
            return this.getDefaultPrediction();
        }

        // Calcular intervalos históricos
        const intervals = this.calculateIntervals(bookings);
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        // Ajustar baseado em padrões comportamentais
        const adjustedInterval = this.adjustIntervalByBehavior(avgInterval, behavior);
        
        // Prever próxima visita
        const lastVisit = moment(bookings[0].date);
        const predictedDate = lastVisit.add(adjustedInterval, 'days');
        
        // Calcular confiança da previsão
        const confidence = this.calculatePredictionConfidence(intervals, behavior);
        
        return {
            predictedDate,
            daysFromNow: predictedDate.diff(moment(), 'days'),
            confidence,
            suggestedServices: await this.predictPreferredServices(userId, behavior),
            reasoning: this.generatePredictionReasoning(behavior, adjustedInterval)
        };
    }

    async predictChurnRisk(userId) {
        const behavior = await this.analyzeClientBehavior(userId);
        const bookings = await this.db.getBookingsByCustomer(userId, 20);
        
        let churnScore = 0;
        const factors = [];

        // Fator 1: Tempo desde última visita
        if (bookings.length > 0) {
            const daysSinceLastVisit = moment().diff(moment(bookings[0].date), 'days');
            const avgInterval = this.calculateAverageInterval(bookings);
            
            if (daysSinceLastVisit > avgInterval * 1.5) {
                churnScore += 0.4;
                factors.push('Tempo excessivo desde última visita');
            }
        }

        // Fator 2: Declínio na frequência
        const frequencyTrend = this.calculateFrequencyTrend(bookings);
        if (frequencyTrend < -0.2) {
            churnScore += 0.3;
            factors.push('Declínio na frequência de visitas');
        }

        // Fator 3: Mudança no padrão de gastos
        const spendingTrend = this.calculateSpendingTrend(bookings);
        if (spendingTrend < -0.15) {
            churnScore += 0.2;
            factors.push('Redução no valor gasto');
        }

        // Fator 4: Cancelamentos recentes
        const recentCancellations = bookings.filter(b => 
            b.status === 'cancelled' && 
            moment().diff(moment(b.date), 'days') < 60
        ).length;
        
        if (recentCancellations > 1) {
            churnScore += 0.1;
            factors.push('Cancelamentos recentes');
        }

        return {
            churnRisk: Math.min(churnScore, 1),
            riskLevel: this.getRiskLevel(churnScore),
            factors,
            recommendedActions: this.getChurnPreventionActions(churnScore, factors)
        };
    }

    async predictServicePreference(userId, availableServices) {
        const behavior = await this.analyzeClientBehavior(userId);
        const cluster = await this.predictClientCluster(userId);
        
        const predictions = availableServices.map(service => {
            let score = 0;

            // Score baseado no histórico
            const historicalPreference = behavior.servicePatterns.favoriteServices[service.name] || 0;
            score += historicalPreference * 0.4;

            // Score baseado no cluster
            const clusterServices = this.clientClusters[cluster.cluster].services;
            const serviceType = this.getServiceType(service.name);
            if (clusterServices.includes(serviceType)) {
                score += 0.3;
            }

            // Score baseado na sazonalidade
            const seasonalScore = this.getSeasonalScore(service, moment().month());
            score += seasonalScore * 0.2;

            // Score baseado no segmento de preço
            const priceScore = this.getPriceSegmentScore(service, behavior.servicePatterns.priceSegment);
            score += priceScore * 0.1;

            return {
                service,
                score,
                confidence: Math.min(score, 1),
                reasoning: this.generateServiceReasoning(service, behavior, cluster)
            };
        });

        return predictions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    // ========== PERSONALIZAÇÃO EXTREMA ==========

    async generatePersonalizedWelcome(userId) {
        const behavior = await this.analyzeClientBehavior(userId);
        const cluster = await this.predictClientCluster(userId);
        const churnRisk = await this.predictChurnRisk(userId);
        
        const clusterConfig = this.clientClusters[cluster.cluster];
        let welcome = '';

        // Saudação baseada no cluster
        switch (cluster.cluster) {
            case 'executivo_apressado':
                welcome = this.getExecutiveGreeting(behavior);
                break;
            case 'jovem_moderno':
                welcome = this.getModernGreeting(behavior);
                break;
            case 'cliente_tradicional':
                welcome = this.getTraditionalGreeting(behavior);
                break;
            case 'ocasional_especial':
                welcome = this.getSpecialGreeting(behavior);
                break;
        }

        // Ajustar tom baseado no risco de churn
        if (churnRisk.churnRisk > 0.6) {
            welcome = this.addRetentionTone(welcome, behavior);
        }

        // Adicionar contexto temporal
        welcome = this.addTemporalContext(welcome, behavior);

        return {
            message: welcome,
            tone: clusterConfig.communication_style,
            cluster: cluster.cluster,
            confidence: cluster.confidence
        };
    }

    async generatePersonalizedRecommendations(userId) {
        const behavior = await this.analyzeClientBehavior(userId);
        const services = Settings.get('services');
        const predictions = await this.predictServicePreference(userId, services);
        
        const recommendations = predictions.slice(0, 3).map(pred => ({
            service: pred.service,
            reason: pred.reasoning,
            confidence: pred.confidence,
            personalizedMessage: this.generatePersonalizedMessage(pred, behavior)
        }));

        return recommendations;
    }

    // ========== ANÁLISE DE SENTIMENTO ==========

    analyzeSentiment(message) {
        const positiveWords = ['ótimo', 'perfeito', 'excelente', 'adorei', 'amei', 'top', 'show', 'massa'];
        const negativeWords = ['ruim', 'péssimo', 'horrível', 'odeio', 'terrível', 'não gostei'];
        const neutralWords = ['ok', 'normal', 'regular', 'mais ou menos'];

        const words = message.toLowerCase().split(' ');
        let sentiment = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) sentiment += 1;
            if (negativeWords.includes(word)) sentiment -= 1;
        });

        if (sentiment > 0) return 'positive';
        if (sentiment < 0) return 'negative';
        return 'neutral';
    }

    // ========== OTIMIZAÇÃO OPERACIONAL ==========

    async predictNoShowRisk(bookingId) {
        const booking = await this.db.getBookingById(bookingId);
        if (!booking) return { risk: 0, factors: [] };

        const behavior = await this.analyzeClientBehavior(booking.user_id);
        let riskScore = 0;
        const factors = [];

        // Histórico de no-shows
        const pastBookings = await this.db.getBookingsByCustomer(booking.user_id, 10);
        const noShows = pastBookings.filter(b => b.status === 'no_show').length;
        if (noShows > 0) {
            riskScore += noShows * 0.2;
            factors.push(`${noShows} no-shows anteriores`);
        }

        // Tempo até o agendamento
        const hoursUntilBooking = moment(`${booking.date} ${booking.time}`).diff(moment(), 'hours');
        if (hoursUntilBooking > 168) { // Mais de 1 semana
            riskScore += 0.1;
            factors.push('Agendamento muito antecipado');
        }

        // Padrão de cancelamentos
        const recentCancellations = pastBookings.filter(b => 
            b.status === 'cancelled' && 
            moment().diff(moment(b.created_at), 'days') < 30
        ).length;
        
        if (recentCancellations > 1) {
            riskScore += 0.15;
            factors.push('Cancelamentos recentes');
        }

        return {
            risk: Math.min(riskScore, 1),
            level: riskScore > 0.5 ? 'high' : riskScore > 0.2 ? 'medium' : 'low',
            factors,
            recommendations: this.getNoShowPreventionActions(riskScore)
        };
    }

    // ========== MÉTODOS AUXILIARES ==========

    getTimeSlot(hour) {
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    }

    getSeason(month) {
        if (month >= 11 || month <= 2) return 'summer';
        if (month >= 3 && month <= 5) return 'autumn';
        if (month >= 6 && month <= 8) return 'winter';
        return 'spring';
    }

    extractPrice(priceString) {
        const match = priceString.match(/[\d,]+/);
        return match ? parseFloat(match[0].replace(',', '.')) : 0;
    }

    calculateBehaviorScore(bookings, conversations) {
        return {
            frequency: this.calculateFrequencyScore(bookings),
            recency: this.calculateRecencyScore(bookings),
            monetary: this.calculateMonetaryScore(bookings),
            engagement: this.calculateEngagementScore(conversations)
        };
    }

    calculateFrequencyScore(bookings) {
        if (bookings.length === 0) return 0;
        const monthsActive = this.getMonthsActive(bookings);
        return Math.min(bookings.length / Math.max(monthsActive, 1), 1);
    }

    calculateRecencyScore(bookings) {
        if (bookings.length === 0) return 0;
        const daysSinceLastVisit = moment().diff(moment(bookings[0].date), 'days');
        return Math.max(0, 1 - (daysSinceLastVisit / 90)); // 90 dias = score 0
    }

    calculateMonetaryScore(bookings) {
        const services = Settings.get('services');
        let totalSpent = 0;
        
        bookings.forEach(booking => {
            const service = services.find(s => s.id === booking.service_id);
            if (service) {
                totalSpent += this.extractPrice(service.price);
            }
        });

        // Normalizar baseado no valor médio dos serviços
        const avgServicePrice = 45; // Valor médio estimado
        return Math.min(totalSpent / (bookings.length * avgServicePrice), 2);
    }

    getMonthsActive(bookings) {
        if (bookings.length === 0) return 0;
        const firstVisit = moment(bookings[bookings.length - 1].date);
        const lastVisit = moment(bookings[0].date);
        return Math.max(1, lastVisit.diff(firstVisit, 'months'));
    }

    async getConversationHistory(userId) {
        // Implementar busca no histórico de conversas
        // Por enquanto, retornar array vazio
        return [];
    }

    async saveBehaviorData(userId, behavior) {
        try {
            // Salvar dados comportamentais no banco
            await this.db.saveBehaviorAnalysis(userId, behavior);
        } catch (error) {
            console.error('Erro ao salvar dados comportamentais:', error);
        }
    }

    getDefaultBehavior() {
        return {
            timePatterns: { preferredDays: {}, preferredHours: {}, consistency: 0 },
            servicePatterns: { favoriteServices: {}, priceSegment: 'standard' },
            communicationPatterns: { communicationStyle: 'friendly' },
            decisionPatterns: { decisionSpeed: 'medium' },
            behaviorScore: { frequency: 0, recency: 0, monetary: 0, engagement: 0 }
        };
    }

    getDefaultPrediction() {
        return {
            predictedDate: moment().add(30, 'days'),
            daysFromNow: 30,
            confidence: 0.3,
            suggestedServices: [],
            reasoning: 'Previsão baseada em padrão padrão'
        };
    }

    // Métodos de geração de mensagens personalizadas
    getExecutiveGreeting(behavior) {
        return "Bom dia! Pronto para renovar o visual executivo? 💼";
    }

    getModernGreeting(behavior) {
        return "E aí! Bora deixar esse visual ainda mais top? 🔥";
    }

    getTraditionalGreeting(behavior) {
        return "Olá! Que bom te ver por aqui novamente! 😊";
    }

    getSpecialGreeting(behavior) {
        return "Opa! Preparando para algo especial? ✨";
    }

    getRiskLevel(score) {
        if (score > 0.7) return 'high';
        if (score > 0.4) return 'medium';
        return 'low';
    }

    getChurnPreventionActions(score, factors) {
        const actions = [];
        
        if (score > 0.6) {
            actions.push('Enviar mensagem personalizada de reconexão');
            actions.push('Oferecer agendamento prioritário');
        }
        
        if (factors.includes('Tempo excessivo desde última visita')) {
            actions.push('Lembrete amigável sobre cuidados com o visual');
        }
        
        return actions;
    }

    getNoShowPreventionActions(riskScore) {
        const actions = [];
        
        if (riskScore > 0.5) {
            actions.push('Enviar lembrete 24h antes');
            actions.push('Confirmar agendamento por telefone');
        }
        
        if (riskScore > 0.3) {
            actions.push('Enviar lembrete 2h antes');
        }
        
        return actions;
    }
}

module.exports = AdvancedAI;