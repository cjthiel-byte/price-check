// archive.js — renders the last 7 playable puzzles

async function loadArchive() {
  const res = await fetch('puzzles/index.json');
  if (!res.ok) throw new Error('Archive unavailable');
  const dates = await res.json();
  return dates.slice(0, 7); // last 7 days
}

async function loadPuzzleMeta(date) {
  const res = await fetch(`puzzles/${date}.json`);
  if (!res.ok) return null;
  const p = await res.json();
  return { date: p.date, title: p.title };
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

async function init() {
  const el = document.getElementById('archive');

  try {
    const dates = await loadArchive();
    const state = getState();
    const today = getTodayUTC();

    // Load titles for all dates in parallel
    const metas = await Promise.all(dates.map(loadPuzzleMeta));

    let html = '<h2 class="archive-page-title">Last 7 Puzzles</h2><div class="archive-list">';

    for (const meta of metas) {
      if (!meta) continue;
      const saved = state.history[meta.date];
      const isToday = meta.date === today;
      const href = isToday ? 'index.html' : `index.html?date=${meta.date}`;

      const scoreHtml = saved?.completed
        ? `<span class="archive-item-score">${saved.score} pts</span>`
        : `<span class="archive-item-score unplayed">Play →</span>`;

      html += `
        <a href="${href}" class="archive-item">
          <div class="archive-item-info">
            <div class="archive-item-date">${formatDate(meta.date)}${isToday ? ' — Today' : ''}</div>
            <div class="archive-item-title">${meta.title}</div>
          </div>
          ${scoreHtml}
        </a>
      `;
    }

    html += '</div>';
    el.innerHTML = html;
  } catch (e) {
    el.innerHTML = '<p class="error-msg">Archive unavailable.</p>';
  }
}

init();
