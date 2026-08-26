# File Structure

## Current Organization

```
honeybees/
├── README.md                          # Main documentation
├── honeyproduction.csv                # Dataset (1998-2012)
│
├── analysis/                          # Data analysis files
│   ├── analyze_honey.py              # Analysis script
│   ├── analysis_results.md            # Analysis findings
│   └── honey_analysis.png             # Visualization charts
│
├── HW 1/                              # Homework 1 files
│   ├── homework_fopc.md              # FOPC assignment
│   ├── homework_fopc.py              # FOPC starter code
│   └── homework_fopc_solution.py     # FOPC solution
│
├── For HW 1/                          # Additional Homework 1 materials
│   ├── homework_fopc.md              # FOPC assignment
│   ├── homework_fopc_solution.py     # FOPC solution
│   ├── homework_tables.md            # Tables assignment
│   ├── homework_tables_solution.md   # Tables solutions document
│   └── homework_tables_solution.py   # Tables Python solutions code
│
├── For HW 2/                          # Homework 2 materials
│   ├── classwork_fopc_vs_tables.md           # Classwork assignment
│   ├── classwork_fopc_vs_tables_solution.md   # Classwork solution
│   ├── homework_fopc_vs_tables.md             # Homework assignment
│   ├── homework_fopc_vs_tables_solution.md    # Homework solutions document
│   └── homework_fopc_vs_tables_solution.py    # Homework Python solutions code
│
└── [Educational Materials]            # Root level files
    ├── exercises_fopc.md              # FOPC exercises
    ├── exercises_fopc_solutions.md    # FOPC exercise solutions
    ├── instructor_guide_tables.md     # Guide for table exercises
    └── fopc_vs_tables_proof_of_concept.md  # Comparison document
```

## Folder Descriptions

### `analysis/`
Contains all data analysis related files:
- Scripts for analyzing the honey production data
- Results and findings documentation
- Generated visualizations

### `HW 1/`
Contains Homework 1 FOPC files:
- FOPC assignment description
- Starter code for students
- Complete solution implementation

### `For HW 1/`
Contains additional Homework 1 materials:
- FOPC assignment and solution
- Tables assignment and solutions (both markdown and Python)

### `For HW 2/`
Contains Homework 2 materials:
- Classwork assignment and solution (FOPC vs Tables)
- Homework assignment and solutions (FOPC vs Tables)

### Root Level
Core educational materials and exercises:
- Exercise sets and solutions
- Instructor guides
- Proof of concept documents

## File Naming Conventions

- **Tables/Tabular:** Files with `tables` or `tabular` in name
- **FOPC:** Files with `fopc` in name
- **Comparisons:** Files with `vs` or `comparison` in name
- **Assignments:** `[type]_[topic].md` or `.py`
- **Solutions:** `[type]_[topic]_solution.md` or `.py`
- **Grading:** `grade_[topic].py`

## Quick Reference

| What you need | Where to find it |
|--------------|------------------|
| Dataset | `honeyproduction.csv` (root) |
| Run analysis | `analysis/analyze_honey.py` |
| Homework 1 FOPC assignment | `HW 1/homework_fopc.md` or `For HW 1/homework_fopc.md` |
| Homework 1 FOPC starter code | `HW 1/homework_fopc.py` |
| Homework 1 FOPC solution | `HW 1/homework_fopc_solution.py` or `For HW 1/homework_fopc_solution.py` |
| Homework 1 Tables assignment | `For HW 1/homework_tables.md` |
| Homework 1 Tables solution | `For HW 1/homework_tables_solution.md` / `.py` |
| Homework 2 Classwork assignment | `For HW 2/classwork_fopc_vs_tables.md` |
| Homework 2 Classwork solution | `For HW 2/classwork_fopc_vs_tables_solution.md` |
| Homework 2 assignment | `For HW 2/homework_fopc_vs_tables.md` |
| Homework 2 solution | `For HW 2/homework_fopc_vs_tables_solution.md` / `.py` |
| FOPC exercises | `exercises_fopc.md` |
| Table instructor guide | `instructor_guide_tables.md` |
| Comparison document | `fopc_vs_tables_proof_of_concept.md` |

