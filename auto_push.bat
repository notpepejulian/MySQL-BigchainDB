@echo off

REM Cambiar a la rama de caché y hacer un respaldo
REM Cambia a la rama 'cache'
git checkout cache

REM Fusiona los cambios de la rama principal 'main' en la rama 'cache'
git merge main

REM Añade todos los archivos al área de preparación en la rama 'cache'
git add .

REM Realiza un commit en la rama 'cache' con un mensaje que incluye la fecha y hora actuales
git commit -m "Copia de seguridad automática: %date% %time%"

REM Sube los cambios de la rama 'cache' al repositorio remoto
git push origin cache

REM Volver a la rama principal y subir los cambios
REM Cambia de vuelta a la rama principal 'main'
git checkout main

REM Añade todos los archivos al área de preparación en la rama 'main'
git add .

REM Realiza un commit en la rama 'main' con un mensaje que incluye la fecha y hora actuales
git commit -m "Commit automático: %date% %time%"

REM Sube los cambios de la rama 'main' al repositorio remoto
git push origin main

REM Muestra un mensaje indicando que el proceso ha finalizado con éxito
echo Los cambios se han subido al repositorio y la caché se ha actualizado.

REM Pausa la ejecución para que el usuario pueda ver el mensaje antes de que el script termine
pause