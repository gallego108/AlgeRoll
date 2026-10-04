import { mono, polynomialFromMonomials } from '../algebra.js';

const p = (...items) => polynomialFromMonomials(items);
const ALGEPLANO = 'Representación con algeplano';

export const CHALLENGES = [
  { id:'E01', difficulty:'easy', text:'Expresión con dos términos', validator:{ type:'TERM_COUNT', count:2 } },
  { id:'E02', difficulty:'easy', text:'Expresión con dos términos que termine en +3', validator:{ type:'TWO_TERMS_CONSTANT_3' } },
  { id:'E03', difficulty:'easy', text:'Expresión con un término', validator:{ type:'TERM_COUNT', count:1 } },
  { id:'E04', difficulty:'easy', text:'Expresión con un término cuadrático', validator:{ type:'HAS_QUADRATIC_TERM' } },
  { id:'E05', difficulty:'easy', text:'x² + y²', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,0,2)) } },
  { id:'E06', difficulty:'easy', text:'x + x² + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,1,0), mono(1,0,0)) } },
  { id:'E07', difficulty:'easy', text:'y² + y + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,0,2), mono(1,0,1), mono(1,0,0)) } },
  { id:'E08', difficulty:'easy', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_x2_plus_2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(2,0,0)) } },
  { id:'E09', difficulty:'easy', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_x2_plus_xy.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,1,1)) } },
  { id:'E10', difficulty:'easy', text:'2x + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,1,0), mono(1,0,0)) } },
  { id:'E11', difficulty:'easy', text:'y + 2', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,0,1), mono(2,0,0)) } },
  { id:'E12', difficulty:'easy', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_3y_plus_2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(3,0,1), mono(2,0,0)) } },

  { id:'I01', difficulty:'intermediate', text:'Perímetro de un triángulo equilátero', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(3,1,0)) } },
  { id:'I02', difficulty:'intermediate', text:'Perímetro de un rectángulo de lados desconocidos', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,1,0), mono(2,0,1)) } },
  { id:'I03', difficulty:'intermediate', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_y_plus_2y2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,0,2), mono(1,0,1)) } },
  { id:'I04', difficulty:'intermediate', text:'Expresión donde un término sea el doble de otro', validator:{ type:'STRUCTURAL_DOUBLE_TERM' } },
  { id:'I05', difficulty:'intermediate', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_2y_plus_3y2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(3,0,2), mono(2,0,1)) } },
  { id:'I06', difficulty:'intermediate', text:'Expresión donde un término sea el triple de otro', validator:{ type:'STRUCTURAL_TRIPLE_TERM' } },
  { id:'I07', difficulty:'intermediate', text:'x² + 2x + 1', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(2,1,0), mono(1,0,0)) } },
  { id:'I08', difficulty:'intermediate', text:'El área de un cuadrado con lado desconocido', validator:{ type:'SINGLE_SQUARE_TERM' } },
  { id:'I09', difficulty:'intermediate', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_x2_plus_2x_plus_1.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(2,1,0), mono(1,0,0)) } },
  { id:'I10', difficulty:'intermediate', text:'Expresión de un solo término que use dos letras y un número', validator:{ type:'SINGLE_TERM_XY_WITH_NUMBER' } },
  { id:'I11', difficulty:'intermediate', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_y2_plus_2x_plus_1.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,1,0), mono(1,0,2), mono(1,0,0)) } },
  { id:'I12', difficulty:'intermediate', text:'El área de un rectángulo cuya altura mide 3 y su base 2x', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(6,1,0)) } },

  { id:'D01', difficulty:'hard', text:'Expresión con 4 términos', validator:{ type:'TERM_COUNT', count:4 } },
  { id:'D02', difficulty:'hard', text:'2x² + 4', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(2,2,0), mono(4,0,0)) } },
  { id:'D03', difficulty:'hard', text:'Construye una expresión y di el resultado si x = 1 e y = 4 (debe contener ambas letras)', validator:{ type:'EVALUATE_AND_ANSWER', x:1, y:4, requireBothVariables:true } },
  { id:'D04', difficulty:'hard', text:'Construye una expresión y di el resultado si x = 3 e y = 1 (debe contener ambas letras)', validator:{ type:'EVALUATE_AND_ANSWER', x:3, y:1, requireBothVariables:true } },
  { id:'D05', difficulty:'hard', text:ALGEPLANO, image:'assets/algebra_tiles/challenge_xy_plus_x2_plus_2.png', validator:{ type:'EXACT_POLYNOMIAL', target:p(mono(1,2,0), mono(1,1,1), mono(2,0,0)) } },
  { id:'D06', difficulty:'hard', text:'Si x = 1 e y = 3, el resultado es < 7 (debe contener ambas letras)', validator:{ type:'EVALUATION_PREDICATE', x:1, y:3, operator:'<', value:7, requireBothVariables:true } },
];
