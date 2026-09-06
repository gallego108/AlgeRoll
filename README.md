# AlgeRoll · Versión definitiva 1.2

Versión local jugable de **AlgeRoll · Desafíos algebraicos**, construida a partir de las instrucciones, cartas y decisiones funcionales documentadas en `AlgeRoll_Especificacion_Funcional_Tecnica.md`.

Esta edición incorpora el acabado visual definitivo del prototipo: **dados cúbicos 3D con seis caras reales, lanzamiento con giro tridimensional, cartas de reto y ayuda dibujadas como cartas físicas, animaciones de entrada, selección, caída de fichas y celebraciones visuales**. Todo funciona de forma local y sin generación de imágenes por IA durante la partida.

## Inicio rápido en Windows

No es necesario ejecutar `npm install`: el juego no utiliza dependencias externas en tiempo de ejecución.

1. Instala **Node.js LTS** si no está instalado.
2. Haz doble clic en **`AlgeRoll.bat`**.
3. Se iniciará un servidor local en `http://127.0.0.1:4173/` y se abrirá el navegador predeterminado.
4. Para **cerrar el servicio**, vuelve a hacer doble clic en **el mismo `AlgeRoll.bat`**.

El BAT guarda únicamente el PID del proceso local en `.algeroll-server.pid`. Cuando se vuelve a ejecutar, detiene ese proceso y elimina el archivo PID. No cierra otros procesos de Node.js.

### Si el BAT no inicia

Revisa:

- `algeroll-server.log`
- `algeroll-server-error.log`

El puerto por defecto es `4173`.

## Inicio desde terminal

```bash
node server.mjs --port 4173
```

Después abre `http://127.0.0.1:4173/`.

## Pruebas

```bash
npm test
```

La entrega se valida con el runner integrado de Node.js y no descarga dependencias.

## Novedades visuales de la versión 1.2

- **Cinco dados cúbicos 3D reales en CSS**, cada uno con las seis caras físicas `1`, `2`, `x`, `y`, `x²`, `y²`. En reposo se aprecia volumen (cara principal, lateral y superior/inferior), no una simple cara plana.
- **Giro 3D más lento y legible**: el lanzamiento dura aproximadamente 3,5–3,9 segundos incluyendo los pequeños desfases entre dados, para apreciar con claridad el giro y la caída.
- **Corrección de orientación de caras**: la orientación del resultado y la inclinación visual del cubo usan envolventes 3D separadas; así `1`, `2`, `x`, `x²`, `y` y `y²` quedan vinculadas de forma fiable a la cara obtenida.
- **Cinco posiciones de dado siempre visibles** en la bandeja. Mientras un dado está dentro de un término, su posición original queda marcada como “En la expresión”, evitando que parezca que faltan dados.
- **Etiqueta redundante del resultado** debajo de cada cubo (`1`, `2`, `x`, `x²`, `y`, `y²`) para que el resultado sea inequívoco aun durante la transición visual.
- **Vista ampliada del algeplano**: al pasar el cursor por una carta de reto con algeplano (o enfocarla con teclado), se abre automáticamente una previsualización grande y centrada de la figura.
- Las caras opuestas se representan también físicamente en el cubo: `1↔2`, `x↔x²`, `y↔y²`.
- Al pulsar **Lanzar dados**, cada cubo se eleva, rota sobre los tres ejes y cae mostrando el resultado aleatorio.
- Los relanzamientos de cartas de ayuda reutilizan la misma animación 3D solo sobre los dados seleccionados.
- Los dados colocados dentro de los términos conservan una representación tridimensional compacta.
- **Cartas de reto** con formato físico, esquinas de puntuación, cinta de dificultad, ilustración o símbolo central y animación de reparto.
- Colores de dificultad: fácil, intermedio y difícil según la identidad visual del material original.
- **Cartas de ayuda** en formato vertical con cabecera, categoría, iconografía, texto, código y estado de uso.
- La mano de ayudas se presenta como una hilera de cartas ligeramente abanicas y se eleva al pasar el cursor.
- Estados visuales claros de carta seleccionada, no aplicable, dado bloqueado, objetivo de una ayuda y caja activa.
- Animación de caída al introducir dados o fichas en un término.
- Mensajes animados de éxito/error.
- Confeti visual al superar retos y al finalizar la partida.
- Respeto de `prefers-reduced-motion`: si el sistema solicita menos movimiento, las animaciones intensas se reducen.

## Funcionalidad incluida

- 1 a 5 jugadores en un único dispositivo.
- Modo solitario de máxima puntuación.
- Fase de **Empieza quien saque 1** en multijugador.
- 5 dados especiales con `1`, `2`, `x`, `y`, `x²`, `y²`.
- Caras opuestas: `1↔2`, `x↔x²`, `y↔y²`.
- 4 cajas fijas de términos.
- Drag and drop de dados entre la reserva y los términos.
- Alternativa accesible por clic: selecciona un dado/factor y luego una caja.
- Multiplicación dentro de cada caja y suma entre cajas.
- Simplificación algebraica automática.
- 20 retos activos ya definidos; **no se incluye el reto de 5 términos**.
- 4 retos visibles simultáneamente.
- Validación automática de retos.
- Retos de evaluación numérica con entrada de respuesta cuando corresponde.
- 40 cartas de ayuda según la distribución documentada.
- Ayudas sobre dados, factores, términos y expresión.
- Fichas virtuales visualmente distintas de los dados.
- Hasta 2 retos por turno con bloqueo de dados físicos ya usados.
- Botón **Pasar turno**; si no se consiguió ningún reto, el jugador roba 1 ayuda.
- Puntuación: fácil 1, intermedio 2, difícil 3.
- Final por agotamiento de uno de los mazos y empates válidos.
- Assets visuales originales incluidos localmente.
- Sin generación de imágenes por IA ni llamadas de red durante una partida.

## Tecnología

La aplicación utiliza **JavaScript modular, HTML y CSS**, sin frameworks ni dependencias de navegador externas. Los cubos 3D se construyen mediante `transform-style: preserve-3d`, perspectiva y seis planos HTML/CSS; no son GIF, vídeo ni imágenes prerenderizadas.

Esto permite que cada dado pueda cambiar de cara, girar, seleccionarse, arrastrarse, bloquearse y relanzarse dinámicamente sin necesitar recursos gráficos adicionales.

```text
AlgeRoll_Definitivo/
├── AlgeRoll.bat
├── server.mjs
├── index.html
├── styles.css
├── src/
│   ├── app.js
│   ├── algebra.js
│   ├── challengeEngine.js
│   ├── constants.js
│   ├── utils.js
│   └── data/
│       ├── challenges.js
│       └── helpCards.js
├── assets/
│   ├── brand/
│   ├── algebra_tiles/
│   └── references/
├── tests/
├── AlgeRoll_Especificacion_Funcional_Tecnica.md
└── docs/
    └── fuentes/
```

## Reglas importantes implementadas

- No hay paréntesis, resta ni división.
- Los factores pueden ordenarse libremente.
- Cada dado físico solo se puede usar una vez dentro de una expresión.
- El orden visual de los factores se conserva, pero la validación utiliza la expresión simplificada.
- Un dado usado para ganar el primer reto queda bloqueado para el posible segundo reto del turno.
- Si una comprobación falla, el jugador puede reorganizar su expresión y volver a intentarlo.
- Las fichas creadas por ayudas pertenecen al intento actual.
- Las modificaciones físicas de dados mediante cartas persisten durante el turno.
- Las modificaciones de la expresión se reinician al pasar al segundo reto.
- El reto “Expresión donde un término sea el doble de otro” se comprueba sobre la estructura de las cajas antes de combinar términos semejantes.

## Fuente funcional

Consulta `AlgeRoll_Especificacion_Funcional_Tecnica.md` para el detalle completo de reglas, cartas, retos, diseño, arquitectura y criterios de aceptación.
