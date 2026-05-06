#!/usr/bin/env python3
"""
fix_images.py — For each puzzle with a broken image, queries the Wikipedia API
to find the article's main image, converts it to a Special:FilePath URL, and
patches the puzzle JSON file.

Usage:
    python3 scripts/fix_images.py
"""

import json
import re
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

PUZZLES_DIR = Path(__file__).parent.parent / "puzzles"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PricecheckBot/1.0)"}


def check_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            ctype = resp.headers.get("Content-Type", "")
            return resp.status == 200 and ctype.startswith("image/")
    except Exception:
        return False


def normalize_image_url(url):
    """Convert upload.wikimedia.org paths to Special:FilePath."""
    m = re.match(
        r'https://upload\.wikimedia\.org/wikipedia/(?:commons|en)/(?:thumb/)?[0-9a-f]/[0-9a-f]{2}/(.+?)(?:/\d+px-.+)?$',
        url,
    )
    if m:
        filename = m.group(1)
        return f'https://commons.wikimedia.org/wiki/Special:FilePath/{filename}'
    return url


def wikipedia_main_image(title):
    """Query Wikipedia API for the main image of an article. Returns Special:FilePath URL or None."""
    encoded = urllib.parse.quote(title)
    url = (
        f'https://en.wikipedia.org/w/api.php?action=query'
        f'&titles={encoded}&prop=pageimages&piprop=original'
        f'&format=json&redirects=1'
    )
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        pages = data.get('query', {}).get('pages', {})
        for page in pages.values():
            src = page.get('original', {}).get('source')
            if src:
                return normalize_image_url(src)
    except Exception as e:
        print(f"    Wikipedia API error for '{title}': {e}")
    return None


def wikipedia_search_image(query):
    """Search Wikipedia for a query and return the main image of the top result."""
    encoded = urllib.parse.quote(query)
    search_url = (
        f'https://en.wikipedia.org/w/api.php?action=query'
        f'&list=search&srsearch={encoded}&srlimit=1'
        f'&format=json'
    )
    req = urllib.request.Request(search_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        results = data.get('query', {}).get('search', [])
        if results:
            top_title = results[0]['title']
            print(f"    Search hit: '{top_title}'")
            return wikipedia_main_image(top_title)
    except Exception as e:
        print(f"    Wikipedia search error for '{query}': {e}")
    return None


def main():
    files = sorted(p for p in PUZZLES_DIR.glob("*.json") if p.name != "index.json")
    print(f"Scanning {len(files)} puzzle files...\n")

    fixed = 0
    failed = []

    for path in files:
        with open(path) as f:
            puzzle = json.load(f)

        date = puzzle.get("date", path.stem)
        title = puzzle.get("title", "")
        url = puzzle.get("image_url", "")

        if check_url(url):
            print(f"[{date}] OK — {title}")
            continue

        print(f"[{date}] BROKEN — {title}")
        print(f"    Current: {url}")

        # Try 1: direct title lookup
        new_url = wikipedia_main_image(title)

        # Try 2: search if direct lookup failed
        if not new_url:
            new_url = wikipedia_search_image(title)

        if new_url and check_url(new_url):
            print(f"    Fixed:   {new_url}")
            puzzle["image_url"] = new_url
            with open(path, "w") as f:
                json.dump(puzzle, f, indent=2)
            fixed += 1
        else:
            print(f"    COULD NOT FIX — needs manual URL")
            failed.append({"date": date, "title": title, "tried": new_url})

        time.sleep(0.3)  # be polite to the API

    print(f"\n{'='*70}")
    print(f"Fixed: {fixed}  |  Still broken: {len(failed)}")

    if failed:
        print("\nCould not auto-fix these — set image_url manually:")
        for item in failed:
            print(f"  [{item['date']}] {item['title']}")
            if item['tried']:
                print(f"    Tried: {item['tried']}")

    # Write a log of failures for easy reference
    if failed:
        log_path = Path(__file__).parent / "unfixed_images.json"
        with open(log_path, "w") as f:
            json.dump(failed, f, indent=2)
        print(f"\nFailures written to {log_path}")


if __name__ == "__main__":
    main()
