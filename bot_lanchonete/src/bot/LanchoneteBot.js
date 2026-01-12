const moment = require('moment');
moment.locale('pt-br');

const AdminPanel = require('../admin/AdminPanel');
const Settings = require('../config/settings');

class LanchoneteBot {
    constructor(client, database) {
        this.client = client;
        this.db = database;
        this.userSessions = new Map(); // Armazena sessões dos usuários
        this.adminNumbers = (process.env.ADMIN_NUMBERS || '').split(',').filter(n => n.trim());
        this.adminPanel = new AdminPanel(client, database); // Painel administrativo
    }

    async handleMessage(message) {
        const userId = message.from;
        const messageText = message.body.toLowerCase().trim();
        
        // 🚫 IGNORAR GRUPOS - Só responder em conversas privadas
        if (message.from.includes('@g.us')) {
            console.log(`🚫 Mensagem ignorada de grupo: ${message.from}`);
            return;
        }

        // Verificar comandos de admin primeiro
        if (messageText === '/admin') {
            await this.adminPanel.handleAdminLogin(message, messageText);
            return;
        }

        // Verificar se é tentativa de senha de admin
        if (await this.adminPanel.handlePasswordAttempt(message)) {
            return;
        }

        // Verificar se é comando de admin autenticado
        if (this.adminPanel.isAuthenticated(userId)) {
            await this.adminPanel.handleAdminCommand(message);
            return;
        }

        // Comando global para voltar ao menu principal
        if (messageText === '0' || messageText.toLowerCase().includes('voltar ao menu')) {
            await this.sendWelcomeMessage(message);
            this.userSessions.set(userId, { step: 'menu', userId: userId, cart: [] });
            return;
        }

        // Obter ou criar sessão do usuário
        let session = this.userSessions.get(userId) || {
            step: 'welcome',
            cart: [],
            customerName: null,
            customerAddress: null,
            paymentMethod: null,
            userId: userId
        };

        try {
            switch (session.step) {
                case 'welcome':
                    await this.sendWelcomeMessage(message);
                    session.step = 'menu';
                    break;

                case 'menu':
                    if (messageText.includes('cardápio') || messageText.includes('1')) {
                        await this.sendCategoryMenu(message);
                        session.step = 'selecting_category';
                    } else if (messageText.includes('carrinho') || messageText.includes('2')) {
                        await this.showCart(message, session);
                    } else if (messageText.includes('pedidos') || messageText.includes('3')) {
                        await this.showMyOrders(message);
                    } else if (messageText.includes('contato') || messageText.includes('4')) {
                        await this.sendContactInfo(message);
                    } else if (messageText === '0' || messageText.includes('voltar')) {
                        await this.sendWelcomeMessage(message);
                        session.step = 'menu';
                    } else {
                        await this.sendMenuOptions(message);
                    }
                    break;

                case 'selecting_category':
                    const category = this.extractCategory(messageText);
                    if (category === 'back') {
                        await this.sendWelcomeMessage(message);
                        session.step = 'menu';
                    } else if (category) {
                        session.selectedCategory = category;
                        await this.sendProductsMenu(message, category);
                        session.step = 'selecting_product';
                    } else {
                        await this.sendCategoryMenu(message);
                    }
                    break;

                case 'selecting_product':
                    const productId = this.extractProductId(messageText);
                    if (productId === 'back') {
                        await this.sendCategoryMenu(message);
                        session.step = 'selecting_category';
                    } else if (productId) {
                        const product = await this.db.getProductById(productId);
                        if (product) {
                            await this.showProductDetails(message, product);
                            session.selectedProduct = product;
                            session.step = 'product_details';
                        } else {
                            await message.reply("❌ Produto não encontrado. Tente novamente.");
                            await this.sendProductsMenu(message, session.selectedCategory);
                        }
                    } else {
                        await this.sendProductsMenu(message, session.selectedCategory);
                    }
                    break;

                case 'product_details':
                    if (messageText.includes('adicionar') || messageText.includes('1')) {
                        await this.addToCart(message, session);
                        session.step = 'menu';
                    } else if (messageText.includes('voltar') || messageText.includes('2')) {
                        await this.sendProductsMenu(message, session.selectedCategory);
                        session.step = 'selecting_product';
                    } else {
                        await this.showProductDetails(message, session.selectedProduct);
                    }
                    break;

                case 'checkout_name':
                    session.customerName = message.body.trim();
                    await this.requestAddress(message);
                    session.step = 'checkout_address';
                    break;

                case 'checkout_address':
                    session.customerAddress = message.body.trim();
                    await this.requestPaymentMethod(message);
                    session.step = 'checkout_payment';
                    break;

                case 'checkout_payment':
                    session.paymentMethod = message.body.trim();
                    await this.confirmOrder(message, session);
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
        
        const welcomeMessages = [
            `Olá! Bem-vindo à ${business.name}! 🍕`,
            `Oi! Que bom te ver aqui! 👋`,
            `E aí! Pronto para fazer seu pedido? 😄`,
            `Opa! Chegou com fome? 🤤`
        ];
        
        const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        const welcomeText = `${randomWelcome}

🍕 *${business.name}*
📍 ${business.address}
📞 ${business.phone}
🕐 Funcionamos das 18:00 às 23:30

O que você gostaria de fazer?`;

        const buttons = [
            {
                buttonId: 'menu_1',
                buttonText: { displayText: '🍕 Ver Cardápio' },
                type: 1
            },
            {
                buttonId: 'menu_2',
                buttonText: { displayText: '🛒 Meu Carrinho' },
                type: 1
            },
            {
                buttonId: 'menu_3',
                buttonText: { displayText: '📋 Meus Pedidos' },
                type: 1
            },
            {
                buttonId: 'menu_4',
                buttonText: { displayText: '📞 Contato' },
                type: 1
            }
        ];

        const buttonMessage = {
            text: welcomeText,
            buttons: buttons,
            headerType: 1
        };

        try {
            await this.client.sendMessage(message.from, buttonMessage);
        } catch (error) {
            // Fallback para texto simples
            const fallbackText = welcomeText + `

1️⃣ Ver Cardápio
2️⃣ Meu Carrinho
3️⃣ Meus Pedidos
4️⃣ Contato

Digite o número da opção! 👆`;
            
            await message.reply(fallbackText);
        }
    }

    async sendMenuOptions(message) {
        const menuText = `
🍕 *Menu Principal*

1️⃣ Ver Cardápio
2️⃣ Meu Carrinho
3️⃣ Meus Pedidos
4️⃣ Contato

Digite o número da opção desejada! 👆`;

        await message.reply(menuText);
    }

    async sendCategoryMenu(message) {
        const categoryText = `
🍕 *NOSSO CARDÁPIO*

Escolha uma categoria:

1️⃣ 🍔 Lanches
2️⃣ 🍕 Pizzas
3️⃣ 🥤 Bebidas
4️⃣ 🍟 Porções

0️⃣ Voltar ao Menu Principal

Digite o número da categoria! 👆`;

        await message.reply(categoryText);
    }

    async sendProductsMenu(message, category) {
        try {
            const products = await this.db.getProductsByCategory(category);
            
            if (products.length === 0) {
                await message.reply("❌ Nenhum produto disponível nesta categoria no momento.");
                return;
            }

            const categoryNames = {
                'lanches': '🍔 LANCHES',
                'pizzas': '🍕 PIZZAS',
                'bebidas': '🥤 BEBIDAS',
                'porcoes': '🍟 PORÇÕES'
            };

            let productsText = `${categoryNames[category] || category.toUpperCase()}\n\n`;

            // Mostrar produtos populares primeiro
            const popularProducts = products.filter(p => p.popular);
            const otherProducts = products.filter(p => !p.popular);

            if (popularProducts.length > 0) {
                productsText += `🔥 *MAIS PEDIDOS:*\n\n`;
                popularProducts.forEach(product => {
                    productsText += `${product.id}️⃣ *${product.name}* 🔥\n`;
                    productsText += `💰 R$ ${product.price.toFixed(2).replace('.', ',')}\n`;
                    if (product.description) {
                        productsText += `📝 ${product.description}\n`;
                    }
                    productsText += `\n`;
                });
            }

            if (otherProducts.length > 0) {
                if (popularProducts.length > 0) {
                    productsText += `✨ *OUTROS PRODUTOS:*\n\n`;
                }
                
                otherProducts.forEach(product => {
                    productsText += `${product.id}️⃣ *${product.name}*\n`;
                    productsText += `💰 R$ ${product.price.toFixed(2).replace('.', ',')}\n`;
                    if (product.description) {
                        productsText += `📝 ${product.description}\n`;
                    }
                    productsText += `\n`;
                });
            }

            productsText += `0️⃣ Voltar às Categorias\n\nDigite o número do produto para ver detalhes! 👆`;

            await message.reply(productsText);

        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            await message.reply("❌ Erro ao carregar produtos. Tente novamente.");
        }
    }

    async showProductDetails(message, product) {
        const productText = `
🍕 *${product.name}*

📝 *Descrição:*
${product.description || 'Produto delicioso da nossa lanchonete!'}

💰 *Preço:* R$ ${product.price.toFixed(2).replace('.', ',')}

O que você gostaria de fazer?

1️⃣ Adicionar ao Carrinho
2️⃣ Voltar aos Produtos

Digite sua opção! 👆`;

        await message.reply(productText);
    }

    async addToCart(message, session) {
        const product = session.selectedProduct;
        
        // Verificar se o produto já está no carrinho
        const existingItem = session.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.subtotal = existingItem.quantity * existingItem.price;
        } else {
            session.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                subtotal: product.price
            });
        }

        const successMessages = [
            `✅ ${product.name} adicionado ao carrinho!`,
            `🛒 Produto adicionado com sucesso!`,
            `👍 ${product.name} está no seu carrinho!`
        ];

        const successMessage = successMessages[Math.floor(Math.random() * successMessages.length)];
        
        await message.reply(`${successMessage}

🛒 *Carrinho atual:* ${session.cart.length} ${session.cart.length === 1 ? 'item' : 'itens'}

Quer continuar comprando ou finalizar o pedido?

1️⃣ Continuar Comprando
2️⃣ Ver Carrinho
3️⃣ Finalizar Pedido

Digite sua opção! 👆`);
    }

    async showCart(message, session) {
        if (session.cart.length === 0) {
            await message.reply(`🛒 *Seu carrinho está vazio!*

Que tal dar uma olhada no nosso cardápio?

1️⃣ Ver Cardápio
0️⃣ Menu Principal`);
            return;
        }

        let cartText = `🛒 *SEU CARRINHO*\n\n`;
        let total = 0;

        session.cart.forEach((item, index) => {
            cartText += `${index + 1}. *${item.name}*\n`;
            cartText += `   Qtd: ${item.quantity}x R$ ${item.price.toFixed(2).replace('.', ',')}\n`;
            cartText += `   Subtotal: R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n\n`;
            total += item.subtotal;
        });

        const deliveryFee = parseFloat(process.env.DELIVERY_FEE || 5.00);
        const minOrderValue = parseFloat(process.env.MIN_ORDER_VALUE || 15.00);
        const freeDeliveryValue = parseFloat(process.env.FREE_DELIVERY_VALUE || 50.00);

        cartText += `💰 *Subtotal:* R$ ${total.toFixed(2).replace('.', ',')}\n`;
        
        if (total >= freeDeliveryValue) {
            cartText += `🚚 *Entrega:* GRÁTIS! 🎉\n`;
        } else {
            cartText += `🚚 *Taxa de entrega:* R$ ${deliveryFee.toFixed(2).replace('.', ',')}\n`;
            total += deliveryFee;
        }
        
        cartText += `💳 *Total:* R$ ${total.toFixed(2).replace('.', ',')}\n\n`;

        if (total < minOrderValue) {
            cartText += `⚠️ *Pedido mínimo:* R$ ${minOrderValue.toFixed(2).replace('.', ',')}\n`;
            cartText += `Adicione mais R$ ${(minOrderValue - (total - deliveryFee)).toFixed(2).replace('.', ',')} para finalizar!\n\n`;
        }

        cartText += `O que você gostaria de fazer?\n\n`;
        cartText += `1️⃣ Continuar Comprando\n`;
        if (total >= minOrderValue) {
            cartText += `2️⃣ Finalizar Pedido\n`;
        }
        cartText += `3️⃣ Limpar Carrinho\n`;
        cartText += `0️⃣ Menu Principal`;

        await message.reply(cartText);
    }

    async requestCustomerName(message) {
        await message.reply(`📝 *FINALIZAR PEDIDO*

Para continuar, preciso de algumas informações:

*Qual é o seu nome completo?*`);
    }

    async requestAddress(message) {
        await message.reply(`📍 *ENDEREÇO DE ENTREGA*

Por favor, informe seu endereço completo:

*Exemplo:*
Rua das Flores, 123 - Centro
Próximo ao mercado São João`);
    }

    async requestPaymentMethod(message) {
        await message.reply(`💳 *FORMA DE PAGAMENTO*

Como você gostaria de pagar?

1️⃣ Dinheiro (informar troco)
2️⃣ PIX
3️⃣ Cartão na entrega

Digite o número ou descreva como prefere pagar:`);
    }

    async confirmOrder(message, session) {
        try {
            let total = 0;
            session.cart.forEach(item => {
                total += item.subtotal;
            });

            const deliveryFee = parseFloat(process.env.DELIVERY_FEE || 5.00);
            const freeDeliveryValue = parseFloat(process.env.FREE_DELIVERY_VALUE || 50.00);
            
            const finalDeliveryFee = total >= freeDeliveryValue ? 0 : deliveryFee;
            const finalTotal = total + finalDeliveryFee;

            // Salvar pedido no banco
            const orderData = {
                customer_phone: message.from,
                customer_name: session.customerName,
                customer_address: session.customerAddress,
                items: session.cart,
                total_amount: finalTotal,
                delivery_fee: finalDeliveryFee,
                payment_method: session.paymentMethod,
                notes: ''
            };

            const order = await this.db.createOrder(orderData);

            // Salvar endereço do cliente
            await this.db.saveCustomerAddress(message.from, session.customerAddress, '', '');

            let confirmText = `✅ *PEDIDO CONFIRMADO!*\n\n`;
            confirmText += `🆔 *Número do pedido:* ${order.id}\n`;
            confirmText += `👤 *Nome:* ${session.customerName}\n`;
            confirmText += `📍 *Endereço:* ${session.customerAddress}\n`;
            confirmText += `💳 *Pagamento:* ${session.paymentMethod}\n\n`;

            confirmText += `🛒 *ITENS DO PEDIDO:*\n`;
            session.cart.forEach(item => {
                confirmText += `• ${item.quantity}x ${item.name} - R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
            });

            confirmText += `\n💰 *Subtotal:* R$ ${total.toFixed(2).replace('.', ',')}\n`;
            if (finalDeliveryFee > 0) {
                confirmText += `🚚 *Entrega:* R$ ${finalDeliveryFee.toFixed(2).replace('.', ',')}\n`;
            } else {
                confirmText += `🚚 *Entrega:* GRÁTIS! 🎉\n`;
            }
            confirmText += `💳 *Total:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n\n`;

            const deliveryTime = process.env.DELIVERY_TIME || 30;
            confirmText += `⏰ *Tempo de entrega:* ${deliveryTime} minutos\n\n`;
            confirmText += `Obrigado pela preferência! 🙏`;

            await message.reply(confirmText);

            // Notificar administradores
            const adminText = `🆕 *NOVO PEDIDO!*\n\n`;
            adminText += `🆔 *Pedido:* ${order.id}\n`;
            adminText += `👤 *Cliente:* ${session.customerName}\n`;
            adminText += `📱 *Telefone:* ${message.from.replace('@c.us', '')}\n`;
            adminText += `📍 *Endereço:* ${session.customerAddress}\n`;
            adminText += `💳 *Pagamento:* ${session.paymentMethod}\n`;
            adminText += `💰 *Total:* R$ ${finalTotal.toFixed(2).replace('.', ',')}\n\n`;
            adminText += `🛒 *Itens:*\n`;
            session.cart.forEach(item => {
                adminText += `• ${item.quantity}x ${item.name}\n`;
            });

            // Enviar para administradores
            for (const adminNumber of this.adminNumbers) {
                try {
                    if (!adminNumber.includes('@g.us')) {
                        await this.client.sendMessage(adminNumber, adminText);
                    }
                } catch (error) {
                    console.error('Erro ao notificar admin:', error);
                }
            }

            // Limpar carrinho
            session.cart = [];
            session.customerName = null;
            session.customerAddress = null;
            session.paymentMethod = null;
            session.step = 'menu';

        } catch (error) {
            console.error('Erro ao confirmar pedido:', error);
            await message.reply('❌ Erro ao processar pedido. Tente novamente.');
        }
    }

    async showMyOrders(message) {
        try {
            const orders = await this.db.getOrdersByCustomer(message.from, 5);
            
            if (orders.length === 0) {
                await message.reply(`📋 *MEUS PEDIDOS*

Você ainda não fez nenhum pedido conosco.

Que tal dar uma olhada no nosso cardápio?

1️⃣ Ver Cardápio
0️⃣ Menu Principal`);
                return;
            }

            let ordersText = `📋 *SEUS ÚLTIMOS PEDIDOS*\n\n`;

            orders.forEach(order => {
                const date = moment(order.created_at).format('DD/MM/YYYY HH:mm');
                const statusEmoji = {
                    'pending': '⏳',
                    'confirmed': '✅',
                    'preparing': '👨‍🍳',
                    'delivering': '🚚',
                    'delivered': '✅',
                    'cancelled': '❌'
                };

                ordersText += `🆔 *Pedido ${order.id}*\n`;
                ordersText += `📅 ${date}\n`;
                ordersText += `${statusEmoji[order.status] || '⏳'} Status: ${this.getStatusText(order.status)}\n`;
                ordersText += `💰 Total: R$ ${order.total_amount.toFixed(2).replace('.', ',')}\n`;
                ordersText += `🛒 ${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}\n\n`;
            });

            ordersText += `0️⃣ Menu Principal`;

            await message.reply(ordersText);

        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            await message.reply("❌ Erro ao carregar seus pedidos. Tente novamente.");
        }
    }

    async sendContactInfo(message) {
        const business = Settings.get('businessInfo');
        
        const contactText = `
📞 *CONTATO E INFORMAÇÕES*

🍕 *${business.name}*
📍 ${business.address}
🏙️ ${business.city}
📞 ${business.phone}

🕐 *Horário de funcionamento:*
Segunda a Domingo: 18:00 às 23:30

🚚 *Delivery:*
Taxa: R$ 5,00
Grátis acima de R$ 50,00
Pedido mínimo: R$ 15,00

💳 *Formas de pagamento:*
• Dinheiro
• PIX
• Cartão na entrega

*Digite 0 para voltar ao menu principal*`;

        await message.reply(contactText);
    }

    // ========== MÉTODOS AUXILIARES ==========

    extractCategory(text) {
        const match = text.match(/(\d+)/);
        const number = match ? parseInt(match[1]) : null;
        
        if (number === 0) return 'back';
        
        const categories = {
            1: 'lanches',
            2: 'pizzas',
            3: 'bebidas',
            4: 'porcoes'
        };
        
        return categories[number] || null;
    }

    extractProductId(text) {
        const match = text.match(/(\d+)/);
        const number = match ? parseInt(match[1]) : null;
        
        if (number === 0) return 'back';
        
        return number;
    }

    getStatusText(status) {
        const statusTexts = {
            'pending': 'Pendente',
            'confirmed': 'Confirmado',
            'preparing': 'Preparando',
            'delivering': 'Saiu para entrega',
            'delivered': 'Entregue',
            'cancelled': 'Cancelado'
        };
        
        return statusTexts[status] || 'Desconhecido';
    }
}

module.exports = LanchoneteBot;