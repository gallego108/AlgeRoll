import {
  polynomialEquals,
  countTerms,
  hasQuadraticTerm,
  hasStructuralDoubleTerm,
  evaluatePolynomial,
} from './algebra.js';

/**
 * Valida una carta de reto contra un contexto de expresión ya estructurado.
 * Es una función pura: no modifica mazos, puntuaciones ni estado de turno.
 */
export function validateChallenge(challenge, context) {
  const { poly, terms, diceById, evaluationAnswer } = context;
  const validator = challenge.validator;

  switch (validator.type) {
    case 'TERM_COUNT':
      return countTerms(poly) === validator.count;

    case 'ENDS_CONSTANT_3':
      return poly.get('0,0') === 3 && [...poly.keys()].some((key) => key !== '0,0');

    case 'HAS_QUADRATIC_TERM':
      return hasQuadraticTerm(poly);

    case 'EXACT_POLYNOMIAL':
      return polynomialEquals(poly, validator.target);

    case 'STRUCTURAL_DOUBLE_TERM':
      return hasStructuralDoubleTerm(terms, diceById);

    case 'EVALUATE_AND_ANSWER': {
      const answer = Number(evaluationAnswer);
      if (String(evaluationAnswer ?? '').trim() === '' || !Number.isFinite(answer)) return false;
      return answer === evaluatePolynomial(poly, validator.x, validator.y);
    }

    case 'EVALUATION_PREDICATE': {
      const value = evaluatePolynomial(poly, validator.x, validator.y);
      switch (validator.operator) {
        case '<': return value < validator.value;
        case '<=': return value <= validator.value;
        case '>': return value > validator.value;
        case '>=': return value >= validator.value;
        case '=': return value === validator.value;
        default: return false;
      }
    }

    default:
      return false;
  }
}
