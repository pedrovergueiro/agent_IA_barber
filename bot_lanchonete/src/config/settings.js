const fs = require('fs');
const path = require('path');

class Settings {
    constructor() {
        this.settingsPath = path.join(__dirname, '../../data/settings.json');
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
            businessInfo: {
                name: process.env.LANCHONETE_NAME || "Lanchonete do João",
                address: process.env.LANCHONETE_ADDRESS || "Rua das Flores, 123 - Centro",
                city: process.env.LANCHONETE_CITY || "São Paulo/SP",
                phone: process.env.LANCHONETE_PHONE || "(11) 99999-9999"
            },
            deliveryConfig: {
                fee: parseFloat(process.env.DELIVERY_FEE || 5.00),
                minOrderValue: parseFloat(process.env.MIN_ORDER_VALUE || 15.00),
                freeDeliveryValue: parseFloat(process.env.FREE_DELIVERY_VALUE || 50.00),
                deliveryTime: parseInt(process.env.DELIVERY_TIME || 30)
            },
            schedule: {
                openTime: process.env.OPEN_TIME || "18:00",
                closeTime: process.env.CLOSE_TIME || "23:30",
                workDays: [1, 2, 3, 4, 5, 6, 0] // Segunda a Domingo
            }
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

    updateDeliveryConfig(config) {
        this.settings.deliveryConfig = { ...this.settings.deliveryConfig, ...config };
        this.saveSettings();
    }
}

module.exports = new Settings();