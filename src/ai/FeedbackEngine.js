const moment = require('moment');

class FeedbackEngine {
    constructor(database, behaviorTracker) {
        this.db = database;
        this.behaviorTracker = behaviorTracker;
        this.feedbackData = new Map();
        this.satisfactionMetrics = new Map();
        
        // Configurações do sistema de feedback
        this.config = {
            feedbackWindow: 24, // horas após o serviço
            reminderInterval: 48, // horas para lembrete
            minRatingForPositive: 4,
            maxRatingForNegative: 2,
            sentimentThreshold: 0.6
        };
    }

    // ========== COLETA DE FEEDBACK AUTOMÁTICA ==========

    async requestFeedback(userId, bookingId) {
        try {
            const booking = await this.db.getBookingById(bookingId);
            if (!booking) return null;

            // Verificar se já foi solicitado feedback
            const existingFeedback = await this.getFeedbackByBooking(bookingId);
            if (existingFeedback) return existingFeedback;

            // Gerar mensagem personalizada de feedback
            const persona = await this.behaviorTracker.predictUserBehavior(userId);
            const feedbackMessage = this.generateFeedbackMessage(booking, persona);

            // Agendar solicitação de feedback
            const feedbackRequest = {
                userId,
                bookingId,
                requestedAt: moment().toISOString(),
                status: 'pending',
                message: feedbackMessage,
                reminderSent: false
            };

            await this.saveFeedbackRequest(feedbackRequest);
            return feedbackRequest;
        } catch (error) {
            console.error('Erro ao solicitar feedback:', error);
            return null;
        }
    }

    async processFeedback(userId, bookingId, feedbackData) {
        try {
            const feedback = {
                userId,
                bookingId,
                rating: feedbackData.rating,
                comment: feedbackData.comment || '',
                categories: this.categorizeFeedback(feedbackData),
                sentiment: this.analyzeSentiment(feedbackData.comment || ''),
                receivedAt: moment().toISOString(),
                processed: false
            };

            // Salvar feedback
            await this.saveFeedback(feedback);

            // Processar feedback imediatamente
            await this.processFeedbackAnalysis(feedback);

            // Gerar resposta personalizada
            const response = await this.generateFeedbackResponse(feedback);

            return {
                feedback,
                response,
                actions: await this.generateFeedbackActions(feedback)
            };
        } catch (error) {
            console.error('Erro ao processar feedback:', error);
            return null;
        }
    }

    // ========== ANÁLISE DE SENTIMENTO E CATEGORIZAÇÃO ==========

    analyzeSentiment(text) {
        if (!text || text.trim().length === 0) {
            return { score: 0.5, label: 'neutral', confidence: 0.3 };
        }

        const positiveWords = [
            'ótimo', 'excelente', 'perfeito', 'maravilhoso', 'incrível', 'fantástico',
            'adorei', 'amei', 'top', 'show', 'massa', 'demais', 'satisfeito',
            'recomendo', 'voltarei', 'profissional', 'caprichado', 'lindo'
        ];

        const negativeWords = [
            'ruim', 'péssimo', 'horrível', 'terrível', 'decepcionante', 'insatisfeito',
            'não gostei', 'odeio', 'nunca mais', 'mal feito', 'demorado', 'caro',
            'sujo', 'desorganizado', 'mal atendido', 'grosso', 'mal educado'
        ];

        const neutralWords = [
            'ok', 'normal', 'regular', 'mais ou menos', 'razoável', 'comum',
            'simples', 'básico', 'padrão'
        ];

        const words = text.toLowerCase().split(/\s+/);
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;

        words.forEach(word => {
            if (positiveWords.some(pw => word.includes(pw))) positiveScore++;
            if (negativeWords.some(nw => word.includes(nw))) negativeScore++;
            if (neutralWords.some(neu => word.includes(neu))) neutralScore++;
        });

        const totalScore = positiveScore + negativeScore + neutralScore;
        
        if (totalScore === 0) {
            return { score: 0.5, label: 'neutral', confidence: 0.3 };
        }

        let finalScore;
        let label;
        let confidence = Math.min(0.9, totalScore / words.length * 3);

        if (positiveScore > negativeScore && positiveScore > neutralScore) {
            finalScore = 0.5 + (positiveScore / totalScore) * 0.5;
            label = 'positive';
        } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
            finalScore = 0.5 - (negativeScore / totalScore) * 0.5;
            label = 'negative';
        } else {
            finalScore = 0.5;
            label = 'neutral';
        }

        return {
            score: Math.max(0, Math.min(1, finalScore)),
            label,
            confidence,
            details: { positiveScore, negativeScore, neutralScore, totalWords: words.length }
        };
    }

    categorizeFeedback(feedbackData) {
        const categories = {
            service_quality: 0,
            staff_behavior: 0,
            cleanliness: 0,
            pricing: 0,
            waiting_time: 0,
            ambiance: 0,
            booking_process: 0
        };

        const comment = (feedbackData.comment || '').toLowerCase();
        const rating = feedbackData.rating || 3;

        // Categorizar baseado em palavras-chave
        const categoryKeywords = {
            service_quality: ['corte', 'serviço', 'qualidade', 'resultado', 'trabalho', 'profissional'],
            staff_behavior: ['atendimento', 'barbeiro', 'educado', 'simpático', 'grosso', 'mal educado'],
            cleanliness: ['limpo', 'sujo', 'higiene', 'organizado', 'bagunçado'],
            pricing: ['preço', 'caro', 'barato', 'valor', 'custo'],
            waiting_time: ['espera', 'demora', 'rápido', 'tempo', 'atraso'],
            ambiance: ['ambiente', 'música', 'decoração', 'confortável'],
            booking_process: ['agendamento', 'marcar', 'whatsapp', 'fácil', 'difícil']
        };

        Object.keys(categoryKeywords).forEach(category => {
            const keywords = categoryKeywords[category];
            const mentions = keywords.filter(keyword => comment.includes(keyword)).length;
            
            if (mentions > 0) {
                // Ajustar score baseado na nota e menções
                const baseScore = (rating - 3) / 2; // Normalizar de -1 a 1
                categories[category] = Math.max(-1, Math.min(1, baseScore + (mentions * 0.1)));
            }
        });

        return categories;
    }

    // ========== MÉTRICAS DE SATISFAÇÃO ==========

    async calculateSatisfactionMetrics(timeframe = 'month') {
        try {
            const startDate = moment().subtract(1, timeframe).format('YYYY-MM-DD');
            const feedbacks = await this.getFeedbacksByPeriod(startDate);

            if (feedbacks.length === 0) {
                return this.getDefaultMetrics();
            }

            const metrics = {
                totalFeedbacks: feedbacks.length,
                averageRating: this.calculateAverageRating(feedbacks),
                ratingDistribution: this.calculateRatingDistribution(feedbacks),
                sentimentDistribution: this.calculateSentimentDistribution(feedbacks),
                categoryScores: this.calculateCategoryScores(feedbacks),
                nps: this.calculateNPS(feedbacks),
                satisfactionTrend: await this.calculateSatisfactionTrend(feedbacks),
                topIssues: this.identifyTopIssues(feedbacks),
                topPraises: this.identifyTopPraises(feedbacks)
            };

            return metrics;
        } catch (error) {
            console.error('Erro ao calcular métricas de satisfação:', error);
            return this.getDefaultMetrics();
        }
    }

    calculateNPS(feedbacks) {
        if (feedbacks.length === 0) return { score: 0, category: 'neutral' };

        const promoters = feedbacks.filter(f => f.rating >= 4).length;
        const detractors = feedbacks.filter(f => f.rating <= 2).length;
        const total = feedbacks.length;

        const npsScore = ((promoters - detractors) / total) * 100;

        let category;
        if (npsScore >= 70) category = 'excellent';
        else if (npsScore >= 50) category = 'great';
        else if (npsScore >= 30) category = 'good';
        else if (npsScore >= 0) category = 'needs_improvement';
        else category = 'critical';

        return {
            score: Math.round(npsScore),
            category,
            promoters,
            detractors,
            passives: total - promoters - detractors,
            total
        };
    }

    async calculateSatisfactionTrend(feedbacks) {
        const monthlyData = {};

        feedbacks.forEach(feedback => {
            const month = moment(feedback.receivedAt).format('YYYY-MM');
            if (!monthlyData[month]) {
                monthlyData[month] = { ratings: [], count: 0 };
            }
            monthlyData[month].ratings.push(feedback.rating);
            monthlyData[month].count++;
        });

        const trend = [];
        Object.keys(monthlyData).sort().forEach(month => {
            const data = monthlyData[month];
            const avgRating = data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length;
            
            trend.push({
                month,
                averageRating: Math.round(avgRating * 100) / 100,
                feedbackCount: data.count
            });
        });

        return trend;
    }

    identifyTopIssues(feedbacks) {
        const issues = {};

        feedbacks.forEach(feedback => {
            if (feedback.rating <= this.config.maxRatingForNegative) {
                Object.keys(feedback.categories).forEach(category => {
                    if (feedback.categories[category] < -0.3) {
                        if (!issues[category]) {
                            issues[category] = { count: 0, severity: 0 };
                        }
                        issues[category].count++;
                        issues[category].severity += Math.abs(feedback.categories[category]);
                    }
                });

                // Analisar comentários para identificar problemas específicos
                const comment = feedback.comment.toLowerCase();
                const commonIssues = {
                    'tempo_espera': ['demora', 'espera', 'atraso'],
                    'qualidade_corte': ['mal feito', 'ruim', 'não gostei do corte'],
                    'atendimento': ['mal educado', 'grosso', 'mal atendido'],
                    'preco': ['caro', 'preço alto', 'não vale'],
                    'limpeza': ['sujo', 'mal limpo', 'desorganizado']
                };

                Object.keys(commonIssues).forEach(issue => {
                    const keywords = commonIssues[issue];
                    if (keywords.some(keyword => comment.includes(keyword))) {
                        if (!issues[issue]) {
                            issues[issue] = { count: 0, severity: 0 };
                        }
                        issues[issue].count++;
                        issues[issue].severity += (3 - feedback.rating);
                    }
                });
            }
        });

        return Object.entries(issues)
            .map(([issue, data]) => ({
                issue,
                count: data.count,
                averageSeverity: data.severity / data.count,
                percentage: (data.count / feedbacks.length) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    identifyTopPraises(feedbacks) {
        const praises = {};

        feedbacks.forEach(feedback => {
            if (feedback.rating >= this.config.minRatingForPositive) {
                Object.keys(feedback.categories).forEach(category => {
                    if (feedback.categories[category] > 0.3) {
                        if (!praises[category]) {
                            praises[category] = { count: 0, intensity: 0 };
                        }
                        praises[category].count++;
                        praises[category].intensity += feedback.categories[category];
                    }
                });

                // Analisar comentários para identificar elogios específicos
                const comment = feedback.comment.toLowerCase();
                const commonPraises = {
                    'qualidade_excelente': ['ótimo', 'excelente', 'perfeito', 'maravilhoso'],
                    'atendimento_top': ['simpático', 'educado', 'profissional', 'atencioso'],
                    'rapidez': ['rápido', 'pontual', 'sem demora'],
                    'preco_justo': ['barato', 'bom preço', 'vale a pena'],
                    'ambiente_agradavel': ['limpo', 'organizado', 'ambiente bom']
                };

                Object.keys(commonPraises).forEach(praise => {
                    const keywords = commonPraises[praise];
                    if (keywords.some(keyword => comment.includes(keyword))) {
                        if (!praises[praise]) {
                            praises[praise] = { count: 0, intensity: 0 };
                        }
                        praises[praise].count++;
                        praises[praise].intensity += (feedback.rating - 3);
                    }
                });
            }
        });

        return Object.entries(praises)
            .map(([praise, data]) => ({
                praise,
                count: data.count,
                averageIntensity: data.intensity / data.count,
                percentage: (data.count / feedbacks.length) * 100
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    // ========== GERAÇÃO DE RESPOSTAS PERSONALIZADAS ==========

    async generateFeedbackResponse(feedback) {
        try {
            const persona = await this.behaviorTracker.predictUserBehavior(feedback.userId);
            const rating = feedback.rating;
            const sentiment = feedback.sentiment;

            let responseTemplate;

            if (rating >= 4) {
                responseTemplate = this.getPositiveFeedbackResponse(persona, sentiment);
            } else if (rating <= 2) {
                responseTemplate = this.getNegativeFeedbackResponse(persona, sentiment);
            } else {
                responseTemplate = this.getNeutralFeedbackResponse(persona, sentiment);
            }

            // Personalizar resposta
            const personalizedResponse = this.personalizeFeedbackResponse(responseTemplate, feedback, persona);

            return {
                message: personalizedResponse,
                tone: this.determineFeedbackTone(rating, sentiment),
                followUpActions: this.generateFollowUpActions(feedback)
            };
        } catch (error) {
            console.error('Erro ao gerar resposta de feedback:', error);
            return this.getDefaultFeedbackResponse(feedback.rating);
        }
    }

    getPositiveFeedbackResponse(persona, sentiment) {
        const responses = {
            enthusiastic: [
                "🎉 QUE INCRÍVEL! Muito obrigado pelo feedback! Ficamos super felizes que você tenha gostado tanto!",
                "🚀 DEMAIS! Seu feedback deixou nossa equipe nas nuvens! Obrigado por escolher a gente!",
                "✨ PERFEITO! É exatamente isso que queremos ouvir! Você é demais!"
            ],
            professional: [
                "Muito obrigado pelo seu feedback positivo. É gratificante saber que atendemos suas expectativas.",
                "Agradecemos imensamente sua avaliação. Continuaremos trabalhando para manter este padrão de excelência.",
                "Seu feedback é muito valioso para nós. Obrigado por reconhecer nosso trabalho."
            ],
            friendly: [
                "😊 Oba! Que bom que você gostou! Seu feedback alegrou nosso dia!",
                "🥰 Que felicidade! Obrigado por compartilhar sua experiência conosco!",
                "😄 Ficamos muito felizes! Obrigado pelo carinho e confiança!"
            ]
        };

        const style = persona.preferredCommunicationStyle || 'friendly';
        const styleResponses = responses[style] || responses.friendly;
        
        return styleResponses[Math.floor(Math.random() * styleResponses.length)];
    }

    getNegativeFeedbackResponse(persona, sentiment) {
        const responses = {
            professional: [
                "Lamentamos profundamente que sua experiência não tenha atendido suas expectativas. Gostaríamos de conversar para entender melhor o ocorrido.",
                "Pedimos sinceras desculpas pelo inconveniente. Seu feedback é fundamental para melhorarmos nossos serviços.",
                "Agradecemos por compartilhar sua experiência. Vamos analisar os pontos mencionados para implementar melhorias."
            ],
            empathetic: [
                "😔 Puxa, que pena que não conseguimos te agradar... Queremos muito melhorar! Pode nos contar mais detalhes?",
                "🙏 Desculpa mesmo! Seu feedback é super importante pra gente crescer. Vamos trabalhar nisso!",
                "😞 Que chato que você não gostou... Podemos conversar para entender melhor o que aconteceu?"
            ]
        };

        const style = sentiment.score < 0.3 ? 'empathetic' : 'professional';
        const styleResponses = responses[style];
        
        return styleResponses[Math.floor(Math.random() * styleResponses.length)];
    }

    getNeutralFeedbackResponse(persona, sentiment) {
        const responses = [
            "Obrigado pelo seu feedback! É importante para nós saber sua opinião. Há algo específico que podemos melhorar?",
            "Agradecemos sua avaliação! Estamos sempre buscando formas de aprimorar nossos serviços.",
            "Seu feedback é valioso! Se tiver sugestões de como podemos melhorar, adoraríamos ouvir!"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    personalizeFeedbackResponse(template, feedback, persona) {
        // Adicionar nome do cliente se disponível
        const booking = feedback.booking;
        if (booking && booking.customer_name) {
            const firstName = booking.customer_name.split(' ')[0];
            template = template.replace(/^/, `${firstName}, `);
        }

        // Adicionar referência específica ao serviço
        if (booking && booking.service_name) {
            template += `\n\nEsperamos você em breve para outro ${booking.service_name}! 😊`;
        }

        return template;
    }

    generateFollowUpActions(feedback) {
        const actions = [];

        if (feedback.rating <= 2) {
            actions.push({
                type: 'manager_contact',
                priority: 'high',
                description: 'Contato do gerente para resolução',
                dueDate: moment().add(2, 'hours').toISOString()
            });

            actions.push({
                type: 'service_recovery',
                priority: 'high',
                description: 'Oferecer serviço gratuito ou desconto',
                dueDate: moment().add(24, 'hours').toISOString()
            });
        }

        if (feedback.rating >= 4) {
            actions.push({
                type: 'review_request',
                priority: 'medium',
                description: 'Solicitar avaliação no Google',
                dueDate: moment().add(1, 'day').toISOString()
            });

            actions.push({
                type: 'referral_program',
                priority: 'low',
                description: 'Oferecer programa de indicação',
                dueDate: moment().add(3, 'days').toISOString()
            });
        }

        return actions;
    }

    // ========== MÉTODOS AUXILIARES ==========

    generateFeedbackMessage(booking, persona) {
        const customerName = booking.customer_name.split(' ')[0];
        const serviceName = booking.service_name;

        const messages = {
            casual: [
                `E aí, ${customerName}! Como foi o ${serviceName}? Conta pra gente! 😊`,
                `Opa, ${customerName}! Gostou do seu ${serviceName}? Queremos saber! 👀`,
                `${customerName}, e aí? Como ficou o ${serviceName}? Manda o feedback! 🔥`
            ],
            professional: [
                `${customerName}, gostaríamos de saber sua opinião sobre o ${serviceName} realizado.`,
                `Prezado ${customerName}, como avalia o ${serviceName} que realizamos?`,
                `${customerName}, sua opinião sobre nosso ${serviceName} é muito importante para nós.`
            ],
            friendly: [
                `Oi, ${customerName}! Como você avalia o ${serviceName}? Adoraríamos saber! 😄`,
                `${customerName}, que tal nos contar como foi o ${serviceName}? 🥰`,
                `Olá, ${customerName}! Ficou satisfeito com o ${serviceName}? Conta pra gente! 😊`
            ]
        };

        const style = persona.preferredCommunicationStyle || 'friendly';
        const styleMessages = messages[style] || messages.friendly;
        
        return styleMessages[Math.floor(Math.random() * styleMessages.length)];
    }

    calculateAverageRating(feedbacks) {
        if (feedbacks.length === 0) return 0;
        
        const sum = feedbacks.reduce((total, feedback) => total + feedback.rating, 0);
        return Math.round((sum / feedbacks.length) * 100) / 100;
    }

    calculateRatingDistribution(feedbacks) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        feedbacks.forEach(feedback => {
            distribution[feedback.rating]++;
        });

        const total = feedbacks.length;
        Object.keys(distribution).forEach(rating => {
            distribution[rating] = {
                count: distribution[rating],
                percentage: total > 0 ? (distribution[rating] / total) * 100 : 0
            };
        });

        return distribution;
    }

    calculateSentimentDistribution(feedbacks) {
        const distribution = { positive: 0, neutral: 0, negative: 0 };
        
        feedbacks.forEach(feedback => {
            distribution[feedback.sentiment.label]++;
        });

        const total = feedbacks.length;
        Object.keys(distribution).forEach(sentiment => {
            distribution[sentiment] = {
                count: distribution[sentiment],
                percentage: total > 0 ? (distribution[sentiment] / total) * 100 : 0
            };
        });

        return distribution;
    }

    calculateCategoryScores(feedbacks) {
        const categories = {};
        
        feedbacks.forEach(feedback => {
            Object.keys(feedback.categories).forEach(category => {
                if (!categories[category]) {
                    categories[category] = { scores: [], average: 0 };
                }
                categories[category].scores.push(feedback.categories[category]);
            });
        });

        Object.keys(categories).forEach(category => {
            const scores = categories[category].scores;
            categories[category].average = scores.length > 0 ? 
                scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
            categories[category].count = scores.length;
        });

        return categories;
    }

    determineFeedbackTone(rating, sentiment) {
        if (rating >= 4 && sentiment.label === 'positive') return 'grateful';
        if (rating <= 2 && sentiment.label === 'negative') return 'apologetic';
        if (rating === 3) return 'understanding';
        return 'professional';
    }

    getDefaultMetrics() {
        return {
            totalFeedbacks: 0,
            averageRating: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
            categoryScores: {},
            nps: { score: 0, category: 'neutral' },
            satisfactionTrend: [],
            topIssues: [],
            topPraises: []
        };
    }

    getDefaultFeedbackResponse(rating) {
        if (rating >= 4) {
            return {
                message: "Muito obrigado pelo seu feedback positivo! 😊",
                tone: 'grateful',
                followUpActions: []
            };
        } else if (rating <= 2) {
            return {
                message: "Obrigado pelo feedback. Vamos trabalhar para melhorar! 🙏",
                tone: 'apologetic',
                followUpActions: []
            };
        } else {
            return {
                message: "Obrigado pelo seu feedback! 👍",
                tone: 'professional',
                followUpActions: []
            };
        }
    }

    // ========== PERSISTÊNCIA DE DADOS ==========

    async saveFeedbackRequest(request) {
        // Implementar salvamento no banco
        console.log('💾 Salvando solicitação de feedback:', request);
    }

    async saveFeedback(feedback) {
        // Implementar salvamento no banco
        console.log('💾 Salvando feedback:', feedback);
    }

    async getFeedbackByBooking(bookingId) {
        // Implementar busca no banco
        return null;
    }

    async getFeedbacksByPeriod(startDate) {
        // Implementar busca no banco
        return [];
    }

    async processFeedbackAnalysis(feedback) {
        // Processar análise adicional do feedback
        console.log('🔍 Processando análise de feedback:', feedback.bookingId);
    }

    async generateFeedbackActions(feedback) {
        // Gerar ações baseadas no feedback
        return this.generateFollowUpActions(feedback);
    }
}

module.exports = FeedbackEngine;