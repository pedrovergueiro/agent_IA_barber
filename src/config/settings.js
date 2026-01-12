const fs = require('fs');
const path = require('path');

class Settings {
    constructor() {
        // No Vercel, usar /tmp para arquivos temporários
        const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
        
        if (isVercel) {
            this.settingsPath = '/tmp/settings.json';
        } else {
            this.settingsPath = path.join(__dirname, '../../data/settings.json');
        }
        
        this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                this.settings = JSON.parse(data);
            } else {
                this.settings = this.getDefaultSettings();
                this.saveSettings();
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            this.settings = this.getDefaultSettings();
        }
    }

    getDefaultSettings() {
        return {
            adminPassword: "admin123",
            businessInfo: {
                name: "Paulinho Barbearia",
                address: "Rua Antônio Scodeler, 885 - Faisqueira",
                city: "Pouso Alegre/MG",
                cep: "37555-100",
                phone: "(35) 99999-9999"
            },
            messages: {
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
                ],
                cancel: [
                    "Tranquilo! 😊 Cancelei tudo aqui.",
                    "Sem problema! 👍 Tudo cancelado!",
                    "Tudo bem! 😄 Cancelamento feito!"
                ],
                strategic: [
                    "Mas ó, se quiser reagendar, temos umas opções bacanas! 😉",
                    "Aproveitando que tá aqui, que tal dar uma olhada nos horários livres? 👀",
                    "Já que cancelou, posso te mostrar outras opções disponíveis! 😊"
                ]
            },
            schedule: {
                1: { // Segunda
                    name: "Segunda-feira",
                    periods: [
                        { start: "09:00", end: "12:00" },
                        { start: "13:00", end: "20:00" }
                    ]
                },
                2: { // Terça
                    name: "Terça-feira", 
                    periods: [
                        { start: "09:00", end: "12:00" },
                        { start: "13:00", end: "14:00" }
                    ]
                },
                3: { // Quarta
                    name: "Quarta-feira",
                    periods: [
                        { start: "09:00", end: "12:00" },
                        { start: "13:00", end: "20:00" }
                    ]
                },
                4: { // Quinta
                    name: "Quinta-feira",
                    periods: [
                        { start: "09:00", end: "12:00" },
                        { start: "13:00", end: "20:00" }
                    ]
                },
                5: { // Sexta
                    name: "Sexta-feira",
                    periods: [
                        { start: "09:00", end: "12:00" },
                        { start: "13:00", end: "20:00" }
                    ]
                },
                6: { // Sábado
                    name: "Sábado",
                    periods: [
                        { start: "09:00", end: "12:00" },
                        { start: "12:00", end: "15:00" }
                    ]
                },
                0: { // Domingo
                    name: "Domingo",
                    periods: []
                }
            },
            services: [
                { id: 1, name: "Alizamento Botox", price: "A partir de: R$ 50,00", popular: false },
                { id: 2, name: "Barba", price: "R$ 25,00", popular: true },
                { id: 3, name: "Bigode", price: "R$ 10,00", popular: false },
                { id: 4, name: "Corte + Barba + Pigmentação", price: "R$ 75,00", popular: false },
                { id: 5, name: "Corte + Sobrancelha", price: "R$ 45,00", popular: false },
                { id: 6, name: "Corte + Alizamento Botox", price: "R$ 65,00", popular: false },
                { id: 7, name: "Corte Degradê", price: "A partir de: R$ 35,00", popular: true },
                { id: 8, name: "Corte Navalhado", price: "R$ 40,00", popular: false },
                { id: 9, name: "Corte + Pigmentação", price: "A partir de: R$ 60,00", popular: false },
                { id: 10, name: "Corte + Barba (Sobrancelha cortesia)", price: "R$ 60,00", popular: true },
                { id: 11, name: "Luzes (consultar valor)", price: "A partir de: R$ 0,00", popular: false },
                { id: 12, name: "Pacote Mensalista", price: "R$ 0,00", popular: false },
                { id: 13, name: "Platinado (consultar valor)", price: "A partir de: R$ 0,00", popular: false },
                { id: 14, name: "Sobrancelha", price: "R$ 10,00", popular: true }
            ]
        };
    }

    saveSettings() {
        try {
            const dir = path.dirname(this.settingsPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    updateBusinessInfo(info) {
        this.settings.businessInfo = { ...this.settings.businessInfo, ...info };
        this.saveSettings();
    }

    updateMessages(type, messages) {
        if (this.settings.messages[type]) {
            this.settings.messages[type] = messages;
            this.saveSettings();
        }
    }

    addMessage(type, message) {
        if (this.settings.messages[type]) {
            this.settings.messages[type].push(message);
            this.saveSettings();
        }
    }

    updateSchedule(dayOfWeek, schedule) {
        this.settings.schedule[dayOfWeek] = schedule;
        this.saveSettings();
    }

    updateService(serviceId, serviceData) {
        const index = this.settings.services.findIndex(s => s.id === serviceId);
        if (index !== -1) {
            this.settings.services[index] = { ...this.settings.services[index], ...serviceData };
            this.saveSettings();
        }
    }

    addService(serviceData) {
        const maxId = Math.max(...this.settings.services.map(s => s.id));
        const newService = {
            id: maxId + 1,
            ...serviceData
        };
        this.settings.services.push(newService);
        this.saveSettings();
        return newService;
    }

    removeService(serviceId) {
        this.settings.services = this.settings.services.filter(s => s.id !== serviceId);
        this.saveSettings();
    }

    changePassword(newPassword) {
        this.settings.adminPassword = newPassword;
        this.saveSettings();
    }

    verifyPassword(password) {
        return this.settings.adminPassword === password;
    }
}

module.exports = new Settings();