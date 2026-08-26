# Homework 1: Analysis of Scores Below 14

**Total students below 14:** 4 (out of 45). *(Vohra regraded to 14.5 — see feedback file.)*

| Student       | Score | Part that failed |
|---------------|-------|------------------|
| George, Mia  | 7.0   | Tables           |
| Chen, Zeli    | 8.0   | FOPC             |
| Gadicke, Karl | 8.0   | FOPC             |
| Li, Xiang     | 8.0   | FOPC             |

Scores mean: **7** = one part full credit (FOPC 7 or Tables 8), other part 0; **8** = Tables full credit (8), FOPC failed (0).

---

## 1. Chen, Zeli (epi-hui9) — 8.0 | FOPC failed

**Error:**  
`TypeError: object of type 'NoneType' has no len()` in `main()` at `print(f"Loaded {len(data)} records\n")`.

**Cause:**  
`load_honey_data()` is still the stub: it has `pass` and returns `None`. The rest of FOPC was never run because the first step fails.

**Root cause:**  
**Incomplete implementation** — Part 1 (loading and encoding) was not implemented; left as `pass`.

---

## 2. Gadicke, Karl (KarlG322) — 8.0 | FOPC failed

**Error:**  
`ModuleNotFoundError: No module named 'param'` at line 17: `from param import produce_value`.

**Cause:**  
The repo has no `param.py` (only the usual homework files and `honeyproduction.csv`). So either:
- A local/custom module was used and not committed, or  
- The import is a mistake (e.g. wrong name or leftover from another project).

**Root cause:**  
**Wrong or missing dependency** — Code depends on a non-existent module `param`, so FOPC never runs.

---

## 3. Li, Xiang (shi1gesong) — 8.0 | FOPC failed

**Error:**  
`TypeError: bad operand type for abs(): 'Operation'` in `encode_production_constraint_rule()` at  
`& (abs(Total - (C * Yld)) < 1)`.

**Cause:**  
In pyDatalog, `Total`, `C`, `Yld` in the rule are symbolic terms. So `Total - (C * Yld)` is a pyDatalog expression (Operation), not a Python number. Python’s `abs()` doesn’t accept that, hence the TypeError.

**Correct approach (per spec):**  
Use exact equality in the rule, e.g.  
`ValidProduction(S, Y) <= HasColonies(S, C, Y) & YieldPerColony(S, Y, Yld) & Produced(S, Total, Y) & (Total == C * Yld)`  
(no `abs()` or tolerance inside the rule).

**Root cause:**  
**Misuse of Python inside a pyDatalog rule** — Used `abs(...) < 1` for a tolerance check; pyDatalog doesn’t support that. Should use `Total == C * Yld` (or handle tolerance outside the rule).

---

## 4. George, Mia (mia-george) — 7.0 | Tables failed

**Error:**  
`ModuleNotFoundError: No module named '_tkinter'` when running `homework_tables.py`.  
Triggered by line 13: `from tkinter import Y`.

**Cause:**  
The assignment does not use tkinter. Importing `Y` from `tkinter` is almost certainly a mistake (e.g. a variable name or leftover). Importing tkinter pulls in the `_tkinter` C extension, which is not available in the grading environment, so the script fails before any Tables logic runs.

**Root cause:** **Erroneous import** — `from tkinter import Y` is wrong and unnecessary; likely a typo or copy-paste. Removing that line (and using a local variable `Y` if needed) would fix the crash.

---

## 5. Vohra, Karan (kvohra01) — ~~7.0~~ **14.5** (regraded)

Originally scored 7.0 because `homework_tables.py` crashed in Exercise 5. Manual partial credit applied (Exercises 1–4); small deductions on Tables Ex3 Q1/Q4; Q2 excused. See `homework1_feedback_Vohra_Karan.md`.

**Original crash (still in submission if unfixed):**  
`ValueError: Can only compare identically-labeled Series objects` in `exercise5_q2()` when comparing `df_2011['numcol']` to `df_2012['numcol']` without aligning by state.

---

## Summary: What went wrong (by category)

| Category                  | Count | Students                                      |
|---------------------------|-------|-----------------------------------------------|
| Incomplete / stub code    | 1     | Chen (FOPC: `load_honey_data` not implemented) |
| Wrong or missing import  | 2     | Karl (FOPC: `param`), Mia (Tables: `tkinter`)  |
| pyDatalog rule misuse    | 1     | Li (FOPC: `abs()` in rule)                     |
| Pandas logic / alignment | 1     | Vohra (original auto-grade failure; regraded)   |

So the failures are **not** all the same. They fall into four distinct issues:

1. **Stub left in place** (Chen)  
2. **Bad or missing import** (Karl, Mia)  
3. **Using Python built-ins inside a pyDatalog rule** (Li)  
4. **Comparing unaligned pandas Series** (Vohra — original run; manual regrade applied)

No single bug appears across all five original low scores; the only repeated theme is **imports** (Karl and Mia), but for different modules and reasons.
