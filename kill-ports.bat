@echo off
setlocal enabledelayedexpansion

set PORTS=24678 3000 3001 3002 8000 8080

for %%P in (%PORTS%) do (
  echo Checking port %%P...
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr :%%P 2^>nul') do (
    echo Found PID %%I on port %%P; terminating it...
    taskkill /PID %%I /F >nul 2>&1
  )
)

echo Port cleanup complete.
endlocal
