# 🚀 FastWings WhatsApp System

Sistema completo para gestión de pedidos por WhatsApp con soporte para PDFs y IA.

## 📋 Comandos de Ejecución

### 🔧 **Backend**
```bash
# Navegar al directorio backend
cd backend

# Instalar dependencias (solo la primera vez)
npm install

# Ejecutar en modo desarrollo (con auto-reload)
npm run dev

# Ejecutar en modo producción
npm start

# Ejecutar pruebas
npm run test
npm run test-pdf
npm run test-curl
```

### 🎨 **Frontend**
```bash
# Navegar al directorio frontend-admin
cd frontend-admin

# Instalar dependencias (solo la primera vez)
npm install

# Ejecutar en modo desarrollo
npm run dev

# Ejecutar en modo producción
npm start
```

### 🚀 **Scripts de Conveniencia**

#### **Windows (PowerShell)**
```powershell
# Iniciar solo backend
.\run.ps1 backend

# Iniciar solo frontend
.\run.ps1 frontend

# Iniciar ambos (backend + frontend)
.\run.ps1 both

# Ejecutar pruebas
.\run.ps1 test
```

#### **Linux/Mac (Bash)**
```bash
# Iniciar solo backend
./run.sh backend

# Iniciar solo frontend
./run.sh frontend

# Iniciar ambos (backend + frontend)
./run.sh both

# Ejecutar pruebas
./run.sh test
```

## 🌐 **URLs de Acceso**

- **Frontend**: `http://localhost:3001`
- **Backend API**: `http://localhost:4000`
- **Archivos PDF**: `http://localhost:4000/uploads/`

## 🔐 **Credenciales de Acceso**

- **Email**: `admin@fastwings.com`
- **Password**: `admin123`

## 📁 **Estructura del Proyecto**

```
fastwings_v4_es_whatsapp_invoice/
├── backend/                 # Servidor Node.js
│   ├── simple-test-server.js
│   ├── package.json
│   ├── uploads/             # Archivos PDF subidos
│   └── test-*.js           # Scripts de prueba
├── frontend-admin/          # Frontend estático
│   ├── index.html
│   ├── package.json
│   └── *.html              # Páginas del sistema
├── run.ps1                 # Script PowerShell
├── run.sh                  # Script Bash
└── README.md
```

## 🎯 **Funcionalidades**

- ✅ **Autenticación JWT**
- ✅ **Gestión de sucursales**
- ✅ **Subida y extracción de PDFs**
- ✅ **API REST completa**
- ✅ **Frontend responsivo**
- ✅ **WhatsApp integration** (estructura lista)
- ✅ **IA integration** (estructura lista)

## 🧪 **Pruebas**

```bash
# Probar funcionalidad básica
npm run test

# Probar subida de PDFs
npm run test-pdf

# Probar con curl
npm run test-curl
```

## 🔧 **Desarrollo**

### **Backend**
- Puerto: 4000
- Auto-reload con nodemon
- Logs detallados

### **Frontend**
- Puerto: 3001
- Servidor estático
- CORS habilitado

## 📞 **Soporte**

Para problemas o preguntas, revisa los logs en la consola donde ejecutas los comandos.