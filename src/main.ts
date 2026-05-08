import './style.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const DROP_INTERVAL_MS = 650;

type Cell = string | null;

type Piece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

const PIECES = [
  { color: 'cyan', shape: [[1, 1, 1, 1]] },
  {
    color: 'blue',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  {
    color: 'orange',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
  },
  {
    color: 'yellow',
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  {
    color: 'green',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  {
    color: 'purple',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    color: 'red',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
];

const boardElement = requiredElement<HTMLDivElement>('#board');
const scoreElement = requiredElement<HTMLElement>('#score');
const statusElement = requiredElement<HTMLElement>('#status');
const restartButton = requiredElement<HTMLButtonElement>('#restart');
const hardDropButton = requiredElement<HTMLButtonElement>('#hard-drop');
const helpButton = requiredElement<HTMLButtonElement>('#help');
const closeHelpButton = requiredElement<HTMLButtonElement>('#close-help');
const startButton = requiredElement<HTMLButtonElement>('#start-game');
const nextPreviewElement = requiredElement<HTMLDivElement>('#next-preview');
const startModal = requiredElement<HTMLDivElement>('#start-modal');
const helpModal = requiredElement<HTMLDivElement>('#help-modal');

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

let board: Cell[][] = createBoard();
let currentPiece: Piece = createPiece();
let nextPiece: Piece = createPiece();
let score = 0;
let isStarted = false;
let isGameOver = false;
let dropTimer: number | undefined;

function createBoard(): Cell[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

function createPiece(): Piece {
  const template = PIECES[Math.floor(Math.random() * PIECES.length)];
  const shape = template.shape.map((row) => [...row]);

  return {
    shape,
    color: template.color,
    x: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
    y: 0,
  };
}

function drawBoard(): void {
  const activeCells = new Map<string, string>();

  forEachPieceCell(currentPiece, (x, y) => {
    activeCells.set(`${x},${y}`, currentPiece.color);
  });

  boardElement.innerHTML = '';

  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const cell = document.createElement('div');
      const activeColor = activeCells.get(`${x},${y}`);
      const lockedColor = board[y][x];
      const color = activeColor ?? lockedColor;

      cell.className = color ? `cell filled ${color}` : 'cell';
      boardElement.appendChild(cell);
    }
  }

  scoreElement.textContent = String(score);
  statusElement.textContent = isGameOver ? 'Game Over' : isStarted ? 'Live' : 'Ready';
  document.body.classList.toggle('game-over', isGameOver);
  drawNextPreview();
}

function tick(): void {
  if (!isStarted || isGameOver) {
    return;
  }

  if (!movePiece(0, 1)) {
    lockPiece();
    clearLines();
    spawnNextPiece();
  }

  drawBoard();
}

function movePiece(dx: number, dy: number): boolean {
  const movedPiece = { ...currentPiece, x: currentPiece.x + dx, y: currentPiece.y + dy };

  if (hasCollision(movedPiece)) {
    return false;
  }

  currentPiece = movedPiece;
  return true;
}

function rotatePiece(): void {
  const rotatedShape = currentPiece.shape[0].map((_, index) =>
    currentPiece.shape.map((row) => row[index]).reverse(),
  );
  const rotatedPiece = { ...currentPiece, shape: rotatedShape };

  if (!hasCollision(rotatedPiece)) {
    currentPiece = rotatedPiece;
  }
}

function hardDropPiece(): void {
  if (!isStarted || isGameOver) {
    return;
  }

  while (movePiece(0, 1)) {
    // Keep dropping until the next row would collide.
  }

  lockPiece();
  clearLines();
  spawnNextPiece();
  drawBoard();
}

function hasCollision(piece: Piece): boolean {
  let collided = false;

  forEachPieceCell(piece, (x, y) => {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && board[y][x])) {
      collided = true;
    }
  });

  return collided;
}

function lockPiece(): void {
  forEachPieceCell(currentPiece, (x, y) => {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      board[y][x] = currentPiece.color;
    }
  });
}

function clearLines(): void {
  const remainingRows = board.filter((row) => row.some((cell) => !cell));
  const clearedCount = BOARD_HEIGHT - remainingRows.length;

  if (clearedCount === 0) {
    return;
  }

  const emptyRows = Array.from({ length: clearedCount }, () => Array<Cell>(BOARD_WIDTH).fill(null));
  board = [...emptyRows, ...remainingRows];
  score += clearedCount * 100;
}

function spawnNextPiece(): void {
  currentPiece = nextPiece;
  nextPiece = createPiece();

  if (hasCollision(currentPiece)) {
    isGameOver = true;
    stopDropTimer();
  }
}

function startGame(): void {
  if (isStarted) {
    return;
  }

  isStarted = true;
  startModal.classList.add('hidden');
  startDropTimer();
  drawBoard();
}

function restartGame(): void {
  board = createBoard();
  currentPiece = createPiece();
  nextPiece = createPiece();
  score = 0;
  isStarted = true;
  isGameOver = false;
  startModal.classList.add('hidden');
  startDropTimer();
  drawBoard();
}

function startDropTimer(): void {
  stopDropTimer();
  dropTimer = window.setInterval(tick, DROP_INTERVAL_MS);
}

function stopDropTimer(): void {
  if (dropTimer !== undefined) {
    window.clearInterval(dropTimer);
    dropTimer = undefined;
  }
}

function forEachPieceCell(piece: Piece, callback: (x: number, y: number) => void): void {
  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value) {
        callback(piece.x + columnIndex, piece.y + rowIndex);
      }
    });
  });
}

function drawNextPreview(): void {
  nextPreviewElement.innerHTML = '';

  const previewSize = 4;
  const offsetX = Math.floor((previewSize - nextPiece.shape[0].length) / 2);
  const offsetY = Math.floor((previewSize - nextPiece.shape.length) / 2);
  const previewCells = new Map<string, string>();

  nextPiece.shape.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value) {
        previewCells.set(`${columnIndex + offsetX},${rowIndex + offsetY}`, nextPiece.color);
      }
    });
  });

  for (let y = 0; y < previewSize; y += 1) {
    for (let x = 0; x < previewSize; x += 1) {
      const cell = document.createElement('div');
      const color = previewCells.get(`${x},${y}`);

      cell.className = color ? `preview-cell filled ${color}` : 'preview-cell';
      nextPreviewElement.appendChild(cell);
    }
  }
}

function showHelp(): void {
  helpModal.classList.remove('hidden');
}

function hideHelp(): void {
  helpModal.classList.add('hidden');
}

function handleKeydown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();

  if (key === 'escape') {
    hideHelp();
    return;
  }

  if (key === 'r') {
    restartGame();
    return;
  }

  if (isGameOver) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    movePiece(-1, 0);
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    movePiece(1, 0);
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    tick();
    return;
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault();
    rotatePiece();
  }

  if (event.key === ' ') {
    event.preventDefault();
    hardDropPiece();
    return;
  }

  drawBoard();
}

restartButton.addEventListener('click', restartGame);
hardDropButton.addEventListener('click', hardDropPiece);
helpButton.addEventListener('click', showHelp);
closeHelpButton.addEventListener('click', hideHelp);
startButton.addEventListener('click', startGame);
helpModal.addEventListener('click', (event) => {
  if (event.target === helpModal) {
    hideHelp();
  }
});
window.addEventListener('keydown', handleKeydown);

drawBoard();
