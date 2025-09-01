// ===== FUNCIONES DE WHATSAPP =====

async function loadWhatsAppStatus() {
    try {
        const response = await makeRequest('/whatsapp-manager/status');
        updateWhatsAppStatus(response);
    } catch (error) {
        showAlert('Error cargando estado de WhatsApp: ' + error.message, 'danger');
    }
}

function updateWhatsAppStatus(data) {
    const { status, stats } = data;
    
    // Actualizar estado de conexión
    const statusText = document.getElementById('statusText');
    const providerText = document.getElementById('providerText');
    const primaryNumber = document.getElementById('primaryNumber');
    
    statusText.textContent = getStatusText(status.status);
    statusText.className = `badge bg-${getStatusColor(status.status)}`;
    providerText.textContent = status.provider || 'whatsapp-web.js';
    primaryNumber.textContent = status.primaryNumber || '+573001234567';
    
    // Actualizar estadísticas
    document.getElementById('messagesSentToday').textContent = stats.messagesSentToday || 0;
    document.getElementById('messagesReceivedToday').textContent = stats.messagesReceivedToday || 0;
    document.getElementById('lastResetDate').textContent = stats.lastResetDate ? 
        new Date(stats.lastResetDate).toLocaleDateString('es-CO') : '-';
    
    // Mostrar/ocultar QR code
    const qrContainer = document.getElementById('qrCodeContainer');
    if (status.qrCode) {
        qrContainer.style.display = 'block';
        displayQRCode(status.qrCode);
    } else {
        qrContainer.style.display = 'none';
    }
}

function getStatusText(status) {
    const statusMap = {
        'connected': 'Conectado',
        'disconnected': 'Desconectado',
        'qr_ready': 'QR Listo',
        'auth_failed': 'Error de Autenticación',
        'connecting': 'Conectando...'
    };
    return statusMap[status] || status;
}

function getStatusColor(status) {
    const colorMap = {
        'connected': 'success',
        'disconnected': 'secondary',
        'qr_ready': 'warning',
        'auth_failed': 'danger',
        'connecting': 'info'
    };
    return colorMap[status] || 'secondary';
}

function displayQRCode(qrData) {
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = `<img src="data:image/png;base64,${qrData}" alt="QR Code" style="max-width: 200px;">`;
}

async function connectWhatsApp() {
    try {
        const response = await makeRequest('/whatsapp-manager/initialize', {
            method: 'POST'
        });
        
        showAlert('WhatsApp inicializado exitosamente', 'success');
        await loadWhatsAppStatus();
        
    } catch (error) {
        showAlert('Error conectando WhatsApp: ' + error.message, 'danger');
    }
}

async function disconnectWhatsApp() {
    try {
        const response = await makeRequest('/whatsapp-manager/disconnect', {
            method: 'POST'
        });
        
        showAlert('WhatsApp desconectado exitosamente', 'success');
        await loadWhatsAppStatus();
        
    } catch (error) {
        showAlert('Error desconectando WhatsApp: ' + error.message, 'danger');
    }
}

async function refreshWhatsAppStatus() {
    await loadWhatsAppStatus();
    showAlert('Estado actualizado', 'info');
}

async function resetWhatsAppStats() {
    try {
        const response = await makeRequest('/whatsapp-manager/stats/reset', {
            method: 'POST'
        });
        
        showAlert('Estadísticas reseteadas exitosamente', 'success');
        await loadWhatsAppStatus();
        
    } catch (error) {
        showAlert('Error reseteando estadísticas: ' + error.message, 'danger');
    }
}

async function handleWhatsAppConfig(e) {
    e.preventDefault();
    
    const configData = {
        provider: document.getElementById('whatsappProvider').value,
        primary_number: document.getElementById('whatsappPrimaryNumber').value,
        is_active: document.getElementById('whatsappActive').checked
    };

    try {
        const response = await makeRequest('/whatsapp-manager/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(configData)
        });
        
        showAlert('Configuración de WhatsApp guardada exitosamente', 'success');
        
    } catch (error) {
        showAlert('Error guardando configuración: ' + error.message, 'danger');
    }
}

async function handleWhatsAppMessages(e) {
    e.preventDefault();
    
    const messagesData = {
        welcome_message: document.getElementById('welcomeMessage').value,
        auto_reply_message: document.getElementById('autoReplyMessage').value,
        order_confirmation_message: document.getElementById('orderConfirmMessage').value
    };

    try {
        const response = await makeRequest('/whatsapp-manager/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messagesData)
        });
        
        showAlert('Mensajes de WhatsApp guardados exitosamente', 'success');
        
    } catch (error) {
        showAlert('Error guardando mensajes: ' + error.message, 'danger');
    }
}

async function handleTestMessage(e) {
    e.preventDefault();
    
    const testNumber = document.getElementById('testNumber').value;
    const testMessage = document.getElementById('testMessage').value;
    
    if (!testNumber || !testMessage) {
        showAlert('Por favor completa todos los campos', 'warning');
        return;
    }

    try {
        const response = await makeRequest('/whatsapp-manager/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: testNumber,
                message: testMessage
            })
        });
        
        showAlert('Mensaje de prueba enviado exitosamente', 'success');
        
    } catch (error) {
        showAlert('Error enviando mensaje de prueba: ' + error.message, 'danger');
    }
}

// Función para hacer requests (asumiendo que existe en el contexto)
async function makeRequest(endpoint, options = {}) {
    const url = `http://localhost:4000/api${endpoint}`;
    const config = {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            ...options.headers
        },
        ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
    }

    return data;
}

// Función para mostrar alertas (asumiendo que existe en el contexto)
function showAlert(message, type) {
    const container = document.getElementById('alertContainer');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    container.innerHTML = '';
    container.appendChild(alert);

    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

