import { FACE_LABELS } from './constants.js';

export function mono(coef = 1, xPow = 0, yPow = 0) {
  return { coef, xPow, yPow };
}

export function cloneMono(value) {
  return { coef: value.coef, xPow: value.xPow, yPow: value.yPow };
}

export function faceToMonomial(face) {
  switch (face) {
    case '1': return mono(1, 0, 0);
    case '2': return mono(2, 0, 0);
    case 'x': return mono(1, 1, 0);
    case 'y': return mono(1, 0, 1);
    case 'x2': return mono(1, 2, 0);
    case 'y2': return mono(1, 0, 2);
    default: throw new Error(`Cara desconocida: ${face}`);
  }
}

export function multiplyMonomials(a, b) {
  return mono(a.coef * b.coef, a.xPow + b.xPow, a.yPow + b.yPow);
}

export function sameLiteralPart(a, b) {
  return a.xPow === b.xPow && a.yPow === b.yPow;
}

export function sameMonomial(a, b) {
  return a.coef === b.coef && sameLiteralPart(a, b);
}

export function monomialKey(m) {
  return `${m.xPow},${m.yPow}`;
}

export function effectiveFactorValue(factor, diceById = new Map()) {
  if (factor.kind === 'die') {
    const die = diceById.get(factor.dieId);
    if (!die) throw new Error(`Dado no encontrado: ${factor.dieId}`);
    return factor.overrideFace ? faceToMonomial(factor.overrideFace) : faceToMonomial(die.face);
  }
  if (factor.kind === 'virtual') {
    return cloneMono(factor.value);
  }
  throw new Error(`Tipo de factor desconocido: ${factor.kind}`);
}

export function simplifyTerm(term, diceById = new Map()) {
  if (!term || term.factors.length === 0) return null;
  let value = mono(1, 0, 0);
  for (const factor of term.factors) {
    value = multiplyMonomials(value, effectiveFactorValue(factor, diceById));
  }
  for (const op of term.operations || []) {
    if (op.type === 'multiply') {
      value = mono(value.coef * op.by, value.xPow, value.yPow);
    } else if (op.type === 'override-one') {
      value = mono(1, 0, 0);
    }
  }
  return value;
}

export function polynomialFromTerms(terms, diceById = new Map(), globalConstantDelta = 0) {
  const map = new Map();
  for (const term of terms) {
    const m = simplifyTerm(term, diceById);
    if (!m) continue;
    const key = monomialKey(m);
    map.set(key, (map.get(key) || 0) + m.coef);
  }
  if (globalConstantDelta) {
    map.set('0,0', (map.get('0,0') || 0) + globalConstantDelta);
  }
  for (const [key, coef] of [...map.entries()]) {
    if (coef === 0) map.delete(key);
  }
  return map;
}

export function monomialFromKey(key, coef) {
  const [xPow, yPow] = key.split(',').map(Number);
  return mono(coef, xPow, yPow);
}

export function polynomialTerms(poly) {
  return [...poly.entries()]
    .map(([key, coef]) => monomialFromKey(key, coef))
    .filter((m) => m.coef !== 0)
    .sort((a, b) => {
      const degreeA = a.xPow + a.yPow;
      const degreeB = b.xPow + b.yPow;
      if (degreeA !== degreeB) return degreeB - degreeA;
      if (a.xPow !== b.xPow) return b.xPow - a.xPow;
      if (a.yPow !== b.yPow) return b.yPow - a.yPow;
      return 0;
    });
}

function superscript(n) {
  const map = { 0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹' };
  return String(n).split('').map((c) => map[c] || c).join('');
}

export function renderMonomial(m) {
  const hasVars = m.xPow > 0 || m.yPow > 0;
  let out = '';
  if (!hasVars || m.coef !== 1) out += String(m.coef);
  if (m.xPow > 0) out += `x${m.xPow === 1 ? '' : superscript(m.xPow)}`;
  if (m.yPow > 0) out += `y${m.yPow === 1 ? '' : superscript(m.yPow)}`;
  return out || '0';
}

export function renderPolynomial(poly) {
  const terms = polynomialTerms(poly);
  return terms.length ? terms.map(renderMonomial).join(' + ') : '0';
}


export function monomialIsSafe(m) {
  return Number.isSafeInteger(m.coef) && Number.isSafeInteger(m.xPow) && Number.isSafeInteger(m.yPow)
    && m.coef >= 0 && m.xPow >= 0 && m.yPow >= 0;
}

export function polynomialIsSafe(poly) {
  return polynomialTerms(poly).every(monomialIsSafe);
}

export function polynomialEquals(a, b) {
  if (a.size !== b.size) return false;
  for (const [key, coef] of a.entries()) {
    if (b.get(key) !== coef) return false;
  }
  return true;
}

export function polynomialFromMonomials(items) {
  const map = new Map();
  for (const m of items) {
    const key = monomialKey(m);
    map.set(key, (map.get(key) || 0) + m.coef);
  }
  return map;
}

export function evaluatePolynomial(poly, x, y) {
  let total = 0;
  for (const [key, coef] of poly.entries()) {
    const [xPow, yPow] = key.split(',').map(Number);
    total += coef * (x ** xPow) * (y ** yPow);
  }
  return total;
}

export function countTerms(poly) {
  return polynomialTerms(poly).length;
}

export function hasQuadraticTerm(poly) {
  return polynomialTerms(poly).some((m) => m.xPow + m.yPow === 2);
}

export function hasBothVariables(poly) {
  let hasX = false;
  let hasY = false;
  for (const key of poly.keys()) {
    const [xPow, yPow] = key.split(',').map(Number);
    if (xPow > 0) hasX = true;
    if (yPow > 0) hasY = true;
  }
  return hasX && hasY;
}

export function hasStructuralDoubleTerm(terms, diceById) {
  const values = terms.map((t) => simplifyTerm(t, diceById)).filter(Boolean);
  for (let i = 0; i < values.length; i += 1) {
    for (let j = i + 1; j < values.length; j += 1) {
      const a = values[i];
      const b = values[j];
      if (!sameLiteralPart(a, b)) continue;
      if (a.coef === b.coef * 2 || b.coef === a.coef * 2) return true;
    }
  }
  return false;
}

export function termHasExactFaceFactor(term, face, diceById) {
  return term.factors.some((factor) => {
    if (factor.kind === 'die') {
      if (factor.overrideFace) return factor.overrideFace === face;
      return diceById.get(factor.dieId)?.face === face;
    }
    if (factor.kind === 'virtual' && factor.face) return factor.face === face;
    return false;
  });
}

export function renderFactor(factor, diceById) {
  if (factor.kind === 'die') {
    const face = factor.overrideFace || diceById.get(factor.dieId)?.face;
    return FACE_LABELS[face] || '?';
  }
  if (factor.face) return FACE_LABELS[factor.face] || factor.face;
  return renderMonomial(factor.value);
}
