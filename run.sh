# Scripts para ejecutar FastWings System
# Uso: ./run.sh [backend|frontend|both|test]

echo "🚀 FastWings System - Scripts de Ejecución"
echo "=========================================="

case "$1" in
  "backend")
    echo "🔧 Iniciando Backend..."
    cd backend
    npm run dev
    ;;
  "frontend")
    echo "🎨 Iniciando Frontend..."
    cd frontend-admin
    npm run dev
    ;;
  "both")
    echo "🔧 Iniciando Backend y Frontend..."
    echo "Backend en puerto 4000"
    echo "Frontend en puerto 3001"
    echo ""
    echo "Presiona Ctrl+C para detener ambos"
    cd backend && npm run dev &
    cd ../frontend-admin && npm run dev &
    wait
    ;;
  "test")
    echo "🧪 Ejecutando pruebas..."
    cd backend
    npm run test
    ;;
  *)
    echo "Uso: ./run.sh [backend|frontend|both|test]"
    echo ""
    echo "Comandos disponibles:"
    echo "  backend  - Inicia solo el backend (puerto 4000)"
    echo "  frontend - Inicia solo el frontend (puerto 3001)"
    echo "  both     - Inicia backend y frontend"
    echo "  test     - Ejecuta las pruebas"
    echo ""
    echo "Comandos manuales:"
    echo "  Backend:  cd backend && npm run dev"
    echo "  Frontend: cd frontend-admin && npm run dev"
    ;;
esac
