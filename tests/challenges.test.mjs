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

test('E02: exactamente dos términos y constante +3', () => {
  assert.equal(validateChallenge(challenge('E02'), ctx(p(mono(1,1,0), mono(3,0,0)))), true);
  assert.equal(validateChallenge(challenge('E02'), ctx(p(mono(3,0,0)))), false);
  assert.equal(validateChallenge(challenge('E02'), ctx(p(mono(1,1,0), mono(1,0,1), mono(3,0,0)))), false);
});

test('E03: un único término', () => {
  assert.equal(validateChallenge(challenge('E03'), ctx(p(mono(4,1,0)))), true);
  assert.equal(validateChallenge(challenge('E03'), ctx(p(mono(1,1,0), mono(1,0,0)))), false);
});

test('E04: detecta término de grado total 2', () => {
  assert.equal(validateChallenge(challenge('E04'), ctx(p(mono(4,1,1)))), true);
  assert.equal(validateChallenge(challenge('E04'), ctx(p(mono(1,3,0)))), false);
});

test('E05: igualdad exacta con x² + y²', () => {
  assert.equal(validateChallenge(challenge('E05'), ctx(p(mono(1,2,0), mono(1,0,2)))), true);
  assert.equal(validateChallenge(challenge('E05'), ctx(p(mono(2,2,0), mono(1,0,2)))), false);
});

test('E09, E12, I09, I11, I12 y D02: objetivos exactos de las imágenes y cartas nuevas', () => {
  assert.equal(validateChallenge(challenge('E09'), ctx(p(mono(1,2,0), mono(1,1,1)))), true);
  assert.equal(validateChallenge(challenge('E12'), ctx(p(mono(3,0,1), mono(2,0,0)))), true);
  assert.equal(validateChallenge(challenge('I09'), ctx(p(mono(1,2,0), mono(2,1,0), mono(1,0,0)))), true);
  assert.equal(validateChallenge(challenge('I11'), ctx(p(mono(2,1,0), mono(1,0,2), mono(1,0,0)))), true);
  assert.equal(validateChallenge(challenge('I12'), ctx(p(mono(6,1,0)))), true);
  assert.equal(validateChallenge(challenge('I12'), ctx(p(mono(6,0,1)))), false);
  assert.equal(validateChallenge(challenge('D02'), ctx(p(mono(2,2,0), mono(4,0,0)))), true);
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

test('I06: relación estructural triple', () => {
  const diceById = new Map([['die-1',{id:'die-1',face:'x'}], ['die-2',{id:'die-2',face:'x'}]]);
  const triple = [
    { factors:[{id:'a',kind:'die',dieId:'die-1'}], operations:[{type:'multiply', by:3}] },
    { factors:[{id:'b',kind:'die',dieId:'die-2'}], operations:[] },
  ];
  assert.equal(validateChallenge(challenge('I06'), { poly:p(mono(4,1,0)), terms:triple, diceById, evaluationAnswer:'' }), true);
  const double = [
    { factors:[{id:'a',kind:'die',dieId:'die-1'}], operations:[{type:'multiply', by:2}] },
    { factors:[{id:'b',kind:'die',dieId:'die-2'}], operations:[] },
  ];
  assert.equal(validateChallenge(challenge('I06'), { poly:p(mono(3,1,0)), terms:double, diceById, evaluationAnswer:'' }), false);
});

test('I08: área de un cuadrado, x² o y²', () => {
  assert.equal(validateChallenge(challenge('I08'), ctx(p(mono(1,2,0)))), true);
  assert.equal(validateChallenge(challenge('I08'), ctx(p(mono(1,0,2)))), true);
  assert.equal(validateChallenge(challenge('I08'), ctx(p(mono(2,2,0)))), false);
  assert.equal(validateChallenge(challenge('I08'), ctx(p(mono(1,1,0)))), false);
});

test('I10: un solo término xy con coeficiente numérico', () => {
  assert.equal(validateChallenge(challenge('I10'), ctx(p(mono(2,1,1)))), true);
  assert.equal(validateChallenge(challenge('I10'), ctx(p(mono(1,1,1)))), false);
  assert.equal(validateChallenge(challenge('I10'), ctx(p(mono(2,1,0)))), false);
});

test('D03: compara la respuesta introducida con la evaluación (x=1, y=4)', () => {
  const poly = p(mono(2,1,0), mono(1,0,1)); // 2x + y => 6 para (1,4)
  assert.equal(validateChallenge(challenge('D03'), ctx(poly, { evaluationAnswer:'6' })), true);
  assert.equal(validateChallenge(challenge('D03'), ctx(poly, { evaluationAnswer:'5' })), false);
});

test('D03: exige términos con x e y, no solo un número', () => {
  const constant = p(mono(4,0,0)); // 4 para (1,4)
  assert.equal(validateChallenge(challenge('D03'), ctx(constant, { evaluationAnswer:'4' })), false);
});

test('D04: compara la respuesta introducida con la evaluación (x=3, y=1)', () => {
  const poly = p(mono(1,1,0), mono(1,0,1)); // x + y => 4 para (3,1)
  assert.equal(validateChallenge(challenge('D04'), ctx(poly, { evaluationAnswer:'4' })), true);
  assert.equal(validateChallenge(challenge('D04'), ctx(poly, { evaluationAnswer:'7' })), false);
  assert.equal(validateChallenge(challenge('D04'), ctx(p(mono(4,0,0)), { evaluationAnswer:'4' })), false);
});

test('D06: predicado de evaluación (x=1, y=3) < 7', () => {
  assert.equal(validateChallenge(challenge('D06'), ctx(p(mono(2,1,0), mono(1,0,1)))), true); // 5 < 7
  assert.equal(validateChallenge(challenge('D06'), ctx(p(mono(1,1,0), mono(2,0,1)))), false); // 7 !< 7
});

test('D06: exige términos con x e y, no solo un número', () => {
  assert.equal(validateChallenge(challenge('D06'), ctx(p(mono(1,0,0)))), false);
  assert.equal(validateChallenge(challenge('D06'), ctx(p(mono(1,0,1)))), false);
});
