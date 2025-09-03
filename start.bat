@echo off
echo ========================================
echo    FastWings WhatsApp System
echo ========================================
echo.

echo Iniciando Backend...
start "Backend" cmd /k "cd backend && npm run dev"

echo Esperando 3 segundos para que el backend inicie...
timeout /t 3 /nobreak > nul

echo Iniciando Frontend...
start "Frontend" cmd /k "cd frontend-admin && npm run dev"

echo.
echo ========================================
echo    Sistema iniciado correctamente
echo ========================================
echo.
echo URLs disponibles:
echo - Frontend: http://localhost:3001
echo - Backend:  http://localhost:4000
echo.
echo Credenciales:
echo - Email: admin@fastwings.com
echo - Password: admin123
echo.
echo Presiona cualquier tecla para cerrar...
pause > nul
