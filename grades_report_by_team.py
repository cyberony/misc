#!/usr/bin/env python3
"""Write roster-ordered grade check report next to Canvas CSV."""
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
OUT = Path(
    "/Users/alam/Library/CloudStorage/OneDrive-NorthwesternUniversity/"
    "MSAI 371 - Winter 2026/Grading/grades_by_team_roster_order.txt"
)

ROSTER_TO_LINKING = {
    "baakkonen,katherine": "baakkonen,katie",
    "qiu,yucheng": "qiu,yc",
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


def main():
    wb = openpyxl.load_workbook(ROSTER, read_only=True)
    ws = wb["Balanced Teams"]
    roster_rows = []
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
        roster_rows.append((team_n, nm, rk))
    wb.close()

    link = {}
    with open(LINKING, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            st = row["Student"].strip().strip('"')
            sis = row["SIS User ID"].strip()
            link[norm_student(st)] = (st, sis)

    def resolve_canvas_name(rk):
        lk = ROSTER_TO_LINKING.get(rk, rk)
        if lk in link:
            return link[lk]
        if rk in link:
            return link[rk]
        return None

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    header = rows[0]
    sis_i = header.index("SIS User ID")
    post_i = header.index("Poster (1725075)")
    vid_i = header.index("Video (1728357)")
    try:
        cmt_i = header.index("Video comments")
    except ValueError:
        cmt_i = None

    grades = {}
    for row in rows[3:]:
        if len(row) <= sis_i:
            continue
        sis = row[sis_i].strip()
        if not sis:
            continue
        cmt = row[cmt_i].strip() if cmt_i is not None and len(row) > cmt_i else ""
        pi = row[post_i].strip() if len(row) > post_i else ""
        vi = row[vid_i].strip() if len(row) > vid_i else ""
        grades[sis] = (pi, vi, cmt)

    lines = [
        "Grades grouped by Balanced Teams roster order",
        "(Same order as sheet 'Balanced Teams' in roster_with_teams.xlsx)",
        "Roster display name → Canvas roster name; Poster / Video; comment on one teammate only.",
        "=" * 72,
    ]
    current_team = None
    for team_n, roster_nm, rk in roster_rows:
        if team_n != current_team:
            current_team = team_n
            lines.append("")
            lines.append(f"--- Team {team_n} ---")
        resolved = resolve_canvas_name(rk)
        if not resolved:
            lines.append(f"  {roster_nm}")
            lines.append("    [no linking_table match — check manually]")
            continue
        canvas_name, sis = resolved
        g = grades.get(sis, ("?", "?", ""))
        post, vid, cmt = g
        cmt_note = " (has video comment)" if cmt else ""
        lines.append(f"  {roster_nm}")
        lines.append(f"    → {canvas_name} ({sis})")
        lines.append(f"    Poster: {post}   Video: {vid}{cmt_note}")
        if cmt:
            preview = cmt[:220] + ("…" if len(cmt) > 220 else "")
            lines.append(f"    Comment preview: {preview}")

    lines.extend(["", "=" * 72, "End"])
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print("Wrote", OUT)


if __name__ == "__main__":
    main()
