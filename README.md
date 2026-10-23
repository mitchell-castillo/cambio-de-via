# Cambio de vía

Juego original de Daily Games para el **21 de octubre de 2026**. Seis puzles ferroviarios de dificultad progresiva: orienta las agujas, prepara las rutas y da la salida simultánea a los trenes. Cada letra debe llegar a su propio andén. Los puentes cruzan dos rutas sin unirlas.

La mecánica combina conectividad, bifurcaciones y rutas simultáneas. Cada plano tiene exactamente una solución, comprobada exhaustivamente entre todas sus configuraciones. No utiliza deslizamiento inercial, apuntado continuo ni gestión de recursos.

## Ejecutar y probar

Requiere Node.js 22 o posterior. No hay dependencias que instalar ni compilación.

```sh
npm start
# http://127.0.0.1:8080
npm run check
```

La variable PORT permite cambiar el puerto. Sirve el juego por HTTP: los módulos ES no funcionan abriendo index.html mediante file://.

`npm run check` comprueba sintaxis y ejecuta 21 pruebas con el runner nativo de Node. Incluye soluciones únicas, todos los errores de una sola aguja, vías y puentes, ausencia de mutaciones, colisiones de frente, cruces simultáneos, destinos incorrectos, vías cortadas, bucles y recuperación del almacenamiento. El workflow `.github/workflows/check.yml` ejecuta las mismas comprobaciones en cada push y pull request, sin secretos.

## Controles y avance

- Toca o pulsa una aguja naranja para alternar su ramal. Las vías oscuras están conectadas; las punteadas están cerradas.
- Tab recorre los controles. En el plano, las flechas recorren las agujas y Enter/Espacio las cambian.
- Dentro del juego, Z deshace, R abre la confirmación de reinicio, P pausa/continúa y Escape vuelve al plano.
- «Paso a paso» mueve los trenes un tramo; «Dar salida» inicia la simulación. «Volver al plano» permite editar. La simulación se pausa al ocultar la pestaña.
- No hay reloj ni límite de intentos. Se mide el número de cambios. Las estaciones se desbloquean en orden y pueden repetirse.

Clave exclusiva de localStorage: `daily-games:cambio-de-via:v1`. El formato versión 1 guarda `currentLevel`, `completed[index].bestMoves` y `attempts[index]` (configuración, cambios e historial de hasta 200 acciones). Es compatible con el lector de resúmenes del catálogo. Cambiar de estación o recargar conserva los intentos; una simulación interrumpida vuelve al plano. Reiniciar una estación conserva las estaciones resueltas y las mejores marcas.

Si el almacenamiento está bloqueado o lleno, el juego sigue funcionando y muestra un aviso. El avance pertenece a este navegador y no se sincroniza. No hay cuentas, telemetría, cookies ni recursos externos.

## Publicación independiente

Este paquete no acredita una publicación pública. Publicar en un repositorio público independiente usando el acceso existente autorizado. Las rutas relativas y `.nojekyll` admiten el prefijo del repositorio. Pages puede publicar `main` desde `/ (root)` una vez configurado por una persona o conexión con el permiso existente necesario.

Antes de añadir la ficha al catálogo, verificar el workflow del SHA exacto, la URL real devuelta por Pages, los módulos/estilos/iconos, una estación completa y la restauración del avance en escritorio y móvil. El código desplegado debe coincidir con los bytes probados. La portada original está en `assets/cover.svg`.

El catálogo vive por separado en `daily-games`. No integrar buzón, contadores ni estadísticas en este repositorio.

## Archivos

- `levels.js`: planos originales y estados iniciales.
- `core.js`: simulador puro y comprobador exhaustivo de soluciones.
- `storage.js`: avance propio y recuperación defensiva.
- `app.js`, `index.html`, `styles.css`: interfaz adaptable sin dependencias.
- `assets/`: portada e icono SVG originales.
- `tests/`: pruebas del motor y almacenamiento.
- `tools/serve.mjs`: servidor limitado a la carpeta del juego y a loopback.

## QA antes de publicar

Comprobar rutas cortadas, los seis destinos, puentes, desbloqueo, teclado, pausa, deshacer, confirmación/cancelación del reinicio y restauración tras recargar. Revisar 320 px, 390 px y escritorio; distinguir emulación de un dispositivo táctil físico. Repetir las comprobaciones en la URL pública del SHA desplegado. El QA local no sustituye la comprobación remota.
