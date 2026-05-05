// game.js — core game logic

const MAX_GUESSES = 5;

let puzzle = null;
let guesses = [];
let gameOver = false;

// ── Data loading ──────────────────────────────────────────────────────────────

async function fetchPuzzle(date) {
  const res = await fetch(`puzzles/${date}.json`);
  if (!res.ok) throw new Error('not found');
  return res.json();
}

async function loadTodaysPuzzle() {
  // Archive links pass ?date=YYYY-MM-DD
  const params = new URLSearchParams(window.location.search);
  const requestedDate = params.get('date');
  if (requestedDate) return fetchPuzzle(requestedDate);

  const today = getTodayUTC();

  // Try today's date first
  try {
    return await fetchPuzzle(today);
  } catch {}

  // Fall back to the most recent available puzzle
  const indexRes = await fetch('puzzles/index.json');
  if (!indexRes.ok) throw new Error('index unavailable');
  const dates = await indexRes.json();
  if (!dates.length) throw new Error('no puzzles');

  return fetchPuzzle(dates[0]); // index is sorted newest-first
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function percentOff(guess, answer) {
  return Math.abs((guess - answer) / answer) * 100;
}

function getScore(pct) {
  if (pct <= 5)  return 1000;
  if (pct <= 15) return 800;
  if (pct <= 30) return 600;
  if (pct <= 50) return 400;
  if (pct <= 75) return 200;
  return 100;
}

function getBestScore() {
  if (!guesses.length) return 0;
  const best = Math.min(...guesses.map(g => percentOff(g, puzzle.answer_price)));
  return getScore(best);
}

function getScoreEmoji(score) {
  if (score === 1000) return '🎯';
  if (score >= 800)  return '🔥';
  if (score >= 600)  return '👍';
  if (score >= 400)  return '😅';
  return '💸';
}

// ── Formatting ────────────────────────────────────────────────────────────────

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const CATEGORY_LABELS = {
  retro_tech:       'Retro Tech',
  everyday_usa:     'Everyday USA',
  luxury:           'Luxury',
  weird_amazon:     'Weird Amazon',
  groceries:        'Groceries',
  art_collectibles: 'Art & Collectibles',
};

function fmtCategory(cat) {
  return CATEGORY_LABELS[cat] || cat;
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function renderPuzzleCard() {
  const yearBadge = puzzle.year
    ? `<span class="year-badge">${puzzle.year}</span>`
    : '';

  return `
    <div class="puzzle-card">
      <div class="puzzle-meta">
        <span class="category-badge">${fmtCategory(puzzle.category)}</span>
        ${yearBadge}
      </div>
      <div class="puzzle-image-wrap">
        <img
          src="${puzzle.image_url}"
          alt="${puzzle.title}"
          class="puzzle-image"
          onerror="this.classList.add('img-failed')"
        />
        <div class="puzzle-image-placeholder" aria-hidden="true">🏷️</div>
      </div>
      <h2 class="puzzle-title">${puzzle.title}</h2>
      <p class="puzzle-description">${puzzle.description}</p>
    </div>
  `;
}

function renderGuessHistory() {
  return guesses.map((g, i) => {
    const pct = percentOff(g, puzzle.answer_price);
    const exact = pct <= 0.001;
    const dir = exact ? 'exact' : g < puzzle.answer_price ? 'higher' : 'lower';
    const dirLabel = { higher: '↑ Go higher', lower: '↓ Go lower', exact: '✓ Exact!' }[dir];

    return `
      <div class="guess-row ${dir}">
        <span class="guess-number">Guess ${i + 1}</span>
        <span class="guess-amount">${fmt(g)}</span>
        <span class="guess-direction">${dirLabel}</span>
      </div>
    `;
  }).join('');
}

function renderInputArea() {
  const remaining = MAX_GUESSES - guesses.length;
  return `
    <div class="guess-area">
      <p class="guesses-remaining">${remaining} guess${remaining !== 1 ? 'es' : ''} remaining</p>
      <div class="guess-input-row">
        <span class="dollar-sign">$</span>
        <input
          type="number"
          id="guess-input"
          min="0"
          step="0.01"
          placeholder="0.00"
          autofocus
        />
        <button id="submit-btn">Submit</button>
      </div>
    </div>
  `;
}

function renderResultScreen() {
  const score = getBestScore();
  const emoji = getScoreEmoji(score);
  const sourceLink = puzzle.source_url
    ? `<a href="${puzzle.source_url}" target="_blank" rel="noopener" class="source-link">View source ↗</a>`
    : '';

  return `
    <div class="result-screen">
      <p class="reveal-label">The actual price was</p>
      <p class="actual-price">${fmt(puzzle.answer_price)}</p>
      <p class="price-context">${puzzle.price_context}</p>
      <div class="score-display">
        <span class="score-emoji">${emoji}</span>
        <span class="score-number">${score}</span>
        <span class="score-label">pts</span>
      </div>
      <div class="result-actions">
        <button id="share-btn" class="share-btn">Copy Result 📋</button>
        ${sourceLink}
      </div>
    </div>
  `;
}

// ── Main render ───────────────────────────────────────────────────────────────

function render() {
  const el = document.getElementById('game');

  let html = renderPuzzleCard();
  html += `<div class="guess-history">${renderGuessHistory()}</div>`;
  html += gameOver ? renderResultScreen() : renderInputArea();

  el.innerHTML = html;
  bindEvents();

  if (!gameOver) {
    document.getElementById('guess-input')?.focus();
  }
}

function bindEvents() {
  if (gameOver) {
    document.getElementById('share-btn').addEventListener('click', handleShare);
    return;
  }

  const input = document.getElementById('guess-input');
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleSubmit(); });
}

// ── Actions ───────────────────────────────────────────────────────────────────

function handleSubmit() {
  const input = document.getElementById('guess-input');
  const val = parseFloat(input.value);

  if (isNaN(val) || val <= 0) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 400);
    return;
  }

  guesses.push(val);

  const pct = percentOff(val, puzzle.answer_price);
  if (pct <= 5 || guesses.length >= MAX_GUESSES) {
    gameOver = true;
    persistResult();
  }

  render();
}

function handleShare() {
  const state = getState();
  const text = buildShareText(puzzle.date, getBestScore(), guesses, puzzle.answer_price, state.streak);

  copyToClipboard(text).then(() => {
    const btn = document.getElementById('share-btn');
    btn.textContent = 'Copied! ✓';
    setTimeout(() => (btn.textContent = 'Copy Result 📋'), 2000);
  });
}

// ── Persistence ───────────────────────────────────────────────────────────────

function persistResult() {
  const state = getState();
  const today = getTodayUTC();
  const isToday = puzzle.date === today;

  if (isToday) {
    if (state.lastPlayedDate === getYesterdayUTC()) {
      state.streak += 1;
    } else if (state.lastPlayedDate !== today) {
      state.streak = 1;
    }
    state.lastPlayedDate = today;
  }

  state.history[puzzle.date] = {
    completed: true,
    score: getBestScore(),
    guesses: [...guesses],
    usedGuesses: guesses.length,
  };

  saveState(state);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  try {
    puzzle = await loadTodaysPuzzle();

    // Remember which puzzle was last viewed so the archive opens on that month
    const s = getState();
    s.lastViewedDate = puzzle.date;
    saveState(s);

    // Restore state if already played this puzzle
    const saved = getState().history[puzzle.date];
    if (saved?.completed) {
      guesses = saved.guesses;
      gameOver = true;
    }

    render();
  } catch (e) {
    document.getElementById('game').innerHTML =
      '<p class="error-msg">No puzzle available right now. Check back soon!</p>';
  }
}

init();

