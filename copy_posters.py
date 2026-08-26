#!/usr/bin/env python3
"""Find poster file in each poster-* repo, resolve team from Balanced Teams roster, copy to posters/ with team suffix."""
import argparse
import csv
import os
import re
import shutil
from datetime import datetime
from pathlib import Path

import openpyxl

POSTERS_DIR = Path(__file__).resolve().parent / "posters"
LINKING_CSV = Path(__file__).resolve().parent / "linking_table.csv"
ROSTER_XLSX = Path(__file__).resolve().parent / "roster_with_teams.xlsx"


def normalize_name(name):
    """'Last, First' or 'Last, First Middle' -> 'last,first' for matching."""
    if not name or not isinstance(name, str):
        return ""
    # Remove quotes, strip, collapse spaces
    s = name.strip().strip('"').replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    if "," in s:
        last, rest = s.split(",", 1)
        first = rest.strip().split()[0] if rest.strip() else ""
        return f"{last.strip().lower()},{first.lower()}"
    return s.lower()


def build_roster_name_to_team():
    """Balanced Teams sheet: Student Name -> Team. Return dict with normalized keys."""
    wb = openpyxl.load_workbook(ROSTER_XLSX, read_only=True)
    ws = wb["Balanced Teams"]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    name_to_team = {}
    for r in rows[1:]:
        team, student_name = (r[0], r[1])
        if not team or not student_name:
            continue
        name_str = str(student_name).strip()
        key = normalize_name(name_str)
        if key:
            name_to_team[key] = str(team).strip()
        # Also add key from last word of last name (handles "Javare Gowda,Amitha" -> gowda,amitha, "Bangalore Vijay Kumar,Monish" -> kumar,monish)
        if "," in name_str:
            last, first = name_str.split(",", 1)
            last = last.strip()
            first = first.strip().split()[0] if first.strip() else ""
            if last and first:
                last_word = last.split()[-1].lower()
                name_to_team[f"{last_word},{first.lower()}"] = str(team).strip()
        # Nickname aliases
        if "qiu,yucheng" in key:
            name_to_team["qiu,yc"] = str(team).strip()
        if "baakkonen,katherine" in key:
            name_to_team["baakkonen,katie"] = str(team).strip()
    return name_to_team


def build_github_to_student():
    """Linking table: GitHub ID -> Student (as in CSV)."""
    gh_to_student = {}
    with open(LINKING_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            gh = (row.get("GitHub ID") or "").strip()
            student = (row.get("Student") or "").strip().strip('"')
            if gh:
                gh_to_student[gh] = student
    return gh_to_student


def find_poster_in_dir(repo_path):
    """Find the poster file in repo root (not in figures/). Prefer PDF, then .pptx.pdf, then .pptx. Prefer name containing 'poster'."""
    root = Path(repo_path)
    if not root.is_dir():
        return None
    # Collect candidates: (path, is_pdf, has_poster_in_name, size)
    candidates = []
    for f in root.iterdir():
        if f.is_dir() or f.name.startswith("."):
            continue
        name_lower = f.name.lower()
        if name_lower.endswith(".pdf"):
            candidates.append((f, True, "poster" in name_lower, f.stat().st_size))
        elif name_lower.endswith(".pptx.pdf"):
            candidates.append((f, True, "poster" in name_lower, f.stat().st_size))
        elif name_lower.endswith(".pptx"):
            candidates.append((f, False, "poster" in name_lower, f.stat().st_size))
    if not candidates:
        return None
    # Prefer PDF, then name containing "poster", then larger file
    candidates.sort(key=lambda x: (not x[1], not x[2], -x[3]))
    return candidates[0][0]


def main():
    parser = argparse.ArgumentParser(description="Copy posters from repos to output dir with team suffix.")
    parser.add_argument(
        "--output-dir", "-o",
        type=Path,
        default=None,
        help="Directory to copy poster files into (default: sandbox/posters)",
    )
    parser.add_argument(
        "--timestamps-file",
        action="store_true",
        help="Write a text file in the output dir listing each file with its timestamp",
    )
    args = parser.parse_args()
    out_dir = args.output_dir if args.output_dir is not None else POSTERS_DIR
    out_dir = Path(out_dir).resolve()
    if args.output_dir is not None:
        out_dir.mkdir(parents=True, exist_ok=True)

    name_to_team = build_roster_name_to_team()
    gh_to_student = build_github_to_student()

    copied = []  # list of (dest_path,) for timestamps

    for path in sorted(POSTERS_DIR.iterdir()):
        if not path.is_dir() or not path.name.startswith("poster-"):
            continue
        gh_id = path.name.replace("poster-", "", 1)
        student = gh_to_student.get(gh_id)
        if not student:
            print(f"Skip {path.name}: no linking table entry for {gh_id}")
            continue
        team = name_to_team.get(normalize_name(student))
        if not team:
            print(f"Skip {path.name}: no team for {student!r} (normalized: {normalize_name(student)!r})")
            continue
        poster_path = find_poster_in_dir(path)
        if not poster_path:
            print(f"Skip {path.name}: no poster file found")
            continue
        # Suffix: team with no space e.g. "Team 1" -> "Team1"
        team_suffix = team.replace(" ", "")
        ext = poster_path.suffix
        dest_name = f"{team_suffix}_{gh_id}{ext}"
        dest_path = out_dir / dest_name
        shutil.copy2(poster_path, dest_path)
        copied.append(dest_path)
        print(f"Copied: {poster_path.name} -> {dest_path}")

    if args.timestamps_file and copied:
        ts_path = out_dir / "poster_timestamps.txt"
        with open(ts_path, "w", encoding="utf-8") as f:
            f.write("Poster file timestamps (file modification time after copy)\n")
            f.write("Generated: " + datetime.now().isoformat() + "\n\n")
            for p in sorted(copied):
                mtime = datetime.fromtimestamp(p.stat().st_mtime)
                f.write(f"{p.name}\t{mtime.isoformat()}\n")
        print(f"Wrote: {ts_path}")


if __name__ == "__main__":
    main()
