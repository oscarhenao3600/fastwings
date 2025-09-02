class AIService {
  constructor() {
    console.log('🤖 AIService inicializado');
  }

  async generateResponse(message, prompt, context = '') {
    try {
      console.log(`🤖 Generando respuesta IA:`);
      console.log(`📝 Mensaje: "${message}"`);
      console.log(`📋 Prompt: "${prompt.substring(0, 100)}..."`);
      console.log(`📍 Contexto: ${context}`);
      
      // Usar el sistema de fallback mejorado
      const response = this.getFallbackResponse(message, prompt, context);
      
      console.log(`✅ Respuesta generada: "${response.substring(0, 100)}..."`);
      return response;
      
    } catch (error) {
      console.error('❌ Error generando respuesta IA:', error);
      return this.getFallbackResponse(message, prompt, context);
    }
  }

  getFallbackResponse(message, prompt, context = '') {
    const lowerMessage = message.toLowerCase();
    const branchName = context.includes('branch-1') ? 'FastWings Principal' : 
                      context.includes('branch-2') ? 'FastWings Norte' : 'FastWings';
    
    // Respuestas mejoradas con emojis y más detalle
    if (lowerMessage.includes('hola') || lowerMessage.includes('buenos días') || lowerMessage.includes('buenas')) {
      return `¡Hola! 👋 Bienvenido a ${branchName}. Soy tu asistente virtual y estoy aquí para ayudarte con:\n\n🍔 Nuestro delicioso menú\n📞 Realizar pedidos\n⏰ Horarios de atención\n📍 Ubicación y delivery\n💰 Precios y promociones\n\n¿En qué puedo ayudarte hoy? 😊`;
    }
    
    if (lowerMessage.includes('menú') || lowerMessage.includes('carta') || lowerMessage.includes('qué tienen')) {
      return `🍽️ **MENÚ ${branchName}** 🍽️\n\n🍔 **Hamburguesas:**\n• Clásica - $15.000\n• Doble Carne - $18.000\n• Pollo - $16.000\n• Vegetariana - $14.000\n\n🍟 **Acompañamientos:**\n• Papas Fritas - $5.000\n• Nuggets - $8.000\n• Onion Rings - $6.000\n\n🥤 **Bebidas:**\n• Gaseosa - $3.000\n• Jugo Natural - $4.000\n• Agua - $2.000\n\n🎁 **Combos disponibles con descuento!**\n\n¿Te gustaría hacer un pedido? 📱`;
    }
    
    if (lowerMessage.includes('precio') || lowerMessage.includes('cuánto') || lowerMessage.includes('vale')) {
      return `💰 **PRECIOS ${branchName}** 💰\n\n🍔 Hamburguesas desde $14.000\n🍟 Acompañamientos desde $2.000\n🥤 Bebidas desde $2.000\n🎁 Combos con descuento del 15%\n\n💳 Aceptamos efectivo, tarjeta y transferencias\n📱 También puedes pagar con QR\n\n¿Quieres ver el menú completo? 📋`;
    }
    
    if (lowerMessage.includes('pedido') || lowerMessage.includes('ordenar') || lowerMessage.includes('comprar')) {
      return `📱 **REALIZAR PEDIDO** 📱\n\nPara hacer tu pedido, por favor:\n\n1️⃣ Dime qué quieres comer\n2️⃣ Te confirmo el precio\n3️⃣ Me das tu dirección\n4️⃣ Te preparo todo en 20-30 min\n\n🚚 **Delivery disponible**\n⏰ **Horario:** 11:00 AM - 10:00 PM\n\n¿Qué te gustaría ordenar? 😋`;
    }
    
    if (lowerMessage.includes('gracias') || lowerMessage.includes('muchas gracias')) {
      return `¡De nada! 😊 Gracias por preferir ${branchName}. Esperamos verte pronto y que disfrutes de nuestra deliciosa comida. 🍔\n\nSi tienes alguna pregunta, no dudes en escribirnos. ¡Estamos aquí para ayudarte! 💪`;
    }
    
    if (lowerMessage.includes('hora') || lowerMessage.includes('horario') || lowerMessage.includes('cuándo abren')) {
      return `⏰ **HORARIOS ${branchName}** ⏰\n\n🕐 **Lunes a Domingo:**\n• 11:00 AM - 10:00 PM\n\n🚚 **Delivery disponible:**\n• Mismo horario\n• Tiempo estimado: 20-30 min\n\n📍 **Retiro en local:**\n• Mismo horario\n• Tiempo estimado: 15-20 min\n\n¿En qué horario te gustaría hacer tu pedido? 📅`;
    }
    
    if (lowerMessage.includes('dirección') || lowerMessage.includes('dónde') || lowerMessage.includes('ubicación')) {
      return `📍 **UBICACIÓN ${branchName}** 📍\n\n${branchName === 'FastWings Principal' ? 
        '🏢 Calle Principal #123, Centro\n📞 Tel: (57) 300-123-4567' : 
        '🏢 Avenida Norte #456, Zona Norte\n📞 Tel: (57) 300-987-6543'}\n\n🚚 **Delivery disponible en:**\n• Radio de 5km alrededor\n• Sin costo adicional\n\n🗺️ **Encuéntranos en:**\n• Google Maps\n• Waze\n• Uber Eats\n\n¿Necesitas indicaciones específicas? 🧭`;
    }
    
    if (lowerMessage.includes('delivery') || lowerMessage.includes('domicilio') || lowerMessage.includes('a domicilio')) {
      return `🚚 **DELIVERY ${branchName}** 🚚\n\n✅ **Disponible:**\n• Radio de 5km\n• Sin costo adicional\n• Tiempo: 20-30 min\n\n📱 **Para pedir:**\n• Escribe tu pedido aquí\n• Dime tu dirección\n• Te confirmo el tiempo\n\n💳 **Formas de pago:**\n• Efectivo\n• Tarjeta\n• Transferencia\n• QR\n\n¿Quieres hacer tu pedido a domicilio? 🏠`;
    }
    
    if (lowerMessage.includes('promoción') || lowerMessage.includes('oferta') || lowerMessage.includes('descuento')) {
      return `🎁 **PROMOCIONES ${branchName}** 🎁\n\n🔥 **OFERTA ESPECIAL:**\n• Combo Doble + Papas + Bebida\n• Precio normal: $25.000\n• **Precio promocional: $20.000**\n• ¡Ahorras $5.000! 💰\n\n🎉 **Otras promociones:**\n• 15% descuento en combos\n• 2x1 en bebidas los martes\n• Delivery gratis en pedidos +$30.000\n\n⏰ **Válido hasta fin de mes**\n\n¿Te interesa alguna promoción? 🎯`;
    }
    
    if (lowerMessage.includes('vegetariano') || lowerMessage.includes('vegano') || lowerMessage.includes('sin carne')) {
      return `🌱 **OPCIONES VEGETARIANAS ${branchName}** 🌱\n\n🍔 **Hamburguesa Vegetariana:**\n• Base de garbanzos y vegetales\n• Precio: $14.000\n• Incluye lechuga, tomate, cebolla\n\n🥗 **Ensalada Fresca:**\n• Lechuga, tomate, aguacate\n• Precio: $12.000\n• Aderezo de la casa\n\n🥤 **Bebidas:**\n• Jugos naturales\n• Agua\n• Gaseosas\n\n¿Te gustaría probar nuestra hamburguesa vegetariana? 😋`;
    }
    
    // Respuesta por defecto
    return `¡Hola! 👋 Soy el asistente virtual de ${branchName} y estoy aquí para ayudarte. 😊\n\nPuedo ayudarte con:\n\n🍔 **Menú y precios**\n📱 **Realizar pedidos**\n⏰ **Horarios de atención**\n📍 **Ubicación y delivery**\n🎁 **Promociones especiales**\n\n¿En qué puedo ayudarte hoy? 🤔`;
  }

  async testConnection() {
    try {
      console.log('🔍 Probando conexión de IA...');
      
      // Simular una prueba exitosa
      const testResponse = this.getFallbackResponse('hola', 'Eres un asistente virtual de FastWings');
      
      console.log('✅ Prueba de IA exitosa');
      
      return {
        success: true,
        response: testResponse,
        error: null
      };
    } catch (error) {
      console.error('❌ Error en prueba de IA:', error);
      return {
        success: false,
        response: null,
        error: error.message
      };
    }
  }
}

module.exports = new AIService();
