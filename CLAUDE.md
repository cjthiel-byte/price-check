# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**price-check** is a daily browser game where players guess the price of a real product. One product per day, same for all players worldwide. Scoring is based on how close the guess is as a percentage of the actual price. The aesthetic is nostalgic (Price is Right vibes) and the experience is designed to be highly shareable.

## Tech Stack

Vanilla HTML/CSS/JS — no build step, no framework. Hosted on GitHub Pages.

## Commands

No build step. Open `index.html` directly in a browser, or use a local server:

```bash
npx serve .
# or
python3 -m http.server
```

## Architecture

### File Structure
```
/
├── index.html          # Main game page
├── archive.html        # Last 7 playable puzzles
├── css/style.css
├── js/
│   ├── state.js        # localStorage: streak, history, getTodayUTC()
│   ├── game.js         # Loads today's puzzle, handles guess flow
│   ├── share.js        # Share card text + clipboard copy
│   └── archive.js      # Renders archive list
├── puzzles/
│   ├── index.json      # Array of available puzzle dates (written by CI)
│   └── YYYY-MM-DD.json # One puzzle file per day
└── .github/workflows/
    └── publish-puzzle.yml  # Nightly: Google Sheet CSV → puzzle JSON files
```

### Data Flow
1. Content lives in a Google Sheet (one row per day)
2. A GitHub Action runs nightly at 00:05 UTC, exports the Sheet as CSV, and writes `puzzles/YYYY-MM-DD.json` + updates `puzzles/index.json`
3. `game.js` fetches `puzzles/<today-utc>.json` on load
4. All game state (streak, guess history, completions) lives in `localStorage` via `state.js`

### Key Design Constraints
- Puzzle date is keyed to UTC (`getTodayUTC()` in `state.js`)
- Archive puzzles are playable but do not update streak or `lastPlayedDate`
- No server, no database — fully static
