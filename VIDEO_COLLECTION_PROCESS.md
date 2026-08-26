# Video collection process

Use this document when you want to "run the video process", "collect videos", or "do the video collection". It mirrors the **poster collection** workflow but targets the **video-*** repositories.

---

## Prerequisites (same as posters)

1. **Linking table** – CSV with columns: `Student`, `SIS User ID`, `SIS Login ID`, `GitHub ID`. One row per student in the class.  
2. **Class roster** – Excel export from Canvas/SIS with current enrolled students (to know who is actually in the class).  
3. **Teams roster** – Excel file with a sheet **"Balanced Teams"** and columns: `Team`, `Student Name`, `Gender`, `Email`. Team values like "Team 1", "Team 2", etc.  

These are the same files used for poster collection (`linking_table.csv` and `roster_with_teams.xlsx` in the project root).

---

## Step 1: Align linking table with class roster

- Load the **Excel class roster** and the **linking table** CSV.  
- Compare by **SIS User ID** (Excel) vs **SIS User ID** (linking table), normalized (e.g. uppercase).  
- Identify students who are **in the linking table but NOT in the Excel roster**.  
- **Remove** those rows from the linking table so it only contains current students.  

_(Same as the poster process.)_

---

## Step 2: Create the `videos` folder

- Create a folder named **`videos`** in the project root (if it doesn’t exist).  

You will clone each student's video repo into this folder.

---

## Step 3: Clone all video repos into `videos/`

- Repo URL pattern:  
  - `https://github.com/NU-MSAI-371/video-<GitHub ID>.git`
- For each **GitHub ID** in the linking table, clone:
  - `git clone https://github.com/NU-MSAI-371/video-<GitHub ID>.git videos/video-<GitHub ID>`
- Use a shallow clone (e.g. `--depth 1`) for speed.  
- Some repos may not exist (404); note those and continue.

This is directly analogous to cloning `poster-<GitHub ID>` repos for posters, just with `video-` instead.

---

## Step 4: Find the video in each repo and copy with team suffix

- For each `videos/video-<GitHub ID>` directory:
  1. **Find the video file** in the repo **root** (not in subfolders such as `assets/`, `figures/`, etc.):
     - Prefer common video formats:
       - `.mp4` (highest priority)  
       - `.mov`, `.m4v`, `.mkv`, `.webm`, `.avi` (fallbacks)
     - If multiple candidates, prefer filenames containing **"video"**, **"demo"**, or **"presentation"**.
     - If still tied, prefer the **larger file** (likely the main recording, not a tiny asset).
  2. **Resolve the team** for this student:
     - Map **GitHub ID** → **Student name** using the linking table.
     - Map **Student name** → **Team** using the **Balanced Teams** sheet.
     - Normalize names for matching (e.g. "Last, First" vs "Last,First"; handle cases like "Javare Gowda,Amitha" → Gowda/Amitha, "Bangalore Vijay Kumar,Monish" → Kumar/Monish, and nicknames like "Qiu, YC" / "Qiu,Yucheng", "Katie" / "Katherine").
  3. **Copy** the chosen video file into the **`videos`** folder (not inside the repo subfolder) with a filename that includes the team, e.g.:
     - `Team<N>_<GitHub ID>.mp4` (or same pattern with the original extension if not `.mp4`).
     - Team label should have **no spaces** (e.g. "Team 1" → `Team1`).

- Repos with **no video file** in the root can be skipped; optionally report which ones were skipped.

---

## Script reference

- The script **`copy_videos.py`** in the project root implements **Step 4 only** (find video in each repo, resolve team, copy to `videos/` with team suffix).
- It expects:
  - `linking_table.csv` in the project root.
  - `roster_with_teams.xlsx` with sheet **"Balanced Teams"** in the project root.
  - Existing `videos/` directory with already-cloned `video-<GitHub ID>` subdirs.
- For a full run of the collection:
  - Do Steps 1–3 manually or via your own commands, then run:
    - `python3 copy_videos.py`

---

## Quick run checklist

1. Update linking table and remove students not on current class roster (Step 1).  
2. Ensure `videos` folder exists (Step 2).  
3. Clone (or re-clone) all `NU-MSAI-371/video-<GitHub ID>` repos into `videos/` (Step 3).  
4. Run `python3 copy_videos.py` (Step 4).  

This gives you a single `videos/` folder containing one consolidated video file per team, named with their team label and GitHub ID.

