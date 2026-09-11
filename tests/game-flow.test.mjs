import test from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGES } from '../src/data/challenges.js';
import { buildHelpDeck } from '../src/data/helpCards.js';

function clickable(dataset = {}) {
  const node = { dataset };
  return { target: { closest() { return node; } } };
}

function fakeDocument() {
  const listeners = new Map();
  const app = {
    innerHTML: '',
    addEventListener(type, handler) { listeners.set(type, handler); },
  };
  globalThis.document = { querySelector() { return app; } };
  return { app, listeners };
}

test('ganar un reto bloquea los dados físicos usados y suma puntos', async () => {
  const { listeners } = fakeDocument();
  await import(`../src/app.js?flow=${Date.now()}`);
  const click = listeners.get('click');
  await click(clickable({ action:'start-game' }));
  const s = globalThis.__ALGEROLL__.state;

  // Saltamos la animación de lanzamiento en esta prueba de dominio/UI.
  s.hasRolled = true;
  s.dice[0].face = 'x';
  s.dice[1].face = '1';
  s.terms[0].factors.push({ id:'f-d1', kind:'die', dieId:'die-1', overrideFace:null });
  s.terms[1].factors.push({ id:'f-d2', kind:'die', dieId:'die-2', overrideFace:null });

  const challenge = CHALLENGES.find((c) => c.id === 'E01');
  s.visibleChallenges = [challenge, ...CHALLENGES.filter((c) => c.id !== 'E01').slice(0,3)];

  await click(clickable({ challengeId:'E01' }));
  await click(clickable({ action:'check-challenge' }));

  assert.equal(s.players[0].score, 1);
  assert.equal(s.turnWins, 1);
  assert.equal(s.dice[0].locked, true);
  assert.equal(s.dice[1].locked, true);
  assert.equal(s.terms.every((t) => t.factors.length === 0), true);
});

test('pasar sin reto roba una ayuda y prepara un nuevo turno', async () => {
  const { listeners } = fakeDocument();
  await import(`../src/app.js?pass=${Date.now()}`);
  const click = listeners.get('click');
  await click(clickable({ action:'start-game' }));
  const s = globalThis.__ALGEROLL__.state;
  const initialHand = s.players[0].hand.length;
  s.hasRolled = true;

  await click(clickable({ action:'pass-turn' }));
  assert.equal(s.players[0].hand.length, initialHand + 1);
  assert.equal(s.hasRolled, false);
  assert.equal(s.turnWins, 0);
});

test('en multijugador el aviso de turno aparece al cambiar de jugador', async () => {
  const { listeners } = fakeDocument();
  await import(`../src/app.js?popup=${Date.now()}`);
  const click = listeners.get('click');
  await click(clickable({ count:'2' }));
  await click(clickable({ action:'start-game' }));
  const s = globalThis.__ALGEROLL__.state;
  // Saltamos la fase de "¿Quién empieza?" para probar el cambio de turno.
  s.screen = 'game';
  s.hasRolled = true;
  s.turnPopup = false;

  await click(clickable({ action:'pass-turn' }));
  assert.equal(s.currentPlayerIndex, 1);
  assert.equal(s.turnPopup, true);
  assert.match(s.players[1].name, /Jugador 2/);

  await click(clickable({ action:'start-turn' }));
  assert.equal(s.turnPopup, false);
});

test('en solitario no aparece el aviso de turno', async () => {
  const { listeners } = fakeDocument();
  await import(`../src/app.js?solo=${Date.now()}`);
  const click = listeners.get('click');
  await click(clickable({ action:'start-game' }));
  const s = globalThis.__ALGEROLL__.state;
  s.hasRolled = true;

  await click(clickable({ action:'pass-turn' }));
  assert.equal(s.turnPopup, false);
});

test('carta de cara opuesta modifica el dado y se descarta', async () => {
  const { listeners } = fakeDocument();
  await import(`../src/app.js?help=${Date.now()}`);
  const click = listeners.get('click');
  await click(clickable({ action:'start-game' }));
  const s = globalThis.__ALGEROLL__.state;
  s.hasRolled = true;
  s.dice[0].face = 'x';
  const h03 = buildHelpDeck().find((c) => c.id === 'H03');
  s.players[0].hand = [h03];

  await click(clickable({ helpId:h03.instanceId }));
  await click(clickable({ dieId:'die-1' }));
  await click(clickable({ action:'confirm-help' }));

  assert.equal(s.dice[0].face, 'x2');
  assert.equal(s.players[0].hand.length, 0);
  assert.equal(s.helpDiscard.at(-1).id, 'H03');
});
