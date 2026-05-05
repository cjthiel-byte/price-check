// archive.js — interactive calendar archive

const MONTHS = ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'];
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CATEGORY_LABELS = {
  retro_tech:       'Retro Tech',
  everyday_usa:     'Everyday USA',
  luxury:           'Luxury',
  weird_amazon:     'Weird Amazon',
  groceries:        'Groceries',
  art_collectibles: 'Art & Collectibles',
};

let puzzleDates = new Set();
let state;
let currentYear, currentMonth;
let minYear, minMonth;

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  state = getState();

  // Open on the month of the last puzzle the user viewed, or today
  const startDate = state.lastViewedDate || getTodayUTC();
  [currentYear, currentMonth] = startDate.split('-').map(Number);

  try {
    const res = await fetch('puzzles/index.json');
    const dates = await res.json();
    puzzleDates = new Set(dates);

    // Find the earliest month we have data for
    const sorted = [...dates].sort();
    if (sorted.length) {
      [minYear, minMonth] = sorted[0].split('-').map(Number);
    } else {
      [minYear, minMonth] = [currentYear, currentMonth];
    }
  } catch {
    document.getElementById('archive').innerHTML = '<p class="error-msg">Archive unavailable.</p>';
    return;
  }

  renderCalendar();
}

// ── Calendar render ───────────────────────────────────────────────────────────

function renderCalendar() {
  const today = getTodayUTC();
  const [ty, tm] = today.split('-').map(Number);

  const canGoPrev = currentYear > minYear || (currentYear === minYear && currentMonth > minMonth);
  const canGoNext = currentYear < ty || (currentYear === ty && currentMonth < tm);

  const firstDOW    = new Date(Date.UTC(currentYear, currentMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();

  const dayHeaders = DAYS.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  let cells = '';
  for (let i = 0; i < firstDOW; i++) cells += '<div class="cal-day empty"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    cells += renderDay(d, today);
  }

  document.getElementById('archive').innerHTML = `
    <div class="calendar">
      <div class="calendar-header">
        <button class="cal-nav" id="cal-prev" ${!canGoPrev ? 'disabled' : ''}>‹</button>
        <h2 class="cal-month-title">${MONTHS[currentMonth - 1]} ${currentYear}</h2>
        <button class="cal-nav" id="cal-next" ${!canGoNext ? 'disabled' : ''}>›</button>
      </div>
      <div class="cal-grid">
        ${dayHeaders}
        ${cells}
      </div>
    </div>
  `;

  document.getElementById('cal-prev').addEventListener('click', () => {
    if (currentMonth === 1) { currentMonth = 12; currentYear--; }
    else currentMonth--;
    renderCalendar();
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    if (currentMonth === 12) { currentMonth = 1; currentYear++; }
    else currentMonth++;
    renderCalendar();
  });

  document.querySelectorAll('.cal-day[data-date]').forEach(el => {
    el.addEventListener('click', () => handleDayClick(el.dataset.date));
  });
}

function renderDay(d, today) {
  const mm   = String(currentMonth).padStart(2, '0');
  const dd   = String(d).padStart(2, '0');
  const date = `${currentYear}-${mm}-${dd}`;

  const isToday    = date === today;
  const isFuture   = date > today;
  const hasPuzzle  = puzzleDates.has(date);
  const saved      = state.history[date];
  const completed  = saved?.completed;

  let cls   = 'cal-day';
  let inner = `<span class="cal-day-num">${d}</span>`;

  if (isFuture || !hasPuzzle) {
    cls += isFuture ? ' future' : ' no-puzzle';
  } else if (completed) {
    const won = saved.score === 1000;
    cls += won ? ' completed won' : ' completed lost';
    inner += `<span class="cal-score">${saved.score}</span>`;
  } else {
    cls += ' playable';
  }

  if (isToday) cls += ' today';

  const clickable = hasPuzzle && !isFuture;
  return `<div class="${cls}" ${clickable ? `data-date="${date}"` : ''}>${inner}</div>`;
}

// ── Popup ─────────────────────────────────────────────────────────────────────

async function handleDayClick(date) {
  showPopup(date, null); // show loading state immediately

  try {
    const res = await fetch(`puzzles/${date}.json`);
    const puzzle = await res.json();
    showPopup(date, puzzle);
  } catch {
    closePopup();
  }
}

function showPopup(date, puzzle) {
  document.getElementById('day-popup')?.remove();

  const saved   = state.history[date];
  const isToday = date === getTodayUTC();

  const [y, m, d] = date.split('-').map(Number);
  const displayDate = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });

  let body;
  if (!puzzle) {
    body = '<p class="popup-loading">Loading…</p>';
  } else {
    const scoreHtml = saved?.completed ? `
      <div class="popup-score">
        ${scoreEmoji(saved.score)} ${saved.score} pts
        <span class="popup-guesses">· ${saved.usedGuesses} guess${saved.usedGuesses !== 1 ? 'es' : ''}</span>
      </div>` : '';

    const btnLabel = saved?.completed ? 'View Result' : isToday ? "Play Today's Puzzle" : 'Play';
    const href     = isToday ? 'index.html' : `index.html?date=${date}`;

    body = `
      <p class="popup-date">${displayDate}</p>
      <h3 class="popup-title">${puzzle.title}</h3>
      <span class="popup-category">${CATEGORY_LABELS[puzzle.category] || puzzle.category}${puzzle.year ? ` · ${puzzle.year}` : ''}</span>
      ${scoreHtml}
      <a href="${href}" class="popup-play-btn">${btnLabel} →</a>
    `;
  }

  const el = document.createElement('div');
  el.id = 'day-popup';
  el.innerHTML = `
    <div class="popup-overlay"></div>
    <div class="popup-card">
      <button class="popup-close">✕</button>
      ${body}
    </div>
  `;
  document.body.appendChild(el);

  el.querySelector('.popup-overlay').addEventListener('click', closePopup);
  el.querySelector('.popup-close').addEventListener('click', closePopup);
}

function closePopup() {
  document.getElementById('day-popup')?.remove();
}

function scoreEmoji(score) {
  if (score === 1000) return '🎯';
  if (score >= 800)  return '🔥';
  if (score >= 600)  return '👍';
  if (score >= 400)  return '😅';
  return '💸';
}

init();
