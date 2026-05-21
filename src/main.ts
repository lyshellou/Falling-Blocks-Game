import './style.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const DROP_INTERVAL_MS = 650;
const DEFAULT_VERSUS_DURATION_SECONDS = 120;
const MIN_VERSUS_DURATION_SECONDS = 30;
const MAX_VERSUS_DURATION_SECONDS = 300;

type Cell = string | null;
type GameMode = 'single' | 'versus';
type MatchResult = 'player1' | 'player2' | 'draw' | null;

type Piece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

type PlayerKeyBindings = {
  left: string;
  right: string;
  down: string;
  rotate: string;
  hardDrop: string;
};

type PlayerState = {
  board: Cell[][];
  currentPiece: Piece;
  nextPiece: Piece;
  score: number;
  clearedLines: number;
  isGameOver: boolean;
};

type PlayerDom = {
  panel: HTMLElement;
  title: HTMLElement;
  status: HTMLElement;
  score: HTMLElement;
  lines: HTMLElement;
  linesCard: HTMLElement;
  board: HTMLDivElement;
  preview: HTMLDivElement;
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

const PLAYER_ONE_KEYS: PlayerKeyBindings = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  down: 'ArrowDown',
  rotate: 'ArrowUp',
  hardDrop: ' ',
};

const PLAYER_TWO_KEYS: PlayerKeyBindings = {
  left: 'a',
  right: 'd',
  down: 's',
  rotate: 'w',
  hardDrop: 'shift',
};

const bodyElement = requiredElement<HTMLBodyElement>('body');
const modeLabelElement = requiredElement<HTMLElement>('#mode-label');
const timerCardElement = requiredElement<HTMLElement>('#timer-card');
const timerDisplayElement = requiredElement<HTMLElement>('#timer-display');
const resultLabelElement = requiredElement<HTMLElement>('#result-label');
const resultDisplayElement = requiredElement<HTMLElement>('#result-display');
const playerTwoPanelElement = requiredElement<HTMLElement>('#player2-panel');
const restartButton = requiredElement<HTMLButtonElement>('#restart');
const helpButton = requiredElement<HTMLButtonElement>('#help');
const closeHelpButton = requiredElement<HTMLButtonElement>('#close-help');
const startButton = requiredElement<HTMLButtonElement>('#start-game');
const singleModeButton = requiredElement<HTMLButtonElement>('#single-mode-button');
const versusModeButton = requiredElement<HTMLButtonElement>('#versus-mode-button');
const modeDescriptionElement = requiredElement<HTMLElement>('#mode-description');
const durationFieldElement = requiredElement<HTMLElement>('#duration-field');
const versusDurationInput = requiredElement<HTMLInputElement>('#versus-duration');
const startModal = requiredElement<HTMLDivElement>('#start-modal');
const helpModal = requiredElement<HTMLDivElement>('#help-modal');

const playerDoms: Record<'player1' | 'player2', PlayerDom> = {
  player1: {
    panel: requiredElement<HTMLElement>('#player1-panel'),
    title: requiredElement<HTMLElement>('#player1-title'),
    status: requiredElement<HTMLElement>('#player1-state'),
    score: requiredElement<HTMLElement>('#player1-score'),
    lines: requiredElement<HTMLElement>('#player1-lines'),
    linesCard: requiredElement<HTMLElement>('#player1-lines-card'),
    board: requiredElement<HTMLDivElement>('#player1-board'),
    preview: requiredElement<HTMLDivElement>('#player1-next-preview'),
  },
  player2: {
    panel: requiredElement<HTMLElement>('#player2-panel'),
    title: requiredElement<HTMLElement>('#player2-title'),
    status: requiredElement<HTMLElement>('#player2-state'),
    score: requiredElement<HTMLElement>('#player2-score'),
    lines: requiredElement<HTMLElement>('#player2-lines'),
    linesCard: requiredElement<HTMLElement>('#player2-lines-card'),
    board: requiredElement<HTMLDivElement>('#player2-board'),
    preview: requiredElement<HTMLDivElement>('#player2-next-preview'),
  },
};

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

let selectedMode: GameMode = 'single';
let currentMode: GameMode = 'single';
let playerOne = createPlayerState();
let playerTwo = createPlayerState();
let isStarted = false;
let dropTimer: number | undefined;
let versusTimer: number | undefined;
let versusDurationSeconds = DEFAULT_VERSUS_DURATION_SECONDS;
let remainingSeconds = DEFAULT_VERSUS_DURATION_SECONDS;
let matchResult: MatchResult = null;

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

function createPlayerState(): PlayerState {
  return {
    board: createBoard(),
    currentPiece: createPiece(),
    nextPiece: createPiece(),
    score: 0,
    clearedLines: 0,
    isGameOver: false,
  };
}

function resetPlayers(): void {
  playerOne = createPlayerState();
  playerTwo = createPlayerState();
}

function drawGame(): void {
  const isVersus = currentMode === 'versus';

  bodyElement.classList.toggle('mode-single', !isVersus);
  bodyElement.classList.toggle('mode-versus', isVersus);
  playerTwoPanelElement.classList.toggle('hidden', !isVersus);
  playerDoms.player1.linesCard.classList.toggle('hidden', !isVersus);
  timerCardElement.classList.toggle('hidden', !isVersus);

  modeLabelElement.textContent = isVersus ? 'Versus' : 'Single';
  resultLabelElement.textContent = isVersus ? 'Result' : 'Status';
  timerDisplayElement.textContent = formatTime(remainingSeconds);

  drawPlayer(playerOne, playerDoms.player1, {
    name: isVersus ? 'Player 1' : 'Solo',
    showLines: isVersus,
  });

  if (isVersus) {
    drawPlayer(playerTwo, playerDoms.player2, {
      name: 'Player 2',
      showLines: true,
    });
  }

  resultDisplayElement.textContent = getResultText();
}

function drawPlayer(
  player: PlayerState,
  dom: PlayerDom,
  options: { name: string; showLines: boolean },
): void {
  const activeCells = new Map<string, string>();

  forEachPieceCell(player.currentPiece, (x, y) => {
    activeCells.set(`${x},${y}`, player.currentPiece.color);
  });

  dom.panel.classList.toggle('is-ko', player.isGameOver);
  dom.title.textContent = options.name;
  dom.status.textContent = getPlayerStatus(player);
  dom.score.textContent = String(player.score);
  dom.lines.textContent = String(player.clearedLines);
  dom.linesCard.classList.toggle('hidden', !options.showLines);
  dom.board.innerHTML = '';

  for (let y = 0; y < BOARD_HEIGHT; y += 1) {
    for (let x = 0; x < BOARD_WIDTH; x += 1) {
      const cell = document.createElement('div');
      const activeColor = activeCells.get(`${x},${y}`);
      const lockedColor = player.board[y][x];
      const color = activeColor ?? lockedColor;

      cell.className = color ? `cell filled ${color}` : 'cell';
      dom.board.appendChild(cell);
    }
  }

  drawNextPreview(player.nextPiece, dom.preview);
}

function drawNextPreview(piece: Piece, previewElement: HTMLDivElement): void {
  previewElement.innerHTML = '';

  const previewSize = 4;
  const offsetX = Math.floor((previewSize - piece.shape[0].length) / 2);
  const offsetY = Math.floor((previewSize - piece.shape.length) / 2);
  const previewCells = new Map<string, string>();

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      if (value) {
        previewCells.set(`${columnIndex + offsetX},${rowIndex + offsetY}`, piece.color);
      }
    });
  });

  for (let y = 0; y < previewSize; y += 1) {
    for (let x = 0; x < previewSize; x += 1) {
      const cell = document.createElement('div');
      const color = previewCells.get(`${x},${y}`);

      cell.className = color ? `preview-cell filled ${color}` : 'preview-cell';
      previewElement.appendChild(cell);
    }
  }
}

function tick(): void {
  if (!isStarted) {
    return;
  }

  if (currentMode === 'single') {
    tickPlayer(playerOne);
    drawGame();
    return;
  }

  tickPlayer(playerOne);
  tickPlayer(playerTwo);

  if (playerOne.isGameOver && !playerTwo.isGameOver) {
    finishVersusMatch('player2');
  } else if (playerTwo.isGameOver && !playerOne.isGameOver) {
    finishVersusMatch('player1');
  } else if (playerOne.isGameOver && playerTwo.isGameOver) {
    finishVersusMatch('draw');
  }

  drawGame();
}

function tickPlayer(player: PlayerState): void {
  if (player.isGameOver) {
    return;
  }

  if (!movePiece(player, 0, 1)) {
    lockPiece(player);
    const clearedCount = clearLines(player);
    player.clearedLines += clearedCount;
    player.score += clearedCount * 100;
    spawnNextPiece(player);
  }
}

function movePiece(player: PlayerState, dx: number, dy: number): boolean {
  if (player.isGameOver) {
    return false;
  }

  const movedPiece = {
    ...player.currentPiece,
    x: player.currentPiece.x + dx,
    y: player.currentPiece.y + dy,
  };

  if (hasCollision(player, movedPiece)) {
    return false;
  }

  player.currentPiece = movedPiece;
  return true;
}

function rotatePiece(player: PlayerState): void {
  if (player.isGameOver) {
    return;
  }

  const rotatedShape = player.currentPiece.shape[0].map((_, index) =>
    player.currentPiece.shape.map((row) => row[index]).reverse(),
  );
  const rotatedPiece = { ...player.currentPiece, shape: rotatedShape };

  if (!hasCollision(player, rotatedPiece)) {
    player.currentPiece = rotatedPiece;
  }
}

function hardDropPiece(player: PlayerState): void {
  if (!isStarted || player.isGameOver) {
    return;
  }

  while (movePiece(player, 0, 1)) {
    // Keep dropping until the next row would collide.
  }

  lockPiece(player);
  const clearedCount = clearLines(player);
  player.clearedLines += clearedCount;
  player.score += clearedCount * 100;
  spawnNextPiece(player);

  if (currentMode === 'versus') {
    if (player === playerOne && player.isGameOver && !playerTwo.isGameOver) {
      finishVersusMatch('player2');
    } else if (player === playerTwo && player.isGameOver && !playerOne.isGameOver) {
      finishVersusMatch('player1');
    } else if (playerOne.isGameOver && playerTwo.isGameOver) {
      finishVersusMatch('draw');
    }
  }

  drawGame();
}

function hasCollision(player: PlayerState, piece: Piece): boolean {
  let collided = false;

  forEachPieceCell(piece, (x, y) => {
    if (x < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT || (y >= 0 && player.board[y][x])) {
      collided = true;
    }
  });

  return collided;
}

function lockPiece(player: PlayerState): void {
  forEachPieceCell(player.currentPiece, (x, y) => {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      player.board[y][x] = player.currentPiece.color;
    }
  });
}

function clearLines(player: PlayerState): number {
  const remainingRows = player.board.filter((row) => row.some((cell) => !cell));
  const clearedCount = BOARD_HEIGHT - remainingRows.length;

  if (clearedCount === 0) {
    return 0;
  }

  const emptyRows = Array.from({ length: clearedCount }, () => Array<Cell>(BOARD_WIDTH).fill(null));
  player.board = [...emptyRows, ...remainingRows];
  return clearedCount;
}

function spawnNextPiece(player: PlayerState): void {
  player.currentPiece = player.nextPiece;
  player.nextPiece = createPiece();

  if (hasCollision(player, player.currentPiece)) {
    player.isGameOver = true;

    if (currentMode === 'single') {
      stopDropTimer();
      isStarted = false;
    }
  }
}

function startGame(): void {
  currentMode = selectedMode;
  versusDurationSeconds = sanitizeDuration(versusDurationInput.value);
  versusDurationInput.value = String(versusDurationSeconds);
  remainingSeconds = versusDurationSeconds;
  matchResult = null;
  isStarted = true;
  resetPlayers();
  startModal.classList.add('hidden');
  startDropTimer();
  startVersusTimerIfNeeded();
  drawGame();
}

function restartGame(): void {
  versusDurationSeconds = sanitizeDuration(versusDurationInput.value);
  versusDurationInput.value = String(versusDurationSeconds);
  remainingSeconds = versusDurationSeconds;
  matchResult = null;
  isStarted = true;
  resetPlayers();
  startModal.classList.add('hidden');
  startDropTimer();
  startVersusTimerIfNeeded();
  drawGame();
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

function startVersusTimerIfNeeded(): void {
  stopVersusTimer();

  if (currentMode !== 'versus') {
    return;
  }

  versusTimer = window.setInterval(() => {
    if (!isStarted) {
      return;
    }

    remainingSeconds = Math.max(remainingSeconds - 1, 0);

    if (remainingSeconds === 0) {
      finishVersusMatch(getWinnerByLines());
    }

    drawGame();
  }, 1000);
}

function stopVersusTimer(): void {
  if (versusTimer !== undefined) {
    window.clearInterval(versusTimer);
    versusTimer = undefined;
  }
}

function finishVersusMatch(result: MatchResult): void {
  matchResult = result;
  isStarted = false;
  stopDropTimer();
  stopVersusTimer();
}

function getWinnerByLines(): MatchResult {
  if (playerOne.clearedLines > playerTwo.clearedLines) {
    return 'player1';
  }

  if (playerTwo.clearedLines > playerOne.clearedLines) {
    return 'player2';
  }

  return 'draw';
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

function showHelp(): void {
  helpModal.classList.remove('hidden');
}

function hideHelp(): void {
  helpModal.classList.add('hidden');
}

function setSelectedMode(mode: GameMode): void {
  selectedMode = mode;
  singleModeButton.classList.toggle('active', mode === 'single');
  versusModeButton.classList.toggle('active', mode === 'versus');
  singleModeButton.setAttribute('aria-pressed', String(mode === 'single'));
  versusModeButton.setAttribute('aria-pressed', String(mode === 'versus'));
  durationFieldElement.classList.toggle('hidden', mode !== 'versus');
  modeLabelElement.textContent = mode === 'versus' ? 'Versus' : 'Single';
  resultDisplayElement.textContent = 'Ready';
  modeDescriptionElement.textContent =
    mode === 'single'
      ? 'Single mode keeps the classic solo run.'
      : 'Versus mode is a timed same-keyboard battle. Clear more lines before time runs out.';
}

function sanitizeDuration(rawValue: string): number {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return DEFAULT_VERSUS_DURATION_SECONDS;
  }

  const clamped = Math.min(Math.max(Math.round(parsed), MIN_VERSUS_DURATION_SECONDS), MAX_VERSUS_DURATION_SECONDS);
  return clamped;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getPlayerStatus(player: PlayerState): string {
  if (player.isGameOver) {
    return 'KO';
  }

  return isStarted ? 'Live' : 'Ready';
}

function getResultText(): string {
  if (currentMode === 'single') {
    if (playerOne.isGameOver) {
      return 'Game Over';
    }

    return isStarted ? 'Live' : 'Ready';
  }

  if (matchResult === 'player1') {
    return 'Player 1 Wins';
  }

  if (matchResult === 'player2') {
    return 'Player 2 Wins';
  }

  if (matchResult === 'draw') {
    return 'Draw';
  }

  return isStarted ? 'Battle On' : 'Ready';
}

function handlePlayerInput(player: PlayerState, bindings: PlayerKeyBindings, event: KeyboardEvent): boolean {
  if (player.isGameOver || !isStarted) {
    return false;
  }

  const loweredKey = event.key.toLowerCase();

  if (event.key === bindings.left || loweredKey === bindings.left) {
    event.preventDefault();
    movePiece(player, -1, 0);
    return true;
  }

  if (event.key === bindings.right || loweredKey === bindings.right) {
    event.preventDefault();
    movePiece(player, 1, 0);
    return true;
  }

  if (event.key === bindings.down || loweredKey === bindings.down) {
    event.preventDefault();
    movePiece(player, 0, 1);
    return true;
  }

  if (event.key === bindings.rotate || loweredKey === bindings.rotate) {
    event.preventDefault();
    rotatePiece(player);
    return true;
  }

  if (event.key === bindings.hardDrop || loweredKey === bindings.hardDrop) {
    event.preventDefault();
    hardDropPiece(player);
    return true;
  }

  return false;
}

function handleKeydown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase();

  if (key === 'escape') {
    hideHelp();
    return;
  }

  if (key === 'r') {
    event.preventDefault();
    restartGame();
    return;
  }

  let handled = handlePlayerInput(playerOne, PLAYER_ONE_KEYS, event);

  if (currentMode === 'versus') {
    handled = handlePlayerInput(playerTwo, PLAYER_TWO_KEYS, event) || handled;
  }

  if (handled) {
    drawGame();
  }
}

function handleStartModalClick(event: MouseEvent): void {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest('button');

  if (!button || !startModal.contains(button)) {
    return;
  }

  if (button.dataset.mode === 'single') {
    setSelectedMode('single');
  } else if (button.dataset.mode === 'versus') {
    setSelectedMode('versus');
  } else if (button === startButton) {
    startGame();
  }
}

restartButton.addEventListener('click', restartGame);
helpButton.addEventListener('click', showHelp);
closeHelpButton.addEventListener('click', hideHelp);
versusDurationInput.addEventListener('change', () => {
  versusDurationInput.value = String(sanitizeDuration(versusDurationInput.value));
});
startModal.addEventListener('click', handleStartModalClick);
helpModal.addEventListener('click', (event) => {
  if (event.target === helpModal) {
    hideHelp();
  }
});
window.addEventListener('keydown', handleKeydown);

bodyElement.classList.add('app-ready');
setSelectedMode('single');
drawGame();
