// archive.js — renders the last 7 playable puzzles (placeholder)

async function loadArchive() {
  const res = await fetch('puzzles/index.json');
  if (!res.ok) throw new Error('Archive not available');
  return res.json();
}

async function init() {
  try {
    const index = await loadArchive();
    console.log('Archive index loaded:', index);
    // TODO: render list of past puzzles with play links and completion status
  } catch (e) {
    document.getElementById('archive').innerHTML = '<p>Archive not available.</p>';
  }
}

init();
