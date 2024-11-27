@echo off

REM Crear copia de seguridad en caché
set CACHE_DIR=%cd%\cache
if not exist "%CACHE_DIR%" (
    mkdir "%CACHE_DIR%"
)
xcopy /E /I /Y "%cd%" "%CACHE_DIR%" >nul

REM Subir los cambios al repositorio
git add .
git commit -m "Commit automático: %date% %time%"
git push origin main

echo Los archivos se han subido y la copia de seguridad está en %CACHE_DIR%.
pause
