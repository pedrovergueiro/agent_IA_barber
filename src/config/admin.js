// Configuração dos administradores do sistema
// Para adicionar um novo admin, inclua o número no formato: 55DDNNNNNNNNN@c.us
// Exemplo: 5535999999999@c.us (35 = DDD de Pouso Alegre)

const ADMIN_NUMBERS = process.env.ADMIN_NUMBERS 
    ? process.env.ADMIN_NUMBERS.split(',').map(num => num.trim())
    : [
        '5535999999999@c.us', // Número principal do barbeiro (padrão)
        // Adicione mais números aqui se necessário
        // '5535888888888@c.us', // Segundo barbeiro
    ];

module.exports = {
    ADMIN_NUMBERS,
    
    // Verificar se um número é administrador
    isAdmin(phoneNumber) {
        return ADMIN_NUMBERS.includes(phoneNumber);
    },
    
    // Adicionar novo administrador
    addAdmin(phoneNumber) {
        if (!ADMIN_NUMBERS.includes(phoneNumber)) {
            ADMIN_NUMBERS.push(phoneNumber);
            return true;
        }
        return false;
    },
    
    // Remover administrador
    removeAdmin(phoneNumber) {
        const index = ADMIN_NUMBERS.indexOf(phoneNumber);
        if (index > -1) {
            ADMIN_NUMBERS.splice(index, 1);
            return true;
        }
        return false;
    }
};