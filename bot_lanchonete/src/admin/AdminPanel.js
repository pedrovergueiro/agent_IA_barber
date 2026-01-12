const moment = require('moment');
moment.locale('pt-br');

const Settings = require('../config/settings');

class AdminPanel {
    constructor(client, database) {
        this.client = client;
        this.db = database;
        this.authenticatedAdmins = new Map(); // Armazena admins autenticados
        this.adminNumbers = (process.env.ADMIN_NUMBERS || '').split(',').filter(n => n.trim());
        this.adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    }

    async handleAdminLogin(message, messageText) {
        const userId = message.from;
        
        // Verificar se é um número de admin autorizado
        const userNumber = userId.replace('@c.us', '');
        const isAuthorizedAdmin = this.adminNumbers.some(adminNum => 
            adminNum.replace('@c.us', '') === userNumber
        );

        if (!isAuthorizedAdmin) {
            await message.reply('❌ Acesso negado. Você não tem permissão de administrador.');
            return;
        }

        await message.reply(`🔐 *PAINEL ADMINISTRATIVO*

Digite a senha de administrador:`);
        
        // Marcar que está aguardando senha
        this.authenticatedAdmins.set(userId, { awaitingPassword: true });
    }

    async handlePasswordAttempt(message) {
        const userId = message.from;
        const adminSession = this.authenticatedAdmins.get(userId);
        
        if (adminSession && adminSession.awaitingPassword) {
            const password = message.body.trim();
            
            if (password === this.adminPassword) {
                // Senha correta - autenticar admin
                this.authenticatedAdmins.set(userId, { 
                    authenticated: true, 
                    loginTime: new Date(),
                    awaitingPassword: false 
                });
                
                await this.showMainAdminMenu(message);
                return true;
            } else {
                // Senha incorreta
                await message.reply('❌ Senha incorreta. Tente novamente ou digite /admin para reiniciar.');
                this.authenticatedAdmins.delete(userId);
                return true;
            }
        }
        
        return false;
    }

    isAuthenticated(userId) {
        const adminSession = this.authenticatedAdmins.get(userId);
        return adminSession && adminSession.authenticated;
    }

    async handleAdminCommand(message) {
        const messageText = message.body.toLowerCase().trim();
        
        try {
            if (messageText === 'menu' || messageText === '0') {
                await this.showMainAdminMenu(message);
            } else if (messageText === '1' || messageText.includes('pedidos')) {
                await this.showOrdersMenu(message);
            } else if (messageText === '2' || messageText.includes('produtos')) {
                await this.showProductsMenu(message);
            } else if (messageText === '3' || messageText.includes('relatórios')) {
                await this.showReportsMenu(message);
            } else if (messageText === '4' || messageText.includes('configurações')) {
                await this.showSettingsMenu(message);
            } else if (messageText === 'sair' || messageText === 'logout') {
                await this.logout(message);
            } else if (messageText.startsWith('produto ')) {
                await this.handleProductCommand(message, messageText);
            } else if (messageText.startsWith('pedido ')) {
                await this.handleOrderCommand(message, messageText);
            } else {
                await this.showMainAdminMenu(message);
            }
        } catch (error) {
            console.error('Erro no painel admin:', error);
            await message.reply('❌ Erro interno. Tente novamente.');
        }
    }

    async showMainAdminMenu(message) {
        const stats = await this.db.getOrderStats();
        
        const menuText = `🔧 *PAINEL ADMINISTRATIVO*

📊 *Resumo de hoje:*
• Pedidos: ${stats.today_orders || 0}
• Faturamento: R$ ${(stats.today_revenue || 0).toFixed(2).replace('.', ',')}

📋 *Menu Principal:*

1️⃣ Gerenciar Pedidos
2️⃣ Gerenciar Produtos
3️⃣ Relatórios
4️⃣ Configurações

*Comandos rápidos:*
• Digite "sair" para sair do painel
• Digite "0" para voltar ao menu

Escolha uma opção:`;

        await message.reply(menuText);
    }

    async showOrdersMenu(message) {
        try {
            const orders = await this.db.getAllOrders(10);
            
            let ordersText = `📋 *GERENCIAR PEDIDOS*\n\n`;
            
            if (orders.length === 0) {
                ordersText += `Nenhum pedido encontrado.\n\n`;
            } else {
                ordersText += `*Últimos 10 pedidos:*\n\n`;
                
                orders.forEach(order => {
                    const date = moment(order.created_at).format('DD/MM HH:mm');
                    const statusEmoji = {
                        'pending': '⏳',
                        'confirmed': '✅',
                        'preparing': '👨‍🍳',
                        'delivering': '🚚',
                        'delivered': '✅',
                        'cancelled': '❌'
                    };
                    
                    ordersText += `🆔 *${order.id}* - ${date}\n`;
                    ordersText += `👤 ${order.customer_name}\n`;
                    ordersText += `${statusEmoji[order.status]} ${this.getStatusText(order.status)}\n`;
                    ordersText += `💰 R$ ${order.total_amount.toFixed(2).replace('.', ',')}\n\n`;
                });
            }
            
            ordersText += `*Comandos:*\n`;
            ordersText += `• pedido [ID] status [novo_status]\n`;
            ordersText += `• pedido [ID] detalhes\n\n`;
            ordersText += `*Status disponíveis:*\n`;
            ordersText += `pending, confirmed, preparing, delivering, delivered, cancelled\n\n`;
            ordersText += `0️⃣ Voltar ao Menu Principal`;

            await message.reply(ordersText);
            
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error);
            await message.reply('❌ Erro ao carregar pedidos.');
        }
    }

    async showProductsMenu(message) {
        try {
            const products = await this.db.getAllProducts();
            
            let productsText = `🍕 *GERENCIAR PRODUTOS*\n\n`;
            
            const categories = {};
            products.forEach(product => {
                if (!categories[product.category]) {
                    categories[product.category] = [];
                }
                categories[product.category].push(product);
            });
            
            Object.keys(categories).forEach(category => {
                const categoryNames = {
                    'lanches': '🍔 LANCHES',
                    'pizzas': '🍕 PIZZAS',
                    'bebidas': '🥤 BEBIDAS',
                    'porcoes': '🍟 PORÇÕES'
                };
                
                productsText += `*${categoryNames[category] || category.toUpperCase()}:*\n`;
                
                categories[category].forEach(product => {
                    const popularIcon = product.popular ? '🔥' : '';
                    productsText += `${product.id}. ${product.name} ${popularIcon}\n`;
                    productsText += `   R$ ${product.price.toFixed(2).replace('.', ',')} - ${product.available ? '✅' : '❌'}\n`;
                });
                productsText += `\n`;
            });
            
            productsText += `*Comandos disponíveis:*\n`;
            productsText += `• produto adicionar [nome] [preço] [categoria] [descrição]\n`;
            productsText += `• produto [ID] editar [campo] [valor]\n`;
            productsText += `• produto [ID] excluir\n`;
            productsText += `• produto [ID] popular [true/false]\n`;
            productsText += `• produto [ID] disponivel [true/false]\n\n`;
            productsText += `*Categorias:* lanches, pizzas, bebidas, porcoes\n\n`;
            productsText += `0️⃣ Voltar ao Menu Principal`;

            await message.reply(productsText);
            
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            await message.reply('❌ Erro ao carregar produtos.');
        }
    }

    async showReportsMenu(message) {
        try {
            const stats = await this.db.getOrderStats();
            const todayOrders = await this.db.getOrdersByDate(moment().format('YYYY-MM-DD'));
            
            let reportText = `📊 *RELATÓRIOS*\n\n`;
            
            reportText += `*📈 Estatísticas Gerais:*\n`;
            reportText += `• Total de pedidos: ${stats.total_orders || 0}\n`;
            reportText += `• Faturamento total: R$ ${(stats.total_revenue || 0).toFixed(2).replace('.', ',')}\n`;
            reportText += `• Ticket médio: R$ ${(stats.avg_order_value || 0).toFixed(2).replace('.', ',')}\n\n`;
            
            reportText += `*📅 Hoje (${moment().format('DD/MM/YYYY')}):*\n`;
            reportText += `• Pedidos: ${stats.today_orders || 0}\n`;
            reportText += `• Faturamento: R$ ${(stats.today_revenue || 0).toFixed(2).replace('.', ',')}\n\n`;
            
            if (todayOrders.length > 0) {
                reportText += `*🛒 Pedidos de hoje:*\n`;
                todayOrders.forEach(order => {
                    const time = moment(order.created_at).format('HH:mm');
                    reportText += `• ${order.id} - ${time} - ${order.customer_name} - R$ ${order.total_amount.toFixed(2).replace('.', ',')}\n`;
                });
            }
            
            reportText += `\n0️⃣ Voltar ao Menu Principal`;

            await message.reply(reportText);
            
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            await message.reply('❌ Erro ao gerar relatório.');
        }
    }

    async showSettingsMenu(message) {
        const business = Settings.get('businessInfo');
        
        const settingsText = `⚙️ *CONFIGURAÇÕES*

*Dados da Lanchonete:*
📛 Nome: ${business.name}
📍 Endereço: ${business.address}
🏙️ Cidade: ${business.city}
📞 Telefone: ${business.phone}

*Configurações de Delivery:*
🚚 Taxa de entrega: R$ ${process.env.DELIVERY_FEE || '5.00'}
📦 Pedido mínimo: R$ ${process.env.MIN_ORDER_VALUE || '15.00'}
🎁 Entrega grátis acima de: R$ ${process.env.FREE_DELIVERY_VALUE || '50.00'}
⏰ Tempo de entrega: ${process.env.DELIVERY_TIME || '30'} min

*Comandos:*
• Para alterar configurações, edite o arquivo .env
• Reinicie o bot após alterações

0️⃣ Voltar ao Menu Principal`;

        await message.reply(settingsText);
    }

    async handleProductCommand(message, command) {
        const parts = command.split(' ');
        
        try {
            if (parts[1] === 'adicionar') {
                // produto adicionar [nome] [preço] [categoria] [descrição]
                if (parts.length < 5) {
                    await message.reply('❌ Formato: produto adicionar [nome] [preço] [categoria] [descrição]');
                    return;
                }
                
                const name = parts[2];
                const price = parseFloat(parts[3]);
                const category = parts[4];
                const description = parts.slice(5).join(' ');
                
                if (isNaN(price)) {
                    await message.reply('❌ Preço deve ser um número válido.');
                    return;
                }
                
                const validCategories = ['lanches', 'pizzas', 'bebidas', 'porcoes'];
                if (!validCategories.includes(category)) {
                    await message.reply(`❌ Categoria deve ser uma das: ${validCategories.join(', ')}`);
                    return;
                }
                
                const product = await this.db.addProduct({
                    name,
                    description,
                    price,
                    category,
                    popular: 0
                });
                
                await message.reply(`✅ Produto "${name}" adicionado com sucesso! ID: ${product.id}`);
                
            } else if (!isNaN(parseInt(parts[1]))) {
                // Comandos com ID do produto
                const productId = parseInt(parts[1]);
                const action = parts[2];
                
                const product = await this.db.getProductById(productId);
                if (!product) {
                    await message.reply('❌ Produto não encontrado.');
                    return;
                }
                
                if (action === 'excluir') {
                    await this.db.deleteProduct(productId);
                    await message.reply(`✅ Produto "${product.name}" removido com sucesso!`);
                    
                } else if (action === 'popular') {
                    const isPopular = parts[3] === 'true' ? 1 : 0;
                    await this.db.updateProduct(productId, {
                        ...product,
                        popular: isPopular
                    });
                    await message.reply(`✅ Produto "${product.name}" ${isPopular ? 'marcado como popular' : 'removido dos populares'}!`);
                    
                } else if (action === 'disponivel') {
                    const isAvailable = parts[3] === 'true' ? 1 : 0;
                    await this.db.updateProduct(productId, {
                        ...product,
                        available: isAvailable
                    });
                    await message.reply(`✅ Produto "${product.name}" ${isAvailable ? 'disponibilizado' : 'indisponibilizado'}!`);
                    
                } else if (action === 'editar') {
                    // produto [ID] editar [campo] [valor]
                    const field = parts[3];
                    const value = parts.slice(4).join(' ');
                    
                    const validFields = ['name', 'description', 'price', 'category'];
                    if (!validFields.includes(field)) {
                        await message.reply(`❌ Campo deve ser um dos: ${validFields.join(', ')}`);
                        return;
                    }
                    
                    const updatedProduct = { ...product };
                    
                    if (field === 'price') {
                        const newPrice = parseFloat(value);
                        if (isNaN(newPrice)) {
                            await message.reply('❌ Preço deve ser um número válido.');
                            return;
                        }
                        updatedProduct.price = newPrice;
                    } else {
                        updatedProduct[field] = value;
                    }
                    
                    await this.db.updateProduct(productId, updatedProduct);
                    await message.reply(`✅ ${field} do produto "${product.name}" atualizado para: ${value}`);
                    
                } else {
                    await message.reply('❌ Ação não reconhecida. Use: excluir, popular, disponivel, editar');
                }
                
            } else {
                await message.reply('❌ Comando não reconhecido. Digite "2" para ver os comandos disponíveis.');
            }
            
        } catch (error) {
            console.error('Erro ao processar comando de produto:', error);
            await message.reply('❌ Erro ao processar comando.');
        }
    }

    async handleOrderCommand(message, command) {
        const parts = command.split(' ');
        
        try {
            if (parts.length < 3) {
                await message.reply('❌ Formato: pedido [ID] [ação]');
                return;
            }
            
            const orderId = parseInt(parts[1]);
            const action = parts[2];
            
            if (isNaN(orderId)) {
                await message.reply('❌ ID do pedido deve ser um número.');
                return;
            }
            
            const order = await this.db.getOrderById(orderId);
            if (!order) {
                await message.reply('❌ Pedido não encontrado.');
                return;
            }
            
            if (action === 'detalhes') {
                let detailsText = `📋 *DETALHES DO PEDIDO ${orderId}*\n\n`;
                detailsText += `👤 *Cliente:* ${order.customer_name}\n`;
                detailsText += `📱 *Telefone:* ${order.customer_phone.replace('@c.us', '')}\n`;
                detailsText += `📍 *Endereço:* ${order.customer_address}\n`;
                detailsText += `💳 *Pagamento:* ${order.payment_method}\n`;
                detailsText += `📅 *Data:* ${moment(order.created_at).format('DD/MM/YYYY HH:mm')}\n`;
                detailsText += `📊 *Status:* ${this.getStatusText(order.status)}\n\n`;
                
                detailsText += `🛒 *Itens:*\n`;
                order.items.forEach(item => {
                    detailsText += `• ${item.quantity}x ${item.name} - R$ ${item.subtotal.toFixed(2).replace('.', ',')}\n`;
                });
                
                detailsText += `\n💰 *Subtotal:* R$ ${(order.total_amount - order.delivery_fee).toFixed(2).replace('.', ',')}\n`;
                detailsText += `🚚 *Entrega:* R$ ${order.delivery_fee.toFixed(2).replace('.', ',')}\n`;
                detailsText += `💳 *Total:* R$ ${order.total_amount.toFixed(2).replace('.', ',')}\n`;
                
                if (order.notes) {
                    detailsText += `\n📝 *Observações:* ${order.notes}`;
                }
                
                await message.reply(detailsText);
                
            } else if (action === 'status') {
                const newStatus = parts[3];
                const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];
                
                if (!validStatuses.includes(newStatus)) {
                    await message.reply(`❌ Status deve ser um dos: ${validStatuses.join(', ')}`);
                    return;
                }
                
                await this.db.updateOrderStatus(orderId, newStatus);
                await message.reply(`✅ Status do pedido ${orderId} alterado para: ${this.getStatusText(newStatus)}`);
                
                // Notificar cliente sobre mudança de status
                const statusMessages = {
                    'confirmed': '✅ Seu pedido foi confirmado! Estamos preparando...',
                    'preparing': '👨‍🍳 Seu pedido está sendo preparado!',
                    'delivering': '🚚 Seu pedido saiu para entrega!',
                    'delivered': '✅ Pedido entregue! Obrigado pela preferência!',
                    'cancelled': '❌ Seu pedido foi cancelado. Entre em contato conosco.'
                };
                
                if (statusMessages[newStatus]) {
                    try {
                        await this.client.sendMessage(order.customer_phone, 
                            `🆔 *Pedido ${orderId}*\n\n${statusMessages[newStatus]}`
                        );
                    } catch (error) {
                        console.error('Erro ao notificar cliente:', error);
                    }
                }
                
            } else {
                await message.reply('❌ Ação não reconhecida. Use: detalhes, status');
            }
            
        } catch (error) {
            console.error('Erro ao processar comando de pedido:', error);
            await message.reply('❌ Erro ao processar comando.');
        }
    }

    async logout(message) {
        const userId = message.from;
        this.authenticatedAdmins.delete(userId);
        await message.reply('👋 Logout realizado com sucesso. Digite /admin para acessar novamente.');
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

module.exports = AdminPanel;