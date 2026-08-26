# MSAI 371 — Cursor session memory (posters, videos, grading)

This file is the **persistent “memory”** for work done in Cursor: scripts live in this repo; **live gradebooks** live on **OneDrive** (not in git).

---

## Key paths (Alam’s machine)

| What | Path |
|------|------|
| **Canvas-style grades CSV + XLSX** | `~/Library/CloudStorage/OneDrive-NorthwesternUniversity/MSAI 371 - Winter 2026/Grading/` |
| **Poster PDFs (flattened)** | Same `Grading/Posters/` and/or `.../Posters/` (course folder) |
| **Project videos** | `.../MSAI 371 - Winter 2026/Project Videos/` |
| **This repo on disk** | `/Users/alam/Code/cursor/misc` |
| **Roster with teams** | `roster_with_teams.xlsx` → sheet **`Balanced Teams`** |
| **Student ↔ GitHub** | `linking_table.csv` |

---

## Poster collection

**Full procedure:** `POSTER_COLLECTION_PROCESS.md`

**Scripts:**
- `copy_posters.py` — find poster file in each `posters/poster-<GitHubID>/`, map team from **Balanced Teams** + `linking_table.csv`, copy to output dir as `Team<N>_<github>.pdf` (or `.pptx`).  
  - Flags: `--output-dir` / `-o`, `--timestamps-file`
- `posters/.gitignore` — ignores cloned `poster-*/` dirs; flattened PDFs can be tracked if desired.

**Repo pattern:** `https://github.com/NU-MSAI-371/poster-<GitHubID>.git`

**Name matching quirks** (roster vs Canvas): `Javare Gowda,Amitha` ↔ Gowda; `Bangalore Vijay Kumar,Monish` ↔ Kumar; `Qiu,Yucheng` ↔ `Qiu, YC`; `Baakkonen,Katherine` ↔ Katie — encoded in `copy_posters.py` / `apply_poster_video_grades.py`.

---

## Videos

**Full procedure:** `VIDEO_COLLECTION_PROCESS.md`

- **Pattern:** `https://github.com/NU-MSAI-371/video-<GitHubID>.git`
- **`copy_videos.py`** — clone/pull video repos and copy media to a target folder.
- Example: `video-utki007` → `Agentic Workout Planner.mp4` copied to **Project Videos**.

---

## Grading CSV / XLSX (OneDrive)

### Scripts in `misc/` (run against paths inside each script or edit `CSV_PATH`)

| Script | Purpose |
|--------|--------|
| **`apply_poster_video_grades.py`** | Reads **`Poster scores`** and **`Video scores`** text files in Grading folder; fills **Poster** and **Video** columns; adds **Video comments** on **one teammate per team** (alphabetically first by Canvas name). First student row is **row index 3** (0-based) after header + 2 meta rows. Skips re-adding **Video comments** if column exists. |
| **`update_project_total_column.py`** | Sets **Project Submission** → **30**; **Project Midpoint Review** → **20**; includes midpoint in **Total points** sum; max total **100**; sets Manual Posting / Points Possible metadata. |
| **`add_grade_column.py`** | Adds **Grade** after **Total points** using thresholds: A 93+, A- 88+, B+ 83+, B 78+, B- 73+, C+ 68+, C 63+, C- 58+, D 53+, F &lt;53 (on **Total points** 0–100 scale). |
| **`reorder_grades_csv_by_roster.py`** | Sorts student rows like **`Balanced Teams`** order; inserts **blank row** between teams; strips old blank lines before re-sort. |
| **`grades_report_by_team.py`** | Writes **`grades_by_team_roster_order.txt`** next to the CSV for verification. |

**Note:** Canvas column names change when assignments are re-imported (e.g. **Project Midpoint Review - NO SUBMISSION REQUIRED (...)**). Update `ASSIGNMENT_COLS` / column lists in scripts if the export breaks.

**Jatin Hooda (`kij6504`):** Homework 1 set to **13.5**; homework aggregates and course **Current Points** / **Score** recalculated; **Total points** and **Grade** must stay in sync with assignment columns (sum of nine assignments, max 100).

---

## Team 9 / poster gaps (historical)

- Team 9 roster: Growney, Kaushik, Patel — poster first appeared under **Tavishi-Kaushik** (`Team9_Poster.pdf`). Some `poster-*` repos 404’d initially (`spatel418`, etc.).

---

## Git / repos

- **These tools now live in** `/Users/alam/Code/cursor/misc` (`cyberony/misc`). The old `NU-MSAI-371/sandbox` checkout was flattened here and removed.
- **Do not commit:** OneDrive gradebooks (stay local/cloud), huge video blobs unless intentional, `.DS_Store`, temp `~$*.xlsx`.

---

## Quick commands

```bash
# Posters → OneDrive Posters + timestamps
python3 copy_posters.py -o "/path/to/Posters" --timestamps-file

# Fill poster/video from text rubrics
python3 apply_poster_video_grades.py

# Totals + midpoint + submission defaults
python3 update_project_total_column.py

# Letter grades from Total points
python3 add_grade_column.py

# Roster order + blank lines between teams
python3 reorder_grades_csv_by_roster.py

# Text report by team
python3 grades_report_by_team.py
```

---

## For the AI in a future chat

Say: **“Follow `MSAI371_CURSOR_MEMORY.md` and `POSTER_COLLECTION_PROCESS.md` in the sandbox repo.”**  
Re-read those files; re-open OneDrive paths on the user’s machine; adjust column names to match the latest Canvas export.
