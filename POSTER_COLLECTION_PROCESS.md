# Poster collection process

Use this document when the user asks to "run the poster process again", "collect posters again", or "do the poster collection". Follow these steps.

---

## Prerequisites (user must have)

1. **Linking table** – CSV with columns: `Student`, `SIS User ID`, `SIS Login ID`, `GitHub ID`. One row per student in the class.
2. **Class roster** – Excel export from Canvas/SIS with current enrolled students (to know who is actually in the class).
3. **Teams roster** – Excel file with a sheet **"Balanced Teams"** and columns: `Team`, `Student Name`, `Gender`, `Email`. Team values like "Team 1", "Team 2", etc.

---

## Step 1: Align linking table with class roster

- Load the **Excel class roster** and the **linking table** CSV.
- Compare by **SIS User ID** (Excel) vs **SIS User ID** (linking table), normalized (e.g. uppercase).
- Identify students who are **in the linking table but NOT in the Excel roster**.
- **Remove** those rows from the linking table so it only contains current students.

---

## Step 2: Create the posters folder

- Create a folder named **`posters`** in the project root (if it doesn’t exist).

---

## Step 3: Clone all poster repos into `posters/`

- Repo URL pattern: `https://github.com/NU-MSAI-371/poster-<GitHub ID>.git`
- For each **GitHub ID** in the linking table, clone:
  - `git clone https://github.com/NU-MSAI-371/poster-<GitHub ID>.git posters/poster-<GitHub ID>`
- Use a shallow clone (e.g. `--depth 1`) for speed.
- Some repos may not exist (404); note those and continue.

---

## Step 4: Find the poster in each repo and copy with team suffix

- For each `posters/poster-<GitHub ID>` directory:
  1. **Find the poster file** in the repo **root** (not in subfolders like `figures/`):
     - Prefer **PDF** (`.pdf`).
     - If no PDF, use `.pptx.pdf` or `.pptx`.
     - If multiple candidates, prefer filenames containing "poster".
  2. **Resolve the team** for this student:
     - Map **GitHub ID** → **Student name** using the linking table.
     - Map **Student name** → **Team** using the **Balanced Teams** sheet.
     - Normalize names for matching (e.g. "Last, First" vs "Last,First"; handle "Javare Gowda,Amitha" → Gowda/Amitha, "Bangalore Vijay Kumar,Monish" → Kumar/Monish, and nicknames like "Qiu, YC" / "Qiu,Yucheng", "Katie" / "Katherine").
  3. **Copy** the poster file into the **`posters`** folder (not inside the repo subfolder) with a filename that includes the team, e.g.:
     - `Team<N>_<GitHub ID>.pdf` (or same pattern with `.pptx` if that was the source).
     - Team label should have no spaces (e.g. "Team 1" → `Team1`).

- Repos with **no poster file** in the root can be skipped; optionally report which ones were skipped.

---

## Script reference

- The script **`copy_posters.py`** in the project root implements **Step 4 only** (find poster in each repo, resolve team, copy to `posters/` with team suffix).
- It expects:
  - `linking_table.csv` in the project root.
  - `roster_with_teams.xlsx` with sheet **"Balanced Teams"** in the project root.
  - Existing `posters/` directory with already-cloned `poster-<GitHub ID>` subdirs.
- So for a full re-run: do Steps 1–3 manually or via your own commands, then run:
  - `python3 copy_posters.py`

---

## Quick re-run checklist

1. Update linking table and remove students not on current class roster (Step 1).
2. Ensure `posters` folder exists (Step 2).
3. Clone (or re-clone) all `NU-MSAI-371/poster-<GitHub ID>` repos into `posters/` (Step 3).
4. Run `python3 copy_posters.py` (Step 4).

When the user says to do this again, you can follow this document and/or re-run the script as appropriate.
