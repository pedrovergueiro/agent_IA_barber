@echo off
echo 🚀 Configurando repositório Git...

REM Inicializar repositório se não existir
if not exist ".git" (
    git init
    echo ✅ Repositório Git inicializado
)

REM Configurar remote origin
git remote remove origin 2>nul
git remote add origin https://github.com/pedrovergueiro/agent_IA_barber.git
echo ✅ Remote origin configurado

REM Adicionar todos os arquivos
git add .
echo ✅ Arquivos adicionados ao staging

REM Commit inicial
git commit -m "🎉 Initial commit: WhatsApp Barber Bot com IA própria

✨ Features implementadas:
- 🤖 IA própria para recomendações personalizadas
- 📱 Sistema completo de agendamento via WhatsApp
- 💳 Integração com Mercado Pago (PIX + Cartão)
- 🎛️ Painel administrativo completo
- 📊 Dashboard com métricas em tempo real
- 🔄 Sistema de reconexão automática
- 📨 Lembretes automáticos inteligentes
- 🌐 Deploy pronto para Vercel
- 📚 Documentação completa

🛠️ Tecnologias:
- Node.js + Express
- WhatsApp Web.js
- SQLite3
- Mercado Pago SDK
- Moment.js
- QRCode

🚀 Pronto para produção!"

echo ✅ Commit realizado

REM Criar branch main se não existir
git branch -M main
echo ✅ Branch main configurada

REM Push para o GitHub
echo 📤 Enviando para o GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo 🎉 SUCESSO! Projeto enviado para o GitHub!
    echo.
    echo 📋 Próximos passos:
    echo 1. Acesse: https://github.com/pedrovergueiro/agent_IA_barber
    echo 2. Configure as GitHub Actions (se necessário^)
    echo 3. Configure deploy no Vercel
    echo 4. Adicione colaboradores (se necessário^)
    echo.
    echo 🔗 Links importantes:
    echo - Repositório: https://github.com/pedrovergueiro/agent_IA_barber
    echo - Issues: https://github.com/pedrovergueiro/agent_IA_barber/issues
    echo - Pull Requests: https://github.com/pedrovergueiro/agent_IA_barber/pulls
    echo.
) else (
    echo ❌ Erro ao enviar para o GitHub
    echo Verifique se:
    echo 1. Você tem acesso ao repositório
    echo 2. Está autenticado no Git
    echo 3. O repositório existe no GitHub
)

pause