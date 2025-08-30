# 📋 INSTRUCCIONES DE INSTALACIÓN - FastWings v4 con MongoDB

## 🎯 **OBJETIVO**
Instalar y configurar FastWings v4 con MongoDB en tu sistema local.

---

## 📋 **PRERREQUISITOS**

### **Software Requerido:**
- ✅ Node.js 16+ 
- ✅ npm o yarn
- ✅ MongoDB 4.4+
- ✅ Git

### **Verificar Instalaciones:**
```bash
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Verificar MongoDB
mongo --version

# Verificar Git
git --version
```

---

## 🚀 **PASO A PASO - INSTALACIÓN COMPLETA**

### **PASO 1: Instalar MongoDB**

#### **Windows:**
1. Descargar MongoDB Community Server desde [mongodb.com](https://www.mongodb.com/try/download/community)
2. Ejecutar el instalador
3. Seleccionar "Complete" installation
4. Instalar MongoDB Compass (opcional pero recomendado)
5. Iniciar MongoDB desde Servicios de Windows

#### **macOS:**
```bash
# Instalar con Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community
```

#### **Ubuntu/Debian:**
```bash
# Importar clave pública
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Agregar repositorio
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Actualizar e instalar
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### **PASO 2: Clonar el Proyecto**
```bash
# Clonar el repositorio
git clone <tu-repositorio>
cd fastwings_v4_es_whatsapp_invoice

# Verificar estructura
ls -la
```

### **PASO 3: Configurar Variables de Entorno**
```bash
# Navegar al backend
cd backend

# Copiar archivo de ejemplo
copy env.example .env

# Editar .env con tus configuraciones
notepad .env
```

#### **Contenido del archivo .env:**
```env
# Configuración del servidor
PORT=4000
NODE_ENV=development

# Base de datos MongoDB
MONGODB_URI=mongodb://localhost:27017/fastwings

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Super Admin
SUPER_ADMIN_EMAIL=admin@fastwings.com
SUPER_ADMIN_PASSWORD=admin123
SUPER_ADMIN_NAME=Administrador Principal

# WhatsApp (opcional para demo)
WHATSAPP_PHONE=+573001234567

# Email (opcional para demo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_aplicacion

# Branding (opcional)
BILLING_LOGO=uploads/logo.png
BILLING_FOOTER=FastWings - Sistema de Pedidos WhatsApp
```

### **PASO 4: Instalar Dependencias**
```bash
# Instalar dependencias del backend
npm install

# Verificar que no hay errores
npm list
```

### **PASO 5: Crear Base de Datos y Datos Iniciales**
```bash
# Ejecutar seed para crear datos iniciales
npm run seed
```

#### **Verificar que el seed funcionó:**
```bash
# Conectar a MongoDB
mongo fastwings

# Verificar colecciones
show collections

# Verificar datos
db.branches.find()
db.users.find()
db.orders.find()

# Salir de MongoDB
exit
```

### **PASO 6: Iniciar el Sistema**
```bash
# Terminal 1: Iniciar backend
npm run dev

# Terminal 2: Abrir frontend (opcional)
cd ../frontend-admin
# Abrir index.html en tu navegador
```

### **PASO 7: Verificar Instalación**
```bash
# Probar API
curl http://localhost:4000

# Debería responder:
# {"message":"FastWings API v4 - Sistema de Pedidos WhatsApp (MongoDB)"}
```

---

## 🧪 **PRUEBAS DE FUNCIONALIDAD**

### **1. Probar Login**
- Abrir: http://localhost:4000
- Login: admin@fastwings.com
- Password: admin123

### **2. Probar APIs**
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fastwings.com","password":"admin123"}'

# Ver sucursales
curl -H "Authorization: Bearer TU_TOKEN" \
  http://localhost:4000/api/admin/branches

# Simular pedido WhatsApp
curl -X POST http://localhost:4000/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"from":"+573001234567","text":"Quiero 2 hamburguesas"}'
```

### **3. Verificar Base de Datos**
```bash
# Conectar a MongoDB
mongo fastwings

# Ver estadísticas
db.stats()

# Ver índices
db.branches.getIndexes()
db.users.getIndexes()
db.orders.getIndexes()

# Salir
exit
```

---

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Configurar MongoDB para Producción**
```bash
# Crear usuario administrador
mongo admin
use admin
db.createUser({
  user: "admin",
  pwd: "password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase","readWriteAnyDatabase"]
})

# Configurar autenticación
sudo nano /etc/mongod.conf
# Agregar:
# security:
#   authorization: enabled

# Reiniciar MongoDB
sudo systemctl restart mongod
```

### **Configurar Variables de Entorno para Producción**
```env
NODE_ENV=production
MONGODB_URI=mongodb://admin:password@localhost:27017/fastwings?authSource=admin
JWT_SECRET=secret_muy_largo_y_complejo_aqui
HTTPS=true
```

### **Configurar Logs**
```bash
# Ver logs de MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Ver logs de la aplicación
npm run dev 2>&1 | tee app.log
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **MongoDB no inicia**
```bash
# Verificar estado
sudo systemctl status mongod

# Verificar logs
sudo journalctl -u mongod

# Verificar puerto
netstat -an | grep 27017

# Reiniciar servicio
sudo systemctl restart mongod
```

### **Error de conexión a MongoDB**
```bash
# Verificar que MongoDB esté corriendo
mongo --version

# Probar conexión
mongo fastwings --eval "db.version()"

# Verificar URI en .env
echo $MONGODB_URI

# Verificar firewall
sudo ufw status
```

### **Error de dependencias**
```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar versiones
npm list
```

### **Error de permisos**
```bash
# Verificar permisos del directorio
ls -la backend/

# Cambiar permisos si es necesario
chmod 755 backend/uploads
chown -R $USER:$USER backend/
```

### **Base de datos vacía**
```bash
# Verificar que el seed se ejecutó
npm run seed

# Verificar datos manualmente
mongo fastwings --eval "db.users.find()"

# Si no hay datos, ejecutar seed manualmente
node src/seed/seed_superadmin.js
```

---

## 📊 **MONITOREO Y MANTENIMIENTO**

### **Comandos Útiles de MongoDB**
```bash
# Ver estadísticas de la base de datos
mongo fastwings --eval "db.stats()"

# Ver colecciones
mongo fastwings --eval "show collections"

# Verificar índices
mongo fastwings --eval "db.orders.getIndexes()"

# Backup de la base de datos
mongodump --db fastwings --out backup/

# Restaurar backup
mongorestore --db fastwings backup/fastwings/
```

### **Monitoreo de Rendimiento**
```bash
# Ver procesos de MongoDB
mongo admin --eval "db.currentOp()"

# Ver estadísticas de operaciones
mongo fastwings --eval "db.orders.stats()"

# Verificar uso de memoria
mongo admin --eval "db.serverStatus().mem"
```

---

## 🎉 **VERIFICACIÓN FINAL**

### **Checklist de Instalación:**
- ✅ MongoDB instalado y corriendo
- ✅ Proyecto clonado
- ✅ Variables de entorno configuradas
- ✅ Dependencias instaladas
- ✅ Base de datos creada con datos iniciales
- ✅ Backend iniciado sin errores
- ✅ APIs respondiendo correctamente
- ✅ Frontend accesible
- ✅ Login funcionando
- ✅ Datos visibles en MongoDB

### **Comandos de Verificación:**
```bash
# Verificar todo en una vez
echo "=== VERIFICACIÓN COMPLETA ==="
echo "1. MongoDB:"
mongo --version
echo "2. Node.js:"
node --version
echo "3. Base de datos:"
mongo fastwings --eval "db.stats()" --quiet
echo "4. Backend:"
curl -s http://localhost:4000
echo "5. Datos iniciales:"
mongo fastwings --eval "db.users.count()" --quiet
echo "=== VERIFICACIÓN COMPLETADA ==="
```

---

## 📚 **RECURSOS ADICIONALES**

### **Documentación:**
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Node.js Documentation](https://nodejs.org/docs/)

### **Herramientas Recomendadas:**
- **MongoDB Compass**: GUI para MongoDB
- **Postman**: Testing de APIs
- **VS Code**: Editor con extensiones para MongoDB
- **Git**: Control de versiones

### **Comandos de Desarrollo:**
```bash
# Modo desarrollo con auto-reload
npm run dev

# Modo producción
npm start

# Ejecutar tests (si existen)
npm test

# Linting (si configurado)
npm run lint
```

---

**¡INSTALACIÓN COMPLETADA! 🚀**

Tu sistema FastWings v4 con MongoDB está listo para usar.
