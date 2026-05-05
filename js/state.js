// state.js — localStorage read/write for streak and game history

const STATE_KEY = 'pricecheck_state';

function getState() {
  const raw = localStorage.getItem(STATE_KEY);
  if (!raw) return { streak: 0, lastPlayedDate: null, history: {} };
  return JSON.parse(raw);
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function getTodayUTC() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // "YYYY-MM-DD"
}
