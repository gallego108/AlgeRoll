# agent.md — AlgeRoll

## 1. Propósito de este archivo

Este documento define las reglas de trabajo para cualquier agente de desarrollo (Codex, OpenCode u otro agente autónomo) que modifique, mantenga o amplíe **AlgeRoll**.

El objetivo es que el agente pueda trabajar sobre el proyecto sin reinterpretar las reglas del juego ni romper decisiones funcionales, visuales o técnicas ya acordadas.

Cuando exista conflicto entre este archivo y una implementación previa defectuosa, **prevalece este archivo** junto con la especificación funcional/técnica del proyecto.

---

# 2. Descripción del producto

**AlgeRoll** es un juego de mesa virtual educativo de álgebra.

El juego se ejecuta en navegador y está diseñado para:

- 1 jugador.
- 2 a 5 jugadores.
- Multijugador local por turnos en un solo dispositivo.
- Sin backend en la versión actual.
- Sin cuentas de usuario.
- Sin conexión a Internet durante la partida.
- Sin generación de imágenes por IA en tiempo de ejecución.

El objetivo es construir expresiones algebraicas a partir de 5 dados especiales y resolver cartas de reto.

---

# 3. Reglas funcionales consolidadas

## 3.1 Dados

Hay exactamente **5 dados**.

Cada dado tiene exactamente estas 6 caras:

- `1`
- `2`
- `x`
- `y`
- `x²`
- `y²`

Las caras opuestas son:

- `1 ↔ 2`
- `x ↔ x²`
- `y ↔ y²`

Todos los dados tienen la misma distribución de caras.

### Requisitos visuales obligatorios

Los dados deben:

- verse como **cubos 3D reales**;
- mostrar sus 6 caras correctamente;
- mostrar los 5 dados simultáneamente;
- permanecer asociados a su identidad individual;
- tener animación de lanzamiento visible y suficientemente lenta;
- no mostrar todos la misma cara por error;
- terminar orientados hacia la cara que corresponde al resultado aleatorio real;
- conservar una representación visible o placeholder si un dado fue arrastrado a una expresión;
- poder seleccionarse individualmente para cartas de ayuda.

### Animación de lanzamiento

El lanzamiento debe:

1. elevar visualmente los dados;
2. hacerlos girar en varios ejes;
3. durar aproximadamente entre **3.5 y 4 segundos**;
4. terminar con una caída suave;
5. orientar cada cubo hacia su resultado real.

No reducir drásticamente esta duración sin una decisión explícita del propietario del proyecto.

---

# 4. Construcción de expresiones

La expresión se construye mediante **4 cajas de términos**.

Siempre deben existir exactamente:

- Término 1
- Término 2
- Término 3
- Término 4

No existe una quinta caja.

El reto "Expresión con 5 términos" fue eliminado y **no debe reintroducirse**.

## 4.1 Operaciones permitidas

Solo están permitidas:

- suma;
- multiplicación.

No están permitidas:

- resta;
- división;
- paréntesis;
- potencias introducidas manualmente.

## 4.2 Semántica de las cajas

Todos los elementos dentro de una misma caja se multiplican.

Ejemplo:

`[2] [x] [x]`

equivale a:

`2 × x × x = 2x²`

Las cajas no vacías se suman entre sí.

Ejemplo:

- Término 1: `[2] [x]`
- Término 2: `[y] [y]`
- Término 3: `[1]`
- Término 4: vacío

Expresión construida:

`2×x + y×y + 1`

Expresión simplificada:

`2x + y² + 1`

## 4.3 Arrastrar y soltar

Los dados deben poder:

- arrastrarse desde la zona de dados hacia una caja;
- moverse de una caja a otra;
- devolverse a la zona de dados;
- reordenarse libremente;
- utilizarse como máximo una vez por reto, salvo que una carta de ayuda permita otra cosa.

Mientras el reto no se haya ganado, el jugador puede modificar libremente la expresión.

---

# 5. Simplificación algebraica

El sistema debe simplificar las expresiones automáticamente.

Ejemplos obligatorios:

- `x × x → x²`
- `y × y → y²`
- `2 × x → 2x`
- `2 × x × x → 2x²`
- `x × y → xy`
- `2 × x × y → 2xy`
- `x + x → 2x`
- `x + x + 1 → 2x + 1`

Los retos se validan contra la **expresión simplificada**.

La simplificación no debe depender de texto renderizado en pantalla. Debe operar sobre una estructura algebraica interna.

---

# 6. Flujo de turno

En su turno el jugador:

1. lanza los 5 dados;
2. puede usar cartas de ayuda;
3. construye una expresión;
4. selecciona un reto;
5. pulsa **Comprobar reto**;
6. si falla:
   - puede modificar la expresión;
   - puede usar ayudas adicionales si corresponde;
   - puede volver a comprobar;
7. si acierta:
   - gana la carta;
   - recibe sus puntos;
   - los dados utilizados quedan bloqueados para un posible segundo reto;
8. puede intentar un segundo reto con los dados restantes;
9. como máximo puede ganar **2 retos por turno**;
10. puede pulsar **Pasar turno**.

---

# 7. Botón "Pasar turno"

Debe existir un botón visible:

**PASAR TURNO**

Comportamiento:

### Si el jugador no consiguió ningún reto

- termina el turno;
- recibe automáticamente **1 carta de ayuda**;
- la carta podrá usarse en el siguiente turno.

### Si consiguió 1 reto

- puede pasar;
- no recibe carta adicional de ayuda.

### Si consiguió 2 retos

- el turno termina normalmente.

El sistema no necesita demostrar matemáticamente que no existe una solución antes de permitir pasar.

La decisión de pasar pertenece al jugador.

---

# 8. Segundo reto del turno

Si el jugador gana un reto:

- los dados usados quedan bloqueados;
- esos dados no pueden reutilizarse en un segundo reto;
- los dados restantes sí pueden usarse;
- las fichas creadas por ayudas deben manejarse según la semántica específica de la carta;
- un mismo dado físico nunca puede contarse dos veces en retos distintos del mismo turno.

---

# 9. Cartas de reto

Debe haber siempre hasta **4 retos visibles** mientras queden cartas disponibles.

Al finalizar un reto o turno, se rellenan los espacios vacíos desde el mazo.

## Puntuación

Sistema actual:

- Fácil: **1 punto**
- Intermedio: **2 puntos**
- Difícil: **3 puntos**

Mantener este sistema salvo cambio explícito.

## Retos pendientes

Existen retos originales cuyo contenido aún no está completamente definido.

Regla:

- **no inventar retos faltantes**;
- no reconstruir texto incompleto por intuición;
- mantenerlos fuera del mazo hasta que sean definidos;
- no volver a agregar el reto eliminado de "5 términos".

---

# 10. Representaciones con algeplano

Algunos retos usan imágenes de algeplano.

Requisitos:

- la imagen debe verse dentro de la carta;
- no debe ser tan pequeña que resulte ilegible;
- al pasar el mouse sobre la carta debe aparecer una **vista ampliada**;
- el preview debe mostrarse centrado y claramente;
- debe permitir identificar cada bloque del algeplano;
- también debe ser accesible mediante foco de teclado cuando sea posible;
- evitar recortes de la figura.

Las imágenes de algeplano pueden utilizarse como assets estáticos.

---

# 11. Cartas de ayuda

Hay ayudas que modifican:

1. dados;
2. términos;
3. expresión;
4. agregan fichas virtuales.

La UI debe hacer evidente qué tipo de selección espera cada carta.

---

# 12. Ayudas sobre dados

Ejemplos:

- volver a tirar hasta N dados;
- volver a tirar los dados que quieras;
- cambiar un dado por su cara opuesta;
- elegir cualquier cara para un dado;
- modificar 2 dados.

Comportamiento recomendado:

1. el usuario selecciona la carta;
2. los dados elegibles se iluminan;
3. el jugador selecciona los dados;
4. confirma;
5. se aplica la acción;
6. la carta se descarta.

Para relanzamientos, usar la misma animación 3D del lanzamiento principal.

---

# 13. Cambiar cara opuesta

Debe respetar exclusivamente:

```text
1  <-> 2
x  <-> x²
y  <-> y²
```

No inferir otras parejas.

---

# 14. Elegir cara de un dado

Cuando una ayuda permita elegir una cara, mostrar las 6 opciones:

- `1`
- `2`
- `x`
- `y`
- `x²`
- `y²`

No pedir entrada de texto libre.

---

# 15. Ayudas que agregan fichas

Algunas cartas pueden añadir:

- `x`;
- `y`;
- `x²`;
- `y²`;
- otros elementos permitidos explícitamente por una carta.

Estas fichas:

- no son dados físicos;
- deben distinguirse visualmente de los dados;
- deben tener una identidad propia;
- deben poder aparecer dentro de una caja de término;
- deben participar correctamente en la simplificación algebraica.

---

# 16. "Añade las X que quieras" / "Añade las Y que quieras"

Estas cartas permiten agregar una cantidad libre de fichas.

Flujo sugerido:

1. seleccionar la carta;
2. seleccionar una caja;
3. mostrar botón `+x` o `+y`;
4. cada clic añade una ficha;
5. ofrecer botón **Confirmar**.

Estas ayudas forman parte de las ayudas de modificación de dados/estructura y pueden utilizarse en la misma fase previa o durante la construcción.

---

# 17. "Añade un término que no tengas"

Comportamiento acordado:

1. se juega la carta;
2. se iluminan las 4 cajas de términos;
3. el jugador elige una caja;
4. aparecen las seis opciones equivalentes a las caras de dado:
   - `1`
   - `2`
   - `x`
   - `y`
   - `x²`
   - `y²`
5. el jugador añade las fichas que quiera en ese término;
6. confirma;
7. la carta se descarta.

La elección se hace visualmente, no mediante texto libre.

---

# 18. Ayudas sobre términos

Ejemplos:

- Multiplica un término por 3.
- Duplica un término.
- Convierte un término en 1.
- Cambia una Y por una X.
- Cambia una X por una Y.
- Cambia una Y² por una X².
- Cambia una X² por una Y².

Flujo:

1. seleccionar la carta;
2. iluminar términos elegibles;
3. seleccionar una caja;
4. aplicar transformación;
5. actualizar la expresión simplificada;
6. descartar la carta.

Ejemplo:

`2x`

con "Multiplica un término por 3":

`6x`

---

# 19. Ayudas sobre la expresión

Cuando una carta afecte la expresión completa:

- no tratarla como una modificación de un dado;
- aplicar la transformación al modelo algebraico;
- recalcular inmediatamente la expresión simplificada;
- reflejar visualmente el cambio.

No modificar únicamente el texto en pantalla.

---

# 20. Mano de ayudas

Cada jugador comienza con:

**2 cartas de ayuda**

Las cartas deben verse físicamente como cartas.

Requisitos visuales:

- formato vertical;
- texto legible;
- diferenciación por tipo;
- hover;
- selección clara;
- estados deshabilitados;
- animación suave;
- no usar únicamente bloques de texto sin diseño de carta.

Una carta usada se descarta.

---

# 21. Inicio de partida

Permitir elegir entre:

- 1 jugador;
- 2 jugadores;
- 3 jugadores;
- 4 jugadores;
- 5 jugadores.

Solicitar el nombre de cada jugador.

---

# 22. Modo un jugador

Objetivo:

**conseguir la máxima puntuación posible hasta que termine la partida**.

No existe puntuación mínima obligatoria.

No introducir temporizador ni límite artificial de turnos salvo decisión posterior.

---

# 23. Multijugador local

Los jugadores usan el mismo navegador/dispositivo.

El juego es por turnos.

Debe mostrarse claramente:

- jugador actual;
- puntuación;
- cartas de ayuda;
- turno;
- retos ganados en ese turno.

## 23.1 Aviso de turno

En partidas de 2 a 5 jugadores, al comenzar cada turno debe aparecer un **popup** que indique el jugador que tiene el turno.

Comportamiento:

- aparece al iniciar la mesa tras la fase de primer jugador;
- aparece cada vez que se pasa el turno al siguiente jugador;
- muestra el nombre del jugador activo y un botón para comenzar el turno;
- no se muestra en el modo de un jugador;
- mientras está visible cubre la mesa para evitar acciones accidentales.

## 23.2 Disposición de la mesa

Las cartas de ayuda deben situarse **a la derecha de los dados** en escritorio, en la misma fila. La mano de ayudas se reparte en varias filas dentro de su panel cuando no cabe en una sola. En pantallas estrechas (hasta 1100 px) la fila se apila en una sola columna, sin reducir los dados ni ocultar cartas.

---

# 24. Empates

Los empates están permitidos.

No aplicar ningún criterio de desempate automático.

Si varios jugadores terminan con la máxima puntuación, todos se consideran ganadores.

---

# 25. Fin de partida

La partida termina cuando se agota uno de los mazos definidos por las reglas originales:

- mazo de ayudas;
- o mazo de retos.

Al terminar:

- sumar puntos;
- mostrar clasificación;
- permitir empate;
- mostrar resultado del modo solitario;
- ofrecer reiniciar partida.

---

# 26. Diseño visual

Usar como referencia los colores y estilo de las instrucciones originales de AlgeRoll.

Identidad aproximada:

- violeta / morado;
- azul;
- amarillo;
- rosa / coral;
- blanco;
- elementos gráficos educativos y juveniles.

El producto debe sentirse como un **juego de mesa**, no como una calculadora.

---

# 27. Estrategia de imágenes

No generar imágenes con IA durante la ejecución.

La aplicación debe funcionar sin APIs de generación de imágenes.

## Usar assets estáticos para

- branding;
- decoraciones;
- algeplano;
- elementos gráficos originales;
- referencias visuales.

## Generar por HTML/CSS/SVG

- dados;
- caras de dados;
- cajas de términos;
- fichas;
- cartas textuales;
- botones;
- estados;
- indicadores;
- resaltados;
- animaciones.

---

# 28. Componentes visuales recomendados

Estructura conceptual:

```text
App
├── StartScreen
├── GameBoard
│   ├── PlayerStatus
│   ├── ChallengeArea
│   │   └── ChallengeCard x4
│   ├── DiceArea
│   │   └── DiceCube x5
│   ├── ExpressionBuilder
│   │   └── TermBox x4
│   ├── HelpHand
│   │   └── HelpCard
│   ├── TurnPopup
│   └── TurnControls
├── ImagePreview
└── EndGameScreen
```

---

# 29. Arquitectura de estado recomendada

Separar:

- estado visual;
- estado de juego;
- modelo algebraico;
- reglas;
- datos de cartas;
- animaciones.

No mezclar toda la lógica en un único archivo.

Ejemplo:

```text
src/
├── components/
├── game/
│   ├── dice/
│   ├── algebra/
│   ├── cards/
│   ├── challenges/
│   ├── rules/
│   └── state/
├── data/
├── styles/
├── assets/
└── tests/
```

Si el proyecto actual no usa React, mantener igualmente separación modular equivalente.

---

# 30. Modelo sugerido de dado

```ts
type DieFace = '1' | '2' | 'x' | 'y' | 'x2' | 'y2';

interface Die {
  id: string;
  face: DieFace;
  location: 'pool' | 'term1' | 'term2' | 'term3' | 'term4' | 'locked';
  locked: boolean;
}
```

No identificar dados únicamente por valor, ya que pueden existir varios con la misma cara.

---

# 31. Modelo sugerido de ficha

```ts
interface Token {
  id: string;
  value: '1' | '2' | 'x' | 'y' | 'x2' | 'y2';
  source: 'die' | 'help-card';
  sourceId?: string;
}
```

---

# 32. Modelo sugerido de término

```ts
interface Term {
  id: string;
  tokens: Token[];
  modifiers: TermModifier[];
}
```

La expresión debe derivarse de los términos, no guardarse solo como string.

---

# 33. Motor algebraico

Debe ser una capa independiente.

Responsabilidades:

- convertir fichas en monomios;
- multiplicar factores;
- combinar términos semejantes;
- calcular coeficientes;
- calcular exponentes;
- detectar `xy`;
- contar términos simplificados;
- evaluar expresiones con valores de variables;
- comparar expresiones;
- soportar validadores de retos.

No usar `eval()`.

---

# 34. Representación algebraica recomendada

Ejemplo:

```ts
interface Monomial {
  coefficient: number;
  xPower: number;
  yPower: number;
}
```

Ejemplo:

`6x²y`

```ts
{
  coefficient: 6,
  xPower: 2,
  yPower: 1
}
```

Una expresión puede representarse como:

```ts
type AlgebraicExpression = Monomial[];
```

Combinar monomios con mismos exponentes.

---

# 35. Validación de retos

Cada reto debe tener lógica explícita.

Ejemplo:

```ts
interface Challenge {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: 1 | 2 | 3;
  label: string;
  validate(expression: AlgebraicExpression): boolean;
}
```

No validar retos mediante comparación con el texto que se muestra en la UI.

---

# 36. Interacción de cartas

Se recomienda una pequeña máquina de estados:

```text
IDLE
ROLLING
BUILDING
SELECTING_HELP_CARD
SELECTING_DICE
SELECTING_TERM
SELECTING_FACE
ADDING_TOKENS
CHECKING_CHALLENGE
CHALLENGE_SUCCESS
TURN_END
GAME_OVER
```

Evitar que el usuario pueda ejecutar acciones incompatibles simultáneamente.

Ejemplo:

- no lanzar mientras una carta espera selección;
- no comprobar mientras los dados están girando;
- no arrastrar un dado bloqueado;
- no usar una carta ya descartada.

---

# 37. Randomness

El resultado de los dados debe ser aleatorio.

Cada dado se lanza independientemente.

Es válido que dos o más dados obtengan la misma cara.

Incluso los cinco dados pueden obtener la misma cara.

Eso no es un error.

El error sería mostrar una cara diferente a la que contiene el estado interno.

---

# 38. Animación de dado 3D

El dado debe tener 6 elementos de cara.

Ejemplo conceptual:

```html
<div class="dice-scene">
  <div class="dice-cube">
    <div class="face face-1">1</div>
    <div class="face face-2">2</div>
    <div class="face face-x">x</div>
    <div class="face face-x2">x²</div>
    <div class="face face-y">y</div>
    <div class="face face-y2">y²</div>
  </div>
</div>
```

Usar:

```css
transform-style: preserve-3d;
perspective: ...;
```

Cada cara debe tener su transformación propia.

La orientación final debe mapear correctamente cada valor a la cara frontal.

No resolver el efecto 3D sustituyendo el cubo por una sola cara 2D.

---

# 39. Accesibilidad mínima

- texto legible;
- contraste suficiente;
- botones con labels claros;
- hover no debe ser la única forma de acceso a información esencial;
- imágenes de retos deben tener texto alternativo;
- soportar `prefers-reduced-motion`;
- mantener foco visible;
- no depender únicamente de color para indicar selección.

---

# 40. Responsive

Objetivo principal:

- escritorio;
- portátil;
- tablet horizontal.

En pantallas pequeñas:

- permitir scroll;
- no reducir los dados hasta hacerlos ilegibles;
- no ocultar cartas;
- no superponer controles;
- apilar en una sola columna la fila dados + ayudas cuando no quepan lado a lado (hasta 1100 px).

---

# 41. Archivo BAT de Windows

El proyecto debe incluir:

```text
AlgeRoll.bat
```

Requisitos:

### Primer doble clic

- detectar si el servidor no está activo;
- iniciar el servicio local;
- abrir el navegador;
- guardar PID o mecanismo equivalente.

### Segundo doble clic

- detectar el servicio activo de AlgeRoll;
- detener solo ese proceso;
- no cerrar procesos Node ajenos;
- limpiar el archivo PID si corresponde.

No usar `taskkill /IM node.exe /F` de forma indiscriminada.

---

# 42. Ejecución local

La versión actual debe poder ejecutarse sin backend externo.

Si se mantiene el enfoque actual sin dependencias:

```bash
node server.js
```

Si se migra a Vite/React:

```bash
npm install
npm run dev
```

En ambos casos, actualizar:

- README;
- BAT;
- scripts;
- documentación.

Nunca dejar instrucciones obsoletas.

---

# 43. Reglas para modificar el proyecto

Antes de realizar cambios:

1. leer este `agent.md`;
2. leer la especificación funcional/técnica;
3. leer el README;
4. inspeccionar el código actual;
5. ejecutar las pruebas existentes;
6. identificar impacto funcional;
7. implementar;
8. volver a ejecutar pruebas;
9. validar manualmente las partes visuales afectadas.

---

# 44. Prohibiciones

No hacer lo siguiente sin autorización explícita:

- agregar un quinto término;
- reintroducir el reto de 5 términos;
- agregar resta;
- agregar división;
- agregar paréntesis;
- reutilizar un dado en dos retos del mismo turno;
- inventar cartas pendientes;
- cambiar las caras del dado;
- cambiar las parejas opuestas;
- eliminar el botón Pasar turno;
- impedir que el jugador reintente un reto fallido;
- introducir desempates;
- añadir backend innecesario;
- añadir login;
- añadir publicidad;
- añadir telemetría;
- generar imágenes mediante IA en tiempo de ejecución;
- sustituir los dados 3D por simples cuadrados sin aprobación.

---

# 45. Pruebas mínimas obligatorias

El proyecto debe tener pruebas para:

## Álgebra

- `x*x = x²`
- `y*y = y²`
- `2*x = 2x`
- `2*x*x = 2x²`
- `x*y = xy`
- combinación de términos semejantes;
- conteo de términos simplificados.

## Dados

- existen 5 dados;
- cada dado usa una de las 6 caras;
- caras opuestas correctas;
- resultado visual coincide con estado;
- reroll modifica solo dados seleccionados.

## Turnos

- máximo 2 retos por turno;
- dados usados quedan bloqueados;
- pasar sin reto entrega ayuda;
- pasar tras 1 reto no entrega ayuda;
- siguiente jugador se activa correctamente.

## Ayudas

- cartas se descartan tras uso;
- selección máxima de dados se respeta;
- modificación de término se aplica al término correcto;
- fichas añadidas participan en álgebra.

## Retos

- puntuación correcta;
- validación sobre expresión simplificada;
- reemplazo de carta al ganar reto;
- no existe reto de 5 términos.

---

# 46. Validación visual obligatoria

Las pruebas unitarias no sustituyen una revisión visual.

Antes de entregar una versión:

- confirmar que los 5 dados se ven;
- confirmar que parecen cubos;
- confirmar que cada cara puede aparecer correctamente;
- lanzar varias veces;
- comprobar que la animación dura lo suficiente;
- probar arrastrar los 5 dados;
- probar cartas de reto con algeplano;
- probar zoom/preview al pasar el mouse;
- probar una ayuda de relanzamiento;
- probar una ayuda de cambio de cara;
- probar una ayuda de término;
- probar Pasar turno;
- probar modo solitario;
- probar 2 jugadores.

---

# 47. Convenciones de código

Preferir:

- funciones pequeñas;
- nombres descriptivos;
- constantes para reglas;
- tipos explícitos;
- datos declarativos para cartas;
- lógica pura para álgebra;
- separación entre UI y reglas.

Evitar:

- números mágicos;
- lógica duplicada;
- mutaciones globales;
- dependencias innecesarias;
- `innerHTML` para datos dinámicos no confiables;
- `eval()`.

---

# 48. Compatibilidad

Objetivo mínimo:

- Chrome actual;
- Edge actual;
- Firefox actual.

La experiencia principal debe funcionar en Windows.

---

# 49. Versionado

Usar versiones semánticas de forma razonable:

```text
v1.2
v1.3
v1.4
...
```

Incrementar versión cuando se entregue un cambio funcional o visual relevante.

Mantener changelog en README o archivo dedicado.

---

# 50. Prioridades del proyecto

Orden de prioridad:

1. reglas correctas;
2. motor algebraico correcto;
3. dados correctos;
4. interacción clara;
5. cartas visibles y legibles;
6. algeplano legible;
7. animaciones;
8. pulido estético.

Nunca sacrificar reglas por efectos visuales.

---

# 51. Criterio de aceptación general

Una versión es aceptable cuando un usuario puede:

1. iniciar el juego;
2. seleccionar jugadores;
3. comenzar partida;
4. lanzar 5 dados;
5. ver los 5 cubos 3D;
6. identificar sus resultados;
7. arrastrarlos a 4 cajas;
8. formar expresiones;
9. ver la simplificación;
10. usar ayudas;
11. seleccionar retos;
12. comprobarlos;
13. ganar hasta 2 retos;
14. pasar turno;
15. recibir ayuda si corresponde;
16. completar una partida;
17. ver puntuaciones finales;
18. jugar nuevamente;
19. visualizar correctamente los retos con algeplano.

---

# 52. Regla final para agentes

Si una regla no está clara:

**no inventarla.**

En caso de duda:

1. conservar el comportamiento actual si no contradice este documento;
2. documentar la duda;
3. solicitar decisión del propietario del proyecto.

El objetivo no es "mejorar" AlgeRoll según criterio propio, sino implementar fielmente el juego definido.
