# Scripts para ejecutar FastWings System en Windows
# Uso: .\run.ps1 [backend|frontend|both|test]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

Write-Host "🚀 FastWings System - Scripts de Ejecución" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

switch ($Command) {
    "backend" {
        Write-Host "🔧 Iniciando Backend..." -ForegroundColor Yellow
        Set-Location backend
        npm run dev
    }
    "frontend" {
        Write-Host "🎨 Iniciando Frontend..." -ForegroundColor Yellow
        Set-Location frontend-admin
        npm run dev
    }
    "both" {
        Write-Host "🔧 Iniciando Backend y Frontend..." -ForegroundColor Yellow
        Write-Host "Backend en puerto 4000" -ForegroundColor Cyan
        Write-Host "Frontend en puerto 3001" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Presiona Ctrl+C para detener ambos" -ForegroundColor Red
        
        # Iniciar backend en background
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
        
        # Iniciar frontend
        Set-Location frontend-admin
        npm run dev
    }
    "test" {
        Write-Host "🧪 Ejecutando pruebas..." -ForegroundColor Yellow
        Set-Location backend
        npm run test
    }
    default {
        Write-Host "Uso: .\run.ps1 [backend|frontend|both|test]" -ForegroundColor White
        Write-Host ""
        Write-Host "Comandos disponibles:" -ForegroundColor Cyan
        Write-Host "  backend  - Inicia solo el backend (puerto 4000)" -ForegroundColor White
        Write-Host "  frontend - Inicia solo el frontend (puerto 3001)" -ForegroundColor White
        Write-Host "  both     - Inicia backend y frontend" -ForegroundColor White
        Write-Host "  test     - Ejecuta las pruebas" -ForegroundColor White
        Write-Host ""
        Write-Host "Comandos manuales:" -ForegroundColor Cyan
        Write-Host "  Backend:  cd backend; npm run dev" -ForegroundColor White
        Write-Host "  Frontend: cd frontend-admin; npm run dev" -ForegroundColor White
    }
}
