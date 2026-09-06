import { mono, polynomialFromMonomials } from '../algebra.js';

const p = (...items) => polynomialFromMonomials(items);

export const CHALLENGES = [
  { id:'E01', difficulty:'easy', text:'Expresión con dos términos', validator:{ type:'TERM_COUNT', count:2 } },
  { id:'E02', difficulty:'easy', text:'Expresión que termine en +3', validator:{ type:'ENDS_CONSTANT_3' } },
  { id:'E03', difficulty:'easy', text:'Expresión con tres términos', validator:{ type:'TERM_COUNT', count:3 } },
  { id:'E04', difficulty:'easy', text:'Expresión con un término cuadrático', validator:{ type:'HAS_QUADRATIC_TERM' } },
  { id:'E05', difficulty:'easy', text:'x² + y²', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,0,2)) } },
  { id:'E06', difficulty:'easy', text:'x + x² + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,1,0), mono(1,0,0)) } },
  { id:'E07', difficulty:'easy', text:'y + y² + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,0,2), mono(1,0,1), mono(1,0,0)) } },
  { id:'E08', difficulty:'easy', text:'Representación con algeplano', image:'assets/algebra_tiles/challenge_x2_plus_2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(2,0,0)) } },
  { id:'E09', difficulty:'easy', text:'2x + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,1,0), mono(1,0,0)) } },
  { id:'E10', difficulty:'easy', text:'y + 2', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,0,1), mono(2,0,0)) } },

  { id:'I01', difficulty:'intermediate', text:'Expresión para el perímetro de un triángulo equilátero cuyo lado mide x', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(3,1,0)) } },
  { id:'I02', difficulty:'intermediate', text:'Expresión con 4 términos', validator:{ type:'TERM_COUNT', count:4 } },
  { id:'I03', difficulty:'intermediate', text:'Representación con algeplano', image:'assets/algebra_tiles/challenge_y_plus_2y2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,0,2), mono(1,0,1)) } },
  { id:'I04', difficulty:'intermediate', text:'Expresión donde un término sea el doble de otro', validator:{ type:'STRUCTURAL_DOUBLE_TERM' } },
  { id:'I05', difficulty:'intermediate', text:'Representación con algeplano', image:'assets/algebra_tiles/challenge_2y_plus_3y2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(3,0,2), mono(2,0,1)) } },

  { id:'D01', difficulty:'hard', text:'2x + 2y + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,1,0), mono(2,0,1), mono(1,0,0)) } },
  { id:'D02', difficulty:'hard', text:'Di el resultado de tu expresión si x = 1 e y = 4', validator:{ type:'EVALUATE_AND_ANSWER', x:1, y:4 } },
  { id:'D03', difficulty:'hard', text:'Si x = 3 e y = 1, el resultado es < 15', validator:{ type:'EVALUATION_PREDICATE', x:3, y:1, operator:'<', value:15 } },
  { id:'D04', difficulty:'hard', text:'Representación con algeplano', image:'assets/algebra_tiles/challenge_xy_plus_x2_plus_2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,1,1), mono(2,0,0)) } },
  { id:'D05', difficulty:'hard', text:'Si x = 1 e y = 3, el resultado es < 7', validator:{ type:'EVALUATION_PREDICATE', x:1, y:3, operator:'<', value:7 } },
];
