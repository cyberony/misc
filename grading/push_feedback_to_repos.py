#!/usr/bin/env python3
"""
Push each student's feedback (Homework 1, Classwork 1, Classwork 2) to their respective repo.
Uses linking_table.csv for Student -> GitHub ID. Token from grading/.github_token for push.
Run from sandbox: python grading/push_feedback_to_repos.py
"""
import csv
import re
import subprocess
import sys
from pathlib import Path

SANDBOX = Path(__file__).resolve().parent.parent
GRADING = Path(__file__).resolve().parent
LINKING_CSV = SANDBOX / "linking_table.csv"

# Feedback file prefix -> (repo parent dir, repo prefix)
CONFIG = {
    "homework1_feedback_": (GRADING / "homework-1-fopc-and-tables", "homework-1-fopc-and-tables"),
    "classwork1_feedback_": (GRADING / "classwork-1-fopc", "classwork-1-fopc"),
    "classwork2_feedback_": (GRADING / "classwork-2-reasoning", "classwork-2-reasoning"),
}


def student_to_key(name: str) -> str:
    """'Last, First' or 'Last, First Middle' -> 'Last_First' or 'Last_First_Middle'."""
    return name.replace(", ", "_").replace(" ", "_").strip()


def load_name_to_github() -> dict[str, str]:
    """Build mapping: student_key -> GitHub ID."""
    out = {}
    with open(LINKING_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            name = (row.get("Student") or "").strip()
            gh = (row.get("GitHub ID") or "").strip()
            if name and gh and "Test" not in name:
                out[student_to_key(name)] = gh
    return out


def main():
    name_to_gh = load_name_to_github()
    token_file = GRADING / ".github_token"
    token = None
    if token_file.exists():
        token = token_file.read_text().strip()
    if not token:
        print("No grading/.github_token found; push will be skipped or may fail.", file=sys.stderr)

    pushed = []
    failed = []

    for prefix, (parent, repo_prefix) in CONFIG.items():
        if not parent.exists():
            print(f"Skip {prefix}: dir {parent} not found", file=sys.stderr)
            continue
        pattern = prefix + "*.md"
        for path in sorted(GRADING.glob(pattern)):
            # e.g. homework1_feedback_Agrawal_Vandan.md -> key Agrawal_Vandan
            key = path.stem[len(prefix) :]
            gh = name_to_gh.get(key)
            if not gh:
                print(f"No GitHub ID for key {key!r}", file=sys.stderr)
                failed.append((path.name, "no_github_id"))
                continue
            repo_name = f"{repo_prefix}-{gh}"
            repo_path = parent / repo_name
            if not repo_path.is_dir():
                print(f"Repo not found: {repo_path}", file=sys.stderr)
                failed.append((path.name, "repo_not_found"))
                continue
            feedback_path = repo_path / "feedback.md"
            content = path.read_text(encoding="utf-8")
            feedback_path.write_text(content, encoding="utf-8")

            # git add, commit (allow no change), push
            try:
                subprocess.run(
                    ["git", "add", "feedback.md"],
                    cwd=repo_path,
                    check=True,
                    capture_output=True,
                )
                r = subprocess.run(
                    ["git", "commit", "-m", f"Add feedback ({repo_prefix})"],
                    cwd=repo_path,
                    capture_output=True,
                    text=True,
                )
                if r.returncode != 0 and "nothing to commit" not in (r.stdout or "") + (r.stderr or ""):
                    print(f"Commit failed in {repo_path}: {r.stderr or r.stdout}", file=sys.stderr)
                    failed.append((path.name, "commit_failed"))
                    continue
                if r.returncode != 0:
                    continue  # nothing to commit, skip push
                if token:
                    origin = f"https://{token}@github.com/NU-MSAI-371/{repo_name}.git"
                    r = subprocess.run(
                        ["git", "push", origin, "main"],
                        cwd=repo_path,
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                    if r.returncode != 0:
                        print(f"Push failed {repo_name}: {r.stderr or r.stdout}", file=sys.stderr)
                        failed.append((path.name, "push_failed"))
                    else:
                        pushed.append(f"{repo_name} <- {path.name}")
                else:
                    r = subprocess.run(
                        ["git", "push", "origin", "main"],
                        cwd=repo_path,
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                    if r.returncode != 0:
                        print(f"Push failed {repo_name}: {r.stderr or r.stdout}", file=sys.stderr)
                        failed.append((path.name, "push_failed"))
                    else:
                        pushed.append(f"{repo_name} <- {path.name}")
            except subprocess.CalledProcessError as e:
                print(f"Git error in {repo_path}: {e}", file=sys.stderr)
                failed.append((path.name, "git_error"))
            except Exception as e:
                print(f"Error {repo_path}: {e}", file=sys.stderr)
                failed.append((path.name, str(e)))

    print("Pushed:", len(pushed))
    for line in pushed:
        print(" ", line)
    if failed:
        print("Failed:", len(failed))
        for name, reason in failed:
            print(f"  {name}: {reason}")


if __name__ == "__main__":
    main()
