const ROWS = 6;
const COLS = 5;
const FLIP_MS = 500;
const STAGGER_MS = 300;

let secret, currentRow, currentCol, board, gameOver, animating;

const WIN_MSGS = ['Genial!','Incrível!','Ótimo!','Muito bem!','Boa!','Ufa!'];

const ACCENT_MAP = {
  'Á':'A','À':'A','Â':'A','Ã':'A','Ä':'A',
  'É':'E','È':'E','Ê':'E','Ë':'E',
  'Í':'I','Ì':'I','Î':'I','Ï':'I',
  'Ó':'O','Ò':'O','Ô':'O','Õ':'O','Ö':'O',
  'Ú':'U','Ù':'U','Û':'U','Ü':'U',
  'Ç':'C','Ñ':'N'
};

function normalize(ch) {
  return ACCENT_MAP[ch] || ch;
}

function getTile(r, c) {
  return document.getElementById(`t-${r}-${c}`);
}

function buildBoard() {
  const el = document.getElementById('board');
  el.innerHTML = '';
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const t = document.createElement('div');
      t.className = 'tile';
      t.id = `t-${r}-${c}`;
      el.appendChild(t);
    }
}

function resetKeys() {
  document.querySelectorAll('.key').forEach(k => {
    k.className = k.classList.contains('wide') ? 'key wide' : 'key';
    delete k.dataset.state;
  });
}

function init() {
  secret = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
  currentRow = 0;
  currentCol = 0;
  board = Array.from({length: ROWS}, () => Array(COLS).fill(''));
  gameOver = false;
  animating = false;
  buildBoard();
  resetKeys();
  document.getElementById('result-modal').classList.add('hidden');
}

function addLetter(letter) {
  if (gameOver || animating || currentCol >= COLS) return;
  const tile = getTile(currentRow, currentCol);
  tile.textContent = letter;
  tile.dataset.filled = '1';
  tile.classList.add('pop');
  tile.addEventListener('animationend', () => tile.classList.remove('pop'), {once: true});
  board[currentRow][currentCol++] = letter;
}

function removeLetter() {
  if (gameOver || animating || currentCol <= 0) return;
  const tile = getTile(currentRow, --currentCol);
  tile.textContent = '';
  delete tile.dataset.filled;
  board[currentRow][currentCol] = '';
}

function submitGuess() {
  if (gameOver || animating) return;
  if (currentCol < COLS) { toast('Palavra muito curta!'); shakeRow(currentRow); return; }

  const guess = board[currentRow].join('');
  if (!WORDS.includes(guess)) { toast('Palavra não encontrada!'); shakeRow(currentRow); return; }

  const result = evaluate(guess);
  revealRow(currentRow, result, () => {
    updateKeys(guess, result);
    if (guess === secret) {
      gameOver = true;
      bounceRow(currentRow);
      setTimeout(() => showResult('Você acertou!', secret, WIN_MSGS[currentRow] || 'Parabéns!'), 400);
    } else if (++currentRow >= ROWS) {
      gameOver = true;
      setTimeout(() => showResult('Fim de jogo', secret, 'Não foi dessa vez...'), 400);
    } else {
      currentCol = 0;
    }
  });
}

function evaluate(guess) {
  const result = Array(COLS).fill('absent');
  const sArr = secret.split('');
  const used = Array(COLS).fill(false);

  for (let i = 0; i < COLS; i++) {
    if (guess[i] === sArr[i]) { result[i] = 'correct'; used[i] = true; }
  }
  for (let i = 0; i < COLS; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < COLS; j++) {
      if (!used[j] && guess[i] === sArr[j]) { result[i] = 'present'; used[j] = true; break; }
    }
  }
  return result;
}

function revealRow(row, result, cb) {
  animating = true;
  for (let c = 0; c < COLS; c++) {
    const tile = getTile(row, c);
    setTimeout(() => {
      tile.classList.add('flip');
      setTimeout(() => tile.classList.add(result[c]), FLIP_MS / 2);
    }, c * STAGGER_MS);
  }
  setTimeout(() => { animating = false; cb(); }, (COLS - 1) * STAGGER_MS + FLIP_MS);
}

function updateKeys(guess, result) {
  const pri = {correct: 3, present: 2, absent: 1};
  for (let i = 0; i < COLS; i++) {
    const key = document.querySelector(`.key[data-key="${guess[i]}"]`);
    if (!key) continue;
    const cur = pri[key.dataset.state] || 0;
    if (pri[result[i]] > cur) {
      key.classList.remove('correct','present','absent');
      key.classList.add(result[i]);
      key.dataset.state = result[i];
    }
  }
}

function shakeRow(row) {
  for (let c = 0; c < COLS; c++) {
    const t = getTile(row, c);
    t.classList.add('shake');
    t.addEventListener('animationend', () => t.classList.remove('shake'), {once: true});
  }
}

function bounceRow(row) {
  for (let c = 0; c < COLS; c++) {
    setTimeout(() => {
      const t = getTile(row, c);
      t.classList.add('bounce');
      t.addEventListener('animationend', () => t.classList.remove('bounce'), {once: true});
    }, c * 80);
  }
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
}

function showResult(title, word, msg) {
  document.getElementById('r-title').textContent = title;
  document.getElementById('r-word').textContent = word;
  document.getElementById('r-msg').textContent = msg;
  document.getElementById('result-modal').classList.remove('hidden');
}

// Keyboard events
document.getElementById('keyboard').addEventListener('click', e => {
  const key = e.target.closest('.key');
  if (!key) return;
  const k = key.dataset.key;
  if (k === 'ENTER') submitGuess();
  else if (k === 'BACKSPACE') removeLetter();
  else addLetter(k);
});

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  const raw = e.key.toUpperCase();
  if (raw === 'ENTER') submitGuess();
  else if (raw === 'BACKSPACE') removeLetter();
  else {
    const ch = normalize(raw);
    if (/^[A-Z]$/.test(ch)) addLetter(ch);
  }
});

document.getElementById('new-game').addEventListener('click', init);
document.getElementById('help-btn').addEventListener('click', () =>
  document.getElementById('help-modal').classList.remove('hidden'));

document.querySelectorAll('.close-modal').forEach(btn =>
  btn.addEventListener('click', () =>
    btn.closest('.modal').classList.add('hidden')));

document.querySelectorAll('.modal').forEach(modal =>
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.classList.add('hidden');
  }));

document.getElementById('theme-btn').addEventListener('click', () => {
  const dark = document.body.classList.toggle('dark');
  document.getElementById('theme-btn').textContent = dark ? '☀' : '☾';
  localStorage.setItem('theme', dark ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('theme-btn').textContent = '☀';
}

init();
