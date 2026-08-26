#!/usr/bin/env python3
"""Reorder student rows in Canvas grades CSV to match Balanced Teams roster (team + member order)."""
import csv
import re
from pathlib import Path

import openpyxl

ROSTER = Path(__file__).resolve().parent / "roster_with_teams.xlsx"
LINKING = Path(__file__).resolve().parent / "linking_table.csv"
CSV_PATH = Path(
    "/Users/alam/Library/CloudStorage/OneDrive-NorthwesternUniversity/"
    "MSAI 371 - Winter 2026/Grading/2026-03-22T0058_Grades-2026WI_MSAI_371-0_SEC20.csv"
)

# Canvas/linking namekey -> roster sheet namekey (Balanced Teams spelling)
CANVAS_TO_ROSTER_KEY = {
    "baakkonen,katie": "baakkonen,katherine",
    "qiu,yc": "qiu,yucheng",
}

ALIASES = {
    "baakkonen,katie": "baakkonen,katherine",
    "qiu,yc": "qiu,yucheng",
}


def norm_student(s):
    s = s.strip().strip('"').replace("\n", " ")
    s = re.sub(r"\s+", " ", s)
    if "," in s:
        last, rest = s.split(",", 1)
        first = rest.strip().split()[0] if rest.strip() else ""
        return f"{last.strip().lower()},{first.lower()}"
    return s.lower()


def roster_key_from_roster_cell(name):
    name = str(name).strip()
    if "," not in name:
        return norm_student(name)
    last, rest = name.split(",", 1)
    last = last.strip()
    first = rest.strip().split()[0] if rest.strip() else ""
    last_word = last.split()[-1].lower()
    return f"{last_word},{first.lower()}"


def load_roster_order():
    """Return list of (team_n, roster_display, roster_key) in sheet order."""
    wb = openpyxl.load_workbook(ROSTER, read_only=True)
    ws = wb["Balanced Teams"]
    rows = []
    for r in ws.iter_rows(values_only=True):
        team_cell, name_cell = r[0], r[1]
        if not team_cell or not name_cell:
            continue
        m = re.match(r"Team\s+(\d+)", str(team_cell).strip())
        if not m:
            continue
        team_n = int(m.group(1))
        nm = str(name_cell).strip()
        rk = roster_key_from_roster_cell(nm)
        rows.append((team_n, nm, rk))
    wb.close()
    return rows


def build_roster_position_map(roster_rows):
    """roster_key -> (team, index_within_team)"""
    pos = {}
    counter = {}
    for team_n, _nm, rk in roster_rows:
        counter.setdefault(team_n, 0)
        pos[rk] = (team_n, counter[team_n])
        counter[team_n] += 1
    return pos


def canvas_keys_for_student(name):
    """All namekeys to try for matching roster."""
    st = name.strip().strip('"')
    keys = []
    nk = norm_student(st)
    keys.append(nk)
    if nk in ALIASES:
        keys.append(ALIASES[nk])
    if nk in CANVAS_TO_ROSTER_KEY:
        keys.append(CANVAS_TO_ROSTER_KEY[nk])
    if "," in st:
        last, rest = st.split(",", 1)
        lw = last.strip().split()[-1].lower()
        fw = rest.strip().split()[0].lower()
        k2 = f"{lw},{fw}"
        if k2 not in keys:
            keys.append(k2)
        if k2 in CANVAS_TO_ROSTER_KEY and CANVAS_TO_ROSTER_KEY[k2] not in keys:
            keys.append(CANVAS_TO_ROSTER_KEY[k2])
    return keys


def sort_tuple_for_row(name, sis, roster_pos, orig_idx):
    for k in canvas_keys_for_student(name):
        if k in roster_pos:
            team, idx = roster_pos[k]
            return (team, idx, 0, name.lower())
    return (999, 999, orig_idx, name.lower())


def team_number_for_row(name, roster_pos):
    for k in canvas_keys_for_student(name):
        if k in roster_pos:
            return roster_pos[k][0]
    return 999


def insert_blank_rows_between_teams(sorted_rows, header_len, sis_i, roster_pos):
    """One fully empty row (same width as header) after each team block."""
    out = []
    prev_team = None
    for row in sorted_rows:
        if not row or not any((c or "").strip() for c in row):
            continue
        if len(row) <= sis_i or not row[sis_i].strip():
            out.append(row)
            continue
        team = team_number_for_row(row[0], roster_pos)
        if prev_team is not None and team != prev_team:
            out.append([""] * header_len)
        out.append(row)
        prev_team = team
    return out


def main():
    roster_rows = load_roster_order()
    roster_pos = build_roster_position_map(roster_rows)

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))

    if len(rows) < 4:
        raise SystemExit("CSV too short")

    header = rows[0]
    meta = rows[:3]
    # Drop blank spacer rows from prior runs before re-sorting
    data = [
        r
        for r in rows[3:]
        if r and any((c or "").strip() for c in r)
    ]

    sis_i = header.index("SIS User ID")
    header_len = len(header)

    decorated = []
    for orig_idx, row in enumerate(data):
        if len(row) <= sis_i or not row[sis_i].strip():
            decorated.append(((1000, orig_idx, 0, ""), row))
            continue
        name = row[0]
        sis = row[sis_i].strip()
        key = sort_tuple_for_row(name, sis, roster_pos, orig_idx)
        decorated.append((key, row))

    decorated.sort(key=lambda x: x[0])
    sorted_students = [r for _, r in decorated]
    with_blanks = insert_blank_rows_between_teams(
        sorted_students, header_len, sis_i, roster_pos
    )
    new_rows = meta + with_blanks

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, quoting=csv.QUOTE_MINIMAL).writerows(new_rows)

    print(f"Reordered {len(data)} student rows + blank lines between teams → {CSV_PATH}")
    print("First lines after header (names / blank):")
    for row in new_rows[3:18]:
        label = row[0] if row and row[0].strip() else "(blank row)"
        print(" ", label)


if __name__ == "__main__":
    main()
