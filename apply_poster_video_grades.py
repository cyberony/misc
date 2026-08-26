#!/usr/bin/env python3
"""Fill Poster/Video columns in Canvas grades CSV from score files; add Video comments column."""
import csv
import re
from pathlib import Path

import openpyxl

ROSTER = Path(__file__).resolve().parent / "roster_with_teams.xlsx"
LINKING = Path(__file__).resolve().parent / "linking_table.csv"
GRADING = Path(
    "/Users/alam/Library/CloudStorage/OneDrive-NorthwesternUniversity/"
    "MSAI 371 - Winter 2026/Grading"
)
CSV_PATH = GRADING / "2026-03-22T0058_Grades-2026WI_MSAI_371-0_SEC20.csv"
POSTER_SCORES = GRADING / "Poster scores"
VIDEO_SCORES = GRADING / "Video scores"

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


def load_namekey_to_team():
    wb = openpyxl.load_workbook(ROSTER, read_only=True)
    ws = wb["Balanced Teams"]
    namekey_to_team = {}
    for r in ws.iter_rows(values_only=True):
        team_cell, name_cell = r[0], r[1]
        if not team_cell or not name_cell:
            continue
        m = re.match(r"Team\s+(\d+)", str(team_cell).strip())
        if not m:
            continue
        team_n = int(m.group(1))
        rk = roster_key_from_roster_cell(name_cell)
        namekey_to_team[rk] = team_n
    wb.close()
    return namekey_to_team


def load_linking():
    link = {}
    with open(LINKING, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            st = row["Student"].strip().strip('"')
            link[norm_student(st)] = row["SIS User ID"].strip()
    return link


def parse_team_blocks(text):
    """Split on 'team N -' headers; return list of (team_int, score_int, body_str)."""
    text = text.strip()
    pattern = re.compile(r"(?i)team\s+(\d+)\s*-\s*(\d+)\s*", re.MULTILINE)
    matches = list(pattern.finditer(text))
    out = []
    for i, m in enumerate(matches):
        team_n = int(m.group(1))
        score = int(m.group(2))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        out.append((team_n, score, body))
    return out


def student_to_team(name, sis, namekey_to_team, link):
    for nk, s in link.items():
        if s != sis:
            continue
        keys = [nk]
        if nk in ALIASES:
            keys.append(ALIASES[nk])
        for k in keys:
            if k in namekey_to_team:
                return namekey_to_team[k]
    st = name.strip().strip('"')
    nk = norm_student(st)
    keys = [nk]
    if nk in ALIASES:
        keys.append(ALIASES[nk])
    if "," in st:
        last, rest = st.split(",", 1)
        lw = last.strip().split()[-1].lower()
        fw = rest.strip().split()[0].lower()
        keys.append(f"{lw},{fw}")
    for k in keys:
        if k in namekey_to_team:
            return namekey_to_team[k]
    return None


def main():
    namekey_to_team = load_namekey_to_team()
    link = load_linking()

    poster_raw = POSTER_SCORES.read_text(encoding="utf-8")
    video_raw = VIDEO_SCORES.read_text(encoding="utf-8")

    poster_by_team = {t: s for t, s, _ in parse_team_blocks(poster_raw)}
    video_parsed = parse_team_blocks(video_raw)
    video_by_team = {t: s for t, s, _ in video_parsed}
    video_comment_by_team = {t: body for t, s, body in video_parsed}

    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.reader(f))

    header = rows[0]
    i_video = header.index("Video (1728357)")
    i_poster = header.index("Poster (1725075)")
    new_header = "Video comments"

    if new_header in header:
        insert_at = header.index(new_header)
    else:
        insert_at = i_video + 1
        old_header_len = len(header)
        header.insert(insert_at, new_header)
        for ri in range(1, len(rows)):
            row = rows[ri]
            while len(row) < old_header_len:
                row.append("")
            row.insert(insert_at, "")
        if len(rows) > 1:
            r1 = rows[1]
            while len(r1) < len(header):
                r1.append("")
            r1[insert_at] = "Manual Posting"
        if len(rows) > 2:
            r2 = rows[2]
            while len(r2) < len(header):
                r2.append("")
            r2[insert_at] = "(read only)"

    # Build team -> sorted student names for comment assignment
    team_members = {t: [] for t in range(1, 16)}
    sis_col = header.index("SIS User ID")
    # Row 0 = header, 1–2 = Canvas metadata rows, row 3 = first student
    data_start = 3
    for ri in range(data_start, len(rows)):
        row = rows[ri]
        if len(row) <= sis_col:
            continue
        sis = row[sis_col].strip()
        if not sis:
            continue
        name = row[0]
        t = student_to_team(name, sis, namekey_to_team, link)
        if t is not None:
            team_members[t].append((name.strip().strip('"'), sis))

    comment_for_sis = {}
    for t, members in team_members.items():
        if not members:
            continue
        members.sort(key=lambda x: x[0].lower())
        chosen = members[0]
        comment_for_sis[chosen[1]] = video_comment_by_team.get(t, "")

    # Fill scores
    need_cols = max(i_poster, i_video, sis_col, insert_at)
    for ri in range(data_start, len(rows)):
        row = rows[ri]
        if len(row) <= need_cols:
            while len(row) <= need_cols:
                row.append("")
        sis = row[sis_col].strip()
        if not sis:
            continue
        name = row[0]
        team = student_to_team(name, sis, namekey_to_team, link)
        if team is None:
            continue

        poster_score = poster_by_team.get(team, 10)
        video_score = video_by_team.get(team, 8)

        row[i_poster] = f"{poster_score:.2f}"
        row[i_video] = f"{video_score:.2f}"

        # Comment column at insert_at (unchanged index for new col)
        if sis in comment_for_sis and comment_for_sis[sis]:
            # Single line for CSV safety — replace newlines with space
            c = comment_for_sis[sis].replace("\r\n", "\n").replace("\r", "\n")
            c = re.sub(r"\s+", " ", c).strip()
            row[insert_at] = c
        else:
            row[insert_at] = ""

    out_path = CSV_PATH
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        w.writerows(rows)

    print(f"Wrote {out_path}")
    print("Poster overrides:", poster_by_team)
    print("Video scores used:", dict(sorted(video_by_team.items())))


if __name__ == "__main__":
    main()
