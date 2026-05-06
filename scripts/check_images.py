#!/usr/bin/env python3
"""
check_images.py — Checks every puzzle JSON file's image_url and reports
whether it resolves to a real image.

Usage:
    python3 scripts/check_images.py
"""

import json
import urllib.request
import urllib.error
from pathlib import Path

PUZZLES_DIR = Path(__file__).parent.parent / "puzzles"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PricecheckBot/1.0)"}


def check_url(url):
    """Returns (status_code, content_type, final_url) or (None, error_msg, url)."""
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.headers.get("Content-Type", ""), resp.url
    except urllib.error.HTTPError as e:
        return e.code, str(e.reason), url
    except Exception as e:
        return None, str(e), url


def main():
    files = sorted(p for p in PUZZLES_DIR.glob("*.json") if p.name != "index.json")

    print(f"Checking {len(files)} puzzle files...\n")
    print(f"{'DATE':<12} {'STATUS':<8} {'CONTENT-TYPE':<30} {'TITLE'}")
    print("-" * 90)

    broken = []

    for path in files:
        with open(path) as f:
            puzzle = json.load(f)

        date = puzzle.get("date", path.stem)
        title = puzzle.get("title", "?")[:40]
        url = puzzle.get("image_url", "")

        status, ctype, final_url = check_url(url)
        is_image = isinstance(ctype, str) and ctype.startswith("image/")
        ok = status == 200 and is_image

        flag = "OK  " if ok else "FAIL"
        print(f"{date:<12} {flag:<8} {str(ctype)[:30]:<30} {title}")

        if not ok:
            broken.append({
                "date": date,
                "title": puzzle.get("title", ""),
                "url": url,
                "status": status,
                "content_type": ctype,
                "final_url": final_url,
            })

    print(f"\n{'='*90}")
    print(f"{len(broken)} broken / {len(files)} total\n")

    if broken:
        print("BROKEN URLS:")
        for b in broken:
            print(f"\n  [{b['date']}] {b['title']}")
            print(f"    URL:    {b['url']}")
            print(f"    Status: {b['status']}  Content-Type: {b['content_type']}")
            if b['final_url'] != b['url']:
                print(f"    Redirected to: {b['final_url']}")


if __name__ == "__main__":
    main()
