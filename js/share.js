// share.js — share card generation and clipboard copy (placeholder)

function buildShareText(date, puzzleNumber, guesses, score, streak) {
  // TODO: build emoji grid from guess accuracy
  return [
    `💰 Pricecheck #${puzzleNumber}`,
    `Score: ${score}`,
    `🔥 Streak: ${streak} days`,
    '',
    'pricecheck.daily',
  ].join('\n');
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
