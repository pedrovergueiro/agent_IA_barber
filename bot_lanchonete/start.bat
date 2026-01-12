@echo off
title Bot Lanchonete - WhatsApp
color 0A

echo.
echo ========================================
echo   🍕 BOT LANCHONETE - WHATSAPP
echo ========================================
echo.
echo 🚀 Iniciando sistema de pedidos...
echo 📱 Delivery automatizado via WhatsApp
echo 🔧 Painel administrativo integrado
echo.

REM Verificar se Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js nao encontrado!
    echo    Instale o Node.js primeiro
    pause
    exit /b 1
)

REM Verificar se as dependencias estao instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
)

REM Verificar arquivo .env
if not exist ".env" (
    echo ⚠️ Arquivo .env nao encontrado!
    echo    Copie o .env.example e configure suas informacoes
    echo.
    echo    cp .env.example .env
    echo.
    pause
    exit /b 1
)

echo ✅ Sistema verificado com sucesso!
echo.
echo 🍕 Iniciando Bot da Lanchonete...
echo 📱 Acesse http://localhost:3001/qr para conectar
echo.
echo ========================================
echo   LOGS DO SISTEMA (Ctrl+C para parar)
echo ========================================
echo.

REM Iniciar o bot
npm start

echo.
echo ========================================
echo   BOT FINALIZADO
echo ========================================
echo.
pause