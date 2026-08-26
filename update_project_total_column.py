#!/usr/bin/env python3
"""Set Project Submission to 30 for all students; add Total points column after Video comments."""
import csv
from pathlib import Path

CSV_PATH = Path(
    "/Users/alam/Library/CloudStorage/OneDrive-NorthwesternUniversity/"
    "MSAI 371 - Winter 2026/Grading/2026-03-22T0058_Grades-2026WI_MSAI_371-0_SEC20.csv"
)

TOTAL_HEADER = "Total points"
ASSIGNMENT_COLS = [
    "Homework 1 - FOPC and Tables (1710992)",
    "Classwork 0 - Representation Choices (1703780)",
    "Classwork 1 - FOPC (1709355)",
    "Classwork 2 - Reasoning (1710189)",
    "Project Proposal (1711082)",
    "Project Midpoint Review",
    "Project Submission (1734391)",
    "Poster (1725075)",
    "Video (1728357)",
]


def parse_num(s):
    if s is None or not str(s).strip():
        return 0.0
    try:
        return float(str(s).strip())
    except ValueError:
        return 0.0


def is_data_row(row, sis_i):
    return row and len(row) > sis_i and (row[sis_i] or "").strip()


def main():
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))

    header = rows[0]
    sis_i = header.index("SIS User ID")
    proj_i = header.index("Project Submission (1734391)")
    try:
        mid_i = header.index("Project Midpoint Review")
    except ValueError:
        mid_i = None

    if TOTAL_HEADER in header:
        total_i = header.index(TOTAL_HEADER)
        insert_new = False
    else:
        vc_i = header.index("Video comments")
        insert_at = vc_i + 1
        old_len = len(header)
        header.insert(insert_at, TOTAL_HEADER)
        for ri in range(1, len(rows)):
            row = rows[ri]
            while len(row) < old_len:
                row.append("")
            row.insert(insert_at, "")
        total_i = insert_at
        insert_new = True
        if len(rows) > 1:
            r1 = rows[1]
            while len(r1) < len(header):
                r1.append("")
            r1[total_i] = "(read only)"
        if len(rows) > 2:
            r2 = rows[2]
            while len(r2) < len(header):
                r2.append("")
            # Max sum = sum of assignment maxima (incl. 20 pt midpoint)
            r2[total_i] = "100"

    idx_sum = [header.index(c) for c in ASSIGNMENT_COLS]

    max_total = "100"  # sum of assignment maxima (midpoint 20)

    if len(rows) > 1 and mid_i is not None:
        r1 = rows[1]
        while len(r1) < len(header):
            r1.append("")
        r1[mid_i] = "Manual Posting"
    if len(rows) > 2:
        r2 = rows[2]
        while len(r2) < len(header):
            r2.append("")
        r2[total_i] = max_total
        if mid_i is not None:
            r2[mid_i] = "20"

    for ri in range(3, len(rows)):
        row = rows[ri]
        if not is_data_row(row, sis_i):
            continue
        while len(row) < len(header):
            row.append("")
        row[proj_i] = "30.00"
        if mid_i is not None:
            row[mid_i] = "20.00"
        total = sum(parse_num(row[j]) for j in idx_sum)
        row[total_i] = f"{total:.2f}"

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, quoting=csv.QUOTE_MINIMAL).writerows(rows)

    print(f"Updated {CSV_PATH}")
    print("  Project Submission → 30.00 for all students")
    print(f"  {TOTAL_HEADER} = sum of 9 assignment columns (max 100)")
    if insert_new:
        print("  Inserted new column after Video comments")


if __name__ == "__main__":
    main()
