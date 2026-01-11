@echo off
echo 🤖 Iniciando Bot WhatsApp - Barbearia
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado! Instale o Node.js primeiro.
    echo 📥 Download: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)

REM Criar diretório de dados se não existir
if not exist "data" (
    mkdir data
    echo ✅ Diretório de dados criado
)

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado!
    echo 📝 Copiando .env.example para .env...
    copy .env.example .env
    echo.
    echo ⚙️  Configure suas credenciais do Mercado Pago no arquivo .env
    echo 📝 Edite o arquivo .env com suas informações antes de continuar
    pause
)

echo.
echo 🚀 Iniciando o bot...
echo 📱 Aguarde o QR Code aparecer para conectar ao WhatsApp
echo.

REM Iniciar o bot
npm start

pause