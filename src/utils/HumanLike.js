class HumanLike {
    constructor(client) {
        this.client = client;
    }

    // Simular digitação humana
    async simulateTyping(chatId, duration = 2000) {
        try {
            const chat = await this.client.getChatById(chatId);
            await chat.sendStateTyping();
            await this.delay(duration);
        } catch (error) {
            console.log('Erro ao simular digitação:', error.message);
        }
    }

    // Delay realista baseado no tamanho da mensagem
    calculateTypingDelay(messageLength) {
        // Simula velocidade de digitação humana (40-60 palavras por minuto)
        const wordsPerMinute = 50;
        const charactersPerWord = 5;
        const charactersPerMinute = wordsPerMinute * charactersPerWord;
        const charactersPerSecond = charactersPerMinute / 60;
        
        // Calcula tempo base + variação aleatória
        const baseTime = (messageLength / charactersPerSecond) * 1000;
        const randomVariation = Math.random() * 1000 + 500; // 0.5-1.5s extra
        
        // Mínimo 1s, máximo 5s
        return Math.min(Math.max(baseTime + randomVariation, 1000), 5000);
    }

    // Enviar mensagem com delay realista
    async sendHumanMessage(message, text) {
        const typingDelay = this.calculateTypingDelay(text.length);
        
        // Simular digitação
        await this.simulateTyping(message.from, typingDelay);
        
        // Enviar mensagem
        await message.reply(text);
    }

    // Enviar mensagem com botões e delay
    async sendHumanButtonMessage(chatId, buttonMessage) {
        const typingDelay = this.calculateTypingDelay(buttonMessage.text.length);
        
        // Simular digitação
        await this.simulateTyping(chatId, typingDelay);
        
        // Enviar mensagem com botões
        await this.client.sendMessage(chatId, buttonMessage);
    }

    // Delay simples
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Converter número para emoji
    numberToEmoji(number) {
        const emojiNumbers = {
            0: '0️⃣', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣',
            5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣',
            10: '🔟'
        };
        
        if (number <= 10) {
            return emojiNumbers[number];
        }
        
        // Para números maiores que 10, usar emojis individuais
        return number.toString().split('').map(digit => emojiNumbers[parseInt(digit)]).join('');
    }

    // Respostas humanizadas aleatórias
    getRandomResponse(type) {
        const responses = {
            welcome: [
                "Oi! Que bom te ver por aqui! 😊",
                "Olá! Bem-vindo à nossa barbearia! 👋",
                "E aí! Como posso te ajudar hoje? 😄",
                "Opa! Chegou na hora certa! 🎉"
            ],
            thinking: [
                "Deixa eu ver aqui... 🤔",
                "Aguarda só um segundinho... ⏳",
                "Vou verificar isso pra você... 👀",
                "Hmm, deixa eu checar... 🔍"
            ],
            success: [
                "Perfeito! ✨",
                "Ótima escolha! 👌",
                "Excelente! 🎯",
                "Massa! 🔥"
            ],
            error: [
                "Ops! Algo deu errado... 😅",
                "Eita! Tivemos um probleminha... 🤦‍♂️",
                "Opa! Parece que houve um erro... 😬",
                "Putz! Algo não funcionou... 🙈"
            ]
        };

        const typeResponses = responses[type] || responses.thinking;
        return typeResponses[Math.floor(Math.random() * typeResponses.length)];
    }

    // Adicionar variações nas mensagens
    addPersonality(baseMessage) {
        const variations = [
            "😊", "👍", "✨", "🎉", "💪", "🔥", "👌", "🎯"
        ];
        
        const randomEmoji = variations[Math.floor(Math.random() * variations.length)];
        
        // 30% de chance de adicionar emoji no final
        if (Math.random() < 0.3) {
            return baseMessage + " " + randomEmoji;
        }
        
        return baseMessage;
    }
}

module.exports = HumanLike;