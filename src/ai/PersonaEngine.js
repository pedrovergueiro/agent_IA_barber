const moment = require('moment');

class PersonaEngine {
    constructor(advancedAI) {
        this.ai = advancedAI;
        this.personas = this.initializePersonas();
        this.communicationStyles = this.initializeCommunicationStyles();
    }

    initializePersonas() {
        return {
            'executivo_apressado': {
                name: 'Executivo Apressado',
                characteristics: {
                    time_preference: 'morning',
                    decision_speed: 'fast',
                    service_preference: 'efficient',
                    communication_style: 'direct',
                    price_sensitivity: 'low'
                },
                behavior_patterns: {
                    books_in_advance: true,
                    prefers_quick_services: true,
                    values_time_over_price: true,
                    consistent_schedule: true
                },
                preferred_services: ['corte_rapido', 'barba_express', 'combo_executivo'],
                communication_tone: 'professional',
                typical_messages: {
                    greeting: 'Bom dia! Preciso agendar um horário rápido.',
                    booking: 'Pode ser amanhã de manhã?',
                    confirmation: 'Perfeito, estarei lá pontualmente.'
                }
            },

            'jovem_moderno': {
                name: 'Jovem Moderno',
                characteristics: {
                    time_preference: 'afternoon_evening',
                    decision_speed: 'medium',
                    service_preference: 'trendy',
                    communication_style: 'casual',
                    price_sensitivity: 'medium'
                },
                behavior_patterns: {
                    follows_trends: true,
                    social_media_active: true,
                    flexible_schedule: true,
                    tries_new_services: true
                },
                preferred_services: ['degradê', 'navalhado', 'pigmentação', 'luzes'],
                communication_tone: 'casual',
                typical_messages: {
                    greeting: 'E aí! Quero fazer algo diferente no cabelo.',
                    booking: 'Tem horário na sexta à tarde?',
                    confirmation: 'Show! Já tô ansioso pra ver como vai ficar.'
                }
            },

            'cliente_tradicional': {
                name: 'Cliente Tradicional',
                characteristics: {
                    time_preference: 'consistent',
                    decision_speed: 'slow',
                    service_preference: 'classic',
                    communication_style: 'polite',
                    price_sensitivity: 'medium'
                },
                behavior_patterns: {
                    fixed_schedule: true,
                    loyal_to_services: true,
                    values_relationship: true,
                    consistent_frequency: true
                },
                preferred_services: ['corte_tradicional', 'barba', 'sobrancelha'],
                communication_tone: 'friendly',
                typical_messages: {
                    greeting: 'Olá! Gostaria de agendar meu corte habitual.',
                    booking: 'Pode ser no mesmo horário de sempre?',
                    confirmation: 'Muito obrigado! Até lá.'
                }
            },

            'ocasional_especial': {
                name: 'Ocasional Especial',
                characteristics: {
                    time_preference: 'event_driven',
                    decision_speed: 'variable',
                    service_preference: 'premium',
                    communication_style: 'enthusiastic',
                    price_sensitivity: 'low'
                },
                behavior_patterns: {
                    event_driven_bookings: true,
                    seeks_premium_services: true,
                    irregular_frequency: true,
                    detail_oriented: true
                },
                preferred_services: ['alizamento', 'platinado', 'combo_completo'],
                communication_tone: 'enthusiastic',
                typical_messages: {
                    greeting: 'Oi! Tenho um evento importante e preciso ficar impecável.',
                    booking: 'Qual o melhor horário para um serviço completo?',
                    confirmation: 'Perfeito! Estou muito animado!'
                }
            },

            'cliente_economico': {
                name: 'Cliente Econômico',
                characteristics: {
                    time_preference: 'flexible',
                    decision_speed: 'slow',
                    service_preference: 'basic',
                    communication_style: 'practical',
                    price_sensitivity: 'high'
                },
                behavior_patterns: {
                    price_conscious: true,
                    seeks_promotions: true,
                    basic_services_only: true,
                    longer_intervals: true
                },
                preferred_services: ['corte_simples', 'barba_basica'],
                communication_tone: 'practical',
                typical_messages: {
                    greeting: 'Oi, preciso de um corte simples.',
                    booking: 'Tem algum horário mais em conta?',
                    confirmation: 'Ok, obrigado.'
                }
            }
        };
    }

    initializeCommunicationStyles() {
        return {
            'professional': {
                greeting_style: 'formal',
                emoji_usage: 'minimal',
                message_length: 'concise',
                tone_keywords: ['senhor', 'prezado', 'cordialmente'],
                response_speed: 'immediate'
            },
            'casual': {
                greeting_style: 'informal',
                emoji_usage: 'moderate',
                message_length: 'medium',
                tone_keywords: ['cara', 'mano', 'galera', 'top'],
                response_speed: 'quick'
            },
            'friendly': {
                greeting_style: 'warm',
                emoji_usage: 'frequent',
                message_length: 'detailed',
                tone_keywords: ['querido', 'amigo', 'pessoal'],
                response_speed: 'thoughtful'
            },
            'enthusiastic': {
                greeting_style: 'excited',
                emoji_usage: 'heavy',
                message_length: 'expressive',
                tone_keywords: ['incrível', 'fantástico', 'perfeito'],
                response_speed: 'energetic'
            },
            'practical': {
                greeting_style: 'direct',
                emoji_usage: 'rare',
                message_length: 'brief',
                tone_keywords: ['simples', 'básico', 'rápido'],
                response_speed: 'efficient'
            }
        };
    }

    // ========== IDENTIFICAÇÃO DE PERSONA ==========

    async identifyPersona(userId) {
        try {
            const behavior = await this.ai.analyzeClientBehavior(userId);
            const cluster = await this.ai.predictClientCluster(userId);
            
            // Calcular scores para cada persona
            const personaScores = {};
            
            Object.keys(this.personas).forEach(personaKey => {
                personaScores[personaKey] = this.calculatePersonaScore(behavior, this.personas[personaKey]);
            });

            // Encontrar persona com maior score
            const bestPersona = Object.keys(personaScores).reduce((a, b) => 
                personaScores[a] > personaScores[b] ? a : b
            );

            return {
                persona: bestPersona,
                confidence: personaScores[bestPersona],
                allScores: personaScores,
                characteristics: this.personas[bestPersona].characteristics,
                communicationStyle: this.personas[bestPersona].communication_tone
            };
        } catch (error) {
            console.error('Erro ao identificar persona:', error);
            return this.getDefaultPersona();
        }
    }

    calculatePersonaScore(behavior, persona) {
        let score = 0;
        let factors = 0;

        // Analisar preferências de horário
        if (persona.characteristics.time_preference === 'morning') {
            score += (behavior.timePatterns.preferredHours.morning || 0) * 0.2;
            factors++;
        } else if (persona.characteristics.time_preference === 'afternoon_evening') {
            score += ((behavior.timePatterns.preferredHours.afternoon || 0) + 
                     (behavior.timePatterns.preferredHours.evening || 0)) * 0.2;
            factors++;
        }

        // Analisar consistência de agendamento
        if (persona.behavior_patterns.consistent_schedule && behavior.timePatterns.consistency > 0.7) {
            score += 0.3;
            factors++;
        }

        // Analisar segmento de preço
        if (persona.characteristics.price_sensitivity === 'low' && 
            behavior.servicePatterns.priceSegment === 'premium') {
            score += 0.25;
            factors++;
        } else if (persona.characteristics.price_sensitivity === 'high' && 
                   behavior.servicePatterns.priceSegment === 'budget') {
            score += 0.25;
            factors++;
        }

        // Analisar frequência
        const frequency = behavior.behaviorScore.frequency;
        if (persona.behavior_patterns.consistent_frequency && frequency > 0.6) {
            score += 0.15;
            factors++;
        }

        // Analisar variedade de serviços
        const serviceVariety = Object.keys(behavior.servicePatterns.favoriteServices).length;
        if (persona.behavior_patterns.tries_new_services && serviceVariety > 3) {
            score += 0.1;
            factors++;
        }

        return factors > 0 ? score / factors : 0;
    }

    // ========== GERAÇÃO DE MENSAGENS PERSONALIZADAS ==========

    async generatePersonalizedMessage(userId, messageType, context = {}) {
        const personaData = await this.identifyPersona(userId);
        const persona = this.personas[personaData.persona];
        const style = this.communicationStyles[persona.communication_tone];

        let message = '';

        switch (messageType) {
            case 'welcome':
                message = await this.generateWelcomeMessage(persona, style, context);
                break;
            case 'service_recommendation':
                message = await this.generateServiceRecommendation(persona, style, context);
                break;
            case 'booking_confirmation':
                message = await this.generateBookingConfirmation(persona, style, context);
                break;
            case 'reminder':
                message = await this.generateReminder(persona, style, context);
                break;
            case 'follow_up':
                message = await this.generateFollowUp(persona, style, context);
                break;
            default:
                message = await this.generateGenericMessage(persona, style, context);
        }

        return {
            message,
            persona: personaData.persona,
            tone: persona.communication_tone,
            confidence: personaData.confidence
        };
    }

    async generateWelcomeMessage(persona, style, context) {
        const { behavior, isReturning } = context;
        let message = '';

        // Saudação baseada na persona
        switch (persona.communication_tone) {
            case 'professional':
                message = isReturning ? 
                    'Bom dia! É um prazer tê-lo conosco novamente.' :
                    'Bom dia! Bem-vindo à nossa barbearia.';
                break;
            case 'casual':
                message = isReturning ?
                    'E aí! Que bom te ver de novo por aqui! 🔥' :
                    'E aí! Seja muito bem-vindo! 👋';
                break;
            case 'friendly':
                message = isReturning ?
                    'Olá! Que alegria te ver novamente! 😊' :
                    'Olá! Seja muito bem-vindo à nossa família! 😄';
                break;
            case 'enthusiastic':
                message = isReturning ?
                    'Opa! Nosso cliente especial voltou! 🎉✨' :
                    'Opa! Que incrível te conhecer! Vamos deixar você ainda mais top! 🚀';
                break;
            case 'practical':
                message = isReturning ?
                    'Oi. Pronto para o próximo corte?' :
                    'Oi. Como posso ajudar?';
                break;
        }

        // Adicionar contexto baseado no comportamento
        if (isReturning && behavior) {
            message += this.addBehaviorContext(message, behavior, persona);
        }

        return message;
    }

    async generateServiceRecommendation(persona, style, context) {
        const { services, reasoning } = context;
        let message = '';

        // Introdução baseada na persona
        switch (persona.communication_tone) {
            case 'professional':
                message = 'Baseado em seu perfil, recomendo os seguintes serviços:';
                break;
            case 'casual':
                message = 'Ó, separei umas opções que têm tudo a ver com você:';
                break;
            case 'friendly':
                message = 'Olha só que serviços bacanas eu tenho para você:';
                break;
            case 'enthusiastic':
                message = 'Cara! Tenho umas sugestões PERFEITAS para você:';
                break;
            case 'practical':
                message = 'Sugestões baseadas no seu histórico:';
                break;
        }

        // Adicionar serviços com estilo personalizado
        services.forEach((service, index) => {
            message += `\n\n${this.getEmojiForIndex(index, style)} *${service.name}*`;
            message += `\n💰 ${service.price}`;
            
            if (reasoning && reasoning[service.id]) {
                message += `\n${this.formatReasoning(reasoning[service.id], persona)}`;
            }
        });

        return message;
    }

    async generateBookingConfirmation(persona, style, context) {
        const { booking, customerName } = context;
        let message = '';

        // Confirmação baseada na persona
        switch (persona.communication_tone) {
            case 'professional':
                message = `Prezado ${customerName}, seu agendamento foi confirmado com sucesso.`;
                break;
            case 'casual':
                message = `Show, ${customerName}! Teu horário tá garantido! 🎯`;
                break;
            case 'friendly':
                message = `Pronto, ${customerName}! Seu agendamento está confirmadinho! 😊`;
                break;
            case 'enthusiastic':
                message = `PERFEITO, ${customerName}! Seu horário está CONFIRMADO! 🎉`;
                break;
            case 'practical':
                message = `${customerName}, agendamento confirmado.`;
                break;
        }

        // Adicionar detalhes do agendamento
        message += `\n\n📋 *Detalhes:*`;
        message += `\n✂️ ${booking.service}`;
        message += `\n📅 ${booking.date}`;
        message += `\n🕐 ${booking.time}`;

        // Adicionar mensagem de encerramento baseada na persona
        message += this.getClosingMessage(persona);

        return message;
    }

    async generateReminder(persona, style, context) {
        const { booking, hoursUntil } = context;
        let message = '';

        // Lembrete baseado na persona
        switch (persona.communication_tone) {
            case 'professional':
                message = `Lembrete: Seu agendamento é em ${hoursUntil} horas.`;
                break;
            case 'casual':
                message = `Opa! Lembra que seu horário é daqui a ${hoursUntil}h? 😉`;
                break;
            case 'friendly':
                message = `Oi! Lembrete amigável: seu horário é em ${hoursUntil} horas! 😊`;
                break;
            case 'enthusiastic':
                message = `Ei! Seu horário incrível é daqui a ${hoursUntil} horas! 🔥`;
                break;
            case 'practical':
                message = `Lembrete: ${hoursUntil}h para seu agendamento.`;
                break;
        }

        // Adicionar detalhes
        message += `\n\n✂️ ${booking.service}`;
        message += `\n🕐 ${booking.time}`;

        return message;
    }

    // ========== MÉTODOS AUXILIARES ==========

    addBehaviorContext(message, behavior, persona) {
        let context = '';

        // Adicionar contexto baseado na frequência
        if (behavior.behaviorScore.frequency > 0.8) {
            switch (persona.communication_tone) {
                case 'professional':
                    context = '\nAgradeço sua fidelidade.';
                    break;
                case 'casual':
                    context = '\nTu é cliente fiel mesmo, hein! 🔥';
                    break;
                case 'friendly':
                    context = '\nAdoro te ver sempre por aqui! 😄';
                    break;
                case 'enthusiastic':
                    context = '\nVocê é DEMAIS! Cliente VIP! 👑';
                    break;
                case 'practical':
                    context = '\nCliente frequente.';
                    break;
            }
        }

        // Adicionar contexto temporal
        const daysSinceLastVisit = behavior.behaviorScore.recency;
        if (daysSinceLastVisit < 0.3) { // Muito tempo sem vir
            switch (persona.communication_tone) {
                case 'professional':
                    context += '\nSentimos sua falta.';
                    break;
                case 'casual':
                    context += '\nCaramba, fazia tempo que não te via! 😅';
                    break;
                case 'friendly':
                    context += '\nQue saudade! 🥰';
                    break;
                case 'enthusiastic':
                    context += '\nFinalmente! Estava com saudades! 🎉';
                    break;
                case 'practical':
                    context += '\nÚltima visita: há tempo.';
                    break;
            }
        }

        return context;
    }

    getEmojiForIndex(index, style) {
        const emojis = {
            'minimal': ['1️⃣', '2️⃣', '3️⃣'],
            'moderate': ['🥇', '🥈', '🥉'],
            'frequent': ['⭐', '🌟', '✨'],
            'heavy': ['🔥', '💎', '🚀'],
            'rare': ['•', '•', '•']
        };

        return emojis[style.emoji_usage] ? emojis[style.emoji_usage][index] || '•' : '•';
    }

    formatReasoning(reasoning, persona) {
        switch (persona.communication_tone) {
            case 'professional':
                return `💡 ${reasoning}`;
            case 'casual':
                return `💭 ${reasoning}`;
            case 'friendly':
                return `😊 ${reasoning}`;
            case 'enthusiastic':
                return `🎯 ${reasoning}`;
            case 'practical':
                return `→ ${reasoning}`;
            default:
                return `💡 ${reasoning}`;
        }
    }

    getClosingMessage(persona) {
        switch (persona.communication_tone) {
            case 'professional':
                return '\n\nAguardamos sua presença.';
            case 'casual':
                return '\n\nTe espero lá! 😎';
            case 'friendly':
                return '\n\nTe aguardo com carinho! 🤗';
            case 'enthusiastic':
                return '\n\nVai ser INCRÍVEL! Te espero! 🚀';
            case 'practical':
                return '\n\nAté lá.';
            default:
                return '\n\nObrigado!';
        }
    }

    getDefaultPersona() {
        return {
            persona: 'cliente_tradicional',
            confidence: 0.5,
            characteristics: this.personas.cliente_tradicional.characteristics,
            communicationStyle: 'friendly'
        };
    }

    // ========== ANÁLISE DE EVOLUÇÃO DE PERSONA ==========

    async trackPersonaEvolution(userId) {
        // Implementar tracking de como a persona do cliente evolui ao longo do tempo
        const currentPersona = await this.identifyPersona(userId);
        
        // Salvar no histórico para análise de tendências
        await this.savePersonaHistory(userId, currentPersona);
        
        return currentPersona;
    }

    async savePersonaHistory(userId, personaData) {
        try {
            // Implementar salvamento do histórico de personas
            console.log(`Persona ${personaData.persona} identificada para ${userId}`);
        } catch (error) {
            console.error('Erro ao salvar histórico de persona:', error);
        }
    }
}

module.exports = PersonaEngine;