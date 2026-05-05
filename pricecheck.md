# Pricecheck — Game Design & Software Doc

## Concept
A daily game where players guess the price of a real product. One product per day, same for everyone worldwide. Scored by how close you are as a percentage — the closer your guess, the higher your score. Simple, nostalgic (Price is Right vibes), highly shareable.

---

## Core Mechanic

1. Player is shown a product listing: photo, name, brief description, and year (if historical).
2. Player types in a dollar amount and hits **Submit**.
3. They get **3 guesses total**.
4. After each guess, feedback shows whether the real price is **higher** or **lower**, plus how far off they were as a percentage.
5. After all guesses (or a correct guess), the real price is revealed with context.

### Scoring
| Accuracy | Points |
|---|---|
| Within 5% | 1000 (Perfect) |
| Within 15% | 800 |
| Within 30% | 600 |
| Within 50% | 400 |
| Within 75% | 200 |
| Over 75% off | 100 |

Points are awarded for the **first correct-range guess**. Fewer guesses used = streak bonus.

### Streak System
- Daily streak tracked via `localStorage` + optional account
- 7-day streak badge, 30-day badge
- Streak shown on share card

---

## Daily Content Format

Each day's puzzle is a **product card** with:
- `title` — Product name (e.g. "1987 Nintendo Entertainment System")
- `description` — 1–2 sentence neutral description (no price hints)
- `image_url` — Clean product photo (no price tags)
- `answer_price` — The real price in USD
- `price_context` — One sentence explaining the price after reveal (e.g. "Adjusted for inflation, this is ~$780 today.")
- `category` — e.g. `retro_tech`, `groceries`, `luxury`, `everyday`, `real_estate`, `weird_amazon`
- `year` — Year the price is from (for historical items)
- `source_url` — Citation for the price

### Content Categories (rotate weekly)
- **Retro tech** — old game consoles, VHS players, early cell phones
- **Grocery comparison** — cost of a cart of groceries in 1975 vs today
- **Weird Amazon** — real absurd products sold on Amazon right now
- **Luxury** — handbags, watches, cars (big swings)
- **Everyday USA** — gallon of milk, movie ticket, rent, stamp (specific year)
- **Art & Collectibles** — auction results, trading cards, rare items

---

## Tech Stack

### Frontend
- **Vanilla HTML/CSS/JS** or **React** (single page, no routing needed)
- `localStorage` for streak, score history, and today's completion state
- Optional: Firebase Auth for cross-device sync

### Backend / Data
- **Static JSON** hosted on GitHub Pages or a CDN — one file per day (e.g. `2025-06-01.json`)
- No server needed for MVP
- Cron job (GitHub Actions) to publish tomorrow's puzzle at midnight UTC

### Hosting
- **GitHub Pages** (free, zero-ops)
- Custom domain (e.g. `pricecheck.daily`)

### Admin / Content Pipeline
- Google Sheets as CMS → GitHub Action exports to JSON nightly
- Columns: `date, title, description, image_url, answer_price, category, year, price_context, source_url`

---

## Share Card (Viral Loop)

```
💰 Pricecheck #142
🎯 Got it in 2 guesses!
📊 Off by 12% on guess 1, then nailed it.
🔥 Streak: 9 days

pricecheck.daily
```

Share to Twitter/X, clipboard copy. Green/yellow/red emoji grid for guess accuracy (like Wordle squares).

---

## MVP Scope (4–6 weeks)

- [ ] Static daily puzzle loaded from JSON
- [ ] 3-guess input with higher/lower feedback
- [ ] Score calculation and display
- [ ] Streak tracking via localStorage
- [ ] Shareable result card (copy to clipboard)
- [ ] Puzzle archive (last 7 days)
- [ ] 30-day content backlog pre-loaded

## Stretch Goals

- [ ] Global leaderboard (Firebase or Supabase)
- [ ] User accounts for cross-device streak sync
- [ ] Category filter on archive page
- [ ] "Submit your own product" community pipeline
- [ ] Multiplayer mode — 2 players, closest guess wins
- [ ] Inflation calculator shown post-reveal
