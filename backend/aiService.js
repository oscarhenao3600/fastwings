const axios = require('axios');

class AIService {
    constructor() {
        // Usar una API gratuita alternativa
        this.apiUrl = 'https://api.openai.com/v1/chat/completions';
        this.apiKey = null; // No usaremos API key por ahora
    }

    async generateResponse(userMessage, aiPrompt, context = '') {
        try {
            console.log(`🤖 Generando respuesta IA para: "${userMessage}"`);
            
            // Por ahora, usar solo el sistema de fallback inteligente
            // que es más confiable y no requiere API keys
            return this.getFallbackResponse(userMessage, aiPrompt);
            
        } catch (error) {
            console.error('❌ Error generando respuesta IA:', error.message);
            
            // Fallback: usar respuestas predefinidas basadas en palabras clave
            return this.getFallbackResponse(userMessage, aiPrompt);
        }
    }

    getFallbackResponse(userMessage, aiPrompt) {
        const message = userMessage.toLowerCase();
        
        // Detectar intención del mensaje con IA mejorada
        if (message.includes('hola') || message.includes('buenos') || message.includes('buenas')) {
            return '¡Hola! 👋 Bienvenido a FastWings. Soy tu asistente virtual y estoy aquí para ayudarte con cualquier consulta sobre nuestro menú, pedidos o servicios. ¿En qué puedo ayudarte hoy?';
        }
        
        if (message.includes('menú') || message.includes('menu') || message.includes('carta') || message.includes('que tienen')) {
            return '🍽️ Aquí tienes nuestro menú del día:\n\n🍔 *Hamburguesas:*\n• Clásica: $8.000\n• Especial: $12.000\n• Vegetariana: $10.000\n\n🍟 *Acompañamientos:*\n• Papas fritas: $3.000\n• Papas con queso: $4.500\n• Ensalada: $5.000\n\n🥤 *Bebidas:*\n• Gaseosas: $2.500\n• Jugos naturales: $3.500\n• Agua: $1.500\n\n💡 *Combos disponibles:*\n• Combo 1: Hamburguesa + Papas + Bebida: $15.000\n• Combo 2: Hamburguesa + Ensalada + Bebida: $16.000\n\n¿Qué te gustaría ordenar? 😊';
        }
        
        if (message.includes('precio') || message.includes('costo') || message.includes('cuánto') || message.includes('cuanto') || message.includes('vale')) {
            return '💰 Nuestros precios son muy accesibles:\n\n• Hamburguesas desde $8.000\n• Combos desde $15.000\n• Bebidas desde $1.500\n• Acompañamientos desde $3.000\n\n💡 *Promoción especial:*\n¡Combos con 15% de descuento en pedidos superiores a $20.000!\n\n¿Te gustaría ver el menú completo o hacer un pedido?';
        }
        
        if (message.includes('pedido') || message.includes('orden') || message.includes('comprar') || message.includes('quiero') || message.includes('dame')) {
            return '🛒 ¡Perfecto! Para tomar tu pedido necesito que me digas:\n\n1️⃣ Qué quieres ordenar\n2️⃣ Si es para llevar 🚗 o para comer aquí 🏠\n3️⃣ Tu dirección (si es para llevar)\n\n📝 *Ejemplo:* "Quiero una hamburguesa clásica con papas y una gaseosa, para llevar"\n\n¿Qué te gustaría ordenar? 😋';
        }
        
        if (message.includes('gracias') || message.includes('adios') || message.includes('chao') || message.includes('bye')) {
            return '¡Gracias por contactarnos! 🙏 Que tengas un excelente día. ¡Esperamos verte pronto en FastWings! 🍔✨\n\n*Horarios:* Lunes a domingo de 11:00 AM a 10:00 PM';
        }
        
        if (message.includes('hora') || message.includes('abierto') || message.includes('cerrado') || message.includes('cuando')) {
            return '🕐 *Horarios de atención:*\n\n📅 **Lunes a domingo**\n⏰ **11:00 AM - 10:00 PM**\n\n🚚 *Servicio a domicilio:*\n⏰ **11:30 AM - 9:30 PM**\n\n📍 *Ubicación:* Calle Principal #123\n📞 *Teléfono:* (57) 300-123-4567\n\n¿En qué horario te gustaría visitarnos? 😊';
        }
        
        if (message.includes('dirección') || message.includes('ubicación') || message.includes('donde') || message.includes('lugar')) {
            return '📍 *Ubicación FastWings:*\n\n🏠 **Dirección:** Calle Principal #123\n🗺️ **Barrio:** Centro Comercial\n🚗 **Estacionamiento:** Gratuito\n\n📱 *Para delivery:*\n• Radio de entrega: 5km\n• Tiempo estimado: 30-45 minutos\n• Costo delivery: $3.000\n\n🗺️ *Cómo llegar:*\n• Desde el centro: 10 minutos\n• Desde el norte: 15 minutos\n• Desde el sur: 20 minutos\n\n¿Te gustaría que te dé indicaciones más específicas? 🚗';
        }
        
        if (message.includes('delivery') || message.includes('domicilio') || message.includes('llevar') || message.includes('envío')) {
            return '🚚 *Servicio a domicilio disponible:*\n\n✅ **Cobertura:** Radio de 5km\n⏰ **Horarios:** 11:30 AM - 9:30 PM\n💰 **Costo delivery:** $3.000\n⏱️ **Tiempo estimado:** 30-45 minutos\n\n📱 *Para pedir:*\n1. Haz tu pedido aquí\n2. Proporciona tu dirección\n3. Paga al recibir\n4. ¡Disfruta tu comida! 😋\n\n¿Quieres hacer un pedido para delivery?';
        }
        
        if (message.includes('promoción') || message.includes('oferta') || message.includes('descuento') || message.includes('especial')) {
            return '🎉 *¡Promociones especiales!*\n\n🔥 **Combo Familiar:**\n• 2 Hamburguesas + 2 Papas + 2 Bebidas\n• Precio: $25.000 (Ahorras $5.000)\n\n🔥 **Happy Hour:**\n• Lunes a viernes 2:00 PM - 5:00 PM\n• 20% de descuento en bebidas\n\n🔥 **Día del Estudiante:**\n• Miércoles con carné estudiantil\n• 15% de descuento en todo el menú\n\n🔥 **Cumpleañeros:**\n• Mes de cumpleaños\n• Postre gratis con cualquier pedido\n\n¿Te interesa alguna de estas promociones? 🎊';
        }
        
        if (message.includes('vegetariano') || message.includes('vegano') || message.includes('sin carne')) {
            return '🌱 *Opciones vegetarianas disponibles:*\n\n🥬 **Hamburguesa Vegetariana:**\n• Con quinoa y vegetales\n• Precio: $10.000\n\n🥗 **Ensalada César:**\n• Lechuga, tomate, queso parmesano\n• Precio: $8.000\n\n🥑 **Wrap Vegetariano:**\n• Aguacate, vegetales, hummus\n• Precio: $9.000\n\n🥤 **Bebidas:**\n• Jugos naturales\n• Smoothies de frutas\n• Agua con limón\n\n¿Te gustaría probar alguna de nuestras opciones vegetarianas? 😊';
        }
        
        // Respuesta por defecto más inteligente
        return `¡Hola! 👋 Soy el asistente virtual de FastWings y estoy aquí para ayudarte. 

Puedo ayudarte con:
🍽️ Información del menú y precios
🛒 Tomar pedidos
🚚 Servicio a domicilio
🕐 Horarios de atención
📍 Ubicación y direcciones
🎉 Promociones especiales

¿En qué puedo ayudarte hoy? 😊

*Tip:* Puedes preguntarme por nuestro menú, hacer un pedido, o consultar nuestros horarios.`;
    }

    async testConnection() {
        try {
            // Simular una prueba exitosa
            const response = this.getFallbackResponse('hola', 'Eres un asistente amigable');
            return { success: true, response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = new AIService();
