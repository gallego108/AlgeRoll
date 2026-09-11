import { FACES, FACE_LABELS, OPPOSITE_FACE, DIFFICULTY, DICE_COUNT, TERM_BOX_COUNT, VISIBLE_CHALLENGES, MAX_CHALLENGES_PER_TURN } from './constants.js';
import {
  faceToMonomial,
  simplifyTerm,
  polynomialFromTerms,
  renderPolynomial,
  renderMonomial,
  polynomialEquals,
  countTerms,
  hasQuadraticTerm,
  hasStructuralDoubleTerm,
  evaluatePolynomial,
  sameMonomial,
  monomialIsSafe,
  polynomialIsSafe,
} from './algebra.js';
import { HELP_CARD_DEFINITIONS, buildHelpDeck } from './data/helpCards.js';
import { CHALLENGES } from './data/challenges.js';
import { validateChallenge as validateChallengeRule } from './challengeEngine.js';
import { shuffle, uid, escapeHtml } from './utils.js';

const app = document.querySelector('#app');

const state = {
  screen: 'setup',
  setupCount: 1,
  setupNames: ['Jugador 1'],
  players: [],
  currentPlayerIndex: 0,
  starterIndex: 0,
  starterLastRoll: null,
  starterRolling: false,
  helpDeck: [],
  helpDiscard: [],
  challengeDeck: [],
  visibleChallenges: [],
  dice: [],
  terms: [],
  globalConstantDelta: 0,
  selectedChallengeId: null,
  evaluationAnswer: '',
  hasRolled: false,
  turnWins: 0,
  rollingDice: new Set(),
  rollingDisplay: new Map(),
  rollingTumble: new Map(),
  starterTumble: null,
  message: null,
  interaction: null,
  moveSelection: null,
  gameEndReason: '',
  turnPopup: false,
};

function createEmptyTerm(index) {
  return { id: `term-${index + 1}`, factors: [], operations: [] };
}

function resetAttempt() {
  state.terms = Array.from({ length: TERM_BOX_COUNT }, (_, i) => createEmptyTerm(i));
  state.globalConstantDelta = 0;
  state.selectedChallengeId = null;
  state.evaluationAnswer = '';
  state.interaction = null;
  state.moveSelection = null;
}

function resetTurn() {
  resetAttempt();
  state.hasRolled = false;
  state.turnWins = 0;
  state.dice = Array.from({ length: DICE_COUNT }, (_, i) => ({
    id: `die-${i + 1}`,
    face: FACES[Math.floor(Math.random() * FACES.length)],
    locked: false,
  }));
  state.rollingDice = new Set();
  state.rollingDisplay = new Map();
  state.rollingTumble = new Map();
  state.starterTumble = null;
  state.message = null;
  state.turnPopup = false;
}

function setMessage(text, type = 'info') {
  state.message = { text, type };
}

function currentPlayer() {
  return state.players[state.currentPlayerIndex];
}

function diceById() {
  return new Map(state.dice.map((d) => [d.id, d]));
}

function dieLocation(dieId) {
  for (let i = 0; i < state.terms.length; i += 1) {
    if (state.terms[i].factors.some((f) => f.kind === 'die' && f.dieId === dieId)) return i;
  }
  return null;
}

function effectiveFaceForFactor(factor) {
  if (factor.kind === 'die') {
    const die = state.dice.find((d) => d.id === factor.dieId);
    return factor.overrideFace || die?.face || null;
  }
  return factor.face || null;
}

function usedPhysicalDiceIds() {
  return new Set(state.terms.flatMap((term) => term.factors.filter((f) => f.kind === 'die').map((f) => f.dieId)));
}

function nonEmptyExpression() {
  return state.terms.some((t) => t.factors.length > 0) || state.globalConstantDelta > 0;
}

function expressionPoly() {
  return polynomialFromTerms(state.terms, diceById(), state.globalConstantDelta);
}

function pointsFor(challenge) {
  return DIFFICULTY[challenge.difficulty].points;
}

function randomFace() {
  return FACES[Math.floor(Math.random() * FACES.length)];
}

// Variantes de giro: '' usa el giro base (cube-tumble-3d-v13). Todas las
// variantes terminan en la identidad para que el reposo muestre una sola cara.
const DICE_TUMBLE_VARIANTS = ['', 'tumble-b', 'tumble-c', 'tumble-d', 'tumble-e', 'tumble-f'];

function randomTumbleVariant() {
  return DICE_TUMBLE_VARIANTS[Math.floor(Math.random() * DICE_TUMBLE_VARIANTS.length)];
}

// Asigna variantes distintas a los dados de un lanzamiento para que cada uno
// gire de forma visiblemente diferente.
function distinctTumbleVariants(count) {
  const pool = shuffle([...DICE_TUMBLE_VARIANTS]);
  return pool.slice(0, count);
}

function buildPlayers() {
  return Array.from({ length: state.setupCount }, (_, i) => ({
    id: `player-${i + 1}`,
    name: (state.setupNames[i] || '').trim() || `Jugador ${i + 1}`,
    score: 0,
    hand: [],
    wonChallenges: [],
  }));
}

function startGame() {
  state.players = buildPlayers();
  state.helpDeck = shuffle(buildHelpDeck());
  state.helpDiscard = [];
  state.challengeDeck = shuffle(CHALLENGES.map((c) => ({ ...c })));
  state.visibleChallenges = [];
  for (let i = 0; i < VISIBLE_CHALLENGES; i += 1) {
    const card = state.challengeDeck.shift();
    if (card) state.visibleChallenges.push(card);
  }
  for (const player of state.players) {
    player.hand = [];
    for (let i = 0; i < 2; i += 1) {
      const card = state.helpDeck.shift();
      if (card) player.hand.push(card);
    }
  }
  state.currentPlayerIndex = 0;
  state.starterIndex = 0;
  state.starterLastRoll = null;
  state.gameEndReason = '';
  resetTurn();
  state.screen = state.players.length === 1 ? 'game' : 'starter';
  render();
}

async function rollStarterDie() {
  if (state.starterRolling) return;
  const face = randomFace();
  state.starterRolling = true;
  state.starterLastRoll = face;
  state.starterTumble = randomTumbleVariant();
  render();
  await wait(STARTER_DIE_ROLL_DURATION_MS);
  state.starterRolling = false;
  state.starterTumble = null;
  if (face === '1') {
    state.currentPlayerIndex = state.starterIndex;
    setMessage(`${state.players[state.starterIndex].name} ha sacado 1 y comienza la partida.`, 'success');
    render();
    await wait(900);
    state.screen = 'game';
    resetTurn();
    if (state.players.length > 1) state.turnPopup = true;
  } else {
    state.starterIndex = (state.starterIndex + 1) % state.players.length;
  }
  render();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Duración deliberadamente pausada para que se aprecie el giro tridimensional de los dados.
// Incluye un pequeño margen adicional sobre la animación CSS y sus desfases entre dados.
const DICE_ROLL_DURATION_MS = 3850;
const STARTER_DIE_ROLL_DURATION_MS = 3650;

function celebrate(kind = 'success') {
  if (typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.body?.appendChild) return;
  const layer = document.createElement('div');
  layer.className = `celebration-layer ${kind}`;
  layer.setAttribute('aria-hidden', 'true');
  const symbols = kind === 'final' ? ['★','✦','◆','●','▲'] : ['★','✦','●','◆'];
  layer.innerHTML = Array.from({ length: kind === 'final' ? 48 : 28 }, (_, i) => {
    const x = (i * 37) % 100;
    const delay = ((i * 17) % 30) / 100;
    const duration = 0.9 + ((i * 13) % 55) / 100;
    const rotate = (i * 47) % 360;
    return `<span style="--x:${x}%;--delay:${delay}s;--duration:${duration}s;--rotate:${rotate}deg">${symbols[i % symbols.length]}</span>`;
  }).join('');
  document.body.appendChild(layer);
  window.setTimeout(() => layer.remove(), kind === 'final' ? 2200 : 1600);
}

async function animateDiceRoll(ids) {
  const validIds = ids.filter((id) => state.dice.some((d) => d.id === id && !d.locked));
  if (!validIds.length) return;

  // Elegimos el resultado antes de iniciar la animación. Durante el giro el cubo muestra
  // físicamente sus seis caras; al finalizar queda orientado hacia el resultado elegido.
  const variants = distinctTumbleVariants(validIds.length);
  validIds.forEach((id, index) => {
    state.rollingDice.add(id);
    state.rollingDisplay.set(id, randomFace());
    state.rollingTumble.set(id, variants[index] || '');
  });
  render();
  await wait(DICE_ROLL_DURATION_MS);

  validIds.forEach((id) => {
    const die = state.dice.find((d) => d.id === id);
    die.face = state.rollingDisplay.get(id) || randomFace();
    state.rollingDice.delete(id);
    state.rollingDisplay.delete(id);
    state.rollingTumble.delete(id);
  });
  render();
}

async function launchDice() {
  if (state.hasRolled || state.rollingDice.size) return;
  state.hasRolled = true;
  state.message = null;
  await animateDiceRoll(state.dice.map((d) => d.id));
  setMessage('Dados listos. Arrástralos a las cajas para construir tu expresión.', 'info');
  render();
}

function findChallenge(id) {
  return state.visibleChallenges.find((c) => c.id === id);
}

function validateChallenge(challenge) {
  return validateChallengeRule(challenge, {
    poly: expressionPoly(),
    terms: state.terms,
    diceById: diceById(),
    evaluationAnswer: state.evaluationAnswer,
  });
}

async function checkChallenge() {
  if (!state.hasRolled) {
    setMessage('Primero debes lanzar los dados.', 'warning');
    render();
    return;
  }
  if (!nonEmptyExpression()) {
    setMessage('Construye una expresión antes de comprobar el reto.', 'warning');
    render();
    return;
  }
  if (!polynomialIsSafe(expressionPoly())) {
    setMessage('La expresión excede el rango numérico seguro del prototipo. Reduce el tamaño del coeficiente antes de comprobar.', 'warning');
    render();
    return;
  }
  if (!state.selectedChallengeId) {
    setMessage('Selecciona una carta de reto.', 'warning');
    render();
    return;
  }
  const challenge = findChallenge(state.selectedChallengeId);
  if (!challenge) return;
  if (challenge.validator.type === 'EVALUATE_AND_ANSWER' && state.evaluationAnswer.trim() === '') {
    setMessage('Escribe tu resultado numérico antes de comprobar.', 'warning');
    render();
    return;
  }

  if (!validateChallenge(challenge)) {
    setMessage('Todavía no cumple el reto. Puedes modificar la expresión y volver a intentarlo.', 'error');
    render();
    return;
  }

  const player = currentPlayer();
  const points = pointsFor(challenge);
  player.score += points;
  player.wonChallenges.push(challenge);
  const usedIds = usedPhysicalDiceIds();
  state.dice.forEach((d) => { if (usedIds.has(d.id)) d.locked = true; });
  state.visibleChallenges = state.visibleChallenges.filter((c) => c.id !== challenge.id);
  state.turnWins += 1;
  setMessage(`¡Reto conseguido! +${points} ${points === 1 ? 'punto' : 'puntos'}.`, 'success');
  celebrate('success');

  if (state.turnWins >= MAX_CHALLENGES_PER_TURN) {
    render();
    await wait(1100);
    endTurn(false);
    return;
  }

  resetAttempt();
  setMessage(`¡Reto conseguido! +${points}. Puedes intentar un segundo reto con los dados restantes o pasar turno.`, 'success');
  render();
}

function drawHelpForCurrentPlayer() {
  const card = state.helpDeck.shift();
  if (card) currentPlayer().hand.push(card);
  return card;
}

function refillChallenges() {
  while (state.visibleChallenges.length < VISIBLE_CHALLENGES && state.challengeDeck.length > 0) {
    state.visibleChallenges.push(state.challengeDeck.shift());
  }
}

function shouldGameEndAfterTurn() {
  if (state.helpDeck.length === 0) return 'Se ha agotado el mazo de cartas de ayuda.';
  if (state.challengeDeck.length === 0) return 'Se ha agotado el mazo de cartas de reto.';
  if (state.visibleChallenges.length < VISIBLE_CHALLENGES) return 'No quedan suficientes retos para completar la mesa.';
  return '';
}

function endTurn(voluntary = true) {
  if (!state.hasRolled && voluntary) return;
  if (state.turnWins === 0) {
    const drawn = drawHelpForCurrentPlayer();
    if (drawn) setMessage(`${currentPlayer().name} recibe una carta de ayuda por terminar sin reto.`, 'info');
  }
  refillChallenges();
  const endReason = shouldGameEndAfterTurn();
  if (endReason) {
    state.gameEndReason = endReason;
    state.screen = 'final';
    render();
    celebrate('final');
    return;
  }
  state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  resetTurn();
  if (state.players.length > 1) state.turnPopup = true;
  render();
}

function closeTurnPopup() {
  state.turnPopup = false;
  render();
}

function passTurn() {
  if (!state.hasRolled) {
    setMessage('El botón Pasar turno se habilita después de lanzar los dados.', 'warning');
    render();
    return;
  }
  endTurn(true);
}

function openHelpCard(instanceId) {
  if (!state.hasRolled) {
    setMessage('Las cartas de ayuda se usan después de lanzar los dados.', 'warning');
    render();
    return;
  }
  const card = currentPlayer().hand.find((c) => c.instanceId === instanceId);
  if (!card) return;
  state.moveSelection = null;
  state.interaction = {
    card,
    selectedDice: [],
    selectedTerms: [],
    selectedFactor: null,
    faceChoices: {},
    count: card.min || 1,
    newFaces: [],
  };
  state.message = null;
  render();
}

function cancelHelp() {
  state.interaction = null;
  render();
}

function consumeHelp(card) {
  const player = currentPlayer();
  const idx = player.hand.findIndex((c) => c.instanceId === card.instanceId);
  if (idx >= 0) player.hand.splice(idx, 1);
  state.helpDiscard.push(card);
  state.interaction = null;
}

function toggleInteractionDie(dieId) {
  const interaction = state.interaction;
  if (!interaction) return;
  const die = state.dice.find((d) => d.id === dieId);
  if (!die || die.locked) return;
  const effects = ['REROLL_DICE','OPPOSITE_DIE','CHOOSE_DIE_FACE','CHOOSE_DICE_FACES'];
  if (!effects.includes(interaction.card.effect)) return;
  const exists = interaction.selectedDice.includes(dieId);
  const max = interaction.card.max || interaction.card.count || 1;
  if (exists) {
    interaction.selectedDice = interaction.selectedDice.filter((id) => id !== dieId);
    delete interaction.faceChoices[dieId];
  } else if (interaction.selectedDice.length < max) {
    interaction.selectedDice.push(dieId);
  }
  render();
}

function chooseInteractionFace(dieId, face) {
  if (!state.interaction || !state.interaction.selectedDice.includes(dieId)) return;
  state.interaction.faceChoices[dieId] = face;
  render();
}

function interactionTermClick(index) {
  const interaction = state.interaction;
  if (!interaction) return false;
  const card = interaction.card;
  const term = state.terms[index];
  if (card.effect === 'MULTIPLY_TERM' || card.effect === 'TERM_TO_ONE') {
    if (!term.factors.length) return true;
    interaction.selectedTerms = [index];
    render();
    return true;
  }
  if (card.effect === 'COPY_TERM') {
    if (interaction.selectedTerms.length === 0) {
      if (!term.factors.length) return true;
      interaction.selectedTerms = [index];
    } else if (interaction.selectedTerms[0] === index) {
      interaction.selectedTerms = [];
    } else if (!term.factors.length) {
      interaction.selectedTerms = [interaction.selectedTerms[0], index];
    }
    render();
    return true;
  }
  if (card.effect === 'NEW_UNIQUE_TERM') {
    if (term.factors.length) return true;
    interaction.selectedTerms = [index];
    render();
    return true;
  }
  if (card.effect === 'ADD_FACE_UNLIMITED' || card.effect === 'ADD_FACE_LIMITED') {
    interaction.selectedTerms = [index];
    render();
    return true;
  }
  return false;
}

function interactionFactorClick(termIndex, factorIndex) {
  const interaction = state.interaction;
  if (!interaction || interaction.card.effect !== 'CHANGE_FACTOR') return false;
  const factor = state.terms[termIndex]?.factors[factorIndex];
  if (!factor) return true;
  const face = effectiveFaceForFactor(factor);
  if (face !== interaction.card.from) return true;
  interaction.selectedFactor = { termIndex, factorIndex };
  render();
  return true;
}

function addNewFaceToInteraction(face) {
  const interaction = state.interaction;
  if (!interaction || interaction.card.effect !== 'NEW_UNIQUE_TERM') return;
  interaction.newFaces.push(face);
  render();
}

function removeNewFaceFromInteraction() {
  if (!state.interaction?.newFaces?.length) return;
  state.interaction.newFaces.pop();
  render();
}

function changeInteractionCount(delta) {
  const i = state.interaction;
  if (!i) return;
  const min = i.card.min || 1;
  const max = i.card.effect === 'ADD_FACE_UNLIMITED' ? Number.POSITIVE_INFINITY : (i.card.max || 1);
  i.count = Math.max(min, Math.min(max, i.count + delta));
  render();
}

function virtualFactor(face, sourceHelpId) {
  return {
    id: uid('vf'),
    kind: 'virtual',
    face,
    value: faceToMonomial(face),
    sourceHelpId,
  };
}

function cloneTermAsVirtual(sourceTerm, sourceHelpId) {
  const value = simplifyTerm(sourceTerm, diceById());
  if (!value) return null;
  return {
    id: uid('vf-copy'),
    kind: 'virtual',
    face: null,
    value: { ...value },
    label: renderMonomial(value),
    sourceHelpId,
    synthetic: true,
  };
}

async function confirmHelp() {
  const interaction = state.interaction;
  if (!interaction) return;
  const card = interaction.card;
  const fail = (text) => { setMessage(text, 'warning'); render(); };

  if (card.effect === 'REROLL_DICE') {
    const min = card.min || 1;
    const max = card.max || 5;
    if (interaction.selectedDice.length < min || interaction.selectedDice.length > max) return fail(`Selecciona entre ${min} y ${max} dados.`);
    const ids = [...interaction.selectedDice];
    consumeHelp(card);
    await animateDiceRoll(ids);
    setMessage('Carta aplicada: dados relanzados.', 'success');
    render();
    return;
  }

  if (card.effect === 'OPPOSITE_DIE') {
    if (interaction.selectedDice.length !== 1) return fail('Selecciona exactamente un dado.');
    const die = state.dice.find((d) => d.id === interaction.selectedDice[0]);
    die.face = OPPOSITE_FACE[die.face];
    consumeHelp(card);
    setMessage('Carta aplicada: cara opuesta.', 'success');
    render();
    return;
  }

  if (card.effect === 'CHOOSE_DIE_FACE' || card.effect === 'CHOOSE_DICE_FACES') {
    const required = card.count;
    if (interaction.selectedDice.length !== required) return fail(`Selecciona exactamente ${required} ${required === 1 ? 'dado' : 'dados'}.`);
    if (interaction.selectedDice.some((id) => !interaction.faceChoices[id])) return fail('Elige una nueva cara para cada dado seleccionado.');
    interaction.selectedDice.forEach((id) => {
      const die = state.dice.find((d) => d.id === id);
      die.face = interaction.faceChoices[id];
    });
    consumeHelp(card);
    setMessage('Carta aplicada: caras modificadas.', 'success');
    render();
    return;
  }

  if (card.effect === 'MULTIPLY_TERM') {
    if (interaction.selectedTerms.length !== 1) return fail('Selecciona un término no vacío.');
    const term = state.terms[interaction.selectedTerms[0]];
    if (!term.factors.length) return fail('El término seleccionado está vacío.');
    const current = simplifyTerm(term, diceById());
    if (!current || !Number.isSafeInteger(current.coef * card.by)) return fail('Ese multiplicador excedería el rango numérico seguro.');
    term.operations.push({ type:'multiply', by:card.by, sourceHelpId:card.instanceId });
    consumeHelp(card);
    setMessage(`Carta aplicada: término ×${card.by}.`, 'success');
    render();
    return;
  }

  if (card.effect === 'TERM_TO_ONE') {
    if (interaction.selectedTerms.length !== 1) return fail('Selecciona un término no vacío.');
    const term = state.terms[interaction.selectedTerms[0]];
    if (!term.factors.length) return fail('El término seleccionado está vacío.');
    term.operations.push({ type:'override-one', sourceHelpId:card.instanceId });
    consumeHelp(card);
    setMessage('Carta aplicada: el término vale 1.', 'success');
    render();
    return;
  }

  if (card.effect === 'COPY_TERM') {
    if (interaction.selectedTerms.length !== 2) return fail('Selecciona primero el término que copiarás y luego una caja vacía.');
    const [sourceIndex, targetIndex] = interaction.selectedTerms;
    const source = state.terms[sourceIndex];
    const target = state.terms[targetIndex];
    if (!source.factors.length || target.factors.length) return fail('La selección de origen/destino no es válida.');
    const factor = cloneTermAsVirtual(source, card.instanceId);
    if (!factor) return fail('No se pudo copiar el término.');
    target.factors.push(factor);
    consumeHelp(card);
    setMessage('Carta aplicada: término copiado exactamente.', 'success');
    render();
    return;
  }

  if (card.effect === 'NEW_UNIQUE_TERM') {
    if (interaction.selectedTerms.length !== 1) return fail('Selecciona una caja vacía.');
    if (!interaction.newFaces.length) return fail('Añade al menos una ficha al nuevo término.');
    const targetIndex = interaction.selectedTerms[0];
    const target = state.terms[targetIndex];
    if (target.factors.length) return fail('La caja debe estar vacía.');
    const temp = { factors: interaction.newFaces.map((face) => virtualFactor(face, card.instanceId)), operations: [] };
    const candidate = simplifyTerm(temp, diceById());
    if (!candidate || !monomialIsSafe(candidate)) return fail('Ese término excede el rango numérico seguro del prototipo. Quita alguna ficha numérica.');
    const existing = state.terms.map((t) => simplifyTerm(t, diceById())).filter(Boolean);
    if (existing.some((m) => sameMonomial(m, candidate))) return fail('Ese término ya existe. La carta exige un término que no tengas.');
    target.factors = temp.factors;
    consumeHelp(card);
    setMessage('Carta aplicada: nuevo término añadido.', 'success');
    render();
    return;
  }

  if (card.effect === 'ADD_FACE_UNLIMITED' || card.effect === 'ADD_FACE_LIMITED') {
    if (interaction.selectedTerms.length !== 1) return fail('Selecciona una caja de término.');
    const count = interaction.count;
    if (card.effect === 'ADD_FACE_LIMITED' && (count < card.min || count > card.max)) return fail(`Añade entre ${card.min} y ${card.max} fichas.`);
    const target = state.terms[interaction.selectedTerms[0]];
    for (let n = 0; n < count; n += 1) target.factors.push(virtualFactor(card.face, card.instanceId));
    consumeHelp(card);
    setMessage(`Carta aplicada: ${count} ${FACE_LABELS[card.face]} añadida${count === 1 ? '' : 's'}.`, 'success');
    render();
    return;
  }

  if (card.effect === 'CHANGE_FACTOR') {
    if (!interaction.selectedFactor) return fail(`Selecciona un factor ${FACE_LABELS[card.from]} de la expresión.`);
    const { termIndex, factorIndex } = interaction.selectedFactor;
    const factor = state.terms[termIndex]?.factors[factorIndex];
    if (!factor || effectiveFaceForFactor(factor) !== card.from) return fail('El factor seleccionado ya no es válido.');
    if (factor.kind === 'die') {
      factor.overrideFace = card.to;
    } else {
      factor.face = card.to;
      factor.value = faceToMonomial(card.to);
    }
    factor.changedByHelp = card.instanceId;
    consumeHelp(card);
    setMessage(`Carta aplicada: ${FACE_LABELS[card.from]} → ${FACE_LABELS[card.to]}.`, 'success');
    render();
    return;
  }

  if (card.effect === 'ADD_EXPRESSION_CONSTANT') {
    state.globalConstantDelta += card.amount;
    consumeHelp(card);
    setMessage(`Carta aplicada: +${card.amount} a la expresión.`, 'success');
    render();
  }
}

function moveDieToTerm(dieId, targetIndex) {
  const die = state.dice.find((d) => d.id === dieId);
  if (!die || die.locked || !state.hasRolled) return;
  let factor = null;
  for (const term of state.terms) {
    const index = term.factors.findIndex((f) => f.kind === 'die' && f.dieId === dieId);
    if (index >= 0) factor = term.factors.splice(index, 1)[0];
  }
  if (!factor) factor = { id:`factor-${dieId}`, kind:'die', dieId, overrideFace:null };
  state.terms[targetIndex].factors.push(factor);
  state.moveSelection = null;
  render();
}

function moveFactorToTerm(factorId, targetIndex) {
  let factor = null;
  for (const term of state.terms) {
    const idx = term.factors.findIndex((f) => f.id === factorId);
    if (idx >= 0) {
      factor = term.factors.splice(idx, 1)[0];
      break;
    }
  }
  if (!factor) return;
  if (factor.kind === 'die') {
    const die = state.dice.find((d) => d.id === factor.dieId);
    if (die?.locked) return;
  }
  state.terms[targetIndex].factors.push(factor);
  state.moveSelection = null;
  render();
}

function returnDieToPool(dieId) {
  const die = state.dice.find((d) => d.id === dieId);
  if (!die || die.locked) return;
  for (const term of state.terms) {
    const idx = term.factors.findIndex((f) => f.kind === 'die' && f.dieId === dieId);
    if (idx >= 0) term.factors.splice(idx, 1);
  }
  state.moveSelection = null;
  render();
}

function selectMoveDie(dieId) {
  if (state.interaction) return;
  state.moveSelection = state.moveSelection?.type === 'die' && state.moveSelection.dieId === dieId ? null : { type:'die', dieId };
  render();
}

function selectMoveFactor(factorId) {
  if (state.interaction) return;
  const found = state.terms.flatMap((t) => t.factors).find((f) => f.id === factorId);
  if (!found) return;
  state.moveSelection = state.moveSelection?.type === 'factor' && state.moveSelection.factorId === factorId ? null : { type:'factor', factorId };
  render();
}

function placeMoveSelection(targetIndex) {
  if (!state.moveSelection) return;
  if (state.moveSelection.type === 'die') moveDieToTerm(state.moveSelection.dieId, targetIndex);
  else moveFactorToTerm(state.moveSelection.factorId, targetIndex);
}

function returnMoveSelectionToPool() {
  if (!state.moveSelection) return;
  if (state.moveSelection.type === 'die') returnDieToPool(state.moveSelection.dieId);
  if (state.moveSelection.type === 'factor') {
    const factor = state.terms.flatMap((t) => t.factors).find((f) => f.id === state.moveSelection.factorId);
    if (factor?.kind === 'die') returnDieToPool(factor.dieId);
  }
}

function restartToSetup() {
  state.screen = 'setup';
  state.setupCount = 1;
  state.setupNames = ['Jugador 1'];
  state.players = [];
  state.message = null;
  render();
}

function helpApplicable(card) {
  if (!state.hasRolled) return false;
  const unlockedDice = state.dice.filter((d) => !d.locked).length;
  if (['REROLL_DICE','OPPOSITE_DIE','CHOOSE_DIE_FACE'].includes(card.effect)) return unlockedDice >= 1;
  if (card.effect === 'CHOOSE_DICE_FACES') return unlockedDice >= 2;
  if (['MULTIPLY_TERM','TERM_TO_ONE'].includes(card.effect)) return state.terms.some((t) => t.factors.length);
  if (card.effect === 'COPY_TERM') return state.terms.some((t) => t.factors.length) && state.terms.some((t) => !t.factors.length);
  if (card.effect === 'NEW_UNIQUE_TERM') return state.terms.some((t) => !t.factors.length);
  if (card.effect === 'CHANGE_FACTOR') return state.terms.some((t) => t.factors.some((f) => effectiveFaceForFactor(f) === card.from));
  return true;
}

function termExpressionRaw(term) {
  if (!term.factors.length) return 'Vacío';
  const factors = term.factors.map((f) => {
    if (f.kind === 'die') return FACE_LABELS[f.overrideFace || state.dice.find((d) => d.id === f.dieId)?.face] || '?';
    return f.face ? FACE_LABELS[f.face] : (f.label || renderMonomial(f.value));
  });
  let raw = factors.join(' × ');
  for (const op of term.operations) {
    if (op.type === 'multiply') raw = `${raw} × ${op.by}`;
    if (op.type === 'override-one') raw = '1';
  }
  return raw;
}

function renderFaceSymbol(face) {
  if (face === 'x2') return 'x<sup>2</sup>';
  if (face === 'y2') return 'y<sup>2</sup>';
  return escapeHtml(FACE_LABELS[face] || face || '?');
}

const DICE_SIDE_CLASS = {
  '1': 'show-front',
  '2': 'show-back',
  x: 'show-right',
  x2: 'show-left',
  y: 'show-top',
  y2: 'show-bottom',
};

function renderDiceCube(face, { rolling = false, mini = false, hidden = false, tumble = '' } = {}) {
  const sideClass = DICE_SIDE_CLASS[face] || 'show-front';
  const tiltClass = `dice-tilt ${rolling ? 'is-rolling' : ''}${rolling && tumble ? ` ${tumble}` : ''}`.trim();
  return `<span class="dice-scene ${mini ? 'mini' : ''}" aria-hidden="true" data-visible-face="${escapeHtml(face || '1')}">
    <span class="${tiltClass}">
      <span class="dice-cube ${sideClass} ${hidden ? 'is-hidden-face' : ''}">
        <span class="cube-face cube-front"><span class="face-val">${hidden ? '?' : renderFaceSymbol('1')}</span></span>
        <span class="cube-face cube-back"><span class="face-val">${hidden ? '?' : renderFaceSymbol('2')}</span></span>
        <span class="cube-face cube-right"><span class="face-val">${hidden ? '?' : renderFaceSymbol('x')}</span></span>
        <span class="cube-face cube-left"><span class="face-val">${hidden ? '?' : renderFaceSymbol('x2')}</span></span>
        <span class="cube-face cube-top"><span class="face-val">${hidden ? '?' : renderFaceSymbol('y')}</span></span>
        <span class="cube-face cube-bottom"><span class="face-val">${hidden ? '?' : renderFaceSymbol('y2')}</span></span>
      </span>
    </span>
  </span>`;
}

function helpCategoryMeta(category) {
  const map = {
    dice: { label:'DADOS', icon:'🎲' },
    term: { label:'TÉRMINO', icon:'✕' },
    factor: { label:'FACTOR', icon:'↔' },
    expression: { label:'EXPRESIÓN', icon:'＋' },
  };
  return map[category] || { label:'AYUDA', icon:'★' };
}

function renderSetup() {
  const inputs = Array.from({ length: state.setupCount }, (_, i) => `
    <label class="name-field">
      <span>Jugador ${i + 1}</span>
      <input data-player-name="${i}" value="${escapeHtml(state.setupNames[i] || '')}" placeholder="Jugador ${i + 1}">
    </label>`).join('');
  app.innerHTML = `
    <main class="setup-screen">
      <img class="decor decor-grid" src="assets/brand/grid_torn_corner.png" alt="" aria-hidden="true">
      <img class="decor decor-purple" src="assets/brand/purple_torn_paper.png" alt="" aria-hidden="true">
      <img class="decor decor-pink" src="assets/brand/pink_torn_paper.png" alt="" aria-hidden="true">
      <section class="setup-card">
        <div class="logo-wrap">
          <div class="logo"><span>ALGE</span><strong>ROLL</strong></div>
          <p>Desafíos algebraicos</p>
        </div>
        <div class="setup-hero">
          <div>
            <h1>Construye, simplifica y supera los retos</h1>
            <p>Lanza 5 dados especiales, crea hasta 4 términos y utiliza cartas de ayuda para transformar tus posibilidades.</p>
          </div>
          <img src="assets/brand/dice_outline_a.png" alt="Ilustración de dados">
        </div>
        <div class="player-count">
          <span>Número de jugadores</span>
          <div class="segmented" role="group" aria-label="Número de jugadores">
            ${[1,2,3,4,5].map((n) => `<button data-count="${n}" class="${state.setupCount === n ? 'active' : ''}">${n}</button>`).join('')}
          </div>
        </div>
        <div class="name-grid">${inputs}</div>
        <div class="quick-rules">
          <span>🎲 5 dados</span><span>🃏 4 retos visibles</span><span>➕ suma</span><span>✖ multiplicación</span><span>🚫 sin paréntesis</span>
        </div>
        <button class="primary giant" data-action="start-game">Comenzar partida</button>
      </section>
      <p class="setup-credit">Juego didáctico diseñado por la Lic. en Matemáticas Viviana Bermudez Herrera.</p>
    </main>`;
}

function starterButtonLabel() {
  return state.starterRolling ? 'Girando…' : 'Tirar para empezar';
}

function renderStarterFull() {
  const player = state.players[state.starterIndex];
  return `
    <main class="starter-screen">
      <section class="starter-card">
        <div class="logo small"><span>ALGE</span><strong>ROLL</strong></div>
        <h1>¿Quién empieza?</h1>
        <p>Empieza el primer jugador que saque <strong>1</strong>.</p>
        <div class="starter-player">Turno de <strong>${escapeHtml(player.name)}</strong></div>
        <div class="starter-die-3d ${state.starterRolling ? 'rolling' : ''}">${renderDiceCube(state.starterLastRoll || '1', { rolling: state.starterRolling, hidden: !state.starterLastRoll && !state.starterRolling, tumble: state.starterRolling ? state.starterTumble || '' : '' })}</div>
        <button class="primary giant" data-action="starter-roll" ${state.starterRolling ? 'disabled' : ''}>${starterButtonLabel()}</button>
      </section>
    </main>`;
}

function starterCardEl() {
  try {
    return typeof app?.querySelector === 'function' ? app.querySelector('.starter-card') : null;
  } catch {
    return null;
  }
}

function renderStarter() {
  const player = state.players[state.starterIndex];
  const card = starterCardEl();
  if (!card) {
    app.innerHTML = renderStarterFull();
    return;
  }

  const nameStrong = card.querySelector('.starter-player strong');
  if (nameStrong && nameStrong.textContent !== player.name) nameStrong.textContent = player.name;

  const dieWrap = card.querySelector('.starter-die-3d');
  if (dieWrap) {
    dieWrap.classList.toggle('rolling', state.starterRolling);
    if (state.starterRolling) {
      dieWrap.innerHTML = renderDiceCube(state.starterLastRoll || '1', { rolling: true, hidden: false, tumble: state.starterTumble || '' });
    } else {
      const tilt = dieWrap.querySelector('.dice-tilt');
      if (tilt) {
        tilt.classList.remove('is-rolling', 'tumble-b', 'tumble-c', 'tumble-d', 'tumble-e', 'tumble-f');
      }
    }
  }

  const btn = card.querySelector('[data-action="starter-roll"]');
  if (btn) {
    btn.disabled = state.starterRolling;
    btn.textContent = starterButtonLabel();
  }
}

function renderScoreboard() {
  return state.players.map((p, i) => `
    <div class="score-player ${i === state.currentPlayerIndex ? 'current' : ''}">
      <span class="turn-dot"></span>
      <strong>${escapeHtml(p.name)}</strong>
      <span>${p.score} pts</span>
    </div>`).join('');
}

function renderChallenges() {
  return state.visibleChallenges.map((c, index) => {
    const diff = DIFFICULTY[c.difficulty];
    const selected = state.selectedChallengeId === c.id;
    const symbol = c.difficulty === 'easy' ? '◆' : c.difficulty === 'intermediate' ? '✦' : '★';
    return `
      <button class="challenge-card ${c.difficulty} ${selected ? 'selected' : ''} ${c.image ? 'has-algeplano' : ''}" data-challenge-id="${c.id}" ${c.image ? `data-preview-image="${c.image}" data-preview-title="Reto ${c.id} · Algeplano"` : ''} aria-pressed="${selected}" style="--deal-delay:${index * 70}ms">
        <span class="card-corner top-left">${diff.points}</span>
        <span class="card-corner bottom-right">${diff.points}</span>
        <span class="challenge-ribbon"><b>${symbol}</b>${diff.label}</span>
        <span class="challenge-card-body">
          ${c.image ? `<span class="challenge-image-frame"><img src="${c.image}" alt="Representación con piezas de algeplano"><span class="challenge-zoom-hint" aria-hidden="true">⌕ Ver grande</span></span>` : `<span class="challenge-glyph">${symbol}</span>`}
          <span class="challenge-text">${escapeHtml(c.text)}</span>
        </span>
        <span class="challenge-card-footer">RETO · ${c.id}</span>
      </button>`;
  }).join('') || '<div class="empty-note">No quedan retos visibles.</div>';
}

function renderDie(die, context = 'pool') {
  const rolling = state.rollingDice.has(die.id);
  const displayFace = rolling ? (state.rollingDisplay.get(die.id) || die.face) : die.face;
  const selectedByHelp = state.interaction?.selectedDice?.includes(die.id);
  const selectedMove = state.moveSelection?.type === 'die' && state.moveSelection.dieId === die.id;
  const hidden = !state.hasRolled && context === 'pool';
  return `
    <button class="die die-3d ${rolling ? 'rolling' : ''} ${die.locked ? 'locked' : ''} ${selectedByHelp ? 'target-selected' : ''} ${selectedMove ? 'move-selected' : ''}"
      data-die-id="${die.id}" draggable="${!die.locked && state.hasRolled && !rolling}"
      aria-label="Dado ${die.id.replace('die-','')} con ${FACE_LABELS[displayFace]}${die.locked ? ', bloqueado' : ''}">
      ${renderDiceCube(displayFace, { rolling, hidden, tumble: state.rollingTumble.get(die.id) })}
      ${die.locked ? '<span class="lock-badge" aria-hidden="true">🔒</span>' : ''}
    </button>`;
}

function diceSelectionMode() {
  return !!(state.interaction && ['REROLL_DICE','OPPOSITE_DIE','CHOOSE_DIE_FACE','CHOOSE_DICE_FACES'].includes(state.interaction.card.effect));
}

function renderDiceBody() {
  const inTerms = new Set(state.terms.flatMap((t) => t.factors.filter((f) => f.kind === 'die').map((f) => f.dieId)));
  return `
    <div class="section-title-row"><h2>Dados</h2><span>${state.hasRolled ? 'Arrastra o pulsa un dado y luego una caja' : 'Lanza para comenzar'}</span></div>
    <div class="dice-pool" data-drop-pool="true">
      <div class="dice-pool-grid">
        ${state.dice.map((die) => {
          const isInTerm = inTerms.has(die.id);
          return `<div class="dice-slot ${isInTerm ? 'occupied-in-term' : ''}" data-dice-slot="${die.id}">
            ${isInTerm
              ? `<span class="dice-slot-placeholder"><strong>Dado ${die.id.replace('die-','')}</strong><small>En la expresión</small></span>`
              : `${renderDie(die)}<span class="die-number" aria-hidden="true">${die.id.replace('die-','')}</span>`}
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="dice-actions">
      <button class="primary roll-button" data-action="launch-dice" ${state.hasRolled || state.rollingDice.size ? 'disabled' : ''}>🎲 ${state.hasRolled ? 'Dados lanzados' : 'Lanzar dados'}</button>
      ${state.dice.some((d) => d.locked) ? `<span class="locked-note">🔒 ${state.dice.filter((d) => d.locked).length} dado(s) usado(s) en el primer reto</span>` : ''}
    </div>`;
}

function renderDicePool() {
  return `<section class="dice-section ${diceSelectionMode() ? 'selection-mode' : ''}">${renderDiceBody()}</section>`;
}

function renderFactor(factor, termIndex, factorIndex) {
  const isPhysical = factor.kind === 'die';
  const face = effectiveFaceForFactor(factor);
  const selectedFactor = state.interaction?.selectedFactor?.termIndex === termIndex && state.interaction?.selectedFactor?.factorIndex === factorIndex;
  const canChange = state.interaction?.card.effect === 'CHANGE_FACTOR' && face === state.interaction.card.from;
  const moveSelected = state.moveSelection?.type === 'factor' && state.moveSelection.factorId === factor.id;
  if (isPhysical) {
    const die = state.dice.find((d) => d.id === factor.dieId);
    const rolling = state.rollingDice.has(factor.dieId);
    const displayFace = rolling ? (state.rollingDisplay.get(factor.dieId) || face) : face;
    return `<button class="term-die term-die-3d ${rolling ? 'rolling' : ''} ${selectedFactor ? 'target-selected' : ''} ${canChange ? 'target-available' : ''} ${moveSelected ? 'move-selected' : ''}"
      data-factor-id="${factor.id}" data-term-index="${termIndex}" data-factor-index="${factorIndex}" data-die-id="${factor.dieId}"
      draggable="${!die?.locked && !rolling}" aria-label="Factor ${FACE_LABELS[displayFace]}">
      ${renderDiceCube(displayFace, { rolling, mini:true, tumble: state.rollingTumble.get(factor.dieId) })}${factor.overrideFace ? '<small>AYUDA</small>' : ''}
    </button>`;
  }
  return `<button class="virtual-factor ${selectedFactor ? 'target-selected' : ''} ${canChange ? 'target-available' : ''} ${moveSelected ? 'move-selected' : ''}"
    data-factor-id="${factor.id}" data-term-index="${termIndex}" data-factor-index="${factorIndex}" draggable="true">
    <span>${face ? renderFaceSymbol(face) : escapeHtml(factor.label || renderMonomial(factor.value))}</span><small>AYUDA</small>
  </button>`;
}

function renderTermBox(term, index) {
  const value = simplifyTerm(term, diceById());
  const interaction = state.interaction;
  const termSelected = interaction?.selectedTerms?.includes(index);
  let targetAvailable = false;
  if (interaction) {
    const e = interaction.card.effect;
    if (['MULTIPLY_TERM','TERM_TO_ONE'].includes(e)) targetAvailable = term.factors.length > 0;
    if (e === 'COPY_TERM') targetAvailable = interaction.selectedTerms.length === 0 ? term.factors.length > 0 : (!term.factors.length || interaction.selectedTerms[0] === index);
    if (e === 'NEW_UNIQUE_TERM') targetAvailable = term.factors.length === 0;
    if (['ADD_FACE_UNLIMITED','ADD_FACE_LIMITED'].includes(e)) targetAvailable = true;
  }
  return `
    <div class="term-wrap">
      <div class="term-label">Término ${index + 1}</div>
      <div class="term-box ${termSelected ? 'target-selected' : ''} ${targetAvailable ? 'target-available' : ''}" data-term-box="${index}">
        <div class="term-factors">
          ${term.factors.map((f, fi) => renderFactor(f, index, fi)).join('<span class="multiply-sign">×</span>')}
          ${term.factors.length === 0 ? '<span class="drop-hint">Arrastra dados aquí</span>' : ''}
        </div>
        <div class="term-footer">
          <span>${escapeHtml(termExpressionRaw(term))}</span>
          <strong>= ${value ? escapeHtml(renderMonomial(value)) : '—'}</strong>
        </div>
      </div>
    </div>`;
}

function renderBuilderBody() {
  const poly = expressionPoly();
  const rawTerms = state.terms.map((t) => simplifyTerm(t, diceById())).filter(Boolean).map(renderMonomial);
  if (state.globalConstantDelta) rawTerms.push(String(state.globalConstantDelta));
  return `
    <div class="section-title-row"><h2>Construye la expresión</h2><span>Dentro de cada caja se multiplica; entre cajas se suma.</span></div>
    <div class="term-grid">${state.terms.map(renderTermBox).join('<div class="plus-sign">+</div>')}</div>
    <div class="expression-summary">
      <div><span>Expresión por cajas</span><strong>${rawTerms.length ? escapeHtml(rawTerms.join(' + ')) : '—'}</strong></div>
      <div class="simplified"><span>Expresión simplificada</span><strong>${nonEmptyExpression() ? escapeHtml(renderPolynomial(poly)) : '—'}</strong></div>
      ${state.globalConstantDelta ? `<span class="global-modifier">Ayuda global: +${state.globalConstantDelta}</span>` : ''}
    </div>`;
}

function renderBuilder() {
  return `<section class="builder-section">${renderBuilderBody()}</section>`;
}

function renderHelpHandBody() {
  const hand = currentPlayer().hand;
  return `
    <div class="section-title-row">
      <div><h2>Cartas de ayuda</h2><span class="section-kicker">Tu mano · pulsa una carta para jugarla</span></div>
      <div class="deck-counter"><span class="mini-deck help-deck-back"></span><strong>${state.helpDeck.length}</strong><small>mazo</small><span class="discard-count">${state.helpDiscard.length} descarte</span></div>
    </div>
    <div class="help-hand">
      ${hand.length ? hand.map((card, index) => {
        const applicable = helpApplicable(card);
        const selected = state.interaction?.card.instanceId === card.instanceId;
        const meta = helpCategoryMeta(card.category);
        return `<button class="help-card visual-card ${selected ? 'selected' : ''} ${!applicable ? 'disabled-card' : ''}" data-help-id="${card.instanceId}" ${(!applicable || (state.interaction && !selected)) ? 'disabled' : ''} style="--card-index:${index}">
          <span class="help-card-header"><b>${meta.icon}</b><span>${meta.label}</span><em>${card.id}</em></span>
          <span class="help-card-art"><span class="help-art-symbol">${meta.icon}</span><span class="help-art-ring"></span></span>
          <span class="help-card-text">${escapeHtml(card.text)}</span>
          <span class="help-card-footer"><strong>ALGEROLL</strong><small>${applicable ? 'USAR CARTA' : 'NO APLICABLE'}</small></span>
        </button>`;
      }).join('') : '<div class="empty-note">No tienes cartas de ayuda.</div>'}
    </div>`;
}

function renderHelpHand() {
  return `<section class="help-section">${renderHelpHandBody()}</section>`;
}

function helpInstruction(interaction) {
  const card = interaction.card;
  switch (card.effect) {
    case 'REROLL_DICE': return `Selecciona entre ${card.min} y ${card.max} dados no bloqueados.`;
    case 'OPPOSITE_DIE': return 'Selecciona un dado. Se cambiará automáticamente a su cara opuesta.';
    case 'CHOOSE_DIE_FACE': return 'Selecciona un dado y luego elige la nueva cara.';
    case 'CHOOSE_DICE_FACES': return 'Selecciona exactamente dos dados y elige una cara para cada uno.';
    case 'MULTIPLY_TERM': return `Selecciona una caja no vacía. Su valor se multiplicará por ${card.by}.`;
    case 'TERM_TO_ONE': return 'Selecciona una caja no vacía. El término pasará a valer 1.';
    case 'COPY_TERM': return interaction.selectedTerms.length === 0 ? 'Selecciona el término que quieres copiar.' : 'Ahora selecciona una caja vacía como destino.';
    case 'NEW_UNIQUE_TERM': return 'Selecciona una caja vacía y construye un término que no exista ya.';
    case 'ADD_FACE_UNLIMITED': return `Selecciona una caja y decide cuántas fichas ${FACE_LABELS[card.face]} añadir.`;
    case 'ADD_FACE_LIMITED': return `Selecciona una caja y añade entre ${card.min} y ${card.max} fichas ${FACE_LABELS[card.face]}.`;
    case 'CHANGE_FACTOR': return `Selecciona exactamente un factor ${FACE_LABELS[card.from]} de la expresión.`;
    case 'ADD_EXPRESSION_CONSTANT': return `Añadirá +${card.amount} a la expresión completa.`;
    default: return 'Selecciona los objetivos necesarios y confirma.';
  }
}

function renderInteractionControls(interaction) {
  const card = interaction.card;
  if (card.effect === 'CHOOSE_DIE_FACE' || card.effect === 'CHOOSE_DICE_FACES') {
    return interaction.selectedDice.map((dieId) => {
      const die = state.dice.find((d) => d.id === dieId);
      return `<div class="face-choice-row"><strong>Dado ${dieId.replace('die-','')} (${FACE_LABELS[die.face]})</strong><div class="face-choices">
        ${FACES.map((face) => `<button data-choice-die="${dieId}" data-choice-face="${face}" class="${interaction.faceChoices[dieId] === face ? 'active' : ''}">${renderFaceSymbol(face)}</button>`).join('')}
      </div></div>`;
    }).join('');
  }
  if (card.effect === 'NEW_UNIQUE_TERM' && interaction.selectedTerms.length === 1) {
    const preview = interaction.newFaces.length ? interaction.newFaces.map((f) => FACE_LABELS[f]).join(' × ') : '—';
    let simplified = '—';
    if (interaction.newFaces.length) {
      const temp = { factors: interaction.newFaces.map((face) => ({ kind:'virtual', face, value:faceToMonomial(face) })), operations:[] };
      simplified = renderMonomial(simplifyTerm(temp, diceById()));
    }
    return `<div class="new-term-builder"><div class="face-choices">${FACES.map((face) => `<button data-add-new-face="${face}">+ ${renderFaceSymbol(face)}</button>`).join('')}</div>
      <div class="new-term-preview">Nuevo término: <strong>${escapeHtml(preview)}</strong><br><small>Simplificado: ${escapeHtml(simplified)}</small></div>
      <button class="secondary" data-action="remove-new-face" ${interaction.newFaces.length ? '' : 'disabled'}>Quitar última ficha</button></div>`;
  }
  if ((card.effect === 'ADD_FACE_UNLIMITED' || card.effect === 'ADD_FACE_LIMITED') && interaction.selectedTerms.length === 1) {
    return `<div class="count-picker"><button data-action="count-minus">−</button><strong>${interaction.count} × ${renderFaceSymbol(card.face)}</strong><button data-action="count-plus">+</button></div>`;
  }
  return '';
}

function renderHelpPanel() {
  const interaction = state.interaction;
  if (!interaction) return '';
  return `
    <section class="help-active-panel" data-zone="help-active" role="region" aria-label="Usar carta de ayuda">
      <div class="help-active-copy">
        <span class="eyebrow">Carta ${interaction.card.id} · Modo selección</span>
        <h2>${escapeHtml(interaction.card.text)}</h2>
        <p>${escapeHtml(helpInstruction(interaction))}</p>
      </div>
      <div class="help-active-controls">${renderInteractionControls(interaction)}</div>
      <div class="modal-actions">
        <button class="secondary" data-action="cancel-help">Cancelar</button>
        <button class="primary" data-action="confirm-help">Confirmar carta</button>
      </div>
    </section>`;
}

const GAME_ZONES = ['scoreboard', 'turn', 'challenge-title', 'challenges', 'dice', 'builder', 'help', 'status', 'actions'];
let zoneSnapshot = new Map();
let helpPanelSnapshot = '';

function gameHasZones() {
  try {
    return typeof app?.querySelector === 'function' && !!app.querySelector('[data-zone="scoreboard"]');
  } catch {
    return false;
  }
}

function zoneNode(name) {
  try {
    return app?.querySelector ? app.querySelector(`[data-zone="${name}"]`) : null;
  } catch {
    return null;
  }
}

function setZoneHtml(name, html) {
  const el = zoneNode(name);
  if (!el) return false;
  if (zoneSnapshot.get(name) === html) return false;
  el.innerHTML = html;
  zoneSnapshot.set(name, html);
  return true;
}

function primeGameZones(htmls) {
  zoneSnapshot = new Map(htmls);
  helpPanelSnapshot = '';
}

function syncDiceSectionMode() {
  const el = zoneNode('dice');
  if (!el) return;
  const want = `dice-section${diceSelectionMode() ? ' selection-mode' : ''}`;
  if (el.className !== want) el.className = want;
}

function syncHelpActivePanel() {
  const html = renderHelpPanel();
  const current = zoneNode('help-active');
  if (helpPanelSnapshot === html && (!!html) === !!current) return;
  helpPanelSnapshot = html;
  const diceZone = zoneNode('dice');
  const row = typeof diceZone?.closest === 'function' ? diceZone.closest('.play-row') : null;
  const anchor = row || diceZone;
  const parent = anchor?.parentNode;
  if (current) current.remove();
  if (!html || !parent) return;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  parent.insertBefore(tpl.content.firstElementChild, anchor);
}

function turnInfoHtml(player) {
  return `<span>Turno actual</span><strong>${escapeHtml(player.name)}</strong><small>${state.turnWins}/2 retos logrados</small>`;
}

// Aviso de turno para multijugador local: al comenzar cada turno se muestra
// quién juega para que los jugadores puedan pasarse el dispositivo.
function renderTurnPopup() {
  if (!state.turnPopup || state.players.length <= 1) return '';
  const player = currentPlayer();
  return `
    <div class="turn-popup-backdrop">
      <div class="turn-popup-card" role="dialog" aria-modal="true" aria-label="Turno actual">
        <span class="turn-popup-eyebrow">Turno actual</span>
        <h2>${escapeHtml(player.name)}</h2>
        <p>Es tu turno. Cuando estés listo, comienza la ronda.</p>
        <button class="primary giant" data-action="start-turn">Comenzar turno</button>
      </div>
    </div>`;
}

function challengeTitleHtml() {
  return `<h2>Retos visibles</h2><span>Mazo: ${state.challengeDeck.length} · Selecciona uno para comprobar</span>`;
}

function statusAreaHtml(needsAnswer, selectedChallenge) {
  return `
    ${state.message ? `<div class="message ${state.message.type}" role="status">${escapeHtml(state.message.text)}</div>` : '<div class="message neutral">Construye una expresión y selecciona un reto.</div>'}
    ${needsAnswer ? `<label class="answer-field">Tu resultado para x = ${selectedChallenge.validator.x}, y = ${selectedChallenge.validator.y}<input type="number" step="1" data-evaluation-answer value="${escapeHtml(state.evaluationAnswer)}" placeholder="Resultado"></label>` : ''}`;
}

function mainActionsHtml() {
  return `
    <button class="success-button" data-action="check-challenge" ${!state.hasRolled ? 'disabled' : ''}>✓ Comprobar reto</button>
    <button class="pass-button" data-action="pass-turn" ${!state.hasRolled ? 'disabled' : ''}>⏭ Pasar turno</button>`;
}

function currentZoneHtmls(player, selectedChallenge, needsAnswer) {
  return new Map([
    ['scoreboard', renderScoreboard()],
    ['turn', turnInfoHtml(player)],
    ['challenge-title', challengeTitleHtml()],
    ['challenges', renderChallenges()],
    ['dice', renderDiceBody()],
    ['builder', renderBuilderBody()],
    ['help', renderHelpHandBody()],
    ['status', statusAreaHtml(needsAnswer, selectedChallenge)],
    ['actions', mainActionsHtml()],
    ['turn-popup', renderTurnPopup()],
  ]);
}

function renderGameFull() {
  const player = currentPlayer();
  const selectedChallenge = findChallenge(state.selectedChallengeId);
  const needsAnswer = selectedChallenge?.validator.type === 'EVALUATE_AND_ANSWER';
  return `
    <main class="game-screen">
      <header class="game-header">
        <div class="logo compact"><span>ALGE</span><strong>ROLL</strong></div>
        <div class="scoreboard" data-zone="scoreboard">${renderScoreboard()}</div>
        <div class="turn-info" data-zone="turn">${turnInfoHtml(player)}</div>
      </header>

      <section class="challenge-section">
        <div class="section-title-row" data-zone="challenge-title">${challengeTitleHtml()}</div>
        <div class="challenge-grid" data-zone="challenges">${renderChallenges()}</div>
      </section>

      ${renderHelpPanel()}
      <div class="play-row">
        <section class="dice-section ${diceSelectionMode() ? 'selection-mode' : ''}" data-zone="dice">${renderDiceBody()}</section>
        <section class="help-section" data-zone="help">${renderHelpHandBody()}</section>
      </div>
      <section class="builder-section" data-zone="builder">${renderBuilderBody()}</section>

      <section class="action-bar">
        <div class="status-area" data-zone="status">${statusAreaHtml(needsAnswer, selectedChallenge)}</div>
        <div class="main-actions" data-zone="actions">${mainActionsHtml()}</div>
      </section>
      <div class="turn-popup-zone" data-zone="turn-popup">${renderTurnPopup()}</div>
    </main>`;
}

function renderGame() {
  const player = currentPlayer();
  const selectedChallenge = findChallenge(state.selectedChallengeId);
  const needsAnswer = selectedChallenge?.validator.type === 'EVALUATE_AND_ANSWER';

  if (!gameHasZones()) {
    app.innerHTML = renderGameFull();
    primeGameZones(currentZoneHtmls(player, selectedChallenge, needsAnswer));
    return;
  }

  const htmls = currentZoneHtmls(player, selectedChallenge, needsAnswer);
  for (const [name, html] of htmls) {
    if (name === 'challenges') continue;
    setZoneHtml(name, html);
  }
  syncChallengesZone();
  syncHelpActivePanel();
  syncDiceSectionMode();
}

// Seleccionar una carta de reto solo cambia el estado visual de esa carta:
// no debe reconstruirse toda la rejilla (evita que las cartas desaparezcan
// y se reparta la animación de nuevo). Solo se reconstruye cuando el conjunto
// de retos visibles cambia (nuevo reparto).
function syncChallengesZone() {
  const grid = zoneNode('challenges');
  const html = renderChallenges();
  if (!grid) {
    zoneSnapshot.set('challenges', html);
    return;
  }
  const desired = state.visibleChallenges.map((c) => c.id);
  const existing = [...grid.querySelectorAll('.challenge-card')];
  const sameSet = desired.length > 0
    && existing.length === desired.length
    && existing.every((node, index) => node.dataset.challengeId === desired[index]);
  if (!sameSet) {
    setZoneHtml('challenges', html);
    return;
  }
  existing.forEach((node) => {
    const selected = state.selectedChallengeId === node.dataset.challengeId;
    if (node.classList.contains('selected') !== selected) {
      node.classList.toggle('selected', selected);
      node.setAttribute('aria-pressed', String(selected));
    }
  });
  zoneSnapshot.set('challenges', html);
}

function renderFinal() {
  const maxScore = Math.max(...state.players.map((p) => p.score));
  const winners = state.players.filter((p) => p.score === maxScore);
  const solo = state.players.length === 1;
  app.innerHTML = `
    <main class="final-screen">
      <img class="final-decor red" src="assets/brand/red_torn_paper.png" alt="" aria-hidden="true">
      <img class="final-decor cyan" src="assets/brand/cyan_torn_paper.png" alt="" aria-hidden="true">
      <section class="final-card">
        <div class="logo-wrap"><div class="logo"><span>ALGE</span><strong>ROLL</strong></div><p>Fin de la partida</p></div>
        <p class="end-reason">${escapeHtml(state.gameEndReason)}</p>
        <h1>${solo ? `Puntuación final: ${state.players[0].score} / 35` : (winners.length > 1 ? `¡Empate entre ${winners.map((w) => escapeHtml(w.name)).join(', ')}!` : `¡Gana ${escapeHtml(winners[0].name)}!`)}</h1>
        <div class="final-results">
          ${state.players.map((p) => {
            const easy = p.wonChallenges.filter((c) => c.difficulty === 'easy').length;
            const medium = p.wonChallenges.filter((c) => c.difficulty === 'intermediate').length;
            const hard = p.wonChallenges.filter((c) => c.difficulty === 'hard').length;
            return `<article class="result-card ${p.score === maxScore ? 'winner' : ''}"><h2>${escapeHtml(p.name)}</h2><strong>${p.score} pts</strong><span>${p.wonChallenges.length} retos</span><small>Fácil ${easy} · Intermedio ${medium} · Difícil ${hard}</small></article>`;
          }).join('')}
        </div>
        <button class="primary giant" data-action="restart">Nueva partida</button>
      </section>
    </main>`;
}

function render() {
  if (state.screen === 'setup') renderSetup();
  else if (state.screen === 'starter') renderStarter();
  else if (state.screen === 'game') renderGame();
  else renderFinal();
}

function renderGameOnly() {
  if (state.screen === 'game') renderGame();
}

app.addEventListener('click', (event) => {
  const target = event.target.closest('button, [data-term-box], [data-drop-pool]');
  if (!target) return;

  if (target.dataset.count) {
    state.setupCount = Number(target.dataset.count);
    while (state.setupNames.length < state.setupCount) state.setupNames.push(`Jugador ${state.setupNames.length + 1}`);
    state.setupNames = state.setupNames.slice(0, state.setupCount);
    render();
    return;
  }

  const action = target.dataset.action;
  if (action === 'start-game') return startGame();
  if (action === 'starter-roll') return rollStarterDie();
  if (action === 'launch-dice') return launchDice();
  if (action === 'check-challenge') return checkChallenge();
  if (action === 'pass-turn') return passTurn();
  if (action === 'cancel-help') return cancelHelp();
  if (action === 'confirm-help') return confirmHelp();
  if (action === 'remove-new-face') return removeNewFaceFromInteraction();
  if (action === 'count-minus') return changeInteractionCount(-1);
  if (action === 'count-plus') return changeInteractionCount(1);
  if (action === 'start-turn') return closeTurnPopup();
  if (action === 'restart') return restartToSetup();

  if (target.dataset.choiceDie && target.dataset.choiceFace) return chooseInteractionFace(target.dataset.choiceDie, target.dataset.choiceFace);
  if (target.dataset.addNewFace) return addNewFaceToInteraction(target.dataset.addNewFace);

  if (target.dataset.helpId) return openHelpCard(target.dataset.helpId);

  if (target.dataset.challengeId) {
    if (state.interaction) return;
    state.selectedChallengeId = state.selectedChallengeId === target.dataset.challengeId ? null : target.dataset.challengeId;
    state.evaluationAnswer = '';
    render();
    return;
  }

  if (target.dataset.factorId) {
    const termIndex = Number(target.dataset.termIndex);
    const factorIndex = Number(target.dataset.factorIndex);
    if (state.interaction && ['REROLL_DICE','OPPOSITE_DIE','CHOOSE_DIE_FACE','CHOOSE_DICE_FACES'].includes(state.interaction.card.effect) && target.dataset.dieId) {
      toggleInteractionDie(target.dataset.dieId);
      return;
    }
    if (interactionFactorClick(termIndex, factorIndex)) return;
    selectMoveFactor(target.dataset.factorId);
    return;
  }

  if (target.dataset.dieId) {
    if (state.interaction) return toggleInteractionDie(target.dataset.dieId);
    selectMoveDie(target.dataset.dieId);
    return;
  }

  if (target.dataset.termBox !== undefined) {
    const index = Number(target.dataset.termBox);
    if (interactionTermClick(index)) return;
    placeMoveSelection(index);
    return;
  }

  if (target.dataset.dropPool !== undefined) returnMoveSelectionToPool();
});

app.addEventListener('input', (event) => {
  if (event.target.matches('[data-player-name]')) {
    state.setupNames[Number(event.target.dataset.playerName)] = event.target.value;
  }
  if (event.target.matches('[data-evaluation-answer]')) {
    state.evaluationAnswer = event.target.value;
  }
});

app.addEventListener('dragstart', (event) => {
  const el = event.target.closest('[data-factor-id], [data-die-id]');
  if (!el || state.interaction) {
    event.preventDefault();
    return;
  }
  if (el.dataset.factorId) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ type:'factor', factorId:el.dataset.factorId }));
  } else if (el.dataset.dieId) {
    event.dataTransfer.setData('text/plain', JSON.stringify({ type:'die', dieId:el.dataset.dieId }));
  }
  event.dataTransfer.effectAllowed = 'move';
});

app.addEventListener('dragover', (event) => {
  const zone = event.target.closest('[data-term-box], [data-drop-pool]');
  if (!zone || state.interaction) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  zone.classList.add('drag-over');
});

app.addEventListener('dragleave', (event) => {
  const zone = event.target.closest('[data-term-box], [data-drop-pool]');
  zone?.classList.remove('drag-over');
});

function hideAlgeplanoPreview() {
  document.getElementById('algeplano-hover-preview')?.remove();
}

function showAlgeplanoPreview(card) {
  const src = card?.dataset?.previewImage;
  if (!src) return;
  hideAlgeplanoPreview();
  const overlay = document.createElement('div');
  overlay.id = 'algeplano-hover-preview';
  overlay.className = 'algeplano-hover-preview';
  overlay.setAttribute('aria-hidden', 'true');
  const title = card.dataset.previewTitle || 'Representación con algeplano';
  overlay.innerHTML = `
    <div class="algeplano-preview-card">
      <div class="algeplano-preview-title">${escapeHtml(title)}</div>
      <div class="algeplano-preview-image-wrap">
        <img src="${src}" alt="">
      </div>
      <div class="algeplano-preview-help">Vista ampliada · mueve el cursor fuera de la carta para cerrar</div>
    </div>`;
  document.body.appendChild(overlay);
}

// Vista ampliada de los retos con algeplano. Funciona con ratón y también al
// navegar con teclado mediante focus, sin interferir con el clic que selecciona el reto.
app.addEventListener('pointerover', (event) => {
  const card = event.target.closest('.challenge-card[data-preview-image]');
  if (!card || card.contains(event.relatedTarget)) return;
  showAlgeplanoPreview(card);
});

app.addEventListener('pointerout', (event) => {
  const card = event.target.closest('.challenge-card[data-preview-image]');
  if (!card || card.contains(event.relatedTarget)) return;
  hideAlgeplanoPreview();
});

app.addEventListener('focusin', (event) => {
  const card = event.target.closest?.('.challenge-card[data-preview-image]');
  if (card) showAlgeplanoPreview(card);
});

app.addEventListener('focusout', (event) => {
  const card = event.target.closest?.('.challenge-card[data-preview-image]');
  if (card && !card.contains(event.relatedTarget)) hideAlgeplanoPreview();
});

app.addEventListener('drop', (event) => {
  const zone = event.target.closest('[data-term-box], [data-drop-pool]');
  if (!zone || state.interaction) return;
  event.preventDefault();
  zone.classList.remove('drag-over');
  let payload;
  try { payload = JSON.parse(event.dataTransfer.getData('text/plain')); } catch { return; }
  if (zone.dataset.termBox !== undefined) {
    const index = Number(zone.dataset.termBox);
    if (payload.type === 'die') moveDieToTerm(payload.dieId, index);
    else if (payload.type === 'factor') moveFactorToTerm(payload.factorId, index);
  } else if (zone.dataset.dropPool !== undefined) {
    if (payload.type === 'die') returnDieToPool(payload.dieId);
    else if (payload.type === 'factor') {
      const factor = state.terms.flatMap((t) => t.factors).find((f) => f.id === payload.factorId);
      if (factor?.kind === 'die') returnDieToPool(factor.dieId);
    }
  }
});

render();

// Exposición mínima para depuración manual en consola, sin formar parte de la API del juego.
globalThis.__ALGEROLL__ = { state, validateChallenge, expressionPoly, HELP_CARD_DEFINITIONS, render, renderDiceCube };
