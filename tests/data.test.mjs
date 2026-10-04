import test from 'node:test';
import assert from 'node:assert/strict';
import { buildHelpDeck, HELP_CARD_DEFINITIONS } from '../src/data/helpCards.js';
import { CHALLENGES } from '../src/data/challenges.js';

test('el mazo de ayudas contiene exactamente 40 cartas', () => {
  assert.equal(HELP_CARD_DEFINITIONS.reduce((sum, card) => sum + card.copies, 0), 40);
  assert.equal(buildHelpDeck().length, 40);
});

test('el MVP contiene 30 retos activos y no contiene el reto de 5 términos', () => {
  assert.equal(CHALLENGES.length, 30);
  assert.equal(CHALLENGES.some((c) => /5 términos/i.test(c.text)), false);
});

test('distribución de retos: 12 fáciles, 12 intermedios, 6 difíciles', () => {
  assert.equal(CHALLENGES.filter((c) => c.difficulty === 'easy').length, 12);
  assert.equal(CHALLENGES.filter((c) => c.difficulty === 'intermediate').length, 12);
  assert.equal(CHALLENGES.filter((c) => c.difficulty === 'hard').length, 6);
});

test('cada carta con imagen apunta a un asset de algeplano', () => {
  const withImage = CHALLENGES.filter((c) => c.image);
  assert.equal(withImage.length, 8);
  for (const c of withImage) {
    assert.match(c.image, /^assets\/algebra_tiles\/.+\.png$/);
    assert.equal(c.validator.type, 'EXACT_POLYNOMIAL');
  }
});
