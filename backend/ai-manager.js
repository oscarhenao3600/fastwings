const fetch = require('node-fetch');
const { HfInference } = require('@huggingface/inference');

class AIManager {
    constructor() {
        // Configuración de Hugging Face
        this.hf = new HfInference(process.env.HUGGINGFACE_API_KEY || null);
        this.modelName = 'microsoft/DialoGPT-medium'; // Modelo en español
        this.useHuggingFace = true; // Activar Hugging Face
        
        this.menuContent = new Map(); // Almacenar contenido de menús por sucursal
        this.aiPrompts = new Map(); // Almacenar prompts personalizados por sucursal
        this.conversationHistory = new Map(); // Historial de conversaciones por cliente
    }

    // Configurar contenido del menú para una sucursal
    setMenuContent(branchId, content) {
        this.menuContent.set(branchId, content);
        console.log(`Menú configurado para sucursal ${branchId}:`, content.substring(0, 100) + '...');
    }

    // Configurar prompt personalizado para una sucursal
    setAIPrompt(branchId, prompt) {
        this.aiPrompts.set(branchId, prompt);
        console.log(`Prompt de IA configurado para sucursal ${branchId}:`, prompt);
    }

    // Obtener prompt personalizado o usar uno por defecto
    getPrompt(branchId) {
        const customPrompt = this.aiPrompts.get(branchId);
        if (customPrompt) {
            return customPrompt;
        }

        return `Eres un asistente virtual amigable de FastWings, un restaurante de comida rápida. 
        Tu objetivo es ayudar a los clientes con sus consultas sobre el menú, precios, pedidos y cualquier otra pregunta relacionada con nuestros servicios.
        
        Debes ser:
        - Amigable y profesional
        - Útil y preciso en tus respuestas
        - Capaz de sugerir productos del menú
        - Ayudar con el proceso de pedidos
        - Responder preguntas sobre precios y disponibilidad
        
        Responde de manera natural y conversacional, como si fueras un empleado amigable del restaurante.`;
    }

    // Generar respuesta usando Hugging Face o simulación inteligente
    async generateResponse(branchId, userMessage, clientId = null) {
        try {
            const menuContent = this.menuContent.get(branchId) || '';
            const prompt = this.getPrompt(branchId);
            
            // Crear contexto completo con el menú
            const fullContext = this.buildContext(prompt, menuContent, userMessage);
            
            // Intentar usar Hugging Face primero
            if (this.useHuggingFace && this.hf) {
                try {
                    const response = await this.callHuggingFace(fullContext, userMessage, clientId);
                    console.log(`Respuesta Hugging Face generada para sucursal ${branchId}:`, response);
                    return response;
                } catch (hfError) {
                    console.log(`Error con Hugging Face, usando simulación:`, hfError.message);
                    // Fallback a simulación inteligente
                    const response = await this.callFreeAI(fullContext, userMessage);
                    console.log(`Respuesta simulación generada para sucursal ${branchId}:`, response);
                    return response;
                }
            } else {
                // Usar simulación inteligente
                const response = await this.callFreeAI(fullContext, userMessage);
                console.log(`Respuesta simulación generada para sucursal ${branchId}:`, response);
                return response;
            }
            
        } catch (error) {
            console.error(`Error generando respuesta IA para sucursal ${branchId}:`, error);
            // Fallback a respuestas básicas
            return this.getFallbackResponse(userMessage);
        }
    }

    // Llamar a Hugging Face
    async callHuggingFace(context, userMessage, clientId) {
        try {
            // Obtener historial de conversación del cliente
            const history = this.getConversationHistory(clientId);
            
            // Crear prompt mejorado para Hugging Face
            const enhancedPrompt = this.createEnhancedPrompt(context, userMessage, history);
            
            // Llamar al modelo de Hugging Face
            const response = await this.hf.textGeneration({
                model: this.modelName,
                inputs: enhancedPrompt,
                parameters: {
                    max_new_tokens: 150,
                    temperature: 0.7,
                    do_sample: true,
                    top_p: 0.9,
                    repetition_penalty: 1.1
                }
            });
            
            // Procesar y limpiar la respuesta
            let aiResponse = response.generated_text || '';
            
            // Limpiar la respuesta (remover el prompt original)
            if (aiResponse.includes(enhancedPrompt)) {
                aiResponse = aiResponse.replace(enhancedPrompt, '').trim();
            }
            
            // Si la respuesta está vacía o es muy corta, usar fallback
            if (!aiResponse || aiResponse.length < 10) {
                throw new Error('Respuesta muy corta o vacía');
            }
            
            // Guardar en historial de conversación
            this.addToConversationHistory(clientId, userMessage, aiResponse);
            
            return aiResponse;
            
        } catch (error) {
            console.error('Error llamando a Hugging Face:', error);
            throw error;
        }
    }

    // Crear prompt mejorado para Hugging Face
    createEnhancedPrompt(context, userMessage, history) {
        let prompt = context + '\n\n';
        
        // Agregar historial de conversación si existe
        if (history && history.length > 0) {
            prompt += 'HISTORIAL DE CONVERSACIÓN:\n';
            history.slice(-3).forEach(entry => { // Últimas 3 interacciones
                prompt += `Cliente: ${entry.user}\n`;
                prompt += `Asistente: ${entry.assistant}\n\n`;
            });
        }
        
        prompt += `Cliente: ${userMessage}\n`;
        prompt += `Asistente:`;
        
        return prompt;
    }

    // Manejar historial de conversaciones
    getConversationHistory(clientId) {
        if (!clientId) return [];
        return this.conversationHistory.get(clientId) || [];
    }

    addToConversationHistory(clientId, userMessage, assistantResponse) {
        if (!clientId) return;
        
        if (!this.conversationHistory.has(clientId)) {
            this.conversationHistory.set(clientId, []);
        }
        
        const history = this.conversationHistory.get(clientId);
        history.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: new Date().toISOString()
        });
        
        // Mantener solo las últimas 10 interacciones
        if (history.length > 10) {
            history.splice(0, history.length - 10);
        }
        
        this.conversationHistory.set(clientId, history);
    }

    // Construir contexto completo con menú y prompt
    buildContext(prompt, menuContent, userMessage) {
        let context = prompt + '\n\n';
        
        if (menuContent) {
            context += `INFORMACIÓN DEL MENÚ:\n${menuContent}\n\n`;
        }
        
        context += `MENSAJE DEL CLIENTE: "${userMessage}"\n\n`;
        context += `Responde de manera natural y útil basándote en la información del menú y el contexto del restaurante.`;
        
        return context;
    }

    // Llamar a IA gratuita (simulación mejorada)
    async callFreeAI(context, userMessage) {
        try {
            // Simulación de IA más inteligente basada en el contexto
            const lowerMessage = userMessage.toLowerCase();
            
            // Respuestas mejoradas basadas en el contenido del menú
            if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas')) {
                return this.generateWelcomeResponse();
            }
            
            if (lowerMessage.includes('menú') || lowerMessage.includes('menu') || lowerMessage.includes('carta')) {
                return this.generateMenuResponse(context);
            }
            
            if (lowerMessage.includes('pedido') || lowerMessage.includes('ordenar') || lowerMessage.includes('comprar')) {
                return this.generateOrderResponse();
            }
            
            if (lowerMessage.includes('precio') || lowerMessage.includes('costo') || lowerMessage.includes('cuánto')) {
                return this.generatePriceResponse(context);
            }
            
            if (lowerMessage.includes('hamburguesa') || lowerMessage.includes('burger')) {
                return this.generateBurgerResponse(context);
            }
            
            if (lowerMessage.includes('pizza')) {
                return this.generatePizzaResponse(context);
            }
            
            if (lowerMessage.includes('bebida') || lowerMessage.includes('refresco') || lowerMessage.includes('jugo')) {
                return this.generateDrinkResponse(context);
            }
            
            if (lowerMessage.includes('delivery') || lowerMessage.includes('domicilio') || lowerMessage.includes('envío')) {
                return this.generateDeliveryResponse();
            }
            
            if (lowerMessage.includes('horario') || lowerMessage.includes('abierto') || lowerMessage.includes('cerrado')) {
                return this.generateHoursResponse();
            }
            
            // Respuesta genérica inteligente
            return this.generateGenericResponse(context, userMessage);
            
        } catch (error) {
            console.error('Error en IA gratuita:', error);
            return this.getFallbackResponse(userMessage);
        }
    }

    // Generar respuestas específicas mejoradas
    generateWelcomeResponse() {
        return `¡Hola! 👋 Bienvenido a FastWings 🍔

¿En qué puedo ayudarte hoy? 

• 📋 Ver nuestro menú completo
• 🛒 Hacer un pedido
• 💰 Consultar precios
• 🚚 Información de delivery
• ⏰ Horarios de atención

¡Estoy aquí para ayudarte a encontrar la comida perfecta! 😊`;
    }

    generateMenuResponse(context) {
        if (context.includes('INFORMACIÓN DEL MENÚ:')) {
            return `🍽️ *NUESTRO MENÚ*

${this.extractMenuHighlights(context)}

¿Te gustaría que te ayude con alguna opción específica o prefieres hacer un pedido? 😊

También puedo enviarte el menú completo en PDF si lo necesitas.`;
        }
        
        return `🍽️ *NUESTRO MENÚ*

Tenemos una gran variedad de opciones deliciosas:

🍔 **Hamburguesas**
• Clásica, Doble, Especial
• Con papas y bebida

🍕 **Pizzas**
• Margarita, Pepperoni, Hawaiana
• Tamaños personalizables

🥤 **Bebidas**
• Refrescos, Jugos naturales
• Agua, Té helado

🍟 **Acompañamientos**
• Papas fritas, Aros de cebolla
• Nuggets, Wings

¿Qué te gustaría probar hoy? 😋`;
    }

    generateOrderResponse() {
        return `🛒 *¡Perfecto! Vamos a hacer tu pedido*

Para procesar tu pedido necesito algunos detalles:

1️⃣ **¿Qué te gustaría ordenar?**
   (Puedes elegir del menú)

2️⃣ **¿Para cuántas personas?**
   (Te ayudo con las porciones)

3️⃣ **¿Prefieres:**
   • 🏠 Recoger en el local
   • 🚚 Delivery a domicilio

4️⃣ **¿Tienes alguna preferencia especial?**
   (Sin cebolla, extra queso, etc.)

¡Cuéntame qué se te antoja y te ayudo a armar tu pedido perfecto! 😊`;
    }

    generatePriceResponse(context) {
        return `💰 *NUESTROS PRECIOS*

🍔 **Hamburguesas:** $8.99 - $15.99
🍕 **Pizzas:** $14.99 - $25.99
🥤 **Bebidas:** $2.99 - $4.99
🍟 **Acompañamientos:** $3.99 - $6.99

*Precios pueden variar según ingredientes especiales*

¿Te gustaría ver el menú completo con todos los precios? También tenemos promociones especiales 😊`;
    }

    generateBurgerResponse(context) {
        return `🍔 *¡Excelente elección!*

Nuestras hamburguesas son famosas por su sabor:

• **Clásica:** Carne, lechuga, tomate, queso
• **Doble:** Doble carne, doble queso
• **Especial:** Con bacon, cebolla caramelizada
• **Vegetariana:** Opción saludable

Todas incluyen papas fritas y bebida.

¿Cuál te llama más la atención? 😋`;
    }

    generatePizzaResponse(context) {
        return `🍕 *¡Pizzas deliciosas!*

Tenemos las mejores pizzas:

• **Margarita:** Salsa, mozzarella, albahaca
• **Pepperoni:** Con pepperoni picante
• **Hawaiana:** Jamón y piña
• **Suprema:** Todos los ingredientes

Tamaños: Personal, Mediana, Familiar

¿Cuál es tu favorita? 🍕`;
    }

    generateDrinkResponse(context) {
        return `🥤 *Bebidas refrescantes*

Para acompañar tu comida:

• **Refrescos:** Coca-Cola, Sprite, Fanta
• **Jugos naturales:** Naranja, Manzana
• **Agua:** Natural, Con gas
• **Té helado:** Limón, Durazno

¿Qué te gustaría para beber? 🥤`;
    }

    generateDeliveryResponse() {
        return `🚚 *Delivery a domicilio*

¡Llevamos la comida hasta tu puerta!

📦 **Servicio de delivery:**
• Tiempo estimado: 30-45 minutos
• Pedido mínimo: $15.00
• Costo de envío: $2.99

📍 **Zonas de cobertura:**
• Centro de la ciudad
• Zonas residenciales cercanas

📞 **Para pedidos:**
Usa el botón "Hacer pedido" o escríbeme tu dirección.

¿Cuál es tu dirección para el delivery? 🏠`;
    }

    generateHoursResponse() {
        return `⏰ *Horarios de atención*

🏪 **Restaurante:**
• Lunes a Viernes: 11:00 AM - 10:00 PM
• Sábados: 12:00 PM - 11:00 PM
• Domingos: 12:00 PM - 9:00 PM

🚚 **Delivery:**
• Mismo horario del restaurante
• Último pedido: 30 min antes del cierre

¿En qué horario te gustaría hacer tu pedido? 😊`;
    }

    generateGenericResponse(context, userMessage) {
        return `¡Gracias por tu mensaje! 😊

Entiendo que quieres saber sobre "${userMessage}". Déjame ayudarte:

• Si es sobre el menú, puedo mostrarte todas nuestras opciones
• Si quieres hacer un pedido, te guío paso a paso
• Si tienes alguna pregunta específica, con gusto te respondo

¿En qué puedo ayudarte específicamente? 🤔`;
    }

    extractMenuHighlights(context) {
        const menuSection = context.split('INFORMACIÓN DEL MENÚ:')[1]?.split('MENSAJE DEL CLIENTE:')[0];
        if (menuSection) {
            // Extraer las primeras líneas del menú
            const lines = menuSection.split('\n').filter(line => line.trim());
            return lines.slice(0, 10).join('\n');
        }
        return 'Tenemos hamburguesas, pizzas, bebidas y acompañamientos deliciosos.';
    }

    getFallbackResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días')) {
            return '¡Hola! Bienvenido a FastWings 🍔\n\n¿En qué puedo ayudarte hoy?';
        }
        
        if (lowerMessage.includes('menú') || lowerMessage.includes('menu')) {
            return '🍽️ Tenemos hamburguesas, pizzas, bebidas y acompañamientos deliciosos.\n\n¿Te gustaría hacer un pedido?';
        }
        
        if (lowerMessage.includes('pedido') || lowerMessage.includes('ordenar')) {
            return '¡Perfecto! Para hacer tu pedido, por favor indícame qué te gustaría ordenar y te ayudo a procesarlo 😊';
        }
        
        return 'Gracias por contactarnos. ¿En qué puedo ayudarte? Puedes preguntarme sobre nuestro menú, precios o hacer un pedido.';
    }
}

module.exports = AIManager;
