# Honey Production Data Analysis

This module contains educational materials for teaching knowledge representation using honey production data.

## Contents

### Data Analysis (`analysis/`)
- **`honeyproduction.csv`** - Honey production data by US state (1998-2012) [root]
- **`analysis/analyze_honey.py`** - Python script for data analysis
- **`analysis/analysis_results.md`** - Complete analysis results and findings
- **`analysis/honey_analysis.png`** - Visualization charts

### Classwork Assignments (`classwork/`)
- **`classwork/classwork_fopc.md`** - Classwork assignment: Manual FOPC encoding
- **`classwork/classwork_fopc_solution.md`** - Solution with complete answers
- **`classwork/classwork_tables.md`** - Classwork assignment: Conceptual exercises on tabular data (Parts 2-5)
- **`classwork/classwork_tables_solution.md`** - Solutions for classwork exercises

### Homework Assignments (`homework/`)
- **`homework/homework_fopc.md`** - Homework assignment: FOPC encoding and inference with pyDatalog
- **`homework/homework_fopc_solution.py`** - Complete solution implementation using pyDatalog
- **`homework/homework_tables.md`** - Homework assignment: Coding exercises on tabular data (Part 1)
- **`homework/homework_tables_solution.md`** - Solutions document for homework
- **`homework/homework_tables_solution.py`** - Complete Python solutions code for homework

### Educational Materials

**Tables/Tabular Data:**
- **`instructor_guide_tables.md`** - Teaching guide for tabular data exercises
- See `classwork/` and `homework/` folders for split assignments

**FOPC (First-Order Predicate Calculus):**
- **`exercises_fopc.md`** - Exercises exploring FOPC as a representation choice
- **`exercises_fopc_solutions.md`** - Solutions for FOPC exercises

**Comparisons:**
- **`fopc_vs_tables_proof_of_concept.md`** - Proof of concept comparing FOPC and tables

## Learning Objectives

Students will learn:
- How data representation shapes reasoning capabilities
- Why tabular data is powerful for certain types of queries
- When to choose alternative representations (including FOPC)
- How schema design affects what questions can be answered
- The pros and cons of FOPC as a knowledge representation formalism

## Quick Start

1. Load the data:
```python
import pandas as pd
df = pd.read_csv('honeyproduction.csv')
```

2. Run the analysis:
```python
python analysis/analyze_honey.py
```

3. Explore the exercises:
   - `exercises_tables.md` - Tabular data exercises
   - `exercises_fopc.md` - FOPC-specific exercises

## Dataset Overview

- **626 records** covering 44 US states
- **Years:** 1998-2012
- **Columns:** state, numcol, yieldpercol, totalprod, stocks, priceperlb, prodvalue, year

## Key Findings

- Honey production has declined from ~220M lbs (1998) to ~141M lbs (2012)
- Prices have increased dramatically from $0.83/lb to $2.37/lb
- Yield per colony has decreased from ~70 lbs to ~55 lbs
- North Dakota, California, and South Dakota are top producers

See `analysis/analysis_results.md` for complete analysis.

## Course Context

This material is designed for courses on:
- Knowledge Representation
- Data Structures and Algorithms
- Database Design
- Data Science Fundamentals

## License

Educational use - See individual files for specific licensing information.

