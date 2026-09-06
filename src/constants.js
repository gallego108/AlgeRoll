export const FACES = ['1', '2', 'x', 'y', 'x2', 'y2'];

export const FACE_LABELS = {
  '1': '1',
  '2': '2',
  x: 'x',
  y: 'y',
  x2: 'x²',
  y2: 'y²',
};

export const OPPOSITE_FACE = {
  '1': '2',
  '2': '1',
  x: 'x2',
  x2: 'x',
  y: 'y2',
  y2: 'y',
};

export const DIFFICULTY = {
  easy: { label: 'Fácil', points: 1 },
  intermediate: { label: 'Intermedio', points: 2 },
  hard: { label: 'Difícil', points: 3 },
};

export const MAX_PLAYERS = 5;
export const DICE_COUNT = 5;
export const TERM_BOX_COUNT = 4;
export const MAX_CHALLENGES_PER_TURN = 2;
export const VISIBLE_CHALLENGES = 4;
export const SERVER_PORT = 4173;
