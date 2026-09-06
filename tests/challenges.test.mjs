import test from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGES } from '../src/data/challenges.js';
import { validateChallenge } from '../src/challengeEngine.js';
import { mono, polynomialFromMonomials } from '../src/algebra.js';

const challenge = (id) => CHALLENGES.find((c) => c.id === id);
const ctx = (poly, extra = {}) => ({ poly, terms:[], diceById:new Map(), evaluationAnswer:'', ...extra });
const p = (...items) => polynomialFromMonomials(items);

test('E01: dos monomios simplificados', () => {
  assert.equal(validateChallenge(challenge('E01'), ctx(p(mono(2,1,0), mono(1,0,0)))), true);
  assert.equal(validateChallenge(challenge('E01'), ctx(p(mono(1,1,0)))), false);
});

test('E02: constante +3 al final canónico y al menos un término variable', () => {
  assert.equal(validateChallenge(challenge('E02'), ctx(p(mono(1,1,0), mono(3,0,0)))), true);
  assert.equal(validateChallenge(challenge('E02'), ctx(p(mono(3,0,0)))), false);
});

test('E04: detecta término de grado total 2', () => {
  assert.equal(validateChallenge(challenge('E04'), ctx(p(mono(4,1,1)))), true);
  assert.equal(validateChallenge(challenge('E04'), ctx(p(mono(1,3,0)))), false);
});

test('E05: igualdad exacta con x² + y²', () => {
  assert.equal(validateChallenge(challenge('E05'), ctx(p(mono(1,2,0), mono(1,0,2)))), true);
  assert.equal(validateChallenge(challenge('E05'), ctx(p(mono(2,2,0), mono(1,0,2)))), false);
});

test('I04: relación estructural doble se observa antes de combinar cajas', () => {
  const diceById = new Map([
    ['die-1',{id:'die-1',face:'2'}], ['die-2',{id:'die-2',face:'x'}], ['die-3',{id:'die-3',face:'x'}],
  ]);
  const terms = [
    { factors:[{id:'a',kind:'die',dieId:'die-1'},{id:'b',kind:'die',dieId:'die-2'}], operations:[] },
    { factors:[{id:'c',kind:'die',dieId:'die-3'}], operations:[] },
  ];
  assert.equal(validateChallenge(challenge('I04'), { poly:p(mono(3,1,0)), terms, diceById, evaluationAnswer:'' }), true);
});

test('D02: compara la respuesta introducida con la evaluación', () => {
  const poly = p(mono(2,1,0), mono(1,0,1)); // 2x + y => 6 para (1,4)
  assert.equal(validateChallenge(challenge('D02'), ctx(poly, { evaluationAnswer:'6' })), true);
  assert.equal(validateChallenge(challenge('D02'), ctx(poly, { evaluationAnswer:'5' })), false);
});

test('D03 y D05: predicados de evaluación', () => {
  assert.equal(validateChallenge(challenge('D03'), ctx(p(mono(4,1,0)))), true); // 12 < 15
  assert.equal(validateChallenge(challenge('D03'), ctx(p(mono(5,1,0)))), false); // 15 !< 15
  assert.equal(validateChallenge(challenge('D05'), ctx(p(mono(2,0,1)))), true); // 6 < 7
  assert.equal(validateChallenge(challenge('D05'), ctx(p(mono(3,0,1)))), false); // 9 !< 7
});
