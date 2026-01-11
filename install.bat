@echo off
echo 🤖 Instalador Bot WhatsApp - Barbearia
echo =====================================
echo.

REM Verificar se o Node.js está instalado
echo 🔍 Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo 📥 Por favor, instale o Node.js primeiro:
    echo    https://nodejs.org/
    echo.
    echo    Após instalar, execute este arquivo novamente.
    pause
    exit /b 1
) else (
    echo ✅ Node.js encontrado: 
    node --version
)

echo.
echo 📦 Instalando dependências...
npm install

if %errorlevel% neq 0 (
    echo ❌ Erro ao instalar dependências!
    echo.
    echo 🔧 Tente executar manualmente:
    echo    npm install
    pause
    exit /b 1
)

echo.
echo ✅ Dependências instaladas com sucesso!

REM Criar diretórios necessários
echo.
echo 📁 Criando diretórios...
if not exist "data" (
    mkdir data
    echo ✅ Diretório 'data' criado
)

if not exist "logs" (
    mkdir logs
    echo ✅ Diretório 'logs' criado
)

REM Configurar arquivo .env
echo.
echo ⚙️  Configurando arquivo de ambiente...
if not exist ".env" (
    copy .env.example .env
    echo ✅ Arquivo .env criado
) else (
    echo ⚠️  Arquivo .env já existe
)

echo.
echo 🎉 INSTALAÇÃO CONCLUÍDA!
echo.
echo 📝 PRÓXIMOS PASSOS:
echo.
echo 1. Configure suas credenciais do Mercado Pago no arquivo .env
echo    - MP_ACCESS_TOKEN (seu token de acesso)
echo    - WEBHOOK_URL (URL do seu servidor)
echo.
echo 2. Execute o bot com:
echo    start.bat
echo.
echo 3. Escaneie o QR Code que aparecerá no terminal
echo.
echo 📞 Suporte: (35) 99999-9999
echo 🏪 Barbearia - Rua Antônio Scodeler, 885 - Pouso Alegre/MG
echo.

pause