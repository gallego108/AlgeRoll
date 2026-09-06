import test from 'node:test';
import assert from 'node:assert/strict';

function clickable(dataset = {}) {
  const node = { dataset };
  return {
    target: {
      closest() { return node; },
    },
  };
}

test('flujo mínimo: setup -> partida solitaria -> lanzamiento -> colocar un dado', async () => {
  const listeners = new Map();
  const fakeApp = {
    innerHTML: '',
    addEventListener(type, handler) { listeners.set(type, handler); },
  };
  globalThis.document = {
    querySelector(selector) {
      assert.equal(selector, '#app');
      return fakeApp;
    },
  };

  await import(`../src/app.js?smoke=${Date.now()}`);
  assert.match(fakeApp.innerHTML, /Comenzar partida/);
  assert.equal(listeners.has('click'), true);

  await listeners.get('click')(clickable({ action:'start-game' }));
  assert.equal(globalThis.__ALGEROLL__.state.screen, 'game');
  assert.equal(globalThis.__ALGEROLL__.state.players.length, 1);
  assert.equal(globalThis.__ALGEROLL__.state.players[0].hand.length, 2);
  assert.equal(globalThis.__ALGEROLL__.state.visibleChallenges.length, 4);

  await listeners.get('click')(clickable({ action:'launch-dice' }));
  assert.equal(globalThis.__ALGEROLL__.state.hasRolled, true);
  assert.equal(globalThis.__ALGEROLL__.state.dice.length, 5);
  assert.equal((fakeApp.innerHTML.match(/data-dice-slot=/g) || []).length, 5, 'la bandeja debe conservar cinco posiciones visibles');
  assert.equal((fakeApp.innerHTML.match(/class="dice-scene/g) || []).length >= 5, true, 'deben renderizarse los cinco cubos');
  assert.equal((fakeApp.innerHTML.match(/class="cube-face cube-front"/g) || []).length >= 5, true, 'cada cubo debe tener cara frontal');
  assert.equal((fakeApp.innerHTML.match(/class="cube-face cube-back"/g) || []).length >= 5, true, 'cada cubo debe tener cara opuesta');
  assert.equal((fakeApp.innerHTML.match(/die-result-label/g) || []).length, 5, 'cada dado debe mostrar además su resultado textual');
  const cubeCases = [
    ['1', 'show-front'], ['2', 'show-back'], ['x', 'show-right'],
    ['x2', 'show-left'], ['y', 'show-top'], ['y2', 'show-bottom'],
  ];
  for (const [face, cssClass] of cubeCases) {
    const html = globalThis.__ALGEROLL__.renderDiceCube(face);
    assert.match(html, new RegExp(`dice-cube ${cssClass}`), `la cara ${face} debe orientar el cubo con ${cssClass}`);
  }

  await listeners.get('click')(clickable({ dieId:'die-1' }));
  await listeners.get('click')(clickable({ termBox:'0' }));
  assert.equal(globalThis.__ALGEROLL__.state.terms[0].factors.length, 1);
  assert.equal(globalThis.__ALGEROLL__.state.terms[0].factors[0].dieId, 'die-1');
  assert.match(fakeApp.innerHTML, /Expresión simplificada/);
});
