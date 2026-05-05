// howtoplay.js — shared How to Play modal (loaded on every page)

const MODAL_HTML = `
<div id="htp-modal" class="htp-hidden">
  <div class="popup-overlay" id="htp-overlay"></div>
  <div class="popup-card htp-card">
    <button class="popup-close" id="htp-close">✕</button>
    <h2 class="htp-title">How to Play</h2>
    <ol class="htp-steps">
      <li>A real product is shown — photo, name, and description.</li>
      <li>You have <strong>5 guesses</strong> to name the price.</li>
      <li>After each guess you'll see if the real price is <span class="htp-higher">↑ Higher</span> or <span class="htp-lower">↓ Lower</span>.</li>
      <li>Get within 5% and the puzzle ends — you nailed it.</li>
      <li>A new puzzle drops every day at midnight UTC.</li>
    </ol>
    <div class="htp-scoring">
      <p class="htp-scoring-title">Scoring</p>
      <div class="htp-score-row"><span class="htp-badge green">Within 5%</span><span>1000 pts 🎯</span></div>
      <div class="htp-score-row"><span class="htp-badge green">Within 15%</span><span>800 pts 🔥</span></div>
      <div class="htp-score-row"><span class="htp-badge yellow">Within 30%</span><span>600 pts 👍</span></div>
      <div class="htp-score-row"><span class="htp-badge yellow">Within 50%</span><span>400 pts 😅</span></div>
      <div class="htp-score-row"><span class="htp-badge red">Within 75%</span><span>200 pts</span></div>
      <div class="htp-score-row"><span class="htp-badge red">Over 75% off</span><span>100 pts 💸</span></div>
    </div>
  </div>
</div>
`;

// Inject modal into page
document.body.insertAdjacentHTML('afterbegin', MODAL_HTML);

function openHTP()  { document.getElementById('htp-modal').classList.remove('htp-hidden'); }
function closeHTP() { document.getElementById('htp-modal').classList.add('htp-hidden'); }

document.getElementById('how-to-play-btn').addEventListener('click', openHTP);
document.getElementById('htp-overlay').addEventListener('click', closeHTP);
document.getElementById('htp-close').addEventListener('click', closeHTP);
