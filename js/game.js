// game.js — core game logic (placeholder)
// Loads today's puzzle and handles guess flow

async function loadPuzzle(date) {
  const res = await fetch(`puzzles/${date}.json`);
  if (!res.ok) throw new Error(`No puzzle found for ${date}`);
  return res.json();
}

async function init() {
  const date = getTodayUTC();
  try {
    const puzzle = await loadPuzzle(date);
    console.log('Puzzle loaded:', puzzle);
    // TODO: render puzzle card and wire up guess input
  } catch (e) {
    document.getElementById('game').innerHTML = '<p>No puzzle available today. Check back soon!</p>';
  }
}

init();
