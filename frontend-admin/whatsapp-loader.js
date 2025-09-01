// Cargador de la sección de WhatsApp
async function loadWhatsAppSection() {
    try {
        const response = await fetch('whatsapp-section.html');
        const html = await response.text();
        
        // Insertar después de billingSection
        const billingSection = document.getElementById('billingSection');
        if (billingSection) {
            billingSection.insertAdjacentHTML('afterend', html);
        }
        
        // Agregar event listeners
        addWhatsAppEventListeners();
        
        console.log('Sección de WhatsApp cargada exitosamente');
    } catch (error) {
        console.error('Error cargando sección de WhatsApp:', error);
    }
}

// Agregar event listeners para WhatsApp
function addWhatsAppEventListeners() {
    // Forms
    const whatsappConfigForm = document.getElementById('whatsappConfigForm');
    const whatsappMessagesForm = document.getElementById('whatsappMessagesForm');
    const testMessageForm = document.getElementById('testMessageForm');
    
    if (whatsappConfigForm) {
        whatsappConfigForm.addEventListener('submit', handleWhatsAppConfig);
    }
    if (whatsappMessagesForm) {
        whatsappMessagesForm.addEventListener('submit', handleWhatsAppMessages);
    }
    if (testMessageForm) {
        testMessageForm.addEventListener('submit', handleTestMessage);
    }
    
    // Buttons
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const refreshStatusBtn = document.getElementById('refreshStatusBtn');
    const resetStatsBtn = document.getElementById('resetStatsBtn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWhatsApp);
    }
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWhatsApp);
    }
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', refreshWhatsAppStatus);
    }
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', resetWhatsAppStats);
    }
}

// Función para mostrar la sección de WhatsApp
function showWhatsAppSection() {
    // Ocultar todas las secciones
    const sections = ['dashboardSection', 'branchesSection', 'usersSection', 'ordersSection', 'billingSection', 'whatsappSection', 'settingsSection'];
    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Mostrar sección de WhatsApp
    const whatsappSection = document.getElementById('whatsappSection');
    if (whatsappSection) {
        whatsappSection.style.display = 'block';
        // Cargar estado inicial
        loadWhatsAppStatus();
    }
}

// Cargar la sección cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    loadWhatsAppSection();
});



