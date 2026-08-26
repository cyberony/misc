#!/usr/bin/env python3
"""Add Grade column after Total points using standard letter-grade thresholds on total (0–100)."""
import csv
from pathlib import Path

CSV_PATH = Path(
    "/Users/alam/Library/CloudStorage/OneDrive-NorthwesternUniversity/"
    "MSAI 371 - Winter 2026/Grading/2026-03-22T0058_Grades-2026WI_MSAI_371-0_SEC20.csv"
)

GRADE_HEADER = "Grade"


def letter_grade_from_total(score: float) -> str:
    """Map total points (same scale as % out of 100) to letter grade."""
    if score >= 93:
        return "A"
    if score >= 88:
        return "A-"
    if score >= 83:
        return "B+"
    if score >= 78:
        return "B"
    if score >= 73:
        return "B-"
    if score >= 68:
        return "C+"
    if score >= 63:
        return "C"
    if score >= 58:
        return "C-"
    if score >= 53:
        return "D"
    return "F"


def parse_num(s):
    if s is None or not str(s).strip():
        return None
    try:
        return float(str(s).strip())
    except ValueError:
        return None


def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))

    header = rows[0]
    sis_i = header.index("SIS User ID")
    total_i = header.index("Total points")

    if GRADE_HEADER in header:
        grade_i = header.index(GRADE_HEADER)
        insert_new = False
    else:
        insert_at = total_i + 1
        old_len = len(header)
        header.insert(insert_at, GRADE_HEADER)
        for ri in range(1, len(rows)):
            row = rows[ri]
            while len(row) < old_len:
                row.append("")
            row.insert(insert_at, "")
        grade_i = insert_at
        insert_new = True
        if len(rows) > 1:
            r1 = rows[1]
            while len(r1) < len(header):
                r1.append("")
            r1[grade_i] = "(read only)"
        if len(rows) > 2:
            r2 = rows[2]
            while len(r2) < len(header):
                r2.append("")
            r2[grade_i] = "(read only)"

    for ri in range(3, len(rows)):
        row = rows[ri]
        if not row or len(row) <= sis_i or not (row[sis_i] or "").strip():
            continue
        while len(row) < len(header):
            row.append("")
        total = parse_num(row[total_i]) if len(row) > total_i else None
        if total is None:
            row[grade_i] = ""
        else:
            row[grade_i] = letter_grade_from_total(total)

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, quoting=csv.QUOTE_MINIMAL).writerows(rows)

    print(f"Updated {CSV_PATH}")
    print(f"  Column {GRADE_HEADER!r} after Total points (thresholds: A=93+, …, F=<53)")
    if insert_new:
        print("  Inserted new column")


if __name__ == "__main__":
    main()
