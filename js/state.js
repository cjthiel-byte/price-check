// state.js — localStorage helpers

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
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function getYesterdayUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}
