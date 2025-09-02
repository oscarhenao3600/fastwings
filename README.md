# FastWings WhatsApp Integration System

## 🚀 Sistema Completo de Integración WhatsApp Multi-Sucursal

Sistema automatizado para gestionar múltiples cuentas de WhatsApp por sucursal con IA integrada para respuestas automáticas.

## ✨ Características Principales

### 🔐 **Autenticación y Seguridad**
- Sistema de login con JWT
- Autenticación por roles (super_admin)
- Tokens seguros con expiración de 24h

### 📱 **WhatsApp Multi-Sucursal**
- **Múltiples cuentas simultáneas** por sucursal
- **QR Codes reales** para vinculación de dispositivos
- **Sesiones persistentes** con LocalAuth
- **Reconexión automática** entre reinicios
- **Pool de clientes** independientes por sucursal

### 🤖 **IA Automática Integrada**
- **Respuestas inteligentes** basadas en palabras clave
- **Mensajes personalizables** por sucursal
- **Detección automática** de intenciones del cliente
- **Respuestas contextuales** para restaurante

### 🎯 **Funcionalidades por Sucursal**
- ✅ Conectar/Desconectar WhatsApp
- ✅ Generar QR de vinculación
- ✅ Regenerar QR cuando sea necesario
- ✅ Desvincular sesión completamente
- ✅ Configurar mensajes personalizados
- ✅ Enviar mensajes de prueba
- ✅ Monitoreo de estado en tiempo real

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **WhatsApp**: whatsapp-web.js con Puppeteer
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Autenticación**: JWT (JSON Web Tokens)
- **QR Codes**: qrcode library
- **Base de Datos**: LocalAuth (sesiones persistentes)

## 📋 Requisitos del Sistema

- Node.js v16 o superior
- NPM o Yarn
- Chrome/Chromium (para Puppeteer)
- Conexión a internet estable

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/oscarhenao3600/fastwings.git
cd fastwings
```

### 2. Instalar Dependencias
```bash
cd backend
npm install
```

### 3. Configurar Variables de Entorno
```bash
# Crear archivo .env en backend/
CHROME_PATH=/path/to/chrome  # Opcional: ruta a Chrome/Chromium
```

### 4. Iniciar el Servidor
```bash
node simple-test-server.js
```

### 5. Acceder al Sistema
- **URL**: http://localhost:4000/frontend-admin/super.html
- **Usuario**: admin@fastwings.com
- **Contraseña**: admin123

## 📱 Configuración de WhatsApp

### 1. Conectar Sucursal
1. Acceder al dashboard
2. Ir a la sección "WhatsApp"
3. Seleccionar sucursal
4. Click en "Conectar WhatsApp"
5. Ingresar número de teléfono

### 2. Vincular Dispositivo
1. Se generará un QR code real
2. Escanear con WhatsApp desde el móvil
3. Confirmar vinculación
4. ¡Listo! IA automática activada

### 3. Personalizar Mensajes
- Ir a "Configurar Mensajes"
- Editar respuestas por categoría:
  - Bienvenida
  - Menú
  - Pedidos
  - Despedida

## 🤖 Sistema de IA Automática

### Respuestas Inteligentes
El bot responde automáticamente a:

| Palabra Clave | Respuesta |
|---------------|-----------|
| `hola`, `buenos días` | Mensaje de bienvenida |
| `menú`, `comida` | Información del menú |
| `pedido`, `ordenar` | Confirmación de pedido |
| `horario`, `abierto` | Horarios de atención |
| `entrega`, `delivery` | Información de entregas |
| `precio`, `costo` | Información de precios |
| `gracias` | Mensaje de despedida |
| `ayuda` | Lista de servicios |

### Personalización por Sucursal
- Cada sucursal puede tener mensajes únicos
- Configuración independiente
- Respuestas contextuales

## 🔧 Endpoints API

### Autenticación
- `POST /api/auth/login` - Login de usuario

### Sucursales
- `GET /api/admin/branches` - Listar sucursales
- `GET /api/branch-whatsapp/branches/status` - Estado de WhatsApp

### WhatsApp por Sucursal
- `POST /api/branch-whatsapp/branch/:id/initialize` - Inicializar WhatsApp
- `POST /api/branch-whatsapp/branch/:id/regenerate-qr` - Regenerar QR
- `GET /api/branch-whatsapp/branch/:id/qr` - Obtener QR
- `POST /api/branch-whatsapp/branch/:id/disconnect` - Desconectar
- `POST /api/branch-whatsapp/branch/:id/logout` - Desvincular sesión
- `GET /api/branch-whatsapp/branch/:id/status` - Estado de sucursal

### Mensajes y IA
- `GET /api/branch-whatsapp/branch/:id/messages` - Obtener mensajes
- `POST /api/branch-whatsapp/branch/:id/messages` - Actualizar mensajes
- `GET /api/branch-whatsapp/ai-status` - Estado de IA

## 📊 Monitoreo y Logs

### Logs del Sistema
El backend genera logs detallados:
```
📱 ===== QR REAL GENERADO =====
📍 Sucursal: branch-1
🔑 Client ID: branch_branch-1
⏰ Timestamp: 2025-01-02T10:30:00.000Z
📱 ============================

📨 ===== MENSAJE RECIBIDO =====
📍 Sucursal: branch-1
👤 De: 573001234567@c.us
💬 Mensaje: hola
🤖 Respuesta IA: ¡Hola! Bienvenido a FastWings...
✅ Respuesta enviada exitosamente
```

### Estados de Conexión
- `disconnected` - No conectado
- `initializing` - Inicializando
- `qr_ready` - QR disponible
- `connected` - Conectado y listo
- `auth_failure` - Error de autenticación

## 🔄 Gestión de Sesiones

### Persistencia de Datos
- **LocalAuth**: Almacena sesiones automáticamente
- **Reconexión automática**: No requiere QR cada vez
- **Datos por sucursal**: Independientes entre sucursales

### Desvinculación Completa
- Elimina todos los datos de sesión
- Requiere nuevo QR para reconectar
- Limpia completamente el estado

## 🎨 Interfaz de Usuario

### Dashboard Principal
- **Métricas en tiempo real**
- **Estado de todas las sucursales**
- **Acceso rápido a funciones**

### Gestión de WhatsApp
- **Botones intuitivos** para cada acción
- **Estados visuales** con badges de color
- **QR codes integrados** en la interfaz
- **Mensajes de feedback** en tiempo real

## 🚨 Solución de Problemas

### QR No Se Genera
1. Verificar que el servidor esté corriendo
2. Revisar logs del backend
3. Intentar "Regenerar QR"
4. Verificar conexión a internet

### IA No Responde
1. Confirmar que WhatsApp esté conectado
2. Verificar logs de mensajes
3. Revisar configuración de mensajes
4. Probar con palabras clave conocidas

### Error de Conexión
1. Verificar puerto 4000 disponible
2. Revisar firewall/antivirus
3. Confirmar dependencias instaladas
4. Revisar logs de error

## 🔒 Seguridad

### Autenticación
- Tokens JWT con expiración
- Middleware de autenticación
- Validación de roles

### WhatsApp
- Sesiones locales seguras
- No almacena contraseñas
- Conexiones cifradas

## 📈 Próximas Mejoras

- [ ] Integración con base de datos real
- [ ] Panel de administración avanzado
- [ ] Reportes de conversaciones
- [ ] Integración con CRM
- [ ] Webhooks para eventos
- [ ] API pública para desarrolladores

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Soporte

- **Email**: admin@fastwings.com
- **Issues**: [GitHub Issues](https://github.com/oscarhenao3600/fastwings/issues)
- **Documentación**: Este README

---

## 🎉 ¡Sistema Listo para Producción!

El sistema está completamente funcional y listo para manejar múltiples sucursales con WhatsApp automatizado. ¡Disfruta de la integración perfecta entre tecnología y servicio al cliente!