import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHelpDeck, HELP_CARD_DEFINITIONS } from '../src/data/helpCards.js';
import { CHALLENGES } from '../src/data/challenges.js';

test('el mazo de ayudas contiene exactamente 40 cartas', () => {
  assert.equal(HELP_CARD_DEFINITIONS.reduce((sum, card) => sum + card.copies, 0), 40);
  assert.equal(buildHelpDeck().length, 40);
});

test('el MVP contiene 20 retos activos y no contiene el reto de 5 términos', () => {
  assert.equal(CHALLENGES.length, 20);
  assert.equal(CHALLENGES.some((c) => /5 términos/i.test(c.text)), false);
});

test('distribución de retos: 10 fáciles, 5 intermedios, 5 difíciles', () => {
  assert.equal(CHALLENGES.filter((c) => c.difficulty === 'easy').length, 10);
  assert.equal(CHALLENGES.filter((c) => c.difficulty === 'intermediate').length, 5);
  assert.equal(CHALLENGES.filter((c) => c.difficulty === 'hard').length, 5);
});
