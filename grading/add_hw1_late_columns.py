#!/usr/bin/env python3
"""
Add Homework 1 Days Late and Homework 1 Penalty columns to the grade sheet.
Uses grading/homework-1-fopc-and-tables/submission_timestamps.txt.
Due date: Jan 25, 2026 11:59:59 PM Central. Going past midnight = 1 day late.
Penalty: 1 day = 10%, 2 days = 25%, 3 days = 50%, 4+ days = 100%.
Run from sandbox: python grading/add_hw1_late_columns.py
"""
import csv
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

SANDBOX = Path(__file__).resolve().parent.parent
GRADING = SANDBOX / "grading"
LINKING_CSV = SANDBOX / "linking_table.csv"
GRADES_CSV = GRADING / "2026-03-16T1228_Grades-2026WI_MSAI_371-0_SEC20.csv"
TIMESTAMPS_FILE = GRADING / "homework-1-fopc-and-tables" / "submission_timestamps.txt"
COMMENTS_COL = "Homework 1 Comments"
DAYS_LATE_COL = "Homework 1 Days Late"
PENALTY_COL = "Homework 1 Penalty"

DEADLINE_CENTRAL = datetime(2026, 1, 25, 23, 59, 59, tzinfo=ZoneInfo("America/Chicago"))
DEADLINE_UTC = DEADLINE_CENTRAL.astimezone(timezone.utc)

PENALTY_PCT = {1: "10%", 2: "25%", 3: "50%"}


def load_linking():
    """SIS User ID (upper) -> GitHub ID."""
    sis_to_gh = {}
    with open(LINKING_CSV, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            sis = (r.get("SIS User ID") or "").strip().upper()
            gh = (r.get("GitHub ID") or "").strip()
            if sis and gh:
                sis_to_gh[sis] = gh
    return sis_to_gh


def parse_timestamps():
    """Parse submission_timestamps.txt. Return gh_id -> (days_late, penalty_str)."""
    gh_to_late = {}
    gh_to_penalty = {}
    with open(TIMESTAMPS_FILE, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("Submission") or line.startswith("Roster") or line.startswith("Deadline"):
                continue
            parts = line.split()
            if len(parts) < 2:
                continue
            repo_name = parts[0]
            if not repo_name.startswith("homework-1-fopc-and-tables-"):
                continue
            ghid = repo_name[len("homework-1-fopc-and-tables-"):]
            ts_str = parts[1]
            try:
                dt = datetime.fromisoformat(ts_str)
            except ValueError:
                continue
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            sub_utc = dt.astimezone(timezone.utc)
            sub_central = sub_utc.astimezone(ZoneInfo("America/Chicago"))
            if sub_central <= DEADLINE_CENTRAL:
                days_late = 0
                penalty = "0%"
            else:
                days_late = (sub_central.date() - DEADLINE_CENTRAL.date()).days
                penalty = PENALTY_PCT.get(days_late, "100%")
            gh_to_late[ghid] = days_late
            gh_to_penalty[ghid] = penalty
    return gh_to_late, gh_to_penalty


def main():
    sis_to_gh = load_linking()
    gh_to_days_late, gh_to_penalty = parse_timestamps()

    with open(GRADES_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    if DAYS_LATE_COL not in fieldnames:
        idx = fieldnames.index(COMMENTS_COL) + 1
        fieldnames.insert(idx, DAYS_LATE_COL)
        fieldnames.insert(idx + 1, PENALTY_COL)

    for row in rows:
        student = (row.get("Student") or "").strip().strip('"')
        sis = (row.get("SIS User ID") or "").strip().upper()
        if student == "Student, Test" or not sis:
            continue
        ghid = sis_to_gh.get(sis)
        if ghid is None:
            row[DAYS_LATE_COL] = ""
            row[PENALTY_COL] = ""
        else:
            row[DAYS_LATE_COL] = str(gh_to_days_late.get(ghid, ""))
            row[PENALTY_COL] = gh_to_penalty.get(ghid, "")

    with open(GRADES_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        for row in rows:
            w.writerow(row)

    print("Added", DAYS_LATE_COL, "and", PENALTY_COL, "to", GRADES_CSV)


if __name__ == "__main__":
    main()
