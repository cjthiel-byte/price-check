// share.js — build share card text and copy to clipboard

function getGuessEmoji(percentOff) {
  if (percentOff <= 5)  return '🟢';
  if (percentOff <= 15) return '🟡';
  if (percentOff <= 30) return '🟠';
  if (percentOff <= 50) return '🔴';
  return '⬛';
}

function buildShareText(puzzleDate, score, guesses, answerPrice, streak) {
  const grid = guesses
    .map(g => getGuessEmoji(Math.abs((g - answerPrice) / answerPrice) * 100))
    .join('');

  // Pad unused guesses with white squares
  const padded = grid + '⬜'.repeat(3 - guesses.length);

  return [
    `💰 Pricecheck — ${puzzleDate}`,
    padded,
    `Score: ${score} pts`,
    `🔥 Streak: ${streak} day${streak !== 1 ? 's' : ''}`,
    '',
    'pricecheck.daily',
  ].join('\n');
}

function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}
