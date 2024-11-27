@echo off
git add .
git commit -m "Actualización automática: %date% %time%"
git push origin main
pause