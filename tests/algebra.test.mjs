import test from 'node:test';
import assert from 'node:assert/strict';
import {
  faceToMonomial,
  simplifyTerm,
  polynomialFromTerms,
  renderPolynomial,
  countTerms,
  hasQuadraticTerm,
  hasStructuralDoubleTerm,
  evaluatePolynomial,
  polynomialEquals,
  polynomialFromMonomials,
  mono,
} from '../src/algebra.js';

const dice = (...faces) => new Map(faces.map((face, i) => [`die-${i+1}`, { id:`die-${i+1}`, face }]));
const dFactor = (id) => ({ id:`f-${id}`, kind:'die', dieId:id, overrideFace:null });
const term = (...ids) => ({ factors: ids.map(dFactor), operations:[] });

test('2 × x × x se simplifica a 2x²', () => {
  const db = dice('2','x','x');
  const t = term('die-1','die-2','die-3');
  assert.deepEqual(simplifyTerm(t, db), { coef:2, xPow:2, yPow:0 });
});

test('x + x + 1 combina semejantes y cuenta dos términos', () => {
  const db = dice('x','x','1');
  const terms = [term('die-1'), term('die-2'), term('die-3'), { factors:[], operations:[] }];
  const poly = polynomialFromTerms(terms, db, 0);
  assert.equal(renderPolynomial(poly), '2x + 1');
  assert.equal(countTerms(poly), 2);
});

test('xy se considera término cuadrático', () => {
  const db = dice('x','y');
  const poly = polynomialFromTerms([term('die-1','die-2')], db, 0);
  assert.equal(hasQuadraticTerm(poly), true);
});

test('2x y x conservan relación estructural doble antes de combinar', () => {
  const db = dice('2','x','x');
  const terms = [term('die-1','die-2'), term('die-3')];
  assert.equal(hasStructuralDoubleTerm(terms, db), true);
});

test('evaluación polinómica', () => {
  const poly = polynomialFromMonomials([mono(2,1,0), mono(2,0,1), mono(1,0,0)]);
  assert.equal(evaluatePolynomial(poly, 1, 4), 11);
});

test('igualdad algebraica usa mapa canónico y no el string', () => {
  const a = polynomialFromMonomials([mono(1,1,0), mono(1,1,0), mono(1,0,0)]);
  const b = polynomialFromMonomials([mono(2,1,0), mono(1,0,0)]);
  assert.equal(polynomialEquals(a, b), true);
});

test('caras básicas se traducen a monomios', () => {
  assert.deepEqual(faceToMonomial('x2'), { coef:1, xPow:2, yPow:0 });
  assert.deepEqual(faceToMonomial('y2'), { coef:1, xPow:0, yPow:2 });
  assert.deepEqual(faceToMonomial('2'), { coef:2, xPow:0, yPow:0 });
});
