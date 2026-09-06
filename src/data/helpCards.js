export const HELP_CARD_DEFINITIONS = [
  { id:'H01', copies:2, text:'Multiplica un término por 3', category:'term', effect:'MULTIPLY_TERM', by:3 },
  { id:'H02', copies:2, text:'Añade un término que sí tengas (Debe ser exactamente igual)', category:'expression', effect:'COPY_TERM' },
  { id:'H03', copies:2, text:'Cambia un dado por su cara opuesta', category:'dice', effect:'OPPOSITE_DIE', min:1, max:1 },
  { id:'H04', copies:2, text:'Añade un término que no tengas', category:'expression', effect:'NEW_UNIQUE_TERM' },
  { id:'H05', copies:2, text:'Añade las X que quieras', category:'expression', effect:'ADD_FACE_UNLIMITED', face:'x' },
  { id:'H06', copies:2, text:'Convierte un término en 1', category:'term', effect:'TERM_TO_ONE' },
  { id:'H07', copies:2, text:'Añade las Y que quieras', category:'expression', effect:'ADD_FACE_UNLIMITED', face:'y' },
  { id:'H08', copies:2, text:'Cambia una Y por una X', category:'factor', effect:'CHANGE_FACTOR', from:'y', to:'x' },
  { id:'H09', copies:3, text:'Vuelve a tirar hasta 3 dados', category:'dice', effect:'REROLL_DICE', min:1, max:3 },
  { id:'H10', copies:1, text:'Vuelve a tirar los dados que quieras', category:'dice', effect:'REROLL_DICE', min:1, max:5 },
  { id:'H11', copies:4, text:'Vuelve a tirar hasta 2 dados', category:'dice', effect:'REROLL_DICE', min:1, max:2 },
  { id:'H12', copies:2, text:'Suma 2 a tu expresión', category:'expression', effect:'ADD_EXPRESSION_CONSTANT', amount:2 },
  { id:'H13', copies:2, text:'Cambia una X por una Y', category:'factor', effect:'CHANGE_FACTOR', from:'x', to:'y' },
  { id:'H14', copies:2, text:'Modifica un dado para elegir la cara que quieras', category:'dice', effect:'CHOOSE_DIE_FACE', count:1 },
  { id:'H15', copies:2, text:'Modifica 2 dados como quieras', category:'dice', effect:'CHOOSE_DICE_FACES', count:2 },
  { id:'H16', copies:2, text:'Duplica un término', category:'term', effect:'MULTIPLY_TERM', by:2 },
  { id:'H17', copies:2, text:'Cambia una Y² por una X²', category:'factor', effect:'CHANGE_FACTOR', from:'y2', to:'x2' },
  { id:'H18', copies:2, text:'Cambia una X² por una Y²', category:'factor', effect:'CHANGE_FACTOR', from:'x2', to:'y2' },
  { id:'H19', copies:1, text:'Añade hasta 3x²', category:'expression', effect:'ADD_FACE_LIMITED', face:'x2', min:1, max:3 },
  { id:'H20', copies:1, text:'Añade hasta 3y²', category:'expression', effect:'ADD_FACE_LIMITED', face:'y2', min:1, max:3 },
];

export function buildHelpDeck() {
  const deck = [];
  for (const def of HELP_CARD_DEFINITIONS) {
    for (let i = 0; i < def.copies; i += 1) {
      deck.push({ ...def, instanceId: `${def.id}-${i + 1}` });
    }
  }
  return deck;
}
