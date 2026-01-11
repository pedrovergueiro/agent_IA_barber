const moment = require('moment');
moment.locale('pt-br');

const Services = require('../data/Services');
const Schedule = require('../data/Schedule');
const MercadoPago = require('../payment/MercadoPago');
const { ADMIN_NUMBERS } = require('../config/admin');
const HumanLike = require('../utils/HumanLike');
const AdminPanel = require('../admin/AdminPanel');
const Settings = require('../config/settings');
const SmartRecommendations = require('../ai/SmartRecommendations');

class BarberBot {
    constructor(client, database) {
        this.client = client;
        this.db = database;
        this.mp = new MercadoPago();
        this.userSessions = new Map(); // Armazena sessões dos usuários
        this.adminNumbers = ADMIN_NUMBERS;
        this.human = new HumanLike(client); // Funcionalidades humanizadas
        this.adminPanel = new AdminPanel(client, database, this.human); // Painel administrativo
        this.ai = new SmartRecommendations(database); // IA de recomendações
    }

    async handleMessage(message) {
        const userId = message.from;
        const messageText = message.body.toLowerCase().trim();
        
        // Verificar comandos de admin primeiro
        if (messageText === '/admin') {
            await this.adminPanel.handleAdminLogin(message, messageText);
            return;
        }

        // Verificar se é tentativa de senha de admin
        if (await this.adminPanel.handlePasswordAttempt(message)) {
            return;
        }

        // Verificar se é comando de admin autenticado - ISOLAMENTO COMPLETO
        if (this.adminPanel.isAuthenticated(userId)) {
            // Admin autenticado - processar APENAS comandos de admin
            await this.adminPanel.handleAdminCommand(message);
            return; // SEMPRE retornar aqui para evitar misturar com booking
        }

        // Verificar se é resposta de botão ou lista
        if (message.type === 'buttons_response' || message.type === 'list_response') {
            await this.handleButtonResponse(message);
            return;
        }
        
        // Obter ou criar sessão do usuário
        let session = this.userSessions.get(userId) || {
            step: 'welcome',
            selectedService: null,
            selectedDate: null,
            selectedTime: null,
            customerName: null,
            paymentId: null
        };

        try {
            switch (session.step) {
                case 'welcome':
                    await this.sendWelcomeMessage(message);
                    session.step = 'menu';
                    break;

                case 'menu':
                    if (messageText.includes('agendar') || messageText.includes('1')) {
                        await this.sendServicesMenu(message);
                        session.step = 'selecting_service';
                    } else if (messageText.includes('horário') || messageText.includes('2')) {
                        await this.sendScheduleInfo(message);
                    } else if (messageText.includes('localização') || messageText.includes('3')) {
                        await this.sendLocationInfo(message);
                    } else if (messageText.includes('cancelar') || messageText.includes('4')) {
                        await this.showUserBookings(message);
                        session.step = 'canceling_booking';
                    } else {
                        await this.sendMenuOptions(message);
                    }
                    break;

                case 'selecting_service':
                    const serviceId = this.extractServiceId(messageText);
                    if (serviceId === 'back') {
                        await this.sendWelcomeMessage(message);
                        session.step = 'menu';
                    } else if (serviceId) {
                        session.selectedService = this.getServiceById(serviceId);
                        if (session.selectedService) {
                            await this.sendDateSelection(message);
                            session.step = 'selecting_date';
                        } else {
                            await this.human.sendHumanMessage(message, "Opa! Esse número não existe... 😅 Escolhe um dos serviços da lista!");
                            await this.sendServicesMenu(message);
                        }
                    } else {
                        await this.sendServicesMenu(message);
                    }
                    break;

                case 'selecting_date':
                    const date = this.extractDate(messageText);
                    if (date === 'back') {
                        await this.sendServicesMenu(message);
                        session.step = 'selecting_service';
                    } else if (date && this.isValidDate(date)) {
                        session.selectedDate = date;
                        await this.sendTimeSelection(message, date);
                        session.step = 'selecting_time';
                    } else {
                        await this.human.sendHumanMessage(message, "Hmm... Essa data não tá na lista... 🤔 Escolhe uma das opções aí!");
                        await this.sendDateSelection(message);
                    }
                    break;

                case 'selecting_time':
                    const time = await this.extractTime(messageText, userId);
                    if (time === 'back') {
                        await this.sendDateSelection(message);
                        session.step = 'selecting_date';
                    } else if (time && await this.isTimeAvailable(session.selectedDate, time)) {
                        session.selectedTime = time;
                        await this.requestCustomerName(message);
                        session.step = 'getting_name';
                    } else {
                        await this.human.sendHumanMessage(message, "Eita! Esse horário não tá disponível... 😬 Escolhe outro aí!");
                        await this.sendTimeSelection(message, session.selectedDate);
                    }
                    break;

                case 'getting_name':
                    session.customerName = message.body.trim();
                    await this.sendBookingSummary(message, session);
                    session.step = 'confirming_booking';
                    break;

                case 'confirming_booking':
                    if (messageText.includes('confirmar') || messageText.includes('sim') || messageText.includes('perfeito')) {
                        await this.processPayment(message, session);
                        session.step = 'payment_pending';
                    } else if (messageText.includes('cancelar') || messageText.includes('não')) {
                        await this.cancelBooking(message);
                        session.step = 'menu';
                    } else if (messageText.includes('nome') || messageText.includes('mudar')) {
                        await this.requestCustomerName(message);
                        session.step = 'getting_name';
                    } else {
                        await this.sendBookingSummary(message, session);
                    }
                    break;

                case 'payment_pending':
                    await this.checkPaymentStatus(message, session);
                    break;

                case 'canceling_booking':
                    await this.handleBookingCancellation(message, messageText);
                    session.step = 'menu';
                    break;

                default:
                    await this.sendWelcomeMessage(message);
                    session.step = 'menu';
            }

            this.userSessions.set(userId, session);

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            await message.reply('❌ Ocorreu um erro. Vou reiniciar nossa conversa.');
            this.userSessions.delete(userId);
        }
    }

    async sendWelcomeMessage(message) {
        const business = Settings.get('businessInfo');
        const userId = message.from;
        
        // Gerar mensagem inteligente com IA
        const smartWelcome = await this.ai.generateSmartWelcome(userId);
        
        const welcomeText = `${smartWelcome}

🏪 *${business.name}*
📍 ${business.address}
📞 ${business.phone}

O que você gostaria de fazer hoje?`;

        const buttons = [
            {
                buttonId: 'menu_1',
                buttonText: { displayText: '✂️ Quero Agendar' },
                type: 1
            },
            {
                buttonId: 'menu_2',
                buttonText: { displayText: '🕐 Ver Horários' },
                type: 1
            },
            {
                buttonId: 'menu_3',
                buttonText: { displayText: '📍 Onde Fica' },
                type: 1
            },
            {
                buttonId: 'menu_4',
                buttonText: { displayText: '❌ Cancelar Agendamento' },
                type: 1
            }
        ];

        const buttonMessage = {
            text: welcomeText,
            buttons: buttons,
            headerType: 1
        };

        try {
            // Menu principal é instantâneo - sem delay
            await this.client.sendMessage(message.from, buttonMessage);
        } catch (error) {
            // Fallback para texto simples - também instantâneo
            const fallbackText = welcomeText + `

${this.human.numberToEmoji(1)} Agendar Serviço
${this.human.numberToEmoji(2)} Ver Horários de Funcionamento  
${this.human.numberToEmoji(3)} Localização e Contato
${this.human.numberToEmoji(4)} Cancelar Agendamento

Digite o número da opção! 👆`;
            
            await message.reply(fallbackText);
        }
    }

    async sendMenuOptions(message) {
        const menuText = `
🏪 *Menu Principal*

${this.human.numberToEmoji(1)} Agendar Serviço
${this.human.numberToEmoji(2)} Ver Horários de Funcionamento
${this.human.numberToEmoji(3)} Localização e Contato
${this.human.numberToEmoji(4)} Cancelar Agendamento

Digite o número da opção desejada! 👆`;

        // Menu principal é instantâneo - sem delay
        await message.reply(menuText);
    }

    async sendServicesMenu(message) {
        const userId = message.from;
        
        // Simular que está pensando
        await this.human.sendHumanMessage(message, this.getRandomMessage('thinking'));
        
        // Obter recomendações inteligentes
        const recommendations = await this.ai.getSmartRecommendations(userId);
        const services = this.getAllServices();
        
        let servicesText = `✂️ *NOSSOS SERVIÇOS*\n\n`;

        // Mostrar recomendações da IA primeiro
        if (recommendations.length > 0) {
            servicesText += `🤖 *IA RECOMENDA PARA VOCÊ:*\n\n`;
            
            recommendations.forEach(rec => {
                const emojiNumber = this.human.numberToEmoji(rec.service.id);
                servicesText += `${emojiNumber} *${rec.service.name}* 🎯\n`;
                servicesText += `💰 ${rec.service.price}\n`;
                servicesText += `💡 ${rec.reason}\n\n`;
            });
            
            servicesText += `🔥 *OUTROS SERVIÇOS POPULARES:*\n\n`;
        } else {
            servicesText += `🔥 *OS MAIS PEDIDOS:*\n\n`;
        }
        
        // Serviços populares (excluindo os já recomendados)
        const recommendedIds = recommendations.map(r => r.service.id);
        const popularServices = services.filter(s => s.popular && !recommendedIds.includes(s.id));
        const otherServices = services.filter(s => !s.popular && !recommendedIds.includes(s.id));
        
        // Mostrar serviços populares
        popularServices.forEach(service => {
            const emojiNumber = this.human.numberToEmoji(service.id);
            servicesText += `${emojiNumber} *${service.name}* 🔥\n`;
            servicesText += `💰 ${service.price}\n\n`;
        });

        if (otherServices.length > 0) {
            servicesText += `✨ *OUTROS SERVIÇOS:*\n\n`;

            // Mostrar outros serviços
            otherServices.forEach(service => {
                const emojiNumber = this.human.numberToEmoji(service.id);
                servicesText += `${emojiNumber} *${service.name}*\n`;
                servicesText += `💰 ${service.price}\n\n`;
            });
        }

        servicesText += `${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite o número do serviço! 👆`;

        await this.human.sendHumanMessage(message, servicesText);
    }

    async sendDateSelection(message) {
        await this.human.sendHumanMessage(message, "Deixa eu ver as datas disponíveis... 📅");
        
        const availableDates = this.getAvailableDates();
        
        const buttons = [];
        availableDates.forEach((date, index) => {
            buttons.push({
                buttonId: `date_${index}`,
                buttonText: { displayText: date.format('DD/MM - ddd') },
                type: 1
            });
        });

        // Adicionar botão de voltar
        buttons.push({
            buttonId: 'back_to_services',
            buttonText: { displayText: '⬅️ Voltar' },
            type: 1
        });

        const buttonMessage = {
            text: `📅 *QUAL DIA VOCÊ PREFERE?*

Essas são as datas que temos disponíveis:`,
            buttons: buttons.slice(0, 10), // Limitar a 10 botões
            headerType: 1
        };

        try {
            await this.human.sendHumanButtonMessage(message.from, buttonMessage);
        } catch (error) {
            // Fallback para texto simples
            let dateText = `📅 *QUAL DIA VOCÊ PREFERE?*

`;

            availableDates.forEach((date, index) => {
                const emojiNumber = this.human.numberToEmoji(index + 1);
                dateText += `${emojiNumber} ${date.format('DD/MM/YYYY - dddd')}\n`;
            });

            dateText += `\n${this.human.numberToEmoji(0)} Voltar aos Serviços\n\nDigite o número da data! 👆`;
            await this.human.sendHumanMessage(message, dateText);
        }
    }

    async sendTimeSelection(message, selectedDate) {
        await this.human.sendHumanMessage(message, "Vou verificar os horários livres... ⏰");
        
        const availableTimes = await this.getAvailableTimes(selectedDate);
        
        if (availableTimes.length === 0) {
            const sadMessages = [
                "Putz! Esse dia tá lotado... 😅",
                "Eita! Não temos horários livres nesse dia... 😬", 
                "Opa! Esse dia já encheu... 🤦‍♂️"
            ];
            
            const sadMessage = sadMessages[Math.floor(Math.random() * sadMessages.length)];
            
            const timeText = `🕐 *HORÁRIOS PARA ${selectedDate.format('DD/MM - dddd')}*

${sadMessage}

Que tal escolher outro dia? Tenho certeza que vamos achar um horário perfeito pra você! 😊`;
            
            await this.human.sendHumanMessage(message, timeText);
            return;
        }

        const encouragingMessages = [
            "Opa! Temos esses horários livres:",
            "Olha só que horários bacanas temos:",
            "Perfeito! Esses horários estão disponíveis:",
            "Massa! Escolhe um desses horários:"
        ];

        const encouragingMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

        // Tentar layout de lista primeiro
        try {
            const listMessage = {
                text: `🕐 *HORÁRIOS PARA ${selectedDate.format('DD/MM - dddd')}*\n\n${encouragingMessage}`,
                buttonText: 'Escolher Horário',
                sections: [{
                    title: '⏰ Horários Disponíveis',
                    rows: availableTimes.slice(0, 10).map((time, index) => ({
                        id: `time_${index}`,
                        title: `🕐 ${time}`,
                        description: 'Clique para selecionar'
                    }))
                }],
                footer: 'Use os botões abaixo para navegar'
            };

            // Adicionar opção de voltar
            listMessage.sections.push({
                title: '🔙 Navegação',
                rows: [{
                    id: 'back_to_dates',
                    title: '⬅️ Outras Datas',
                    description: 'Voltar para seleção de datas'
                }]
            });

            await this.client.sendMessage(message.from, listMessage);
            
        } catch (error) {
            // Fallback para botões simples
            try {
                const buttons = [];
                availableTimes.slice(0, 3).forEach((time, index) => {
                    buttons.push({
                        buttonId: `time_${index}`,
                        buttonText: { displayText: `🕐 ${time}` },
                        type: 1
                    });
                });

                buttons.push({
                    buttonId: 'back_to_dates',
                    buttonText: { displayText: '⬅️ Outras Datas' },
                    type: 1
                });

                const buttonMessage = {
                    text: `🕐 *HORÁRIOS PARA ${selectedDate.format('DD/MM - dddd')}*\n\n${encouragingMessage}`,
                    buttons: buttons,
                    headerType: 1
                };

                await this.human.sendHumanButtonMessage(message.from, buttonMessage);
                
            } catch (buttonError) {
                // Fallback final para texto simples
                let timeText = `🕐 *HORÁRIOS PARA ${selectedDate.format('DD/MM - dddd')}*\n\n${encouragingMessage}\n\n`;

                availableTimes.forEach((time, index) => {
                    const emojiNumber = this.human.numberToEmoji(index + 1);
                    timeText += `${emojiNumber} ${time}\n`;
                });

                timeText += `\n${this.human.numberToEmoji(0)} Voltar às Datas\n\nDigite o número do horário! 👆`;
                await this.human.sendHumanMessage(message, timeText);
            }
        }
    }

    async requestCustomerName(message) {
        const nameMessages = [
            `${this.human.getRandomResponse('success')} Horário reservado!

Agora preciso saber seu nome completo para finalizar o agendamento:`,

            `Ótima escolha! 👌 Separei esse horário pra você!

Me fala seu nome completo aí:`,

            `Perfeito! 🎯 Esse horário tá reservado!

Qual é seu nome completo?`
        ];

        const nameText = nameMessages[Math.floor(Math.random() * nameMessages.length)];

        await this.human.sendHumanMessage(message, nameText);
    }

    async sendBookingSummary(message, session) {
        await this.human.sendHumanMessage(message, "Deixa eu organizar tudo aqui... 📋");
        
        const service = session.selectedService;
        const date = session.selectedDate;
        const time = session.selectedTime;
        const name = session.customerName;
        const depositAmount = (parseFloat(service.price.replace('R$ ', '').replace(',', '.')) * 0.5).toFixed(2);

        const summaryMessages = [
            `Pronto, ${name.split(' ')[0]}! 😊 Vou confirmar os dados:`,
            `Perfeito, ${name.split(' ')[0]}! 👌 Olha como ficou:`,
            `Ótimo, ${name.split(' ')[0]}! ✨ Confere aí se tá tudo certo:`
        ];

        const summaryIntro = summaryMessages[Math.floor(Math.random() * summaryMessages.length)];

        const summaryText = `${summaryIntro}

📋 *RESUMO DO SEU AGENDAMENTO*

👤 *Cliente:* ${name}
✂️ *Serviço:* ${service.name}
💰 *Valor Total:* ${service.price}
📅 *Data:* ${date.format('DD/MM/YYYY - dddd')}
🕐 *Horário:* ${time}

💳 *Sinal (50%):* R$ ${depositAmount.replace('.', ',')}

Para garantir seu horário, preciso que você pague o sinal de 50%. Tá tudo certo?`;

        const buttons = [
            {
                buttonId: 'confirm_booking',
                buttonText: { displayText: '✅ Tá Perfeito!' },
                type: 1
            },
            {
                buttonId: 'cancel_booking',
                buttonText: { displayText: '❌ Cancelar' },
                type: 1
            },
            {
                buttonId: 'back_to_name',
                buttonText: { displayText: '✏️ Mudar Nome' },
                type: 1
            }
        ];

        const buttonMessage = {
            text: summaryText,
            buttons: buttons,
            headerType: 1
        };

        try {
            await this.human.sendHumanButtonMessage(message.from, buttonMessage);
        } catch (error) {
            // Fallback para texto simples
            const fallbackText = summaryText + `

Digite:
✅ *CONFIRMAR* - para prosseguir com o pagamento
❌ *CANCELAR* - para cancelar o agendamento
✏️ *NOME* - para alterar o nome`;
            
            await this.human.sendHumanMessage(message, fallbackText);
        }
    }

    async processPayment(message, session) {
        try {
            const service = session.selectedService;
            const depositAmount = parseFloat(service.price.replace('R$ ', '').replace(',', '.')) * 0.5;
            
            // Reservar o horário temporariamente
            await this.db.reserveTimeSlot(
                session.selectedDate.format('YYYY-MM-DD'),
                session.selectedTime,
                message.from,
                'reserved'
            );
            
            const paymentData = await this.mp.createPayment({
                amount: depositAmount,
                description: `Sinal - ${service.name}`,
                customerName: session.customerName,
                customerPhone: message.from
            });

            session.paymentId = paymentData.id;

            const paymentText = `
💳 *PAGAMENTO DO SINAL*

Para confirmar seu agendamento, realize o pagamento de *R$ ${depositAmount.toFixed(2).replace('.', ',')}*

*🔗 Link de Pagamento:*
${paymentData.init_point}

*📱 PIX Copia e Cola:*
\`${paymentData.qr_code}\`

*⏰ Aguardando confirmação do pagamento...*

Após o pagamento, seu agendamento será confirmado automaticamente! ✅

⚠️ *Importante:* Você tem 30 minutos para realizar o pagamento, após isso o horário será liberado.`;

            await message.reply(paymentText);

        } catch (error) {
            console.error('Erro ao processar pagamento:', error);
            await message.reply('❌ Erro ao gerar pagamento. Tente novamente.');
        }
    }

    async sendScheduleInfo(message) {
        const schedule = Settings.get('schedule');
        const business = Settings.get('businessInfo');
        
        let scheduleText = `🕐 *HORÁRIOS DE FUNCIONAMENTO*\n\n`;
        
        // Ordenar os dias da semana
        const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Segunda a Domingo
        
        dayOrder.forEach(dayNum => {
            const daySchedule = schedule[dayNum];
            if (daySchedule) {
                scheduleText += `*${daySchedule.name}:* `;
                
                if (daySchedule.periods.length === 0) {
                    scheduleText += 'FECHADO\n';
                } else {
                    const periods = daySchedule.periods.map(p => `${p.start} - ${p.end}`).join(' | ');
                    scheduleText += `${periods}\n`;
                }
            }
        });
        
        scheduleText += `\n📞 Para emergências: ${business.phone}`;

        await message.reply(scheduleText);
    }

    async sendLocationInfo(message) {
        const business = Settings.get('businessInfo');
        
        const locationText = `
📍 *LOCALIZAÇÃO E CONTATO*

🏪 *${business.name}*
📍 ${business.address}
🏙️ ${business.city}
📮 CEP: ${business.cep}

📞 *Telefone:* ${business.phone}
📱 *WhatsApp:* Este número

🚗 *Como chegar:*
Estamos localizados no bairro Faisqueira, próximo ao centro da cidade.

*Digite 1 para voltar ao menu principal*`;

        await message.reply(locationText);
    }

    // ========== MÉTODOS DE CANCELAMENTO PARA CLIENTES ==========

    async showUserBookings(message) {
        await this.human.sendHumanMessage(message, "Deixa eu ver seus agendamentos... 📋");
        
        try {
            const userId = message.from;
            const bookings = await this.db.getBookingsByCustomer(userId, 5);
            
            const activeBookings = bookings.filter(b => 
                b.status !== 'cancelled' && 
                moment(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm').isAfter(moment())
            );

            if (activeBookings.length === 0) {
                const noBookingsMessages = [
                    "Opa! Você não tem nenhum agendamento ativo no momento... 🤔",
                    "Hmm... Não encontrei agendamentos seus aqui... 😅",
                    "Eita! Parece que você não tem nada agendado ainda... 🤷‍♂️"
                ];
                
                const noBookingsMessage = noBookingsMessages[Math.floor(Math.random() * noBookingsMessages.length)];
                await this.human.sendHumanMessage(message, noBookingsMessage);
                
                // Aguardar um pouco
                await this.human.delay(1500);
                
                // Mostrar mensagem estratégica
                await this.sendStrategicBookingMessage(message);
                
                // Voltar automaticamente ao menu principal
                await this.human.delay(2000);
                await this.sendWelcomeMessage(message);
                
                return;
            }

            let bookingText = `📅 *SEUS AGENDAMENTOS ATIVOS*\n\n`;
            
            activeBookings.forEach((booking, index) => {
                const emojiNumber = this.human.numberToEmoji(booking.id);
                bookingText += `${emojiNumber} *ID: ${booking.id}*\n`;
                bookingText += `✂️ ${booking.service_name}\n`;
                bookingText += `📅 ${moment(booking.date).format('DD/MM/YYYY - ddd')}\n`;
                bookingText += `🕐 ${booking.time}\n`;
                bookingText += `📊 ${booking.status === 'confirmed' ? 'Confirmado ✅' : 'Pendente ⏳'}\n\n`;
            });

            bookingText += `Para cancelar, digite o *ID* do agendamento.\n`;
            bookingText += `Exemplo: ${activeBookings[0].id}\n\n`;
            bookingText += `${this.human.numberToEmoji(0)} Voltar ao Menu Principal`;

            await this.human.sendHumanMessage(message, bookingText);

        } catch (error) {
            console.error('Erro ao buscar agendamentos do usuário:', error);
            await this.human.sendHumanMessage(message, this.human.getRandomResponse('error') + " Tenta de novo aí!");
        }
    }

    async sendStrategicBookingMessage(message) {
        const strategicMessages = [
            "Que tal fazer um agendamento? Temos horários bacanas! 😊",
            "Aproveitando, quer dar uma olhada nos nossos horários? 👀",
            "Já que tá aqui, posso te mostrar quando temos vaga! 😄"
        ];
        
        const strategicMessage = strategicMessages[Math.floor(Math.random() * strategicMessages.length)];
        
        // Buscar próximos horários disponíveis
        const availableSlots = await this.getNextAvailableSlots();
        
        let bookingText = strategicMessage + "\n\n";
        
        // Mostrar próximos horários disponíveis
        if (availableSlots.length > 0) {
            bookingText += "🕐 *PRÓXIMOS HORÁRIOS LIVRES:*\n";
            availableSlots.slice(0, 4).forEach(slot => {
                bookingText += `📅 ${slot.date} às ${slot.time}\n`;
            });
            bookingText += "\n";
        }
        
        // Mostrar serviços estratégicos
        bookingText += "✂️ *NOSSOS HITS:*\n";
        bookingText += "🔥 Corte Degradê - A partir de R$ 35,00\n";
        bookingText += "💪 Corte + Barba - R$ 60,00 (Sobrancelha grátis!)\n";
        bookingText += "⚡ Barba Express - R$ 25,00\n";
        bookingText += "✨ Sobrancelha - R$ 10,00\n\n";
        
        const encouragingMessages = [
            "Bora agendar? 😉",
            "Que tal garantir seu horário? 🎯",
            "Quer marcar algo? 😊"
        ];
        
        bookingText += encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
        
        await this.human.sendHumanMessage(message, bookingText);
    }

    async handleBookingCancellation(message, messageText) {
        try {
            if (messageText.toLowerCase().includes('voltar') || messageText === '0') {
                await this.sendWelcomeMessage(message);
                return;
            }
            
            const bookingId = parseInt(messageText.trim());
            
            if (isNaN(bookingId)) {
                await this.human.sendHumanMessage(message, 'Hmm... Digite um ID válido ou "0" para voltar ao menu! 🤔');
                return;
            }

            const booking = await this.db.getBookingById(bookingId);
            
            if (!booking || booking.user_id !== message.from) {
                await this.human.sendHumanMessage(message, 'Opa! Esse agendamento não é seu ou não existe... 😅');
                return;
            }

            if (booking.status === 'cancelled') {
                await this.human.sendHumanMessage(message, 'Eita! Esse agendamento já foi cancelado antes... 🤷‍♂️');
                return;
            }

            // Verificar se é possível cancelar (pelo menos 2 horas de antecedência)
            const bookingDateTime = moment(`${booking.date} ${booking.time}`, 'YYYY-MM-DD HH:mm');
            const now = moment();
            const hoursUntilBooking = bookingDateTime.diff(now, 'hours');

            if (hoursUntilBooking < 2) {
                await this.human.sendHumanMessage(message, 'Putz! Cancelamentos precisam ser feitos com pelo menos 2 horas de antecedência... 😬');
                return;
            }

            // Cancelar agendamento
            await this.db.updateBookingStatus(bookingId, 'cancelled');

            // Notificar barbeiro sobre cancelamento e reembolso
            const adminText = `
🚨 *CANCELAMENTO DE AGENDAMENTO*

Cliente cancelou agendamento:

📋 *Detalhes:*
👤 ${booking.customer_name}
✂️ ${booking.service_name}
📅 ${moment(booking.date).format('DD/MM/YYYY')}
🕐 ${booking.time}
📱 ${booking.user_id.replace('@c.us', '')}

💰 *AÇÃO NECESSÁRIA:* Processar reembolso de 50% do valor pago.

ID do Agendamento: ${bookingId}`;

            // Enviar para todos os administradores
            for (const adminNumber of this.adminNumbers) {
                try {
                    await this.client.sendMessage(adminNumber, adminText);
                } catch (error) {
                    console.error('Erro ao notificar admin:', error);
                }
            }

            const confirmMessages = [
                `Pronto! Cancelei seu agendamento. 😊`,
                `Tudo certo! Agendamento cancelado com sucesso! ✅`,
                `Feito! Seu horário foi liberado! 👍`
            ];

            const confirmMessage = confirmMessages[Math.floor(Math.random() * confirmMessages.length)];

            const confirmText = `${confirmMessage}

📋 *Agendamento Cancelado:*
✂️ ${booking.service_name}
📅 ${moment(booking.date).format('DD/MM/YYYY - ddd')}
🕐 ${booking.time}

💰 *Reembolso:* O barbeiro foi notificado para processar o reembolso do sinal pago.`;

            await this.human.sendHumanMessage(message, confirmText);
            
            // Aguardar um pouco antes da mensagem estratégica
            await this.human.delay(2000);
            
            // Enviar mensagem estratégica de reagendamento
            await this.sendStrategicRebookingMessage(message);

        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            await this.human.sendHumanMessage(message, this.human.getRandomResponse('error') + " Tenta cancelar de novo aí!");
        }
    }

    // ========== MÉTODOS AUXILIARES ==========

    getServiceById(id) {
        const services = Settings.get('services');
        return services.find(service => service.id === id);
    }

    getAllServices() {
        return Settings.get('services');
    }

    getScheduleByDay(dayOfWeek) {
        const schedule = Settings.get('schedule');
        return schedule[dayOfWeek] || schedule[0];
    }

    getBusinessInfo() {
        return Settings.get('businessInfo');
    }

    getRandomMessage(type) {
        const messages = Settings.get('messages');
        const typeMessages = messages[type] || messages.thinking;
        return typeMessages[Math.floor(Math.random() * typeMessages.length)];
    }

    async handleButtonResponse(message) {
        const userId = message.from;
        const buttonId = message.selectedButtonId || message.listResponseId;
        let session = this.userSessions.get(userId);

        if (!session) {
            session = {
                step: 'welcome',
                selectedService: null,
                selectedDate: null,
                selectedTime: null,
                customerName: null,
                paymentId: null
            };
        }

        try {
            if (buttonId.startsWith('menu_')) {
                // Resposta do menu principal
                const menuOption = buttonId.replace('menu_', '');
                
                switch (menuOption) {
                    case '1':
                        await this.sendServicesMenu(message);
                        session.step = 'selecting_service';
                        break;
                    case '2':
                        await this.sendScheduleInfo(message);
                        break;
                    case '3':
                        await this.sendLocationInfo(message);
                        break;
                    case '4':
                        await this.showUserBookings(message);
                        session.step = 'canceling_booking';
                        break;
                }
                
            } else if (buttonId.startsWith('date_')) {
                // Resposta de seleção de data
                const dateIndex = parseInt(buttonId.replace('date_', ''));
                const availableDates = this.getAvailableDates();
                const selectedDate = availableDates[dateIndex];

                if (selectedDate && this.isValidDate(selectedDate)) {
                    session.selectedDate = selectedDate;
                    await this.sendTimeSelection(message, selectedDate);
                    session.step = 'selecting_time';
                } else {
                    await this.human.sendHumanMessage(message, this.human.getRandomResponse('error') + " Escolhe outra data aí!");
                    await this.sendDateSelection(message);
                }
                
            } else if (buttonId.startsWith('time_')) {
                // Resposta de seleção de horário
                const timeIndex = parseInt(buttonId.replace('time_', ''));
                const availableTimes = await this.getAvailableTimes(session.selectedDate);
                const selectedTime = availableTimes[timeIndex];

                if (selectedTime && await this.isTimeAvailable(session.selectedDate, selectedTime)) {
                    session.selectedTime = selectedTime;
                    await this.requestCustomerName(message);
                    session.step = 'getting_name';
                } else {
                    await this.human.sendHumanMessage(message, "Eita! Alguém pegou esse horário agora... 😅 Escolhe outro aí!");
                    await this.sendTimeSelection(message, session.selectedDate);
                }
                
            } else if (buttonId === 'confirm_booking') {
                // Confirmar agendamento
                await this.processPayment(message, session);
                session.step = 'payment_pending';
                
            } else if (buttonId === 'cancel_booking') {
                // Cancelar agendamento
                await this.cancelBooking(message);
                session.step = 'menu';
                
            } else if (buttonId === 'back_to_services') {
                // Voltar aos serviços
                await this.sendServicesMenu(message);
                session.step = 'selecting_service';
                
            } else if (buttonId === 'back_to_dates') {
                // Voltar às datas
                await this.sendDateSelection(message);
                session.step = 'selecting_date';
                
            } else if (buttonId === 'back_to_name') {
                // Voltar para alterar nome
                await this.requestCustomerName(message);
                session.step = 'getting_name';
            }
            
            this.userSessions.set(userId, session);
            
        } catch (error) {
            console.error('Erro ao processar botão:', error);
            await this.human.sendHumanMessage(message, this.human.getRandomResponse('error') + " Tenta de novo aí!");
        }
    }

    extractServiceId(text) {
        const match = text.match(/(\d+)/);
        const number = match ? parseInt(match[1]) : null;
        
        // Se for 0, significa voltar
        if (number === 0) {
            return 'back';
        }
        
        return number;
    }

    extractDate(text) {
        const match = text.match(/(\d+)/);
        if (match) {
            const number = parseInt(match[1]);
            
            // Se for 0, significa voltar
            if (number === 0) {
                return 'back';
            }
            
            const dates = this.getAvailableDates();
            const index = number - 1;
            return dates[index] || null;
        }
        return null;
    }

    async extractTime(text, userId) {
        const match = text.match(/(\d+)/);
        if (match) {
            const number = parseInt(match[1]);
            
            // Se for 0, significa voltar
            if (number === 0) {
                return 'back';
            }
            
            const session = this.userSessions.get(userId);
            if (session && session.selectedDate) {
                const times = await this.getAvailableTimes(session.selectedDate);
                const index = number - 1;
                return times[index] || null;
            }
        }
        return null;
    }

    getAvailableDates() {
        const dates = [];
        for (let i = 1; i <= 7; i++) {
            const date = moment().add(i, 'days');
            if (date.day() !== 0) { // Não incluir domingo
                dates.push(date);
            }
        }
        return dates;
    }

    async getAvailableTimes(date) {
        const schedule = this.getScheduleByDay(date.day());
        const times = [];
        
        schedule.periods.forEach(period => {
            let current = moment(period.start, 'HH:mm');
            const end = moment(period.end, 'HH:mm');
            
            while (current.isBefore(end)) {
                times.push(current.format('HH:mm'));
                current.add(30, 'minutes');
            }
        });
        
        // Filtrar horários ocupados e bloqueados
        const dateStr = date.format('YYYY-MM-DD');
        const occupiedTimes = await this.db.getOccupiedTimes(dateStr);
        const blockedTimes = await this.db.getBlockedTimes(dateStr);
        
        const unavailableTimes = [...occupiedTimes, ...blockedTimes];
        
        return times.filter(time => !unavailableTimes.includes(time));
    }

    isValidDate(date) {
        return date && date.isAfter(moment()) && date.day() !== 0;
    }

    async isTimeAvailable(date, time) {
        const dateStr = date.format('YYYY-MM-DD');
        return await this.db.isTimeSlotAvailable(dateStr, time);
    }

    async handlePaymentWebhook(data) {
        if (data.type === 'payment' && data.action === 'payment.updated') {
            const paymentId = data.data.id;
            const paymentStatus = await this.mp.getPaymentStatus(paymentId);
            
            if (paymentStatus === 'approved') {
                await this.confirmBooking(paymentId);
            }
        }
    }

    async confirmBooking(paymentId) {
        // Encontrar sessão pelo paymentId e confirmar agendamento
        for (let [userId, session] of this.userSessions) {
            if (session.paymentId === paymentId) {
                const booking = await this.db.createBooking({
                    userId,
                    customerName: session.customerName,
                    serviceId: session.selectedService.id,
                    serviceName: session.selectedService.name,
                    date: session.selectedDate.format('YYYY-MM-DD'),
                    time: session.selectedTime,
                    status: 'confirmed',
                    paymentId
                });

                // Atualizar status da reserva
                await this.db.updateReservationStatus(
                    session.selectedDate.format('YYYY-MM-DD'),
                    session.selectedTime,
                    userId,
                    'confirmed'
                );

                const confirmText = `
✅ *AGENDAMENTO CONFIRMADO!*

Seu pagamento foi aprovado e seu horário está reservado!

📋 *Detalhes:*
👤 ${session.customerName}
✂️ ${session.selectedService.name}
📅 ${session.selectedDate.format('DD/MM/YYYY - dddd')}
🕐 ${session.selectedTime}

📍 *Localização:*
Rua Antônio Scodeler, 885 - Faisqueira
Pouso Alegre/MG

⏰ *Lembrete:* Chegue 5 minutos antes do horário agendado.

Aguardamos você! 😊`;

                await this.client.sendMessage(userId, confirmText);
                
                // Notificar barbeiro sobre novo agendamento
                const adminNotification = `
🆕 *NOVO AGENDAMENTO CONFIRMADO*

📋 *Detalhes:*
👤 ${session.customerName}
✂️ ${session.selectedService.name}
📅 ${session.selectedDate.format('DD/MM/YYYY - dddd')}
🕐 ${session.selectedTime}
📱 ${userId.replace('@c.us', '')}

ID: ${booking.id}`;

                for (const adminNumber of this.adminNumbers) {
                    try {
                        await this.client.sendMessage(adminNumber, adminNotification);
                    } catch (error) {
                        console.error('Erro ao notificar admin:', error);
                    }
                }

                this.userSessions.delete(userId);
                break;
            }
        }
    }

    async cancelBooking(message) {
        const cancelMessages = [
            "Tranquilo! 😊 Cancelei tudo aqui.",
            "Sem problema! 👍 Tudo cancelado!",
            "Tudo bem! 😄 Cancelamento feito!"
        ];
        
        const cancelMessage = cancelMessages[Math.floor(Math.random() * cancelMessages.length)];
        await this.human.sendHumanMessage(message, cancelMessage);
        
        // Aguardar um pouco antes da próxima mensagem
        await this.human.delay(1500);
        
        // Mostrar mensagem estratégica com horários e serviços populares
        await this.sendStrategicRebookingMessage(message);
    }

    async sendStrategicRebookingMessage(message) {
        // Buscar próximos horários disponíveis
        const availableSlots = await this.getNextAvailableSlots();
        
        const strategicMessages = [
            "Mas ó, se quiser reagendar, temos umas opções bacanas! 😉",
            "Aproveitando que tá aqui, que tal dar uma olhada nos horários livres? 👀",
            "Já que cancelou, posso te mostrar outras opções disponíveis! 😊"
        ];
        
        const strategicMessage = strategicMessages[Math.floor(Math.random() * strategicMessages.length)];
        
        let rebookingText = strategicMessage + "\n\n";
        
        // Mostrar próximos horários disponíveis
        if (availableSlots.length > 0) {
            rebookingText += "🕐 *PRÓXIMOS HORÁRIOS LIVRES:*\n";
            availableSlots.slice(0, 4).forEach(slot => {
                rebookingText += `📅 ${slot.date} às ${slot.time}\n`;
            });
            rebookingText += "\n";
        }
        
        // Mostrar serviços mais populares
        rebookingText += "✂️ *SERVIÇOS MAIS PEDIDOS:*\n";
        rebookingText += "🔥 Corte Degradê - R$ 35,00\n";
        rebookingText += "💪 Corte + Barba - R$ 60,00\n";
        rebookingText += "✨ Barba - R$ 25,00\n\n";
        
        rebookingText += "Quer agendar algo? É só me chamar! 😄";
        
        await this.human.sendHumanMessage(message, rebookingText);
    }

    async getNextAvailableSlots() {
        const slots = [];
        const today = moment();
        
        // Verificar próximos 5 dias
        for (let i = 1; i <= 5; i++) {
            const date = today.clone().add(i, 'days');
            
            // Pular domingo
            if (date.day() === 0) continue;
            
            const availableTimes = await this.getAvailableTimes(date);
            
            // Pegar primeiros 2 horários de cada dia
            availableTimes.slice(0, 2).forEach(time => {
                slots.push({
                    date: date.format('DD/MM - ddd'),
                    time: time,
                    fullDate: date.format('YYYY-MM-DD')
                });
            });
            
            // Parar quando tiver 6 slots
            if (slots.length >= 6) break;
        }
        
        return slots;
    }

    async checkPaymentStatus(message, session) {
        const waitingMessages = [
            "Tô aqui esperando o pagamento... ⏰ Assim que cair, te aviso!",
            "Aguardando o PIX... 💳 Quando processar, confirmo seu horário!",
            "Esperando o pagamento... 🕐 Logo logo tá confirmado!"
        ];
        
        const waitingMessage = waitingMessages[Math.floor(Math.random() * waitingMessages.length)];
        await this.human.sendHumanMessage(message, waitingMessage);
    }
}

module.exports = BarberBot;