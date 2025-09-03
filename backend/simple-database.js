const fs = require('fs');
const path = require('path');

class SimpleDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, 'data');
        this.ensureDataDir();
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
            console.log('✅ Directorio de datos creado');
        }
    }

    async connect() {
        console.log('✅ Base de datos simple conectada');
        return true;
    }

    async disconnect() {
        console.log('🔌 Base de datos simple desconectada');
    }

    // Guardar datos en archivo JSON
    saveToFile(filename, data) {
        try {
            const filepath = path.join(this.dataDir, `${filename}.json`);
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error guardando ${filename}:`, error);
            return false;
        }
    }

    // Leer datos desde archivo JSON
    loadFromFile(filename) {
        try {
            const filepath = path.join(this.dataDir, `${filename}.json`);
            if (fs.existsSync(filepath)) {
                const data = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(data);
            }
            return {};
        } catch (error) {
            console.error(`Error cargando ${filename}:`, error);
            return {};
        }
    }

    // Métodos para sucursales
    async saveBranch(branchData) {
        try {
            const branches = this.loadFromFile('branches');
            branches[branchData.branchId] = {
                ...branchData,
                updatedAt: new Date().toISOString()
            };
            this.saveToFile('branches', branches);
            console.log(`✅ Sucursal ${branchData.branchId} guardada`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error guardando sucursal:', error);
            throw error;
        }
    }

    async getBranch(branchId) {
        try {
            const branches = this.loadFromFile('branches');
            return branches[branchId] || null;
        } catch (error) {
            console.error('❌ Error obteniendo sucursal:', error);
            throw error;
        }
    }

    async getAllBranches() {
        try {
            const branches = this.loadFromFile('branches');
            return Object.values(branches);
        } catch (error) {
            console.error('❌ Error obteniendo sucursales:', error);
            throw error;
        }
    }

    // Métodos para configuración de WhatsApp
    async saveWhatsAppConfig(branchId, config) {
        try {
            const configs = this.loadFromFile('whatsapp_config');
            configs[branchId] = {
                branchId: branchId,
                ...config,
                updatedAt: new Date().toISOString()
            };
            this.saveToFile('whatsapp_config', configs);
            console.log(`✅ Configuración WhatsApp guardada para ${branchId}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error guardando configuración WhatsApp:', error);
            throw error;
        }
    }

    async getWhatsAppConfig(branchId) {
        try {
            const configs = this.loadFromFile('whatsapp_config');
            return configs[branchId] || null;
        } catch (error) {
            console.error('❌ Error obteniendo configuración WhatsApp:', error);
            throw error;
        }
    }

    // Métodos para teléfonos
    async savePhoneNumbers(branchId, phoneData) {
        try {
            const phones = this.loadFromFile('phone_numbers');
            phones[branchId] = {
                branchId: branchId,
                orderPhone: phoneData.orderPhone,
                complaintPhone: phoneData.complaintPhone,
                updatedAt: new Date().toISOString()
            };
            this.saveToFile('phone_numbers', phones);
            console.log(`✅ Teléfonos guardados para ${branchId}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error guardando teléfonos:', error);
            throw error;
        }
    }

    async getPhoneNumbers(branchId) {
        try {
            const phones = this.loadFromFile('phone_numbers');
            const branchPhones = phones[branchId];
            return {
                orderPhone: branchPhones?.orderPhone || '',
                complaintPhone: branchPhones?.complaintPhone || ''
            };
        } catch (error) {
            console.error('❌ Error obteniendo teléfonos:', error);
            return { orderPhone: '', complaintPhone: '' };
        }
    }

    // Métodos para menús
    async saveMenu(branchId, menuContent) {
        try {
            const menus = this.loadFromFile('menus');
            menus[branchId] = {
                branchId: branchId,
                content: menuContent,
                updatedAt: new Date().toISOString()
            };
            this.saveToFile('menus', menus);
            console.log(`✅ Menú guardado para ${branchId}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error guardando menú:', error);
            throw error;
        }
    }

    async getMenu(branchId) {
        try {
            const menus = this.loadFromFile('menus');
            const menu = menus[branchId];
            return menu?.content || '';
        } catch (error) {
            console.error('❌ Error obteniendo menú:', error);
            return '';
        }
    }

    // Métodos para historial de conversaciones
    async saveConversation(clientId, message, response) {
        try {
            const conversations = this.loadFromFile('conversations');
            if (!conversations[clientId]) {
                conversations[clientId] = [];
            }
            
            conversations[clientId].push({
                message: message,
                response: response,
                timestamp: new Date().toISOString()
            });
            
            // Mantener solo las últimas 50 conversaciones por cliente
            if (conversations[clientId].length > 50) {
                conversations[clientId] = conversations[clientId].slice(-50);
            }
            
            this.saveToFile('conversations', conversations);
            console.log(`✅ Conversación guardada para ${clientId}`);
            return { success: true };
        } catch (error) {
            console.error('❌ Error guardando conversación:', error);
            throw error;
        }
    }

    async getConversationHistory(clientId, limit = 10) {
        try {
            const conversations = this.loadFromFile('conversations');
            const clientConversations = conversations[clientId] || [];
            return clientConversations.slice(-limit).reverse();
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    }
}

module.exports = SimpleDatabase;
