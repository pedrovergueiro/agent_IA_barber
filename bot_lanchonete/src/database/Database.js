const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // Criar diretório data se não existir
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        this.dbPath = path.join(dataDir, 'lanchonete.db');
        console.log('📁 Database path:', this.dbPath);
        
        this.db = new sqlite3.Database(this.dbPath);
        this.initDatabase();
    }

    initDatabase() {
        // Tabela de produtos (lanches, pizzas, bebidas, etc.)
        this.db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                category TEXT NOT NULL,
                available BOOLEAN DEFAULT 1,
                popular BOOLEAN DEFAULT 0,
                image_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de pedidos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_phone TEXT NOT NULL,
                customer_name TEXT NOT NULL,
                customer_address TEXT,
                items TEXT NOT NULL,
                total_amount REAL NOT NULL,
                delivery_fee REAL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                payment_method TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de itens do pedido
        this.db.run(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                product_name TEXT NOT NULL,
                product_price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                subtotal REAL NOT NULL,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES orders (id),
                FOREIGN KEY (product_id) REFERENCES products (id)
            )
        `);

        // Tabela de endereços de clientes
        this.db.run(`
            CREATE TABLE IF NOT EXISTS customer_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_phone TEXT NOT NULL,
                address TEXT NOT NULL,
                neighborhood TEXT,
                reference TEXT,
                is_default BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Inserir produtos padrão se não existirem
        this.insertDefaultProducts();
        
        console.log('✅ Banco de dados da lanchonete inicializado');
    }

    insertDefaultProducts() {
        this.db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
            if (err) {
                console.error('Erro ao verificar produtos:', err);
                return;
            }

            if (row.count === 0) {
                console.log('📦 Inserindo produtos padrão...');
                
                const defaultProducts = [
                    // LANCHES
                    { name: 'X-Burger', description: 'Hambúrguer, queijo, alface, tomate', price: 15.00, category: 'lanches', popular: 1 },
                    { name: 'X-Salada', description: 'Hambúrguer, queijo, alface, tomate, milho', price: 18.00, category: 'lanches', popular: 1 },
                    { name: 'X-Bacon', description: 'Hambúrguer, queijo, bacon, alface, tomate', price: 20.00, category: 'lanches', popular: 1 },
                    { name: 'X-Tudo', description: 'Hambúrguer, queijo, bacon, ovo, alface, tomate, milho', price: 25.00, category: 'lanches', popular: 1 },
                    { name: 'Misto Quente', description: 'Presunto e queijo no pão de forma', price: 8.00, category: 'lanches', popular: 0 },
                    { name: 'Bauru', description: 'Presunto, queijo, tomate, orégano', price: 12.00, category: 'lanches', popular: 0 },
                    { name: 'Americano', description: 'Hambúrguer, queijo, presunto, ovo, alface, tomate', price: 22.00, category: 'lanches', popular: 0 },
                    
                    // PIZZAS
                    { name: 'Pizza Margherita', description: 'Molho de tomate, mussarela, manjericão', price: 35.00, category: 'pizzas', popular: 1 },
                    { name: 'Pizza Calabresa', description: 'Molho de tomate, mussarela, calabresa, cebola', price: 38.00, category: 'pizzas', popular: 1 },
                    { name: 'Pizza Portuguesa', description: 'Presunto, mussarela, ovo, cebola, azeitona', price: 42.00, category: 'pizzas', popular: 1 },
                    { name: 'Pizza Frango Catupiry', description: 'Frango desfiado, catupiry, milho', price: 40.00, category: 'pizzas', popular: 1 },
                    { name: 'Pizza Quatro Queijos', description: 'Mussarela, parmesão, gorgonzola, catupiry', price: 45.00, category: 'pizzas', popular: 0 },
                    { name: 'Pizza Pepperoni', description: 'Molho de tomate, mussarela, pepperoni', price: 43.00, category: 'pizzas', popular: 0 },
                    { name: 'Pizza Vegetariana', description: 'Abobrinha, berinjela, pimentão, cebola, azeitona', price: 39.00, category: 'pizzas', popular: 0 },
                    
                    // BEBIDAS
                    { name: 'Coca-Cola 350ml', description: 'Refrigerante de cola gelado', price: 5.00, category: 'bebidas', popular: 1 },
                    { name: 'Guaraná 350ml', description: 'Refrigerante de guaraná gelado', price: 5.00, category: 'bebidas', popular: 1 },
                    { name: 'Fanta Laranja 350ml', description: 'Refrigerante de laranja gelado', price: 5.00, category: 'bebidas', popular: 0 },
                    { name: 'Água Mineral 500ml', description: 'Água mineral sem gás', price: 3.00, category: 'bebidas', popular: 0 },
                    { name: 'Suco Natural 300ml', description: 'Suco natural da fruta (consulte sabores)', price: 8.00, category: 'bebidas', popular: 0 },
                    { name: 'Cerveja Skol 350ml', description: 'Cerveja gelada', price: 6.00, category: 'bebidas', popular: 0 },
                    
                    // PORÇÕES
                    { name: 'Batata Frita', description: 'Porção de batata frita crocante', price: 12.00, category: 'porcoes', popular: 1 },
                    { name: 'Onion Rings', description: 'Anéis de cebola empanados', price: 15.00, category: 'porcoes', popular: 0 },
                    { name: 'Nuggets (10 unid)', description: 'Nuggets de frango crocantes', price: 18.00, category: 'porcoes', popular: 1 },
                    { name: 'Mandioca Frita', description: 'Porção de mandioca frita', price: 10.00, category: 'porcoes', popular: 0 }
                ];

                const stmt = this.db.prepare(`
                    INSERT INTO products (name, description, price, category, popular) 
                    VALUES (?, ?, ?, ?, ?)
                `);

                defaultProducts.forEach(product => {
                    stmt.run([product.name, product.description, product.price, product.category, product.popular]);
                });

                stmt.finalize();
                console.log('✅ Produtos padrão inseridos');
            }
        });
    }

    // ========== MÉTODOS DE PRODUTOS ==========

    getAllProducts() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM products 
                WHERE available = 1 
                ORDER BY category, popular DESC, name
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getProductsByCategory(category) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM products 
                WHERE category = ? AND available = 1 
                ORDER BY popular DESC, name
            `, [category], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getProductById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM products WHERE id = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    addProduct(productData) {
        return new Promise((resolve, reject) => {
            const { name, description, price, category, popular = 0 } = productData;
            
            this.db.run(`
                INSERT INTO products (name, description, price, category, popular) 
                VALUES (?, ?, ?, ?, ?)
            `, [name, description, price, category, popular], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...productData });
            });
        });
    }

    updateProduct(id, productData) {
        return new Promise((resolve, reject) => {
            const { name, description, price, category, popular, available } = productData;
            
            this.db.run(`
                UPDATE products 
                SET name = ?, description = ?, price = ?, category = ?, popular = ?, available = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [name, description, price, category, popular, available, id], function(err) {
                if (err) reject(err);
                else resolve({ id, changes: this.changes });
            });
        });
    }

    deleteProduct(id) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE products SET available = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `, [id], function(err) {
                if (err) reject(err);
                else resolve({ id, changes: this.changes });
            });
        });
    }

    // ========== MÉTODOS DE PEDIDOS ==========

    createOrder(orderData) {
        return new Promise((resolve, reject) => {
            const { customer_phone, customer_name, customer_address, items, total_amount, delivery_fee, payment_method, notes } = orderData;
            
            this.db.run(`
                INSERT INTO orders (customer_phone, customer_name, customer_address, items, total_amount, delivery_fee, payment_method, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [customer_phone, customer_name, customer_address, JSON.stringify(items), total_amount, delivery_fee, payment_method, notes], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, ...orderData });
            });
        });
    }

    getOrderById(id) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM orders WHERE id = ?
            `, [id], (err, row) => {
                if (err) reject(err);
                else {
                    if (row && row.items) {
                        row.items = JSON.parse(row.items);
                    }
                    resolve(row);
                }
            });
        });
    }

    getOrdersByCustomer(customerPhone, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM orders 
                WHERE customer_phone = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [customerPhone, limit], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        if (row.items) {
                            row.items = JSON.parse(row.items);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    updateOrderStatus(id, status) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `, [status, id], function(err) {
                if (err) reject(err);
                else resolve({ id, status, changes: this.changes });
            });
        });
    }

    // ========== MÉTODOS DE ENDEREÇOS ==========

    saveCustomerAddress(customerPhone, address, neighborhood, reference) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO customer_addresses (customer_phone, address, neighborhood, reference, is_default) 
                VALUES (?, ?, ?, ?, 1)
            `, [customerPhone, address, neighborhood, reference], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    getCustomerAddress(customerPhone) {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT * FROM customer_addresses 
                WHERE customer_phone = ? AND is_default = 1
            `, [customerPhone], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // ========== MÉTODOS ADMINISTRATIVOS ==========

    getAllOrders(limit = 50) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM orders 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        if (row.items) {
                            row.items = JSON.parse(row.items);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    getOrdersByDate(date) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT * FROM orders 
                WHERE DATE(created_at) = ? 
                ORDER BY created_at DESC
            `, [date], (err, rows) => {
                if (err) reject(err);
                else {
                    rows.forEach(row => {
                        if (row.items) {
                            row.items = JSON.parse(row.items);
                        }
                    });
                    resolve(rows);
                }
            });
        });
    }

    getOrderStats() {
        return new Promise((resolve, reject) => {
            this.db.get(`
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as avg_order_value,
                    COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_orders,
                    SUM(CASE WHEN DATE(created_at) = DATE('now') THEN total_amount ELSE 0 END) as today_revenue
                FROM orders
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
}

module.exports = Database;