const moment = require('moment');

class BehaviorTracker {
    constructor(database) {
        this.db = database;
        this.behaviorCache = new Map();
        this.sessionData = new Map();
    }

    // ========== RASTREAMENTO DE COMPORTAMENTO EM TEMPO REAL ==========

    async trackUserInteraction(userId, interaction) {
        try {
            const timestamp = moment().toISOString();
            
            // Obter dados da sessão atual
            let sessionData = this.sessionData.get(userId) || {
                sessionStart: timestamp,
                interactions: [],
                currentStep: null,
                decisionPoints: [],
                responsePatterns: []
            };

            // Adicionar interação
            sessionData.interactions.push({
                type: interaction.type,
                content: interaction.content,
                timestamp,
                step: interaction.step,
                responseTime: interaction.responseTime || null
            });

            // Analisar padrões de decisão
            if (interaction.type === 'decision') {
                sessionData.decisionPoints.push({
                    decision: interaction.content,
                    timeToDecide: interaction.timeToDecide,
                    timestamp,
                    context: interaction.context
                });
            }

            // Analisar padrões de resposta
            if (interaction.type === 'message') {
                sessionData.responsePatterns.push({
                    messageLength: interaction.content.length,
                    responseTime: interaction.responseTime,
                    emojiCount: this.countEmojis(interaction.content),
                    questionMarks: (interaction.content.match(/\?/g) || []).length,
                    timestamp
                });
            }

            this.sessionData.set(userId, sessionData);
            
            // Salvar no banco periodicamente
            if (sessionData.interactions.length % 5 === 0) {
                await this.saveBehaviorData(userId, sessionData);
            }

            return sessionData;
        } catch (error) {
            console.error('Erro ao rastrear interação:', error);
            return null;
        }
    }

    async trackBookingBehavior(userId, bookingData) {
        try {
            const behavior = {
                userId,
                bookingId: bookingData.id,
                serviceSelected: bookingData.serviceName,
                timeToBook: bookingData.timeToBook,
                changesCount: bookingData.changesCount || 0,
                paymentMethod: bookingData.paymentMethod,
                completionRate: bookingData.completed ? 1 : 0,
                timestamp: moment().toISOString()
            };

            await this.saveBehaviorData(userId, { bookingBehavior: behavior });
            return behavior;
        } catch (error) {
            console.error('Erro ao rastrear comportamento de agendamento:', error);
            return null;
        }
    }

    async trackCancellationBehavior(userId, cancellationData) {
        try {
            const behavior = {
                userId,
                bookingId: cancellationData.bookingId,
                reasonCategory: this.categorizeCancellationReason(cancellationData.reason),
                timeBeforeAppointment: cancellationData.timeBeforeAppointment,
                isRepeatedCancellation: await this.isRepeatedCanceller(userId),
                timestamp: moment().toISOString()
            };

            await this.saveBehaviorData(userId, { cancellationBehavior: behavior });
            return behavior;
        } catch (error) {
            console.error('Erro ao rastrear comportamento de cancelamento:', error);
            return null;
        }
    }

    // ========== ANÁLISE DE PADRÕES COMPORTAMENTAIS ==========

    async analyzeCommunicationStyle(userId) {
        try {
            const sessionData = this.sessionData.get(userId);
            if (!sessionData || sessionData.responsePatterns.length === 0) {
                return this.getDefaultCommunicationStyle();
            }

            const patterns = sessionData.responsePatterns;
            
            const analysis = {
                avgMessageLength: this.calculateAverage(patterns.map(p => p.messageLength)),
                avgResponseTime: this.calculateAverage(patterns.map(p => p.responseTime).filter(t => t)),
                emojiUsage: this.calculateAverage(patterns.map(p => p.emojiCount)),
                questionFrequency: this.calculateAverage(patterns.map(p => p.questionMarks)),
                communicationTone: this.determineTone(patterns),
                formalityLevel: this.determineFormalityLevel(patterns),
                engagementLevel: this.calculateEngagementLevel(patterns)
            };

            return analysis;
        } catch (error) {
            console.error('Erro ao analisar estilo de comunicação:', error);
            return this.getDefaultCommunicationStyle();
        }
    }

    async analyzeDecisionPatterns(userId) {
        try {
            const sessionData = this.sessionData.get(userId);
            if (!sessionData || sessionData.decisionPoints.length === 0) {
                return this.getDefaultDecisionPattern();
            }

            const decisions = sessionData.decisionPoints;
            
            const analysis = {
                avgDecisionTime: this.calculateAverage(decisions.map(d => d.timeToDecide).filter(t => t)),
                decisionConfidence: this.calculateDecisionConfidence(decisions),
                changeFrequency: this.calculateChangeFrequency(decisions),
                decisionStyle: this.determineDecisionStyle(decisions),
                consistencyScore: this.calculateConsistencyScore(decisions)
            };

            return analysis;
        } catch (error) {
            console.error('Erro ao analisar padrões de decisão:', error);
            return this.getDefaultDecisionPattern();
        }
    }

    async analyzeEngagementLevel(userId) {
        try {
            const sessionData = this.sessionData.get(userId);
            if (!sessionData) {
                return { level: 'medium', score: 0.5 };
            }

            let engagementScore = 0;
            let factors = 0;

            // Fator 1: Frequência de interações
            const interactionCount = sessionData.interactions.length;
            if (interactionCount > 0) {
                engagementScore += Math.min(interactionCount / 10, 1) * 0.3;
                factors++;
            }

            // Fator 2: Tempo de sessão
            const sessionDuration = moment().diff(moment(sessionData.sessionStart), 'minutes');
            if (sessionDuration > 0) {
                engagementScore += Math.min(sessionDuration / 15, 1) * 0.2;
                factors++;
            }

            // Fator 3: Uso de emojis e expressividade
            const responsePatterns = sessionData.responsePatterns || [];
            if (responsePatterns.length > 0) {
                const avgEmojis = this.calculateAverage(responsePatterns.map(p => p.emojiCount));
                engagementScore += Math.min(avgEmojis / 3, 1) * 0.2;
                factors++;
            }

            // Fator 4: Completude de ações
            const completedActions = sessionData.interactions.filter(i => i.type === 'completion').length;
            const totalActions = sessionData.interactions.filter(i => i.type === 'action').length;
            if (totalActions > 0) {
                engagementScore += (completedActions / totalActions) * 0.3;
                factors++;
            }

            const finalScore = factors > 0 ? engagementScore / factors : 0.5;

            return {
                level: this.getEngagementLevel(finalScore),
                score: finalScore,
                factors: {
                    interactions: interactionCount,
                    sessionDuration,
                    expressiveness: responsePatterns.length > 0 ? this.calculateAverage(responsePatterns.map(p => p.emojiCount)) : 0,
                    completionRate: totalActions > 0 ? completedActions / totalActions : 0
                }
            };
        } catch (error) {
            console.error('Erro ao analisar nível de engajamento:', error);
            return { level: 'medium', score: 0.5 };
        }
    }

    // ========== PREDIÇÃO DE COMPORTAMENTO ==========

    async predictUserBehavior(userId) {
        try {
            const communicationStyle = await this.analyzeCommunicationStyle(userId);
            const decisionPatterns = await this.analyzeDecisionPatterns(userId);
            const engagementLevel = await this.analyzeEngagementLevel(userId);
            const historicalData = await this.getHistoricalBehavior(userId);

            const predictions = {
                likelyToComplete: this.predictCompletionLikelihood(decisionPatterns, engagementLevel),
                preferredCommunicationStyle: this.predictPreferredStyle(communicationStyle),
                optimalInteractionTime: this.predictOptimalTime(historicalData),
                churnRisk: this.predictChurnRisk(engagementLevel, historicalData),
                servicePreferences: await this.predictServicePreferences(userId, historicalData),
                nextAction: this.predictNextAction(decisionPatterns, engagementLevel)
            };

            return predictions;
        } catch (error) {
            console.error('Erro ao prever comportamento:', error);
            return this.getDefaultPredictions();
        }
    }

    async predictOptimalResponseTime(userId) {
        try {
            const sessionData = this.sessionData.get(userId);
            if (!sessionData || sessionData.responsePatterns.length === 0) {
                return { optimal: 2000, confidence: 0.3 }; // 2 segundos padrão
            }

            const responseTimes = sessionData.responsePatterns
                .map(p => p.responseTime)
                .filter(t => t && t > 0);

            if (responseTimes.length === 0) {
                return { optimal: 2000, confidence: 0.3 };
            }

            const avgResponseTime = this.calculateAverage(responseTimes);
            const optimalTime = Math.max(avgResponseTime * 0.8, 1000); // 80% do tempo médio, mínimo 1s

            return {
                optimal: Math.round(optimalTime),
                confidence: Math.min(responseTimes.length / 10, 1),
                userPattern: avgResponseTime
            };
        } catch (error) {
            console.error('Erro ao prever tempo de resposta ótimo:', error);
            return { optimal: 2000, confidence: 0.3 };
        }
    }

    // ========== MÉTODOS AUXILIARES ==========

    countEmojis(text) {
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
        const matches = text.match(emojiRegex);
        return matches ? matches.length : 0;
    }

    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    determineTone(patterns) {
        const avgEmojis = this.calculateAverage(patterns.map(p => p.emojiCount));
        const avgQuestions = this.calculateAverage(patterns.map(p => p.questionMarks));

        if (avgEmojis > 2 && avgQuestions > 0.5) return 'enthusiastic';
        if (avgEmojis > 1) return 'friendly';
        if (avgQuestions > 1) return 'inquisitive';
        return 'neutral';
    }

    determineFormalityLevel(patterns) {
        const avgLength = this.calculateAverage(patterns.map(p => p.messageLength));
        const avgEmojis = this.calculateAverage(patterns.map(p => p.emojiCount));

        if (avgLength > 50 && avgEmojis < 1) return 'formal';
        if (avgLength < 20 && avgEmojis > 1) return 'casual';
        return 'neutral';
    }

    calculateEngagementLevel(patterns) {
        const totalInteractions = patterns.length;
        const avgLength = this.calculateAverage(patterns.map(p => p.messageLength));
        const avgEmojis = this.calculateAverage(patterns.map(p => p.emojiCount));

        let score = 0;
        if (totalInteractions > 5) score += 0.3;
        if (avgLength > 30) score += 0.3;
        if (avgEmojis > 1) score += 0.4;

        return Math.min(score, 1);
    }

    determineDecisionStyle(decisions) {
        const avgTime = this.calculateAverage(decisions.map(d => d.timeToDecide).filter(t => t));
        
        if (avgTime < 5000) return 'impulsive'; // Menos de 5 segundos
        if (avgTime < 30000) return 'quick'; // Menos de 30 segundos
        if (avgTime < 120000) return 'thoughtful'; // Menos de 2 minutos
        return 'deliberate'; // Mais de 2 minutos
    }

    calculateDecisionConfidence(decisions) {
        const changesCount = decisions.filter(d => d.decision.includes('mudar') || d.decision.includes('voltar')).length;
        return Math.max(0, 1 - (changesCount / decisions.length));
    }

    calculateChangeFrequency(decisions) {
        const changes = decisions.filter(d => 
            d.decision.includes('mudar') || 
            d.decision.includes('voltar') || 
            d.decision.includes('alterar')
        ).length;
        
        return decisions.length > 0 ? changes / decisions.length : 0;
    }

    calculateConsistencyScore(decisions) {
        if (decisions.length < 2) return 1;
        
        const times = decisions.map(d => d.timeToDecide).filter(t => t);
        if (times.length < 2) return 0.5;
        
        const variance = this.calculateVariance(times);
        const avgTime = this.calculateAverage(times);
        
        // Menor variância = maior consistência
        return Math.max(0, 1 - (variance / (avgTime * avgTime)));
    }

    calculateVariance(numbers) {
        const avg = this.calculateAverage(numbers);
        const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
        return this.calculateAverage(squaredDiffs);
    }

    getEngagementLevel(score) {
        if (score > 0.8) return 'high';
        if (score > 0.6) return 'medium-high';
        if (score > 0.4) return 'medium';
        if (score > 0.2) return 'medium-low';
        return 'low';
    }

    categorizeCancellationReason(reason) {
        if (!reason) return 'unknown';
        
        const reasonLower = reason.toLowerCase();
        
        if (reasonLower.includes('emergência') || reasonLower.includes('urgente')) return 'emergency';
        if (reasonLower.includes('trabalho') || reasonLower.includes('reunião')) return 'work';
        if (reasonLower.includes('doente') || reasonLower.includes('saúde')) return 'health';
        if (reasonLower.includes('viagem') || reasonLower.includes('viajando')) return 'travel';
        if (reasonLower.includes('esqueci') || reasonLower.includes('confundi')) return 'forgot';
        
        return 'other';
    }

    async isRepeatedCanceller(userId) {
        try {
            const bookings = await this.db.getBookingsByCustomer(userId, 10);
            const cancellations = bookings.filter(b => b.status === 'cancelled');
            
            return cancellations.length >= 2;
        } catch (error) {
            console.error('Erro ao verificar cancelamentos repetidos:', error);
            return false;
        }
    }

    predictCompletionLikelihood(decisionPatterns, engagementLevel) {
        let likelihood = 0.5; // Base 50%
        
        // Fator de engajamento
        likelihood += (engagementLevel.score - 0.5) * 0.4;
        
        // Fator de consistência de decisão
        if (decisionPatterns.consistencyScore > 0.7) likelihood += 0.2;
        if (decisionPatterns.changeFrequency < 0.2) likelihood += 0.1;
        
        return Math.max(0, Math.min(1, likelihood));
    }

    predictPreferredStyle(communicationStyle) {
        const { formalityLevel, communicationTone, emojiUsage } = communicationStyle;
        
        if (formalityLevel === 'formal') return 'professional';
        if (communicationTone === 'enthusiastic') return 'energetic';
        if (emojiUsage > 2) return 'expressive';
        if (formalityLevel === 'casual') return 'friendly';
        
        return 'balanced';
    }

    predictChurnRisk(engagementLevel, historicalData) {
        let risk = 0;
        
        // Baixo engajamento = maior risco
        if (engagementLevel.score < 0.3) risk += 0.4;
        else if (engagementLevel.score < 0.5) risk += 0.2;
        
        // Histórico de cancelamentos
        if (historicalData && historicalData.cancellationRate > 0.3) risk += 0.3;
        
        // Tempo desde última interação
        if (historicalData && historicalData.daysSinceLastVisit > 60) risk += 0.3;
        
        return Math.min(1, risk);
    }

    predictNextAction(decisionPatterns, engagementLevel) {
        if (engagementLevel.score > 0.7 && decisionPatterns.decisionStyle === 'quick') {
            return 'likely_to_book';
        }
        
        if (decisionPatterns.changeFrequency > 0.5) {
            return 'needs_guidance';
        }
        
        if (engagementLevel.score < 0.3) {
            return 'likely_to_abandon';
        }
        
        return 'exploring_options';
    }

    async predictServicePreferences(userId, historicalData) {
        try {
            if (!historicalData || !historicalData.favoriteServices) {
                return [];
            }
            
            return historicalData.favoriteServices.slice(0, 3);
        } catch (error) {
            console.error('Erro ao prever preferências de serviço:', error);
            return [];
        }
    }

    async getHistoricalBehavior(userId) {
        try {
            const bookings = await this.db.getBookingsByCustomer(userId, 20);
            
            if (bookings.length === 0) {
                return null;
            }
            
            const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
            const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
            
            return {
                totalBookings: bookings.length,
                confirmedBookings: confirmedBookings.length,
                cancellationRate: cancelledBookings.length / bookings.length,
                daysSinceLastVisit: bookings.length > 0 ? moment().diff(moment(bookings[0].date), 'days') : null,
                favoriteServices: this.extractFavoriteServices(confirmedBookings),
                avgBookingInterval: this.calculateAvgInterval(confirmedBookings)
            };
        } catch (error) {
            console.error('Erro ao obter dados históricos:', error);
            return null;
        }
    }

    extractFavoriteServices(bookings) {
        const serviceCount = {};
        bookings.forEach(booking => {
            serviceCount[booking.service_name] = (serviceCount[booking.service_name] || 0) + 1;
        });
        
        return Object.entries(serviceCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([service]) => service);
    }

    calculateAvgInterval(bookings) {
        if (bookings.length < 2) return null;
        
        const intervals = [];
        for (let i = 0; i < bookings.length - 1; i++) {
            const current = moment(bookings[i].date);
            const next = moment(bookings[i + 1].date);
            intervals.push(current.diff(next, 'days'));
        }
        
        return this.calculateAverage(intervals);
    }

    async saveBehaviorData(userId, data) {
        try {
            // Implementar salvamento no banco de dados
            // Por enquanto, apenas log
            console.log(`💾 Salvando dados comportamentais para ${userId}:`, Object.keys(data));
        } catch (error) {
            console.error('Erro ao salvar dados comportamentais:', error);
        }
    }

    getDefaultCommunicationStyle() {
        return {
            avgMessageLength: 25,
            avgResponseTime: 3000,
            emojiUsage: 1,
            questionFrequency: 0.3,
            communicationTone: 'neutral',
            formalityLevel: 'neutral',
            engagementLevel: 0.5
        };
    }

    getDefaultDecisionPattern() {
        return {
            avgDecisionTime: 15000,
            decisionConfidence: 0.7,
            changeFrequency: 0.2,
            decisionStyle: 'thoughtful',
            consistencyScore: 0.6
        };
    }

    getDefaultPredictions() {
        return {
            likelyToComplete: 0.6,
            preferredCommunicationStyle: 'balanced',
            optimalInteractionTime: 2000,
            churnRisk: 0.3,
            servicePreferences: [],
            nextAction: 'exploring_options'
        };
    }

    // ========== LIMPEZA E MANUTENÇÃO ==========

    clearExpiredSessions() {
        const now = moment();
        
        for (let [userId, sessionData] of this.sessionData) {
            const sessionAge = now.diff(moment(sessionData.sessionStart), 'hours');
            
            // Limpar sessões com mais de 24 horas
            if (sessionAge > 24) {
                this.sessionData.delete(userId);
                console.log(`🧹 Sessão expirada removida para usuário: ${userId}`);
            }
        }
    }

    // Executar limpeza periodicamente
    startPeriodicCleanup() {
        setInterval(() => {
            this.clearExpiredSessions();
        }, 60 * 60 * 1000); // A cada hora
    }
}

module.exports = BehaviorTracker;