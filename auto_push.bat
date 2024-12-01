@echo off

REM Cambiar a la rama de caché y hacer un respaldo
git checkout cache
git merge main
git add .
git commit -m "Copia de seguridad automática: %date% %time%"
git push origin cache

REM Volver a la rama principal y subir los cambios
git checkout main
git add .
git commit -m "Commit automático: %date% %time%"
git push origin main

echo Los cambios se han subido al repositorio y la caché se ha actualizado.
pause

