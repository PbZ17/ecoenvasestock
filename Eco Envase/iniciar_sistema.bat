@echo off
title Eco Envase - Sistema de Control de Stock y Balances
echo ========================================================
echo        ECO ENVASE - CONTROL DE STOCK Y BALANCES
echo ========================================================
echo.
echo Iniciando Servidor Backend (PostgreSQL / Express)...
start "Eco Envase Backend" cmd /k "cd server && npm.cmd run dev"

echo.
echo Iniciando Interfaz Web (React / Vite)...
start "Eco Envase Frontend" cmd /k "cd client && npm.cmd run dev"

echo.
echo ========================================================
echo   El sistema estara disponible en tu navegador en:
echo   http://localhost:3000
echo ========================================================
echo.
pause
