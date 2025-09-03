const { MongoClient } = require('mongodb');

class Database {
    constructor() {
        this.client = null;
        this.db = null;
        this.url = process.env.MONGODB_URL || 'mongodb://localhost:27017';
        this.dbName = 'fastwings';
    }

    async connect() {
        try {
            console.log('Conectando a MongoDB...');
            this.client = new MongoClient(this.url);
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            console.log('✅ MongoDB conectado exitosamente');
            
            // Crear colecciones si no existen
            await this.createCollections();
            
            return this.db;
        } catch (error) {
            console.error('❌ Error conectando a MongoDB:', error);
            throw error;
        }
    }

    async createCollections() {
        try {
            // Colección de sucursales
            await this.db.createCollection('branches');
            
            // Colección de configuración de WhatsApp
            await this.db.createCollection('whatsapp_config');
            
            // Colección de historial de conversaciones
            await this.db.createCollection('conversations');
            
            // Colección de menús
            await this.db.createCollection('menus');
            
            console.log('✅ Colecciones creadas/verificadas');
        } catch (error) {
            console.log('ℹ️ Colecciones ya existen o error:', error.message);
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.close();
            console.log('🔌 MongoDB desconectado');
        }
    }

    // Métodos para sucursales
    async saveBranch(branchData) {
        try {
            const collection = this.db.collection('branches');
            const result = await collection.updateOne(
                { branchId: branchData.branchId },
                { $set: branchData },
                { upsert: true }
            );
            console.log(`✅ Sucursal ${branchData.branchId} guardada`);
            return result;
        } catch (error) {
            console.error('❌ Error guardando sucursal:', error);
            throw error;
        }
    }

    async getBranch(branchId) {
        try {
            const collection = this.db.collection('branches');
            return await collection.findOne({ branchId: branchId });
        } catch (error) {
            console.error('❌ Error obteniendo sucursal:', error);
            throw error;
        }
    }

    async getAllBranches() {
        try {
            const collection = this.db.collection('branches');
            return await collection.find({}).toArray();
        } catch (error) {
            console.error('❌ Error obteniendo sucursales:', error);
            throw error;
        }
    }

    // Métodos para configuración de WhatsApp
    async saveWhatsAppConfig(branchId, config) {
        try {
            const collection = this.db.collection('whatsapp_config');
            const result = await collection.updateOne(
                { branchId: branchId },
                { 
                    $set: {
                        ...config,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`✅ Configuración WhatsApp guardada para ${branchId}`);
            return result;
        } catch (error) {
            console.error('❌ Error guardando configuración WhatsApp:', error);
            throw error;
        }
    }

    async getWhatsAppConfig(branchId) {
        try {
            const collection = this.db.collection('whatsapp_config');
            return await collection.findOne({ branchId: branchId });
        } catch (error) {
            console.error('❌ Error obteniendo configuración WhatsApp:', error);
            throw error;
        }
    }

    // Métodos para teléfonos
    async savePhoneNumbers(branchId, phoneData) {
        try {
            const collection = this.db.collection('whatsapp_config');
            const result = await collection.updateOne(
                { branchId: branchId },
                { 
                    $set: {
                        orderPhone: phoneData.orderPhone,
                        complaintPhone: phoneData.complaintPhone,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`✅ Teléfonos guardados para ${branchId}`);
            return result;
        } catch (error) {
            console.error('❌ Error guardando teléfonos:', error);
            throw error;
        }
    }

    async getPhoneNumbers(branchId) {
        try {
            const collection = this.db.collection('whatsapp_config');
            const config = await collection.findOne({ branchId: branchId });
            return {
                orderPhone: config?.orderPhone || '',
                complaintPhone: config?.complaintPhone || ''
            };
        } catch (error) {
            console.error('❌ Error obteniendo teléfonos:', error);
            return { orderPhone: '', complaintPhone: '' };
        }
    }

    // Métodos para menús
    async saveMenu(branchId, menuContent) {
        try {
            const collection = this.db.collection('menus');
            const result = await collection.updateOne(
                { branchId: branchId },
                { 
                    $set: {
                        content: menuContent,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );
            console.log(`✅ Menú guardado para ${branchId}`);
            return result;
        } catch (error) {
            console.error('❌ Error guardando menú:', error);
            throw error;
        }
    }

    async getMenu(branchId) {
        try {
            const collection = this.db.collection('menus');
            const menu = await collection.findOne({ branchId: branchId });
            return menu?.content || '';
        } catch (error) {
            console.error('❌ Error obteniendo menú:', error);
            return '';
        }
    }

    // Métodos para historial de conversaciones
    async saveConversation(clientId, message, response) {
        try {
            const collection = this.db.collection('conversations');
            const result = await collection.insertOne({
                clientId: clientId,
                message: message,
                response: response,
                timestamp: new Date()
            });
            console.log(`✅ Conversación guardada para ${clientId}`);
            return result;
        } catch (error) {
            console.error('❌ Error guardando conversación:', error);
            throw error;
        }
    }

    async getConversationHistory(clientId, limit = 10) {
        try {
            const collection = this.db.collection('conversations');
            return await collection.find({ clientId: clientId })
                .sort({ timestamp: -1 })
                .limit(limit)
                .toArray();
        } catch (error) {
            console.error('❌ Error obteniendo historial:', error);
            return [];
        }
    }
}

module.exports = Database;
