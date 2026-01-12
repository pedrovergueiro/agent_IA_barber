const moment = require('moment');
const Settings = require('../config/settings');

class AdminPanel {
    constructor(client, database, human) {
        this.client = client;
        this.db = database;
        this.human = human;
        this.adminSessions = new Map(); // Sessões de admin
    }

    async handleAdminLogin(message, command) {
        const userId = message.from;
        
        if (command === '/admin') {
            // Solicitar senha
            await this.human.sendHumanMessage(message, "🔐 *ACESSO ADMINISTRATIVO*\n\nDigite a senha de administrador:");
            
            this.adminSessions.set(userId, {
                step: 'awaiting_password',
                attempts: 0
            });
            return;
        }
    }

    async handlePasswordAttempt(message) {
        const userId = message.from;
        const session = this.adminSessions.get(userId);
        const password = message.body.trim();

        if (!session || session.step !== 'awaiting_password') {
            return false;
        }

        if (Settings.verifyPassword(password)) {
            // Senha correta
            session.step = 'authenticated';
            session.currentMenu = 'main';
            session.loginTime = moment();
            this.adminSessions.set(userId, session);
            
            await this.human.sendHumanMessage(message, "✅ *ACESSO LIBERADO!*\n\nBem-vindo ao painel administrativo! 🎛️");
            await this.sendMainAdminMenu(message);
            return true;
        } else {
            // Senha incorreta
            session.attempts++;
            
            if (session.attempts >= 3) {
                this.adminSessions.delete(userId);
                await this.human.sendHumanMessage(message, "❌ *ACESSO NEGADO!*\n\nMuitas tentativas incorretas. Tente novamente mais tarde.");
                return true;
            }
            
            await this.human.sendHumanMessage(message, `❌ Senha incorreta! Tentativa ${session.attempts}/3\n\nDigite a senha novamente:`);
            return true;
        }
    }

    isAuthenticated(userId) {
        const session = this.adminSessions.get(userId);
        return session && (session.step === 'authenticated' || session.currentMenu);
    }

    async sendMainAdminMenu(message) {
        const menuText = `
🎛️ *PAINEL ADMINISTRATIVO*

Escolha uma opção:

${this.human.numberToEmoji(1)} 📊 Dashboard & Relatórios
${this.human.numberToEmoji(2)} 📅 Gerenciar Agendamentos  
${this.human.numberToEmoji(3)} ✂️ Gerenciar Serviços
${this.human.numberToEmoji(4)} 🕐 Horários de Funcionamento
${this.human.numberToEmoji(5)} 💬 Personalizar Mensagens
${this.human.numberToEmoji(6)} 🏪 Informações da Barbearia
${this.human.numberToEmoji(7)} 🔐 Alterar Senha
${this.human.numberToEmoji(8)} 📱 Status WhatsApp
${this.human.numberToEmoji(9)} 🚪 Sair

Digite o número da opção desejada:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.step = 'main_menu';
        this.adminSessions.set(message.from, session);
    }

    async handleAdminCommand(message) {
        const userId = message.from;
        const session = this.adminSessions.get(userId);
        const input = message.body.trim();

        if (!session || !this.isAuthenticated(userId)) {
            // Se não está autenticado, redirecionar para login
            await this.handleAdminLogin(message, '/admin');
            return;
        }

        try {
            // Se não tem menu atual, está no menu principal
            if (!session.currentMenu) {
                session.currentMenu = 'main';
                this.adminSessions.set(userId, session);
            }

            switch (session.currentMenu) {
                case 'main':
                    await this.handleMainMenu(message, input);
                    break;
                case 'dashboard':
                    await this.handleDashboard(message, input);
                    break;
                case 'bookings':
                    await this.handleBookingsMenu(message, input);
                    break;
                case 'services':
                    await this.handleServicesMenu(message, input);
                    break;
                case 'schedule':
                    await this.handleScheduleMenu(message, input);
                    break;
                case 'messages':
                    if (session.waitingFor && session.waitingFor.startsWith('message_action_')) {
                        const messageType = session.waitingFor.replace('message_action_', '');
                        await this.handleMessageAction(message, input, messageType);
                    } else {
                        await this.handleMessagesMenu(message, input);
                    }
                    break;
                case 'business':
                    await this.handleBusinessMenu(message, input);
                    break;
                case 'password':
                    await this.handlePasswordMenu(message, input);
                    break;
                case 'whatsapp':
                    await this.handleWhatsAppMenu(message, input);
                    break;
                default:
                    session.currentMenu = 'main';
                    this.adminSessions.set(userId, session);
                    await this.sendMainAdminMenu(message);
            }
        } catch (error) {
            console.error('Erro no painel admin:', error);
            await this.human.sendHumanMessage(message, "❌ Erro interno. Voltando ao menu principal...");
            session.currentMenu = 'main';
            this.adminSessions.set(userId, session);
            await this.sendMainAdminMenu(message);
        }
    }

    async handleMainMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        switch (input) {
            case '1':
                session.currentMenu = 'dashboard';
                this.adminSessions.set(message.from, session);
                await this.showDashboard(message);
                break;
            case '2':
                session.currentMenu = 'bookings';
                this.adminSessions.set(message.from, session);
                await this.showBookingsMenu(message);
                break;
            case '3':
                session.currentMenu = 'services';
                this.adminSessions.set(message.from, session);
                await this.showServicesMenu(message);
                break;
            case '4':
                session.currentMenu = 'schedule';
                this.adminSessions.set(message.from, session);
                await this.showScheduleMenu(message);
                break;
            case '5':
                session.currentMenu = 'messages';
                this.adminSessions.set(message.from, session);
                await this.showMessagesMenu(message);
                break;
            case '6':
                session.currentMenu = 'business';
                this.adminSessions.set(message.from, session);
                await this.showBusinessMenu(message);
                break;
            case '7':
                session.currentMenu = 'password';
                this.adminSessions.set(message.from, session);
                await this.showPasswordMenu(message);
                break;
            case '8':
                session.currentMenu = 'whatsapp';
                this.adminSessions.set(message.from, session);
                await this.showWhatsAppStatus(message);
                break;
            case '9':
                this.adminSessions.delete(message.from);
                await this.human.sendHumanMessage(message, "👋 Sessão encerrada! Até mais!");
                break;
            default:
                await this.sendMainAdminMenu(message);
        }
    }

    async showDashboard(message) {
        await this.human.sendHumanMessage(message, "Gerando relatório... 📊");
        
        // Usar data atual do sistema (sem forçar timezone)
        const today = moment().format('YYYY-MM-DD');
        const todayDisplay = moment().format('DD/MM/YYYY');
        
        console.log(`📊 Dashboard: Data atual do sistema: ${today} (${todayDisplay})`);
        console.log(`📊 Dashboard: Buscando agendamentos para ${today}`);
        
        const bookings = await this.db.getBookingsByDate(today);
        console.log(`📊 Dashboard: Encontrados ${bookings.length} agendamentos:`, bookings);
        
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;
        const pending = bookings.filter(b => b.status === 'pending').length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;
        
        // Calcular receita usando Services.extractPrice
        const Services = require('../data/Services');
        const totalRevenue = bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, booking) => {
                const service = Services.getById(booking.service_id);
                if (service) {
                    const price = Services.extractPrice(service.price);
                    return sum + price;
                }
                return sum;
            }, 0);

        const dashboardText = `
📊 *DASHBOARD - ${todayDisplay}*

📈 *Agendamentos Hoje:*
✅ Confirmados: ${confirmed}
⏳ Pendentes: ${pending}
❌ Cancelados: ${cancelled}
📊 Total: ${bookings.length}

💰 *Faturamento:*
Receita estimada: R$ ${totalRevenue.toFixed(2).replace('.', ',')}

🕐 *Próximos Agendamentos:*`;

        let nextBookings = bookings
            .filter(b => b.status === 'confirmed' && moment(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm').isAfter(moment()))
            .sort((a, b) => moment(`${a.date} ${a.time}`, 'YYYY-MM-DD HH:mm').diff(moment(`${b.date} ${b.time}`, 'YYYY-MM-DD HH:mm')))
            .slice(0, 5);

        let finalDashboard = dashboardText;
        
        if (nextBookings.length > 0) {
            nextBookings.forEach(booking => {
                const bookingDate = moment(booking.date).format('DD/MM');
                finalDashboard += `\n🕐 ${booking.time} (${bookingDate}) - ${booking.customer_name} (${booking.service_name})`;
            });
        } else {
            finalDashboard += '\nNenhum agendamento pendente para hoje.';
        }

        finalDashboard += `\n\n${this.human.numberToEmoji(0)} Voltar ao Menu Principal`;

        await this.human.sendHumanMessage(message, finalDashboard);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'dashboard';
        this.adminSessions.set(message.from, session);
    }

    async showBookingsMenu(message) {
        const menuText = `
📅 *GERENCIAR AGENDAMENTOS*

${this.human.numberToEmoji(1)} Ver Agendamentos de Hoje
${this.human.numberToEmoji(2)} Ver Agendamentos por Data
${this.human.numberToEmoji(3)} Buscar por Cliente
${this.human.numberToEmoji(4)} 📊 Relatório Completo
${this.human.numberToEmoji(5)} 📈 Relatório por Período
${this.human.numberToEmoji(6)} Cancelar Agendamento
${this.human.numberToEmoji(7)} Bloquear Horário
${this.human.numberToEmoji(8)} Desbloquear Horário
${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite a opção:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'bookings';
        this.adminSessions.set(message.from, session);
    }

    async showServicesMenu(message) {
        const services = Settings.get('services');
        
        let menuText = `
✂️ *GERENCIAR SERVIÇOS*

*Serviços Atuais:*
`;

        services.forEach(service => {
            const popular = service.popular ? ' 🔥' : '';
            menuText += `${this.human.numberToEmoji(service.id)} ${service.name}${popular}\n`;
            menuText += `   💰 ${service.price}\n\n`;
        });

        menuText += `
*Opções:*
🆕 *NOVO* - Adicionar serviço
✏️ *EDITAR [ID]* - Ex: EDITAR 1
💰 *PRECO [ID] [VALOR]* - Ex: PRECO 1 25.50
❌ *REMOVER [ID]* - Ex: REMOVER 1
🔥 *POPULAR [ID]* - Marcar como popular
${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite a opção:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'services';
        this.adminSessions.set(message.from, session);
    }

    async showScheduleMenu(message) {
        const schedule = Settings.get('schedule');
        
        let menuText = `
🕐 *HORÁRIOS DE FUNCIONAMENTO*

*Horários Atuais:*
`;

        Object.keys(schedule).forEach(day => {
            const daySchedule = schedule[day];
            menuText += `${this.human.numberToEmoji(parseInt(day))} ${daySchedule.name}: `;
            
            if (daySchedule.periods.length === 0) {
                menuText += 'FECHADO\n';
            } else {
                const periods = daySchedule.periods.map(p => `${p.start}-${p.end}`).join(' | ');
                menuText += `${periods}\n`;
            }
        });

        menuText += `
*Para editar, digite:*
HORARIO [DIA] [INICIO-FIM] [INICIO-FIM]
Ex: HORARIO 1 09:00-12:00 13:00-20:00
Ex: HORARIO 0 (para fechar domingo)

${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite a opção:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'schedule';
        this.adminSessions.set(message.from, session);
    }

    async showMessagesMenu(message) {
        const messages = Settings.get('messages');
        
        let menuText = `
💬 *PERSONALIZAR MENSAGENS*

Escolha o tipo de mensagem para editar:

${this.human.numberToEmoji(1)} Boas-vindas (${messages.welcome.length} variações)
${this.human.numberToEmoji(2)} Pensando (${messages.thinking.length} variações)
${this.human.numberToEmoji(3)} Sucesso (${messages.success.length} variações)
${this.human.numberToEmoji(4)} Erro (${messages.error.length} variações)
${this.human.numberToEmoji(5)} Cancelamento (${messages.cancel.length} variações)
${this.human.numberToEmoji(6)} Estratégicas (${messages.strategic.length} variações)

${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite o número do tipo de mensagem:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'messages';
        this.adminSessions.set(message.from, session);
    }

    async showBusinessMenu(message) {
        const business = Settings.get('businessInfo');
        
        const menuText = `
🏪 *INFORMAÇÕES DA BARBEARIA*

*Dados Atuais:*
📛 Nome: ${business.name}
📍 Endereço: ${business.address}
🏙️ Cidade: ${business.city}
📮 CEP: ${business.cep}
📞 Telefone: ${business.phone}

*Para editar:*
NOME [novo nome]
ENDERECO [novo endereço]
CIDADE [nova cidade]
CEP [novo cep]
TELEFONE [novo telefone]

${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite a opção:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'business';
        this.adminSessions.set(message.from, session);
    }

    async showPasswordMenu(message) {
        const menuText = `
🔐 *ALTERAR SENHA*

Digite a nova senha de administrador:
(Mínimo 6 caracteres)

${this.human.numberToEmoji(0)} Voltar ao Menu Principal`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'password';
        this.adminSessions.set(message.from, session);
    }

    // Métodos para lidar com cada menu específico
    async handleDashboard(message, input) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.currentMenu = 'main';
            this.adminSessions.set(message.from, session);
            await this.sendMainAdminMenu(message);
        } else {
            await this.showDashboard(message);
        }
    }

    async handleBookingsMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        switch (input) {
            case '0':
                session.currentMenu = 'main';
                this.adminSessions.set(message.from, session);
                await this.sendMainAdminMenu(message);
                break;
            case '1':
                await this.showTodayBookings(message);
                break;
            case '2':
                await this.human.sendHumanMessage(message, "Digite a data (DD/MM/YYYY):");
                session.waitingFor = 'date_search';
                this.adminSessions.set(message.from, session);
                break;
            case '3':
                await this.human.sendHumanMessage(message, "Digite o nome do cliente:");
                session.waitingFor = 'client_search';
                this.adminSessions.set(message.from, session);
                break;
            case '4':
                await this.showCompleteReport(message);
                break;
            case '5':
                await this.human.sendHumanMessage(message, "Digite o período:\nDD/MM/YYYY - DD/MM/YYYY\nEx: 01/01/2026 - 31/01/2026");
                session.waitingFor = 'period_report';
                this.adminSessions.set(message.from, session);
                break;
            case '6':
                await this.human.sendHumanMessage(message, "Digite o ID do agendamento para cancelar:");
                session.waitingFor = 'cancel_booking';
                this.adminSessions.set(message.from, session);
                break;
            case '7':
                await this.human.sendHumanMessage(message, "Digite: DD/MM HH:MM\nEx: 15/01 14:30");
                session.waitingFor = 'block_time';
                this.adminSessions.set(message.from, session);
                break;
            case '8':
                await this.human.sendHumanMessage(message, "Digite: DD/MM HH:MM\nEx: 15/01 14:30");
                session.waitingFor = 'unblock_time';
                this.adminSessions.set(message.from, session);
                break;
            default:
                if (session.waitingFor) {
                    await this.handleBookingAction(message, input);
                } else {
                    await this.showBookingsMenu(message);
                }
        }
    }

    async handleServicesMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.currentMenu = 'main';
            this.adminSessions.set(message.from, session);
            await this.sendMainAdminMenu(message);
            return;
        }

        if (input.toUpperCase() === 'NOVO') {
            await this.human.sendHumanMessage(message, "Digite os dados do novo serviço:\nNOME|PREÇO\nEx: Corte Especial|R$ 45,00");
            session.waitingFor = 'new_service';
            this.adminSessions.set(message.from, session);
            return;
        }

        if (input.toUpperCase().startsWith('EDITAR ')) {
            const serviceId = parseInt(input.split(' ')[1]);
            await this.editService(message, serviceId);
            return;
        }

        if (input.toUpperCase().startsWith('PRECO ')) {
            const parts = input.split(' ');
            if (parts.length >= 3) {
                const serviceId = parseInt(parts[1]);
                const newPrice = parts.slice(2).join(' ');
                await this.updateServicePrice(message, serviceId, newPrice);
            } else {
                await this.human.sendHumanMessage(message, "❌ Formato inválido! Use: PRECO [ID] [VALOR]\nEx: PRECO 1 25.50");
            }
            return;
        }

        if (input.toUpperCase().startsWith('REMOVER ')) {
            const serviceId = parseInt(input.split(' ')[1]);
            await this.removeService(message, serviceId);
            return;
        }

        if (input.toUpperCase().startsWith('POPULAR ')) {
            const serviceId = parseInt(input.split(' ')[1]);
            await this.toggleServicePopular(message, serviceId);
            return;
        }

        // Se está esperando dados de novo serviço
        if (session.waitingFor === 'new_service' && input.includes('|')) {
            await this.addNewService(message, input);
            session.waitingFor = null;
            this.adminSessions.set(message.from, session);
            return;
        }

        // Se está esperando dados de edição
        if (session.waitingFor && session.waitingFor.startsWith('edit_service_')) {
            await this.handleServiceEdit(message, input);
            return;
        }

        await this.showServicesMenu(message);
    }

    async handleScheduleMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.currentMenu = 'main';
            this.adminSessions.set(message.from, session);
            await this.sendMainAdminMenu(message);
            return;
        }

        if (input.toUpperCase().startsWith('HORARIO ')) {
            await this.updateSchedule(message, input);
            return;
        }

        await this.showScheduleMenu(message);
    }

    async handleMessagesMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.currentMenu = 'main';
            this.adminSessions.set(message.from, session);
            await this.sendMainAdminMenu(message);
            return;
        }

        // Se está esperando nova mensagem
        if (session.waitingFor && session.waitingFor.startsWith('edit_message_')) {
            await this.updateMessage(message, input);
            return;
        }

        // Seleção do tipo de mensagem
        const messageTypes = ['welcome', 'thinking', 'success', 'error', 'cancel', 'strategic'];
        const selectedIndex = parseInt(input) - 1;
        
        if (selectedIndex >= 0 && selectedIndex < messageTypes.length) {
            const messageType = messageTypes[selectedIndex];
            await this.showMessageTypeEditor(message, messageType);
        } else {
            await this.showMessagesMenu(message);
        }
    }

    async showMessageTypeEditor(message, messageType) {
        const messages = Settings.get('messages');
        const typeMessages = messages[messageType] || [];
        
        const typeNames = {
            welcome: 'Boas-vindas',
            thinking: 'Pensando',
            success: 'Sucesso',
            error: 'Erro',
            cancel: 'Cancelamento',
            strategic: 'Estratégicas'
        };

        let menuText = `
💬 *MENSAGENS DE ${typeNames[messageType].toUpperCase()}*

*Mensagens atuais:*

`;

        typeMessages.forEach((msg, index) => {
            menuText += `${this.human.numberToEmoji(index + 1)} "${msg}"\n\n`;
        });

        menuText += `
*Opções:*
🆕 *NOVA* - Adicionar nova mensagem
✏️ *EDITAR [NÚMERO]* - Ex: EDITAR 1
❌ *REMOVER [NÚMERO]* - Ex: REMOVER 1
${this.human.numberToEmoji(0)} Voltar

Digite a opção:`;

        await this.human.sendHumanMessage(message, menuText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMessageType = messageType;
        session.waitingFor = `message_action_${messageType}`;
        this.adminSessions.set(message.from, session);
    }

    async handleMessageAction(message, input, messageType) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.waitingFor = null;
            session.currentMessageType = null;
            this.adminSessions.set(message.from, session);
            await this.showMessagesMenu(message);
            return;
        }

        if (input.toUpperCase() === 'NOVA') {
            await this.human.sendHumanMessage(message, "✏️ Digite a nova mensagem:");
            session.waitingFor = `new_message_${messageType}`;
            this.adminSessions.set(message.from, session);
            return;
        }

        if (input.toUpperCase().startsWith('EDITAR ')) {
            const messageIndex = parseInt(input.split(' ')[1]) - 1;
            const messages = Settings.get('messages');
            const typeMessages = messages[messageType] || [];
            
            if (messageIndex >= 0 && messageIndex < typeMessages.length) {
                await this.human.sendHumanMessage(message, `✏️ Mensagem atual:\n"${typeMessages[messageIndex]}"\n\nDigite a nova mensagem:`);
                session.waitingFor = `edit_message_${messageType}_${messageIndex}`;
                this.adminSessions.set(message.from, session);
            } else {
                await this.human.sendHumanMessage(message, "❌ Número inválido!");
                await this.showMessageTypeEditor(message, messageType);
            }
            return;
        }

        if (input.toUpperCase().startsWith('REMOVER ')) {
            const messageIndex = parseInt(input.split(' ')[1]) - 1;
            await this.removeMessage(message, messageType, messageIndex);
            return;
        }

        // Se chegou aqui, é uma ação inválida
        await this.showMessageTypeEditor(message, messageType);
    }

    async updateMessage(message, newMessage) {
        const session = this.adminSessions.get(message.from);
        const waitingFor = session.waitingFor;
        
        if (waitingFor.startsWith('new_message_')) {
            const messageType = waitingFor.replace('new_message_', '');
            Settings.addMessage(messageType, newMessage);
            await this.human.sendHumanMessage(message, "✅ Nova mensagem adicionada!");
            
        } else if (waitingFor.startsWith('edit_message_')) {
            const parts = waitingFor.replace('edit_message_', '').split('_');
            const messageType = parts[0];
            const messageIndex = parseInt(parts[1]);
            
            const messages = Settings.get('messages');
            messages[messageType][messageIndex] = newMessage;
            Settings.set('messages', messages);
            
            await this.human.sendHumanMessage(message, "✅ Mensagem atualizada!");
        }
        
        session.waitingFor = null;
        this.adminSessions.set(message.from, session);
        await this.showMessageTypeEditor(message, session.currentMessageType);
    }

    async removeMessage(message, messageType, messageIndex) {
        const messages = Settings.get('messages');
        const typeMessages = messages[messageType] || [];
        
        if (messageIndex >= 0 && messageIndex < typeMessages.length) {
            const removedMessage = typeMessages[messageIndex];
            typeMessages.splice(messageIndex, 1);
            Settings.set('messages', messages);
            
            await this.human.sendHumanMessage(message, `✅ Mensagem removida:\n"${removedMessage}"`);
            await this.showMessageTypeEditor(message, messageType);
        } else {
            await this.human.sendHumanMessage(message, "❌ Número inválido!");
            await this.showMessageTypeEditor(message, messageType);
        }
    }

    async handleBusinessMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.currentMenu = 'main';
            this.adminSessions.set(message.from, session);
            await this.sendMainAdminMenu(message);
            return;
        }

        await this.updateBusinessInfo(message, input);
    }

    async handlePasswordMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        if (input === '0') {
            session.currentMenu = 'main';
            this.adminSessions.set(message.from, session);
            await this.sendMainAdminMenu(message);
            return;
        }

        if (input.length < 6) {
            await this.human.sendHumanMessage(message, "❌ Senha deve ter pelo menos 6 caracteres!");
            return;
        }

        Settings.changePassword(input);
        await this.human.sendHumanMessage(message, "✅ Senha alterada com sucesso!");
        session.currentMenu = 'main';
        this.adminSessions.set(message.from, session);
        await this.sendMainAdminMenu(message);
    }

    async showWhatsAppStatus(message) {
        const isConnected = this.client.info ? true : false;
        const hasQR = !!global.currentQR;
        
        let statusText = `
📱 *STATUS DO WHATSAPP*

🔗 *Conexão:* ${isConnected ? '✅ Conectado' : '❌ Desconectado'}
📊 *Estado:* ${hasQR ? '⏳ Aguardando QR Code' : (isConnected ? '🟢 Funcionando' : '🔴 Offline')}
⏰ *Última verificação:* ${new Date().toLocaleString('pt-BR')}

`;

        if (hasQR) {
            statusText += `📱 *QR Code disponível em:*
🌐 http://localhost:${process.env.PORT || 3000}/qr

`;
        }

        statusText += `*Opções:*
${this.human.numberToEmoji(1)} 🔄 Forçar Reconexão
${this.human.numberToEmoji(2)} 📱 Ver QR Code (se disponível)
${this.human.numberToEmoji(3)} 📊 Status Detalhado
${this.human.numberToEmoji(0)} Voltar ao Menu Principal

Digite a opção:`;

        await this.human.sendHumanMessage(message, statusText);
        
        const session = this.adminSessions.get(message.from);
        session.currentMenu = 'whatsapp';
        this.adminSessions.set(message.from, session);
    }

    async handleWhatsAppMenu(message, input) {
        const session = this.adminSessions.get(message.from);
        
        switch (input) {
            case '0':
                session.currentMenu = 'main';
                this.adminSessions.set(message.from, session);
                await this.sendMainAdminMenu(message);
                break;
            case '1':
                await this.forceReconnection(message);
                break;
            case '2':
                await this.showQRInfo(message);
                break;
            case '3':
                await this.showDetailedStatus(message);
                break;
            default:
                await this.showWhatsAppStatus(message);
        }
    }

    async forceReconnection(message) {
        await this.human.sendHumanMessage(message, "🔄 Iniciando reconexão forçada...");
        
        try {
            // Tentar destruir cliente atual
            await this.client.destroy();
            
            setTimeout(() => {
                this.client.initialize();
            }, 3000);
            
            await this.human.sendHumanMessage(message, "✅ Reconexão iniciada! Aguarde alguns segundos e verifique o status novamente.");
            
        } catch (error) {
            console.error('Erro na reconexão:', error);
            
            // Força bruta - reinicializar diretamente
            this.client.initialize();
            
            await this.human.sendHumanMessage(message, "⚠️ Reconexão forçada iniciada. Verifique o status em alguns segundos.");
        }
        
        // Voltar ao menu WhatsApp
        setTimeout(() => {
            this.showWhatsAppStatus(message);
        }, 5000);
    }

    async showQRInfo(message) {
        if (!global.currentQR) {
            await this.human.sendHumanMessage(message, "❌ Nenhum QR Code disponível no momento.\n\nO WhatsApp pode já estar conectado ou em processo de conexão.");
            return;
        }
        
        const qrInfo = `
📱 *QR CODE DISPONÍVEL*

🌐 *Acesse pelo navegador:*
http://localhost:${process.env.PORT || 3000}/qr

📱 *Como escanear:*
1. Abra WhatsApp no celular
2. Vá em Configurações > Aparelhos Conectados
3. Toque em "Conectar um aparelho"
4. Escaneie o QR Code da tela

⏰ *Gerado em:* ${global.qrTimestamp ? global.qrTimestamp.toLocaleString('pt-BR') : 'Agora'}

💡 *Dica:* O QR Code expira em alguns minutos. Se não funcionar, force uma reconexão.`;

        await this.human.sendHumanMessage(message, qrInfo);
    }

    async showDetailedStatus(message) {
        const isConnected = this.client.info ? true : false;
        const hasQR = !!global.currentQR;
        
        let detailedStatus = `
📊 *STATUS DETALHADO*

🔗 *Conexão WhatsApp:*
${isConnected ? '✅ Conectado e funcionando' : '❌ Desconectado'}

📱 *Informações do Cliente:*`;

        if (this.client.info) {
            detailedStatus += `
📞 Número: ${this.client.info.wid.user}
📱 Plataforma: ${this.client.info.platform}
🔋 Bateria: ${this.client.info.battery}%`;
        } else {
            detailedStatus += `
❌ Cliente não conectado`;
        }

        detailedStatus += `

🌐 *Servidor Web:*
✅ Rodando na porta ${process.env.PORT || 3000}
🔗 Status: http://localhost:${process.env.PORT || 3000}/status
📱 QR Code: http://localhost:${process.env.PORT || 3000}/qr

📊 *Sistema:*
⏰ Uptime: ${process.uptime().toFixed(0)} segundos
💾 Memória: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
🤖 IA: Funcionando
📨 Lembretes: Ativos

${hasQR ? '⏳ QR Code aguardando escaneamento' : '🟢 Pronto para uso'}`;

        await this.human.sendHumanMessage(message, detailedStatus);
    }

    // Métodos auxiliares
    async addNewService(message, input) {
        try {
            const [name, price] = input.split('|');
            const newService = Settings.addService({
                name: name.trim(),
                price: price.trim(),
                popular: false
            });
            
            await this.human.sendHumanMessage(message, `✅ Serviço "${newService.name}" adicionado com ID ${newService.id}!`);
            await this.showServicesMenu(message);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Formato inválido! Use: NOME|PREÇO");
        }
    }

    async editService(message, serviceId) {
        const services = Settings.get('services');
        const service = services.find(s => s.id === serviceId);
        
        if (!service) {
            await this.human.sendHumanMessage(message, "❌ Serviço não encontrado!");
            return;
        }

        await this.human.sendHumanMessage(message, `Editando: ${service.name}\nDigite: NOME|PREÇO\nEx: Novo Nome|R$ 50,00`);
        
        const session = this.adminSessions.get(message.from);
        session.waitingFor = `edit_service_${serviceId}`;
        this.adminSessions.set(message.from, session);
    }

    async handleServiceEdit(message, input) {
        const session = this.adminSessions.get(message.from);
        const serviceId = parseInt(session.waitingFor.replace('edit_service_', ''));
        
        try {
            const [name, price] = input.split('|');
            Settings.updateService(serviceId, {
                name: name.trim(),
                price: price.trim()
            });
            
            await this.human.sendHumanMessage(message, `✅ Serviço ID ${serviceId} atualizado!`);
            session.waitingFor = null;
            this.adminSessions.set(message.from, session);
            await this.showServicesMenu(message);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Formato inválido! Use: NOME|PREÇO");
        }
    }

    async removeService(message, serviceId) {
        const services = Settings.get('services');
        const service = services.find(s => s.id === serviceId);
        
        if (service) {
            Settings.removeService(serviceId);
            await this.human.sendHumanMessage(message, `✅ Serviço "${service.name}" removido!`);
            await this.showServicesMenu(message);
        } else {
            await this.human.sendHumanMessage(message, "❌ Serviço não encontrado!");
        }
    }

    async updateServicePrice(message, serviceId, newPrice) {
        const services = Settings.get('services');
        const service = services.find(s => s.id === serviceId);
        
        if (!service) {
            await this.human.sendHumanMessage(message, "❌ Serviço não encontrado!");
            return;
        }

        try {
            // Validar e formatar o preço
            let price = parseFloat(newPrice.replace(',', '.'));
            
            if (isNaN(price) || price < 0) {
                await this.human.sendHumanMessage(message, "❌ Preço inválido! Use apenas números.\nEx: 25.50 ou 25,50");
                return;
            }

            // Garantir valor mínimo de 1 centavo
            if (price === 0) {
                price = 0.01;
                await this.human.sendHumanMessage(message, "⚠️ Valor ajustado para mínimo: R$ 0,01");
            }

            // Formatar preço para exibição
            const formattedPrice = `R$ ${price.toFixed(2).replace('.', ',')}`;
            
            // Atualizar o serviço
            Settings.updateService(serviceId, { price: formattedPrice });
            
            await this.human.sendHumanMessage(message, `✅ Preço do serviço "${service.name}" atualizado para ${formattedPrice}!`);
            
            // Mostrar menu atualizado
            await this.showServicesMenu(message);
            
        } catch (error) {
            console.error('Erro ao atualizar preço:', error);
            await this.human.sendHumanMessage(message, "❌ Erro ao atualizar preço. Tente novamente.");
        }
    }

    async toggleServicePopular(message, serviceId) {
        const services = Settings.get('services');
        const service = services.find(s => s.id === serviceId);
        
        if (service) {
            Settings.updateService(serviceId, { popular: !service.popular });
            const status = service.popular ? 'removido dos' : 'adicionado aos';
            await this.human.sendHumanMessage(message, `✅ Serviço "${service.name}" ${status} populares!`);
            await this.showServicesMenu(message);
        } else {
            await this.human.sendHumanMessage(message, "❌ Serviço não encontrado!");
        }
    }

    async updateSchedule(message, input) {
        try {
            const parts = input.split(' ');
            const dayOfWeek = parseInt(parts[1]);
            const periods = parts.slice(2);
            
            if (dayOfWeek < 0 || dayOfWeek > 6) {
                await this.human.sendHumanMessage(message, "❌ Dia inválido! Use 0-6 (0=Domingo, 1=Segunda...)");
                return;
            }

            const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
            
            if (periods.length === 0) {
                // Fechar o dia
                Settings.updateSchedule(dayOfWeek, {
                    name: dayNames[dayOfWeek],
                    periods: []
                });
                await this.human.sendHumanMessage(message, `✅ ${dayNames[dayOfWeek]} fechado!`);
            } else {
                // Configurar horários
                const schedulePeriods = [];
                periods.forEach(period => {
                    const [start, end] = period.split('-');
                    if (start && end) {
                        schedulePeriods.push({ start: start.trim(), end: end.trim() });
                    }
                });
                
                Settings.updateSchedule(dayOfWeek, {
                    name: dayNames[dayOfWeek],
                    periods: schedulePeriods
                });
                
                const periodsText = schedulePeriods.map(p => `${p.start}-${p.end}`).join(' | ');
                await this.human.sendHumanMessage(message, `✅ ${dayNames[dayOfWeek]}: ${periodsText}`);
            }
            
            await this.showScheduleMenu(message);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Formato inválido! Use: HORARIO [DIA] [INICIO-FIM] [INICIO-FIM]");
        }
    }



    async updateBusinessInfo(message, input) {
        try {
            const [command, ...valueParts] = input.split(' ');
            const value = valueParts.join(' ');
            
            const updates = {};
            
            switch (command.toUpperCase()) {
                case 'NOME':
                    updates.name = value;
                    break;
                case 'ENDERECO':
                    updates.address = value;
                    break;
                case 'CIDADE':
                    updates.city = value;
                    break;
                case 'CEP':
                    updates.cep = value;
                    break;
                case 'TELEFONE':
                    updates.phone = value;
                    break;
                default:
                    await this.human.sendHumanMessage(message, "❌ Comando inválido! Use: NOME, ENDERECO, CIDADE, CEP ou TELEFONE");
                    return;
            }
            
            Settings.updateBusinessInfo(updates);
            await this.human.sendHumanMessage(message, `✅ ${command.toUpperCase()} atualizado com sucesso!`);
            await this.showBusinessMenu(message);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Formato inválido!");
        }
    }

    async handleBookingAction(message, input) {
        const session = this.adminSessions.get(message.from);
        
        try {
            switch (session.waitingFor) {
                case 'cancel_booking':
                    await this.cancelBookingById(message, parseInt(input));
                    break;
                case 'block_time':
                    await this.blockTimeSlot(message, input);
                    break;
                case 'unblock_time':
                    await this.unblockTimeSlot(message, input);
                    break;
                case 'date_search':
                    await this.searchBookingsByDate(message, input);
                    break;
                case 'client_search':
                    await this.searchBookingsByClient(message, input);
                    break;
                case 'period_report':
                    await this.showPeriodReport(message, input);
                    break;
            }
            
            session.waitingFor = null;
            this.adminSessions.set(message.from, session);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Erro ao processar ação!");
        }
    }

    async searchBookingsByDate(message, dateInput) {
        try {
            const date = moment(dateInput, 'DD/MM/YYYY');
            if (!date.isValid()) {
                await this.human.sendHumanMessage(message, "❌ Data inválida! Use DD/MM/YYYY");
                return;
            }

            const formattedDate = date.format('YYYY-MM-DD');
            const bookings = await this.db.getBookingsByDate(formattedDate);
            
            if (bookings.length === 0) {
                await this.human.sendHumanMessage(message, `📅 Nenhum agendamento para ${dateInput}.`);
                return;
            }

            let bookingText = `📅 *AGENDAMENTOS DE ${dateInput}*\n\n`;
            
            bookings.forEach(booking => {
                const status = booking.status === 'confirmed' ? '✅' : 
                              booking.status === 'cancelled' ? '❌' : '⏳';
                
                const bookingDate = moment(booking.date).format('DD/MM/YYYY');
                
                bookingText += `${status} *ID: ${booking.id}*\n`;
                bookingText += `👤 ${booking.customer_name}\n`;
                bookingText += `✂️ ${booking.service_name}\n`;
                bookingText += `📅 Data Agendada: ${bookingDate}\n`;
                bookingText += `🕐 Horário: ${booking.time}\n`;
                bookingText += `📱 ${booking.user_id.replace('@c.us', '')}\n`;
                bookingText += `💳 Status: ${booking.status}\n\n`;
            });

            bookingText += `${this.human.numberToEmoji(0)} Voltar`;
            await this.human.sendHumanMessage(message, bookingText);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Erro ao buscar agendamentos por data!");
        }
    }

    async searchBookingsByClient(message, clientName) {
        try {
            const bookings = await this.db.searchBookingsByClient(clientName);
            
            if (bookings.length === 0) {
                await this.human.sendHumanMessage(message, `👤 Nenhum agendamento encontrado para "${clientName}".`);
                return;
            }

            let bookingText = `👤 *AGENDAMENTOS DE "${clientName.toUpperCase()}"*\n\n`;
            
            bookings.slice(0, 10).forEach(booking => {
                const status = booking.status === 'confirmed' ? '✅' : 
                              booking.status === 'cancelled' ? '❌' : '⏳';
                
                bookingText += `${status} *ID: ${booking.id}*\n`;
                bookingText += `👤 ${booking.customer_name}\n`;
                bookingText += `✂️ ${booking.service_name}\n`;
                bookingText += `📅 ${moment(booking.date).format('DD/MM/YYYY')}\n`;
                bookingText += `🕐 ${booking.time}\n`;
                bookingText += `📱 ${booking.user_id.replace('@c.us', '')}\n\n`;
            });

            if (bookings.length > 10) {
                bookingText += `... e mais ${bookings.length - 10} agendamentos\n\n`;
            }

            bookingText += `${this.human.numberToEmoji(0)} Voltar`;
            await this.human.sendHumanMessage(message, bookingText);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Erro ao buscar agendamentos por cliente!");
        }
    }

    async cancelBookingById(message, bookingId) {
        const booking = await this.db.getBookingById(bookingId);
        
        if (!booking) {
            await this.human.sendHumanMessage(message, "❌ Agendamento não encontrado!");
            return;
        }

        await this.db.updateBookingStatus(bookingId, 'cancelled');
        
        // Notificar cliente
        const clientText = `❌ *AGENDAMENTO CANCELADO PELO BARBEIRO*

Seu agendamento foi cancelado:
✂️ ${booking.service_name}
📅 ${moment(booking.date).format('DD/MM/YYYY')}
🕐 ${booking.time}

💰 O reembolso será processado em até 5 dias úteis.`;

        try {
            // 🚫 Não enviar notificações para grupos
            if (!booking.user_id.includes('@g.us')) {
                await this.client.sendMessage(booking.user_id, clientText);
            } else {
                console.log(`🚫 Notificação de cancelamento ignorada para grupo: ${booking.user_id}`);
            }
        } catch (error) {
            console.error('Erro ao notificar cliente:', error);
        }
        
        await this.human.sendHumanMessage(message, `✅ Agendamento ID ${bookingId} cancelado e cliente notificado!`);
    }

    async blockTimeSlot(message, input) {
        try {
            const [dateStr, timeStr] = input.split(' ');
            const date = moment(dateStr, 'DD/MM').year(moment().year());
            const formattedDate = date.format('YYYY-MM-DD');

            await this.db.blockTimeSlot(formattedDate, timeStr, 'Bloqueado pelo administrador');
            await this.human.sendHumanMessage(message, `✅ Horário ${dateStr} às ${timeStr} bloqueado!`);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Formato inválido! Use: DD/MM HH:MM");
        }
    }

    async unblockTimeSlot(message, input) {
        try {
            const [dateStr, timeStr] = input.split(' ');
            const date = moment(dateStr, 'DD/MM').year(moment().year());
            const formattedDate = date.format('YYYY-MM-DD');

            await this.db.unblockTimeSlot(formattedDate, timeStr);
            await this.human.sendHumanMessage(message, `✅ Horário ${dateStr} às ${timeStr} desbloqueado!`);
        } catch (error) {
            await this.human.sendHumanMessage(message, "❌ Formato inválido! Use: DD/MM HH:MM");
        }
    }

    async showTodayBookings(message) {
        // Usar data atual do sistema
        const today = moment().format('YYYY-MM-DD');
        const todayDisplay = moment().format('DD/MM/YYYY');
        
        console.log(`📅 Data atual do sistema: ${today} (${todayDisplay})`);
        console.log(`📅 Buscando agendamentos para hoje: ${today}`);
        
        const bookings = await this.db.getBookingsByDate(today);
        console.log(`📅 Encontrados ${bookings.length} agendamentos:`, bookings);
        
        if (bookings.length === 0) {
            await this.human.sendHumanMessage(message, `📅 Nenhum agendamento para hoje (${todayDisplay}).\n\n💡 *Dica:* Agendamentos confirmados aparecerão aqui automaticamente.`);
            return;
        }

        let bookingText = `📅 *AGENDAMENTOS DE HOJE (${todayDisplay})*\n\n`;
        
        bookings.forEach(booking => {
            const status = booking.status === 'confirmed' ? '✅' : 
                          booking.status === 'cancelled' ? '❌' : '⏳';
            
            // Formatar a data do agendamento
            const bookingDate = moment(booking.date).format('DD/MM/YYYY');
            
            bookingText += `${status} *ID: ${booking.id}*\n`;
            bookingText += `👤 ${booking.customer_name}\n`;
            bookingText += `✂️ ${booking.service_name}\n`;
            bookingText += `📅 Data Agendada: ${bookingDate}\n`;
            bookingText += `🕐 Horário: ${booking.time}\n`;
            bookingText += `📱 ${booking.user_id.replace('@c.us', '')}\n`;
            bookingText += `💳 Status: ${booking.status}\n\n`;
        });

        bookingText += `${this.human.numberToEmoji(0)} Voltar`;

        await this.human.sendHumanMessage(message, bookingText);
    }

    // 📊 SISTEMA DE RELATÓRIOS COMPLETOS
    async showCompleteReport(message) {
        await this.human.sendHumanMessage(message, "📊 Gerando relatório completo... Aguarde...");
        
        try {
            // Buscar todos os agendamentos
            const allBookings = await this.db.getAllBookings();
            
            if (!allBookings || allBookings.length === 0) {
                await this.human.sendHumanMessage(message, "📊 *RELATÓRIO COMPLETO*\n\n❌ Nenhum agendamento encontrado no sistema.");
                return;
            }

            // Organizar dados por data
            const bookingsByDate = {};
            const today = moment().format('YYYY-MM-DD');
            let totalBookings = 0;
            let confirmedBookings = 0;
            let cancelledBookings = 0;
            let pendingBookings = 0;
            let totalRevenue = 0;
            let confirmedRevenue = 0;

            allBookings.forEach(booking => {
                const bookingDate = moment(booking.date).format('YYYY-MM-DD');
                
                if (!bookingsByDate[bookingDate]) {
                    bookingsByDate[bookingDate] = [];
                }
                bookingsByDate[bookingDate].push(booking);
                
                totalBookings++;
                
                // Contar por status
                switch (booking.status) {
                    case 'confirmed':
                        confirmedBookings++;
                        confirmedRevenue += parseFloat(booking.total_amount || 0);
                        break;
                    case 'cancelled':
                        cancelledBookings++;
                        break;
                    default:
                        pendingBookings++;
                }
                
                totalRevenue += parseFloat(booking.total_amount || 0);
            });

            // Gerar relatório resumido
            let reportText = `📊 *RELATÓRIO COMPLETO DE AGENDAMENTOS*\n`;
            reportText += `📅 *Gerado em:* ${moment().format('DD/MM/YYYY HH:mm')}\n\n`;
            
            reportText += `📈 *RESUMO GERAL:*\n`;
            reportText += `• Total de Agendamentos: ${totalBookings}\n`;
            reportText += `• ✅ Confirmados: ${confirmedBookings}\n`;
            reportText += `• ❌ Cancelados: ${cancelledBookings}\n`;
            reportText += `• ⏳ Pendentes: ${pendingBookings}\n`;
            reportText += `• 💰 Receita Total: R$ ${totalRevenue.toFixed(2)}\n`;
            reportText += `• 💚 Receita Confirmada: R$ ${confirmedRevenue.toFixed(2)}\n\n`;

            // Agendamentos por data (próximos 7 dias)
            reportText += `📅 *PRÓXIMOS AGENDAMENTOS:*\n`;
            
            const sortedDates = Object.keys(bookingsByDate).sort();
            const futureDates = sortedDates.filter(date => date >= today).slice(0, 7);
            
            if (futureDates.length === 0) {
                reportText += `❌ Nenhum agendamento futuro encontrado.\n\n`;
            } else {
                futureDates.forEach(date => {
                    const dateBookings = bookingsByDate[date];
                    const dateFormatted = moment(date).format('DD/MM/YYYY');
                    const dayName = moment(date).format('dddd');
                    
                    reportText += `\n📅 *${dateFormatted} (${dayName})*\n`;
                    reportText += `   ${dateBookings.length} agendamento(s)\n`;
                    
                    dateBookings.forEach(booking => {
                        const status = booking.status === 'confirmed' ? '✅' : 
                                      booking.status === 'cancelled' ? '❌' : '⏳';
                        reportText += `   ${status} ${booking.time} - ${booking.customer_name}\n`;
                        reportText += `      ${booking.service_name} (R$ ${parseFloat(booking.total_amount || 0).toFixed(2)})\n`;
                    });
                });
            }

            await this.human.sendHumanMessage(message, reportText);
            
            // Enviar relatório detalhado se houver muitos agendamentos
            if (totalBookings > 10) {
                await this.sendDetailedReport(message, allBookings);
            }
            
        } catch (error) {
            console.error('Erro ao gerar relatório completo:', error);
            await this.human.sendHumanMessage(message, "❌ Erro ao gerar relatório. Tente novamente.");
        }
    }

    async sendDetailedReport(message, bookings) {
        await this.human.sendHumanMessage(message, "📋 Enviando relatório detalhado...");
        
        // Agrupar por status
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
        const pendingBookings = bookings.filter(b => b.status === 'pending');
        
        // Relatório de confirmados
        if (confirmedBookings.length > 0) {
            let confirmedText = `✅ *AGENDAMENTOS CONFIRMADOS (${confirmedBookings.length})*\n\n`;
            
            confirmedBookings.forEach(booking => {
                const bookingDate = moment(booking.date).format('DD/MM/YYYY');
                const createdDate = moment(booking.created_at).format('DD/MM/YYYY HH:mm');
                
                confirmedText += `🆔 *ID: ${booking.id}*\n`;
                confirmedText += `👤 Cliente: ${booking.customer_name}\n`;
                confirmedText += `📱 Telefone: ${booking.user_id.replace('@c.us', '')}\n`;
                confirmedText += `✂️ Serviço: ${booking.service_name}\n`;
                confirmedText += `📅 Data Agendada: ${bookingDate}\n`;
                confirmedText += `🕐 Horário: ${booking.time}\n`;
                confirmedText += `💰 Valor: R$ ${parseFloat(booking.total_amount || 0).toFixed(2)}\n`;
                confirmedText += `📝 Agendado em: ${createdDate}\n`;
                if (booking.payment_status) {
                    confirmedText += `💳 Pagamento: ${booking.payment_status}\n`;
                }
                confirmedText += `\n`;
            });
            
            await this.human.sendHumanMessage(message, confirmedText);
        }
        
        // Relatório de cancelados
        if (cancelledBookings.length > 0) {
            let cancelledText = `❌ *AGENDAMENTOS CANCELADOS (${cancelledBookings.length})*\n\n`;
            
            cancelledBookings.forEach(booking => {
                const bookingDate = moment(booking.date).format('DD/MM/YYYY');
                const createdDate = moment(booking.created_at).format('DD/MM/YYYY HH:mm');
                
                cancelledText += `🆔 *ID: ${booking.id}*\n`;
                cancelledText += `👤 Cliente: ${booking.customer_name}\n`;
                cancelledText += `📱 Telefone: ${booking.user_id.replace('@c.us', '')}\n`;
                cancelledText += `✂️ Serviço: ${booking.service_name}\n`;
                cancelledText += `📅 Data que seria: ${bookingDate}\n`;
                cancelledText += `🕐 Horário: ${booking.time}\n`;
                cancelledText += `💰 Valor: R$ ${parseFloat(booking.total_amount || 0).toFixed(2)}\n`;
                cancelledText += `📝 Agendado em: ${createdDate}\n`;
                cancelledText += `\n`;
            });
            
            await this.human.sendHumanMessage(message, cancelledText);
        }
        
        // Relatório de pendentes
        if (pendingBookings.length > 0) {
            let pendingText = `⏳ *AGENDAMENTOS PENDENTES (${pendingBookings.length})*\n\n`;
            
            pendingBookings.forEach(booking => {
                const bookingDate = moment(booking.date).format('DD/MM/YYYY');
                const createdDate = moment(booking.created_at).format('DD/MM/YYYY HH:mm');
                
                pendingText += `🆔 *ID: ${booking.id}*\n`;
                pendingText += `👤 Cliente: ${booking.customer_name}\n`;
                pendingText += `📱 Telefone: ${booking.user_id.replace('@c.us', '')}\n`;
                pendingText += `✂️ Serviço: ${booking.service_name}\n`;
                pendingText += `📅 Data: ${bookingDate}\n`;
                pendingText += `🕐 Horário: ${booking.time}\n`;
                pendingText += `💰 Valor: R$ ${parseFloat(booking.total_amount || 0).toFixed(2)}\n`;
                pendingText += `📝 Agendado em: ${createdDate}\n`;
                pendingText += `⚠️ *Ação necessária: Confirmar pagamento*\n`;
                pendingText += `\n`;
            });
            
            await this.human.sendHumanMessage(message, pendingText);
        }
    }

    async showPeriodReport(message, period) {
        try {
            // Parsear período
            const [startDateStr, endDateStr] = period.split(' - ');
            const startDate = moment(startDateStr, 'DD/MM/YYYY');
            const endDate = moment(endDateStr, 'DD/MM/YYYY');
            
            if (!startDate.isValid() || !endDate.isValid()) {
                await this.human.sendHumanMessage(message, "❌ Formato de data inválido! Use: DD/MM/YYYY - DD/MM/YYYY");
                return;
            }
            
            if (startDate.isAfter(endDate)) {
                await this.human.sendHumanMessage(message, "❌ Data inicial deve ser anterior à data final!");
                return;
            }
            
            await this.human.sendHumanMessage(message, `📊 Gerando relatório de ${startDate.format('DD/MM/YYYY')} até ${endDate.format('DD/MM/YYYY')}...`);
            
            // Buscar agendamentos do período
            const bookings = await this.db.getBookingsByPeriod(
                startDate.format('YYYY-MM-DD'),
                endDate.format('YYYY-MM-DD')
            );
            
            if (!bookings || bookings.length === 0) {
                await this.human.sendHumanMessage(message, 
                    `📊 *RELATÓRIO DO PERÍODO*\n` +
                    `📅 ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}\n\n` +
                    `❌ Nenhum agendamento encontrado neste período.`
                );
                return;
            }
            
            // Calcular estatísticas
            let totalBookings = bookings.length;
            let confirmedBookings = 0;
            let cancelledBookings = 0;
            let pendingBookings = 0;
            let totalRevenue = 0;
            let confirmedRevenue = 0;
            
            // Agrupar por data
            const bookingsByDate = {};
            
            bookings.forEach(booking => {
                const bookingDate = moment(booking.date).format('YYYY-MM-DD');
                
                if (!bookingsByDate[bookingDate]) {
                    bookingsByDate[bookingDate] = [];
                }
                bookingsByDate[bookingDate].push(booking);
                
                // Contar por status
                switch (booking.status) {
                    case 'confirmed':
                        confirmedBookings++;
                        confirmedRevenue += parseFloat(booking.total_amount || 0);
                        break;
                    case 'cancelled':
                        cancelledBookings++;
                        break;
                    default:
                        pendingBookings++;
                }
                
                totalRevenue += parseFloat(booking.total_amount || 0);
            });
            
            // Gerar relatório
            let reportText = `📊 *RELATÓRIO DO PERÍODO*\n`;
            reportText += `📅 ${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}\n`;
            reportText += `🕐 Gerado em: ${moment().format('DD/MM/YYYY HH:mm')}\n\n`;
            
            reportText += `📈 *RESUMO:*\n`;
            reportText += `• Total: ${totalBookings} agendamentos\n`;
            reportText += `• ✅ Confirmados: ${confirmedBookings}\n`;
            reportText += `• ❌ Cancelados: ${cancelledBookings}\n`;
            reportText += `• ⏳ Pendentes: ${pendingBookings}\n`;
            reportText += `• 💰 Receita Total: R$ ${totalRevenue.toFixed(2)}\n`;
            reportText += `• 💚 Receita Confirmada: R$ ${confirmedRevenue.toFixed(2)}\n\n`;
            
            // Detalhes por data
            reportText += `📅 *DETALHES POR DATA:*\n`;
            
            const sortedDates = Object.keys(bookingsByDate).sort();
            
            sortedDates.forEach(date => {
                const dateBookings = bookingsByDate[date];
                const dateFormatted = moment(date).format('DD/MM/YYYY');
                const dayName = moment(date).format('dddd');
                
                reportText += `\n📅 *${dateFormatted} (${dayName})*\n`;
                reportText += `   ${dateBookings.length} agendamento(s)\n`;
                
                dateBookings.forEach(booking => {
                    const status = booking.status === 'confirmed' ? '✅' : 
                                  booking.status === 'cancelled' ? '❌' : '⏳';
                    reportText += `   ${status} ${booking.time} - ${booking.customer_name}\n`;
                    reportText += `      ${booking.service_name} (R$ ${parseFloat(booking.total_amount || 0).toFixed(2)})\n`;
                });
            });
            
            await this.human.sendHumanMessage(message, reportText);
            
        } catch (error) {
            console.error('Erro ao gerar relatório por período:', error);
            await this.human.sendHumanMessage(message, "❌ Erro ao gerar relatório. Verifique o formato da data e tente novamente.");
        }
    }
}

module.exports = AdminPanel;