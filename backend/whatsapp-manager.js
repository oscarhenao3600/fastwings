const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');

class WhatsAppManager {
    constructor() {
        this.clients = new Map();
        this.qrCodes = new Map();
        this.connectionStatus = new Map();
        this.aiManager = null; // Se configurará desde el servidor
        this.database = null; // Se configurará desde el servidor
        this.reconnectionAttempts = new Map();
        this.maxReconnectionAttempts = 5;
    }

    // Configurar AI Manager
    setAIManager(aiManager) {
        this.aiManager = aiManager;
    }

    // Configurar Database
    setDatabase(database) {
        this.database = database;
    }

    // Forzar desconexión desde el teléfono
    async forcePhoneLogout(branchId) {
        try {
            console.log(`Forzando logout desde teléfono para sucursal ${branchId}`);
            
            // Desconectar cliente actual
            const existingClient = this.clients.get(branchId);
            if (existingClient) {
                try {
                    await existingClient.logout();
                    await existingClient.destroy();
                } catch (error) {
                    console.log(`Error en logout:`, error.message);
                }
                this.clients.delete(branchId);
            }
            
            // Limpiar estado
            this.qrCodes.delete(branchId);
            this.connectionStatus.set(branchId, 'disconnected');
            this.reconnectionAttempts.set(branchId, 0);
            
            // Limpiar sesión específica
            const fs = require('fs');
            const path = require('path');
            const sessionDir = path.join(__dirname, 'whatsapp-sessions', `session-${branchId}`);
            
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`Sesión específica eliminada para ${branchId}`);
                } catch (error) {
                    console.log(`Error eliminando sesión específica:`, error.message);
                }
            }
            
            // Guardar estado en BD
            if (this.database) {
                await this.database.saveWhatsAppConfig(branchId, {
                    status: 'disconnected',
                    lastUpdate: new Date()
                });
            }
            
            console.log(`Logout forzado completado para sucursal ${branchId}`);
            return true;
            
        } catch (error) {
            console.error(`Error forzando logout para sucursal ${branchId}:`, error);
            throw error;
        }
    }

    // Limpiar sesión anterior y forzar nueva autenticación
    async forceNewSession(branchId) {
        try {
            console.log(`Forzando nueva sesión para sucursal ${branchId}`);
            
            // Desconectar cliente actual si existe
            const existingClient = this.clients.get(branchId);
            if (existingClient) {
                try {
                    await existingClient.destroy();
                } catch (error) {
                    console.log(`Error destruyendo cliente existente:`, error.message);
                }
                this.clients.delete(branchId);
            }
            
            // Limpiar estado
            this.qrCodes.delete(branchId);
            this.connectionStatus.set(branchId, 'disconnected');
            this.reconnectionAttempts.set(branchId, 0);
            
            // Limpiar datos de sesión local
            const fs = require('fs');
            const path = require('path');
            const sessionDir = path.join(__dirname, '.wwebjs_auth', `session-${branchId}`);
            
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                    console.log(`Sesión anterior eliminada para ${branchId}`);
                } catch (error) {
                    console.log(`Error eliminando sesión:`, error.message);
                }
            }
            
            // Crear nuevo cliente
            await this.createClient(branchId);
            
            console.log(`Nueva sesión creada para sucursal ${branchId}`);
            return true;
            
        } catch (error) {
            console.error(`Error forzando nueva sesión para sucursal ${branchId}:`, error);
            throw error;
        }
    }

    async createClient(branchId) {
        try {
            console.log(`Creando cliente WhatsApp para sucursal ${branchId}`);
            
            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: branchId,
                    dataPath: path.join(__dirname, 'whatsapp-sessions')
                }),
                puppeteer: {
                    headless: true,
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-extensions',
                        '--disable-plugins',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-features=TranslateUI',
                        '--disable-ipc-flooding-protection',
                        '--enable-logging',
                        '--log-level=0',
                        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        '--disable-blink-features=AutomationControlled',
                        '--disable-web-security',
                        '--allow-running-insecure-content',
                        '--disable-features=VizDisplayCompositor'
                    ],
                    timeout: 120000,
                    protocolTimeout: 120000,
                    defaultViewport: {
                        width: 1280,
                        height: 720
                    }
                },
                webVersion: '2.2402.5',
                webVersionCache: {
                    type: 'local'
                }
            });

            // Eventos del cliente
            client.on('qr', async (qr) => {
                console.log(`QR recibido para sucursal ${branchId}`);
                try {
                    const qrImage = await qrcode.toDataURL(qr);
                    const qrBase64 = qrImage.split(',')[1]; // Remover el prefijo data:image/png;base64,
                    this.qrCodes.set(branchId, qrBase64);
                    this.connectionStatus.set(branchId, 'qr_ready');
                    
                    // Guardar estado en BD
                    if (this.database) {
                        await this.database.saveWhatsAppConfig(branchId, {
                            status: 'qr_ready',
                            qrCode: qrBase64,
                            lastUpdate: new Date()
                        });
                    }
                    
                    console.log(`QR guardado para sucursal ${branchId}`);
                } catch (error) {
                    console.error(`Error generando QR para sucursal ${branchId}:`, error);
                }
            });

            client.on('ready', () => {
                console.log(`Cliente WhatsApp listo para sucursal ${branchId}`);
                this.connectionStatus.set(branchId, 'connected');
                this.qrCodes.delete(branchId);
                this.reconnectionAttempts.set(branchId, 0); // Reset intentos
                
                // Guardar estado en BD
                if (this.database) {
                    this.database.saveWhatsAppConfig(branchId, {
                        status: 'connected',
                        lastConnection: new Date(),
                        lastUpdate: new Date()
                    }).catch(err => console.error('Error guardando estado:', err));
                }
            });

            client.on('authenticated', () => {
                console.log(`Cliente autenticado para sucursal ${branchId}`);
                this.connectionStatus.set(branchId, 'authenticated');
                
                // Guardar estado en BD
                if (this.database) {
                    this.database.saveWhatsAppConfig(branchId, {
                        status: 'authenticated',
                        lastUpdate: new Date()
                    }).catch(err => console.error('Error guardando estado:', err));
                }
            });

            client.on('auth_failure', (msg) => {
                console.error(`Error de autenticación para sucursal ${branchId}:`, msg);
                this.connectionStatus.set(branchId, 'auth_failure');
                
                // Guardar estado en BD
                if (this.database) {
                    this.database.saveWhatsAppConfig(branchId, {
                        status: 'auth_failure',
                        lastUpdate: new Date()
                    }).catch(err => console.error('Error guardando estado:', err));
                }
            });

            client.on('disconnected', (reason) => {
                console.log(`Cliente desconectado para sucursal ${branchId}:`, reason);
                this.connectionStatus.set(branchId, 'disconnected');
                this.qrCodes.delete(branchId);
                
                // Guardar estado en BD
                if (this.database) {
                    this.database.saveWhatsAppConfig(branchId, {
                        status: 'disconnected',
                        lastUpdate: new Date()
                    }).catch(err => console.error('Error guardando estado:', err));
                }
                
                // Intentar reconexión automática
                this.attemptReconnection(branchId);
            });

            client.on('message', async (message) => {
                console.log(`Mensaje recibido en sucursal ${branchId}:`, message.body);
                await this.handleIncomingMessage(branchId, message);
            });

            // Inicializar cliente
            await client.initialize();
            
            this.clients.set(branchId, client);
            this.connectionStatus.set(branchId, 'connecting');
            
            return client;
        } catch (error) {
            console.error(`Error creando cliente WhatsApp para sucursal ${branchId}:`, error);
            this.connectionStatus.set(branchId, 'error');
            throw error;
        }
    }

    async handleIncomingMessage(branchId, message) {
        try {
            console.log(`Procesando mensaje de ${message.from} en sucursal ${branchId}: ${message.body}`);
            
            // Usar el número de teléfono como ID del cliente para el historial
            const clientId = message.from;
            
            // Aquí puedes implementar la lógica de IA para responder
            const response = await this.generateAIResponse(branchId, message.body, clientId);
            
            if (response) {
                await this.sendMessage(branchId, message.from, response);
            }
        } catch (error) {
            console.error(`Error procesando mensaje en sucursal ${branchId}:`, error);
        }
    }

    async generateAIResponse(branchId, message, clientId = null) {
        try {
            // Usar AI Manager si está disponible
            if (this.aiManager) {
                const response = await this.aiManager.generateResponse(branchId, message, clientId);
                return response;
            }
            
            // Fallback a respuestas básicas si no hay AI Manager
            const lowerMessage = message.toLowerCase();
            
            if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas')) {
                return '¡Hola! Bienvenido a FastWings 🍔\n\n¿En qué puedo ayudarte hoy?\n• Ver nuestro menú\n• Hacer un pedido\n• Consultar precios\n• Horarios de atención';
            }
            
            if (lowerMessage.includes('menú') || lowerMessage.includes('menu')) {
                return '🍽️ *NUESTRO MENÚ*\n\nTenemos una gran variedad de opciones:\n• Hamburguesas desde $8.99\n• Pizzas desde $14.99\n• Bebidas desde $2.99\n• Acompañamientos desde $3.99\n\n¿Te gustaría hacer un pedido?';
            }
            
            if (lowerMessage.includes('pedido') || lowerMessage.includes('ordenar')) {
                return '¡Perfecto! Para hacer tu pedido, por favor indícame:\n\n1. ¿Qué te gustaría ordenar?\n2. ¿Para cuántas personas?\n3. ¿Prefieres recoger o delivery?\n\nTe ayudo a procesar tu pedido 😊';
            }
            
            if (lowerMessage.includes('precio') || lowerMessage.includes('costo')) {
                return '💰 *NUESTROS PRECIOS*\n\n• Hamburguesas: $8.99 - $15.99\n• Pizzas: $14.99 - $25.99\n• Bebidas: $2.99 - $4.99\n• Acompañamientos: $3.99 - $6.99\n\n¿Te gustaría ver el menú completo?';
            }
            
            return 'Gracias por contactarnos. ¿En qué puedo ayudarte? Puedes preguntarme sobre nuestro menú, precios o hacer un pedido.';
        } catch (error) {
            console.error(`Error generando respuesta IA para sucursal ${branchId}:`, error);
            return 'Gracias por contactarnos. ¿En qué puedo ayudarte?';
        }
    }

    async sendMessage(branchId, to, message) {
        try {
            const client = this.clients.get(branchId);
            if (client && this.connectionStatus.get(branchId) === 'connected') {
                await client.sendMessage(to, message);
                console.log(`Mensaje enviado a ${to} desde sucursal ${branchId}`);
                return true;
            } else {
                console.log(`Cliente no disponible para sucursal ${branchId}`);
                return false;
            }
        } catch (error) {
            console.error(`Error enviando mensaje desde sucursal ${branchId}:`, error);
            return false;
        }
    }

    getQRCode(branchId) {
        return this.qrCodes.get(branchId);
    }

    getStatus(branchId) {
        return this.connectionStatus.get(branchId) || 'disconnected';
    }

    isConnected(branchId) {
        return this.connectionStatus.get(branchId) === 'connected';
    }

    async disconnect(branchId) {
        try {
            const client = this.clients.get(branchId);
            if (client) {
                await client.destroy();
                this.clients.delete(branchId);
                this.qrCodes.delete(branchId);
                this.connectionStatus.set(branchId, 'disconnected');
                console.log(`Cliente desconectado para sucursal ${branchId}`);
            }
        } catch (error) {
            console.error(`Error desconectando cliente de sucursal ${branchId}:`, error);
        }
    }

    async logout(branchId) {
        try {
            const client = this.clients.get(branchId);
            if (client) {
                await client.logout();
                await client.destroy();
                this.clients.delete(branchId);
                this.qrCodes.delete(branchId);
                this.connectionStatus.set(branchId, 'disconnected');
                this.reconnectionAttempts.set(branchId, 0);
                console.log(`Cliente desvinculado para sucursal ${branchId}`);
                
                // Guardar estado en BD
                if (this.database) {
                    await this.database.saveWhatsAppConfig(branchId, {
                        status: 'disconnected',
                        lastUpdate: new Date()
                    });
                }
            }
        } catch (error) {
            console.error(`Error desvinculando cliente de sucursal ${branchId}:`, error);
        }
    }

    // Reconexión automática
    async attemptReconnection(branchId) {
        const attempts = this.reconnectionAttempts.get(branchId) || 0;
        
        if (attempts >= this.maxReconnectionAttempts) {
            console.log(`Máximo de intentos de reconexión alcanzado para sucursal ${branchId}`);
            return;
        }
        
        this.reconnectionAttempts.set(branchId, attempts + 1);
        
        console.log(`Intentando reconexión ${attempts + 1}/${this.maxReconnectionAttempts} para sucursal ${branchId}`);
        
        // Esperar antes de intentar reconectar
        setTimeout(async () => {
            try {
                await this.createClient(branchId);
            } catch (error) {
                console.error(`Error en reconexión para sucursal ${branchId}:`, error);
                // Intentar de nuevo si no se alcanzó el máximo
                if (attempts + 1 < this.maxReconnectionAttempts) {
                    this.attemptReconnection(branchId);
                }
            }
        }, 5000 * (attempts + 1)); // Esperar más tiempo en cada intento
    }

    // Cargar estado desde BD
    async loadStateFromDatabase() {
        if (!this.database) return;
        
        try {
            const branches = await this.database.getAllBranches();
            
            for (const branch of branches) {
                const config = await this.database.getWhatsAppConfig(branch.branchId);
                if (config && config.status === 'connected') {
                    // Intentar reconectar si estaba conectado
                    console.log(`Intentando reconectar sucursal ${branch.branchId} desde BD`);
                    this.attemptReconnection(branch.branchId);
                }
            }
        } catch (error) {
            console.error('Error cargando estado desde BD:', error);
        }
    }
}

module.exports = WhatsAppManager;
