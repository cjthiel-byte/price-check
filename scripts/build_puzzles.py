#!/usr/bin/env python3
"""
build_puzzles.py — Fetches the Pricecheck Google Sheet (published as CSV)
and writes one JSON file per puzzle into puzzles/YYYY-MM-DD.json.
Also updates puzzles/index.json with all dates available up to today UTC.

Usage:
    python3 scripts/build_puzzles.py "<SHEET_CSV_URL>"
"""

import csv
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone


def normalize_image_url(url):
    """Convert upload.wikimedia.org paths to Special:FilePath (no hash required)."""
    m = re.match(
        r'https://upload\.wikimedia\.org/wikipedia/(?:commons|en)/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/(.+?)(?:/\d+px-.+)?$',
        url,
    )
    if m:
        filename = m.group(1)
        return f'https://commons.wikimedia.org/wiki/Special:FilePath/{filename}'
    return url

PUZZLES_DIR = "puzzles"


def fetch_csv(url):
    with urllib.request.urlopen(url) as response:
        return response.read().decode("utf-8")


def parse_puzzles(csv_text):
    reader = csv.DictReader(csv_text.splitlines())
    puzzles = []
    for row in reader:
        date = row.get("date", "").strip()
        if not date:
            continue

        year_raw = row.get("year", "").strip()
        answer_raw = row.get("answer_price", "0").strip().lstrip("$").replace(",", "")

        puzzle = {
            "date": date,
            "title": row.get("title", "").strip(),
            "description": row.get("description", "").strip(),
            "image_url": normalize_image_url(row.get("image_url", "").strip()),
            "answer_price": float(answer_raw) if answer_raw else 0.0,
            "category": row.get("category", "").strip(),
            "year": int(year_raw) if year_raw else None,
            "price_context": row.get("price_context", "").strip(),
            "source_url": row.get("source_url", "").strip(),
        }
        puzzles.append(puzzle)
    return puzzles


def main():
    if len(sys.argv) < 2:
        print("Usage: build_puzzles.py <SHEET_CSV_URL>")
        sys.exit(1)

    url = sys.argv[1]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print(f"Fetching sheet CSV...")
    csv_text = fetch_csv(url)
    puzzles = parse_puzzles(csv_text)
    print(f"Found {len(puzzles)} puzzle rows.")

    available_dates = []

    for puzzle in puzzles:
        path = f"{PUZZLES_DIR}/{puzzle['date']}.json"
        with open(path, "w") as f:
            json.dump(puzzle, f, indent=2)
        print(f"  Written: {path}")

        # Only expose puzzles up to and including today
        if puzzle["date"] <= today:
            available_dates.append(puzzle["date"])

    # Sort descending so index[0] is the most recent
    available_dates.sort(reverse=True)

    index_path = f"{PUZZLES_DIR}/index.json"
    with open(index_path, "w") as f:
        json.dump(available_dates, f, indent=2)
    print(f"index.json updated — {len(available_dates)} puzzle(s) available as of {today}.")


if __name__ == "__main__":
    main()
