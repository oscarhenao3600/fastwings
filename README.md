
# FastWings v4 (Español) — Sistema Completo de Pedidos WhatsApp

🚀 **Sistema completo de pedidos por WhatsApp con panel administrador en Español**

## ✨ Características Principales

- **Backend completo** con Node.js + Express
- **Base de datos** PostgreSQL con migraciones Knex
- **Frontend responsive** con Bootstrap 5
- **Sistema de roles** (Super Admin, Admin, Usuario Sucursal)
- **Gestión de sucursales** y usuarios
- **Procesamiento de pedidos** por WhatsApp
- **Generación automática** de facturas PDF
- **Envío de facturas** por WhatsApp
- **Dashboard completo** con estadísticas en tiempo real

## 🏗️ Arquitectura del Sistema

```
fastwings_v4_es_whatsapp_invoice/
├── backend/                 # Servidor Node.js
│   ├── src/
│   │   ├── routes/         # Rutas de la API
│   │   ├── middlewares/    # Middlewares de autenticación
│   │   ├── services/       # Servicios de negocio
│   │   └── config/         # Configuración de BD
│   ├── migrations/         # Migraciones de la base de datos
│   └── uploads/            # Archivos subidos (logos, comprobantes)
├── frontend-admin/          # Panel de administración
│   ├── index.html          # Login
│   ├── super.html          # Dashboard Super Admin
│   ├── admin.html          # Dashboard Admin
│   └── branch.html         # Dashboard Usuario Sucursal
└── README.md               # Este archivo
```

## 🚀 Instalación Rápida

### 1. Prerrequisitos
- Node.js 16+ 
- PostgreSQL 12+
- npm o yarn

### 2. Clonar y configurar
```bash
git clone <tu-repositorio>
cd fastwings_v4_es_whatsapp_invoice
```

### 3. Configurar Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb fastwings

# Configurar variables de entorno
cd backend
copy env.example .env
# Editar .env con tus credenciales de BD
```

### 4. Instalar dependencias y configurar BD
```bash
cd backend
npm install
npm run migrate
npm run seed
```

### 5. Iniciar el sistema
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend (opcional, puedes abrir directamente los archivos HTML)
cd ../frontend-admin
# Abrir index.html en tu navegador
```

## 🔧 Configuración Detallada

### Variables de Entorno (.env)
```env
# Servidor
PORT=4000
NODE_ENV=development

# Base de Datos
DB_TYPE=pg
SQL_HOST=localhost
SQL_PORT=5432
SQL_USER=postgres
SQL_PASSWORD=tu_password
SQL_DATABASE=fastwings

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Super Admin
SUPER_ADMIN_EMAIL=admin@fastwings.com
SUPER_ADMIN_PASSWORD=admin123
SUPER_ADMIN_NAME=Administrador Principal
```

### Base de Datos
El sistema crea automáticamente:
- **Tabla `branches`**: Sucursales del negocio
- **Tabla `users`**: Usuarios del sistema con roles
- **Tabla `orders`**: Pedidos de los clientes

## 👥 Roles y Permisos

### 🔴 Super Admin
- Gestión completa de sucursales
- Crear y gestionar usuarios
- Acceso total al sistema
- Estadísticas globales

### 🟡 Admin
- Gestionar pedidos de su sucursal
- Generar facturas
- Ver estadísticas de sucursal
- Gestionar usuarios de sucursal

### 🟢 Usuario Sucursal
- Ver pedidos de su sucursal
- Actualizar estados de pedidos
- Generar facturas básicas

## 📱 Funcionalidades de WhatsApp

### Webhook de Entrada
- Recibe mensajes de WhatsApp
- Procesa pedidos automáticamente
- Interpreta texto y imágenes
- Crea pedidos en la base de datos

### Envío de Facturas
- Genera PDF automáticamente
- Envía por WhatsApp al cliente
- Notificaciones de estado

## 🎯 Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Login de usuarios
- `GET /api/auth/profile` - Perfil del usuario
- `PUT /api/auth/change-password` - Cambiar contraseña

### Administración
- `GET /api/admin/branches` - Listar sucursales
- `POST /api/admin/branches` - Crear sucursal
- `GET /api/admin/users` - Listar usuarios
- `POST /api/admin/users` - Crear usuario

### Pedidos
- `POST /api/orders` - Crear pedido
- `GET /api/orders` - Listar pedidos
- `PATCH /api/orders/:id/status` - Actualizar estado
- `GET /api/orders/dashboard/stats` - Estadísticas

### WhatsApp
- `POST /api/whatsapp/webhook` - Webhook de entrada
- `GET /api/whatsapp/test` - Probar conexión

### Facturación
- `POST /api/billing/generate/:orderId` - Generar factura
- `POST /api/billing/send/:branchId` - Enviar facturas
- `GET /api/billing/stats` - Estadísticas de facturación

## 🎨 Frontend

### Características
- **Responsive design** con Bootstrap 5
- **Iconos FontAwesome** para mejor UX
- **Temas personalizados** por rol
- **Dashboard interactivo** con estadísticas
- **Modales** para acciones rápidas

### Navegación
- **Login único** con redirección por rol
- **Sidebar** con navegación intuitiva
- **Breadcrumbs** para orientación
- **Alertas** para feedback del usuario

## 🧪 Testing y Demo

### Probar el Sistema
```bash
# 1. Simular pedido por WhatsApp
curl -X POST http://localhost:4000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"from":"+573001234567","text":"Quiero 2 hamburguesas y 1 bebida"}'

# 2. Ver pedidos creados
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:4000/api/orders

# 3. Generar factura
curl -X POST \
  -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:4000/api/billing/generate/1
```

### Credenciales de Demo
- **Email**: admin@fastwings.com
- **Password**: admin123
- **Rol**: Super Admin

## 🚀 Despliegue en Producción

### 1. Configuración de Seguridad
```env
NODE_ENV=production
JWT_SECRET=secret_muy_largo_y_complejo_aqui
HTTPS=true
```

### 2. Base de Datos
- Usar PostgreSQL en servidor dedicado
- Configurar backups automáticos
- Optimizar índices para producción

### 3. Servidor
- Usar PM2 o similar para gestión de procesos
- Configurar Nginx como proxy reverso
- Implementar rate limiting
- Configurar logs y monitoreo

### 4. WhatsApp en Producción
- Integrar con proveedor oficial (Twilio, etc.)
- Configurar webhooks seguros
- Implementar manejo de errores robusto

## 🐛 Solución de Problemas

### Errores Comunes

#### 1. Error de Conexión a BD
```bash
# Verificar que PostgreSQL esté corriendo
pg_ctl status

# Verificar credenciales en .env
# Probar conexión manual
psql -h localhost -U postgres -d fastwings
```

#### 2. Error de Migraciones
```bash
# Revertir migraciones
npx knex migrate:rollback --knexfile knexfile.js

# Ejecutar migraciones desde cero
npx knex migrate:latest --knexfile knexfile.js
```

#### 3. Error de Permisos en Uploads
```bash
# Verificar permisos del directorio
chmod 755 backend/uploads
chown node:node backend/uploads
```

## 📚 Recursos Adicionales

### Documentación
- [Knex.js](http://knexjs.org/) - Query builder
- [Express.js](https://expressjs.com/) - Framework web
- [Bootstrap 5](https://getbootstrap.com/) - CSS framework
- [PDFKit](https://pdfkit.org/) - Generación de PDFs

### Herramientas Recomendadas
- **Postman** - Testing de API
- **pgAdmin** - Administración de PostgreSQL
- **VS Code** - Editor de código
- **Git** - Control de versiones

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: soporte@fastwings.com
- **Documentación**: [Wiki del proyecto]
- **Issues**: [GitHub Issues]

---

## 🎉 ¡Listo para tu Presentación!

Tu sistema FastWings v4 está completamente funcional con:

✅ **Backend completo** con todas las APIs  
✅ **Frontend responsive** con dashboards por rol  
✅ **Base de datos** con migraciones y seed data  
✅ **Sistema de autenticación** JWT  
✅ **Gestión de pedidos** y facturación  
✅ **Integración WhatsApp** simulada  
✅ **Generación de PDFs** automática  

**¡Perfecto para tu presentación de las 5pm!** 🚀
