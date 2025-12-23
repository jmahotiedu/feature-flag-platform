@echo off
setlocal

if "%~1"=="" goto :usage

if /I "%~1"=="setup" (
  npm run setup
  exit /b %errorlevel%
)
if /I "%~1"=="build" (
  npm run build
  exit /b %errorlevel%
)
if /I "%~1"=="test" (
  npm run test
  exit /b %errorlevel%
)
if /I "%~1"=="lint" (
  npm run lint
  exit /b %errorlevel%
)
if /I "%~1"=="typecheck" (
  npm run typecheck
  exit /b %errorlevel%
)
if /I "%~1"=="dev-up" (
  npm run dev-up
  exit /b %errorlevel%
)
if /I "%~1"=="dev-down" (
  npm run dev-down
  exit /b %errorlevel%
)
if /I "%~1"=="bench" (
  npm run bench
  exit /b %errorlevel%
)
if /I "%~1"=="bench:sdk" (
  npm run bench:sdk
  exit /b %errorlevel%
)

echo Unknown make target: %~1
goto :usage

:usage
echo Usage: make ^<setup^|build^|test^|lint^|typecheck^|dev-up^|dev-down^|bench^|bench:sdk^>
exit /b 1
