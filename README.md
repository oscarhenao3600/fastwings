# FastWings v4 - Sistema de Pedidos WhatsApp

Sistema completo de gestión de pedidos con integración de WhatsApp por sucursal, desarrollado en Node.js, Express y MongoDB.

## 🚀 Características Principales

### ✅ Sistema de WhatsApp por Sucursal
- **WhatsApp independiente** para cada sucursal
- **QR en Frontend** (no en consola)
- **Sesiones persistentes** (escaneo único)
- **Botón de desvincular** para cambiar números
- **Gestión completa** de conexiones

### ✅ Funcionalidades del Sistema
- **Dashboard completo** con estadísticas
- **Gestión de sucursales** y usuarios
- **Sistema de autenticación** JWT
- **API REST** completa
- **Frontend responsive** con Bootstrap

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **WhatsApp Web.js** - Integración WhatsApp
- **Puppeteer** - Automatización de navegador

### Frontend
- **HTML5** - Estructura
- **CSS3** - Estilos
- **JavaScript (ES6+)** - Lógica del cliente
- **Bootstrap 5** - Framework CSS
- **Font Awesome** - Iconos

## 📋 Requisitos Previos

- **Node.js** (v16 o superior)
- **npm** o **yarn**
- **MongoDB** (opcional, el sistema funciona sin él)

## 🔧 Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd fastwings_v4_es_whatsapp_invoice
```

### 2. Instalar dependencias
```bash
cd backend
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la carpeta `backend`:
```env
# Configuración del servidor
PORT=4000
NODE_ENV=development

# Base de datos (MongoDB)
MONGODB_URI=mongodb://localhost:27017/fastwings

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Super Admin
SUPER_ADMIN_EMAIL=admin@fastwings.com
SUPER_ADMIN_PASSWORD=admin123
SUPER_ADMIN_NAME=Administrador Principal

# WhatsApp
WHATSAPP_PHONE=+573001234567

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_aplicacion

# Branding
BILLING_LOGO=uploads/logo.png
BILLING_FOOTER=FastWings - Sistema de Pedidos WhatsApp
```

### 4. Iniciar el servidor
```bash
# Opción 1: Servidor completo (requiere MongoDB)
npm start

# Opción 2: Servidor de prueba (sin MongoDB)
node complete-server.js
```

## 🌐 Acceso al Sistema

### URLs Disponibles
- **Frontend Principal:** `http://localhost:4000/frontend-admin/super.html`
- **Página de Prueba:** `http://localhost:4000/frontend-admin/test-whatsapp-branch.html`
- **API:** `http://localhost:4000/`

### Credenciales de Acceso
- **Email:** `admin@fastwings.com`
- **Password:** `admin123`

## 📱 Configuración de WhatsApp por Sucursal

### 1. Acceder al Sistema
1. Abrir `http://localhost:4000/frontend-admin/super.html`
2. Hacer login con las credenciales
3. Ir a la sección "WhatsApp" en el menú lateral

### 2. Inicializar WhatsApp
1. Hacer clic en "Conectar" en la sucursal deseada
2. Ingresar el número de WhatsApp (ej: `+573001234567`)
3. Se generará un QR en el frontend
4. Escanear el QR con WhatsApp del número especificado

### 3. Gestión de Conexiones
- **Ver Estado:** Muestra el estado actual de cada sucursal
- **Conectar:** Inicializa WhatsApp para una sucursal
- **Desconectar:** Desconecta WhatsApp temporalmente
- **Desvincular:** Elimina la sesión completamente
- **Ver QR:** Muestra el código QR en un modal

## 🏗️ Estructura del Proyecto

```
fastwings_v4_es_whatsapp_invoice/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── middlewares/
│   │   │   └── auth.js
│   │   ├── models/
│   │   │   ├── Branch.js
│   │   │   ├── Order.js
│   │   │   ├── User.js
│   │   │   └── WhatsAppConfig.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   ├── billing.js
│   │   │   ├── branchWhatsapp.js
│   │   │   ├── orders.js
│   │   │   ├── whatsapp.js
│   │   │   └── whatsappWebhook.js
│   │   ├── services/
│   │   │   ├── adminService.js
│   │   │   ├── branchWhatsappService.js
│   │   │   ├── billingService.js
│   │   │   ├── mailService.js
│   │   │   ├── ocrService.js
│   │   │   ├── orderService.js
│   │   │   ├── paymentValidation.js
│   │   │   ├── twilioProvider.js
│   │   │   ├── whatsappProvider.js
│   │   │   ├── whatsappService.js
│   │   │   └── whatsappWebJsProvider.js
│   │   └── index.js
│   ├── package.json
│   └── complete-server.js
├── frontend-admin/
│   ├── super.html
│   ├── test-whatsapp-branch.html
│   ├── admin.html
│   ├── branch.html
│   └── index.html
├── uploads/
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login de usuario

### Dashboard
- `GET /api/admin/dashboard/stats` - Estadísticas del dashboard

### Sucursales
- `GET /api/admin/branches` - Obtener sucursales
- `POST /api/admin/branches` - Crear sucursal
- `PUT /api/admin/branches/:id` - Actualizar sucursal
- `DELETE /api/admin/branches/:id` - Eliminar sucursal

### WhatsApp por Sucursal
- `GET /api/branch-whatsapp/branches/status` - Estado de WhatsApp de todas las sucursales
- `GET /api/branch-whatsapp/branch/:branchId/status` - Estado de WhatsApp de una sucursal
- `POST /api/branch-whatsapp/branch/:branchId/initialize` - Inicializar WhatsApp
- `POST /api/branch-whatsapp/branch/:branchId/disconnect` - Desconectar WhatsApp
- `POST /api/branch-whatsapp/branch/:branchId/logout` - Desvincular WhatsApp
- `GET /api/branch-whatsapp/branch/:branchId/qr` - Obtener código QR

## 🚨 Notas Importantes

### WhatsApp Web.js
- **Sesiones persistentes:** Una vez escaneado el QR, la sesión se mantiene
- **Archivos de sesión:** Se guardan en `.wwebjs_auth/`
- **Desvincular:** Elimina completamente la sesión y requiere nuevo escaneo

### Seguridad
- **Cambiar JWT_SECRET** en producción
- **Configurar HTTPS** en producción
- **Validar números** de WhatsApp antes de conectar

### Rendimiento
- **MongoDB:** Recomendado para producción
- **Servidor de prueba:** Funciona sin base de datos para desarrollo

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- **Email:** admin@fastwings.com
- **Documentación:** Ver archivos de configuración y comentarios en el código

---

**Desarrollado con ❤️ para FastWings**