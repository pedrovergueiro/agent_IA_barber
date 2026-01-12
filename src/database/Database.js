const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
    constructor() {
        // No Vercel, usar /tmp para arquivos temporários
        const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
        
        if (isVercel) {
            // Vercel: usar diretório temporário
            this.dbPath = '/tmp/barber.db';
            
            // Criar diretório se não existir
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }
        } else {
            // Local: usar diretório data
            this.dbPath = path.join(__dirname, '../../data/barber.db');
        }
        
        console.log(`📁 Database path: ${this.dbPath}`);
        
        this.db = new sqlite3.Database(this.dbPath);
        this.init();
    }

    init() {
        // Criar tabelas se não existirem
        this.db.serialize(() => {
            // Tabela de agendamentos
            this.db.run(`
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    customer_name TEXT NOT NULL,
                    service_id INTEGER NOT NULL,
                    service_name TEXT NOT NULL,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    payment_id TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabela de clientes
            this.db.run(`
                CREATE TABLE IF NOT EXISTS customers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_visit DATETIME
                )
            `);

            // Tabela de pagamentos
            this.db.run(`
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    booking_id INTEGER,
                    payment_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (booking_id) REFERENCES bookings (id)
                )
            `);

            // Tabela de horários bloqueados
            this.db.run(`
                CREATE TABLE IF NOT EXISTS blocked_times (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    reason TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Tabela de reservas temporárias
            this.db.run(`
                CREATE TABLE IF NOT EXISTS time_reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date TEXT NOT NULL,
                    time TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    status TEXT DEFAULT 'reserved',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Criar índices para melhor performance
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(date, time)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_blocked_times_date_time ON blocked_times(date, time)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_reservations_date_time ON time_reservations(date, time)`);
        });

        console.log('✅ Banco de dados inicializado');
    }

    async createBooking(bookingData) {
        return new Promise((resolve, reject) => {
            const {
                userId,
                customerName,
                serviceId,
                serviceName,
                date,
                time,
                status = 'pending',
                paymentId
            } = bookingData;

            const query = `
                INSERT INTO bookings (
                    user_id, customer_name, service_id, service_name, 
                    date, time, status, payment_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(
                query,
                [userId, customerName, serviceId, serviceName, date, time, status, paymentId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ id: this.lastID, ...bookingData });
                    }
                }
            );
        });
    }

    async getBookingsByDate(date) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM bookings 
                WHERE date = ? AND status != 'cancelled'
                ORDER BY time
            `;

            this.db.all(query, [date], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async isTimeSlotAvailable(date, time) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count FROM (
                    SELECT 1 FROM bookings 
                    WHERE date = ? AND time = ? AND status != 'cancelled'
                    UNION ALL
                    SELECT 1 FROM blocked_times 
                    WHERE date = ? AND time = ?
                    UNION ALL
                    SELECT 1 FROM time_reservations 
                    WHERE date = ? AND time = ? AND status IN ('reserved', 'confirmed')
                ) as occupied_slots
            `;

            this.db.get(query, [date, time, date, time, date, time], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    // Permitir até 3 agendamentos por horário
                    resolve(row.count < 3);
                }
            });
        });
    }

    async updateBookingStatus(bookingId, status) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE bookings 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;

            this.db.run(query, [status, bookingId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async getBookingByPaymentId(paymentId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM bookings 
                WHERE payment_id = ?
            `;

            this.db.get(query, [paymentId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async createCustomer(customerData) {
        return new Promise((resolve, reject) => {
            const { userId, name, phone } = customerData;

            const query = `
                INSERT OR REPLACE INTO customers (user_id, name, phone)
                VALUES (?, ?, ?)
            `;

            this.db.run(query, [userId, name, phone], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...customerData });
                }
            });
        });
    }

    async getCustomerByUserId(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM customers 
                WHERE user_id = ?
            `;

            this.db.get(query, [userId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getBookingsByCustomer(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM bookings 
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;

            this.db.all(query, [userId, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async blockTimeSlot(date, time, reason = 'Bloqueado pelo sistema') {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO blocked_times (date, time, reason)
                VALUES (?, ?, ?)
            `;

            this.db.run(query, [date, time, reason], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    async getBlockedTimes(date) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT time FROM blocked_times 
                WHERE date = ?
            `;

            this.db.all(query, [date], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.time));
                }
            });
        });
    }

    async reserveTimeSlot(date, time, userId, status = 'reserved') {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO time_reservations (date, time, user_id, status)
                VALUES (?, ?, ?, ?)
            `;

            this.db.run(query, [date, time, userId, status], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
    }

    async updateReservationStatus(date, time, userId, status) {
        return new Promise((resolve, reject) => {
            const query = `
                UPDATE time_reservations 
                SET status = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE date = ? AND time = ? AND user_id = ?
            `;

            this.db.run(query, [status, date, time, userId], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async getOccupiedTimes(date) {
        return new Promise((resolve, reject) => {
            // Buscar horários que já têm 3 ou mais agendamentos
            const query = `
                SELECT time, COUNT(*) as count
                FROM (
                    SELECT time FROM bookings 
                    WHERE date = ? AND status IN ('confirmed', 'pending')
                    UNION ALL
                    SELECT time FROM time_reservations 
                    WHERE date = ? AND status IN ('reserved', 'confirmed')
                ) as all_times
                GROUP BY time
                HAVING count >= 3
            `;

            this.db.all(query, [date, date], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.time));
                }
            });
        });
    }

    // Nova função para contar agendamentos por horário
    async getBookingCountByTime(date, time) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT COUNT(*) as count
                FROM (
                    SELECT time FROM bookings 
                    WHERE date = ? AND time = ? AND status IN ('confirmed', 'pending')
                    UNION ALL
                    SELECT time FROM time_reservations 
                    WHERE date = ? AND time = ? AND status IN ('reserved', 'confirmed')
                ) as all_times
            `;

            this.db.get(query, [date, time, date, time], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row ? row.count : 0);
                }
            });
        });
    }

    async getBookingById(bookingId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM bookings 
                WHERE id = ?
            `;

            this.db.get(query, [bookingId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async unblockTimeSlot(date, time) {
        return new Promise((resolve, reject) => {
            const query = `
                DELETE FROM blocked_times 
                WHERE date = ? AND time = ?
            `;

            this.db.run(query, [date, time], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
    }

    async searchBookingsByClient(clientName) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT * FROM bookings 
                WHERE customer_name LIKE ? 
                ORDER BY date DESC, time DESC
                LIMIT 20
            `;

            this.db.all(query, [`%${clientName}%`], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getRecentClients(sinceDate) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DISTINCT user_id, customer_name, MAX(date) as last_visit
                FROM bookings 
                WHERE date >= ? AND status = 'confirmed'
                GROUP BY user_id
                ORDER BY last_visit DESC
            `;

            this.db.all(query, [sinceDate], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getPaidClientsAfterDate(sinceDate) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT user_id, customer_name, service_name as last_service_name,
                       MAX(date) as last_booking_date,
                       COUNT(*) as total_bookings
                FROM bookings 
                WHERE date >= ? AND status = 'confirmed' AND payment_id IS NOT NULL
                GROUP BY user_id
                ORDER BY last_booking_date DESC
            `;

            this.db.all(query, [sinceDate], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // 📊 FUNÇÕES PARA RELATÓRIOS COMPLETOS
    getAllBookings() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.*
                FROM bookings b
                ORDER BY b.date DESC, b.time DESC
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar todos os agendamentos:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getBookingsByPeriod(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    b.*
                FROM bookings b
                WHERE b.date >= ? AND b.date <= ?
                ORDER BY b.date ASC, b.time ASC
            `;
            
            this.db.all(query, [startDate, endDate], (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar agendamentos por período:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Estatísticas avançadas para relatórios
    getBookingStats() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    COUNT(*) as total_bookings,
                    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_bookings,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                    SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as confirmed_revenue,
                    SUM(total_amount) as total_revenue,
                    AVG(total_amount) as average_booking_value
                FROM bookings
            `;
            
            this.db.get(query, [], (err, row) => {
                if (err) {
                    console.error('Erro ao buscar estatísticas:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    getTopServices() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    service_name as name,
                    COUNT(id) as booking_count,
                    SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as revenue
                FROM bookings
                WHERE service_name IS NOT NULL
                GROUP BY service_name
                ORDER BY booking_count DESC
                LIMIT 10
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar serviços mais populares:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    getTopClients() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    customer_name,
                    user_id,
                    COUNT(*) as booking_count,
                    SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END) as total_spent,
                    MAX(date) as last_booking_date
                FROM bookings
                GROUP BY customer_name, user_id
                HAVING booking_count > 1
                ORDER BY booking_count DESC, total_spent DESC
                LIMIT 10
            `;
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    console.error('Erro ao buscar clientes mais frequentes:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Erro ao fechar banco de dados:', err);
            } else {
                console.log('✅ Conexão com banco de dados fechada');
            }
        });
    }
}

module.exports = Database;