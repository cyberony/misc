# Work Session Summary - MSAI 371 Homework Development

## Date: January 16, 2025

This document summarizes all work completed on Homework 1 (FOPC and Tables) for MSAI 371.

---

## Repository Structure

### Main Student Repository
**Location:** `https://github.com/NU-MSAI-371/homework-1-fopc-and-tables`

**Contents:**
- `homework_fopc.md` - Student instructions for FOPC homework
- `homework_fopc.py` - Student starter code for FOPC homework
- `homework_tables.md` - Student instructions for Tables homework
- `homework_tables.py` - Student starter code for Tables homework
- `honeyproduction.csv` - Data file for both assignments

**Note:** Solution files were removed from this repo and moved to the solutions repository.

### Solutions Repository
**Location:** `https://github.com/NU-MSAI-371/homework-1-fopc-and-tables-solutions`

**Contents:**
- `homework_fopc_solutions.md` - Complete solutions for FOPC homework
- `homework_fopc_solutions.py` - Complete Python solutions for FOPC homework
- `homework_tables_solutions.md` - Complete solutions for Tables homework
- `homework_tables_solutions.py` - Complete Python solutions for Tables homework
- `honeyproduction.csv` - Data file

### Class Notes Repository
**Location:** `https://github.com/NU-MSAI-371/notes`

**Contents:**
- `knowledge_graphs.md` - Knowledge graphs tutorial

**Local Location:** `/Users/alam/Code/cursor/working/class_notes/`

---

## Local Workspace Structure

```
/Users/alam/Code/cursor/working/
├── class_notes/                    # Cloned from notes repo
│   └── knowledge_graphs.md
└── honeybees/
    ├── homework-1-fopc-and-tables/        # Cloned student repo
    │   ├── homework_fopc.md
    │   ├── homework_fopc.py
    │   ├── homework_tables.md
    │   ├── homework_tables.py
    │   └── honeyproduction.csv
    └── homework-1-fopc-and-tables-solutions/  # Cloned solutions repo
        ├── homework_fopc_solutions.md
        ├── homework_fopc_solutions.py
        ├── homework_tables_solutions.md
        ├── homework_tables_solutions.py
        └── honeyproduction.csv
```

---

## Homework 1, Part 1: FOPC Encoding and Inference with pyDatalog

### Key Technical Decisions

#### 1. **Uppercase Variables Required in pyDatalog**
**Critical Issue Discovered:** pyDatalog requires uppercase variables (S, Y, C, etc.) for queries to work. Lowercase variables (s, y, c) will NOT work.

**Solution Applied:**
- All variable names changed to uppercase: `S, Y, C, Total, Yld, Price, Stocks, P`
- Updated in all files: `.py`, `.md` (both student and solutions versions)
- Added tip in Tips section explaining this requirement
- Updated all docstrings, examples, and code comments

**Files Affected:**
- `homework_fopc.py`
- `homework_fopc.md`
- `homework_fopc_solutions.py`
- `homework_fopc_solutions.md`

#### 2. **Query Results Access**
**Issue:** pyDatalog Query objects require accessing `.data` attribute to get actual results.

**Solution:**
- All queries now use `result.data` instead of just `result`
- Updated all query functions to use `.data` attribute
- Updated examples and documentation

#### 3. **Scientific Notation in CSV**
**Issue:** Some numeric values in CSV are in scientific notation (e.g., '1e+05').

**Solution:**
- Updated `load_honey_data()` to use `int(float(value))` for numeric conversions
- Handles both regular integers and scientific notation

#### 4. **Reserved Keyword Issue**
**Issue:** `yield` is a Python reserved keyword.

**Solution:**
- Renamed variable from `yield` to `yld` throughout all files
- Updated in rules, queries, and documentation

### File Structure

#### Student Version (`homework_fopc.md` and `homework_fopc.py`)
- **Functions 2.1, 3.1, and 4.1** are marked as "(Already Implemented below)" with solutions provided
- All other functions have `pass` statements for students to implement
- Includes comprehensive test cases for each function
- Tips section includes uppercase variable requirement
- Getting Started section with step-by-step guidance

#### Solutions Version (`homework_fopc_solutions.md` and `homework_fopc_solutions.py`)
- Complete implementations for all functions
- All code matches between `.md` and `.py` files
- Uses uppercase variables throughout
- Proper `.data` access for all queries

### Functions Implemented

1. **Part 1: Loading Data and Encoding Facts**
   - `load_honey_data(filename)` - Loads CSV, handles scientific notation
   - `encode_facts_to_pydatalog(data)` - Encodes 5 predicates (HasColonies, Produced, YieldPerColony, PricePerPound, HasStocks)

2. **Part 2: Encoding Rules**
   - `encode_major_producer_rule()` - ✅ Already implemented (function 2.1)
   - `encode_high_price_rule()` - Student implements
   - `encode_production_constraint_rule()` - Student implements

3. **Part 3: Performing Inference**
   - `query_major_producers(year)` - ✅ Already implemented (function 3.1)
   - `query_high_price_states(year)` - Student implements
   - `query_major_producers_with_high_price(year)` - Student implements
   - `query_production_for_state(state, year)` - Student implements

4. **Part 4: Main Function**
   - `main()` - ✅ Already implemented (function 4.1)

### Grading
- Total: 7 points
- Functions 2.1, 3.1, and 4.1 are already implemented (no points)
- All other functions worth 1 point each

### Important Links
- pyDatalog GitHub: https://github.com/pcarbonn/pyDatalog
- pyDatalog Documentation: https://github.com/pcarbonn/pyDatalog
- Both linked in Learning Objectives section

---

## Homework 1, Part 2: Reasoning with Tabular Data using Pandas

### File Structure

#### Student Version (`homework_tables.md` and `homework_tables.py`)
- **Exercise 1** is marked as "(Already Implemented below)" with solutions provided
- All other exercises have function stubs with TODO comments and hints
- Tips section with pandas examples
- Getting Started section

#### Solutions Version (`homework_tables_solutions.md` and `homework_tables_solutions.py`)
- Complete implementations for all 5 exercises (20 questions total)
- All code matches between `.md` and `.py` files

### Exercises Structure

1. **Exercise 1: Aggregation Questions** - ✅ Already implemented
   - Question 1: Total production in 2010
   - Question 2: Average price per pound
   - Question 3: Total colonies in 2005
   - Question 4: State with most total production

2. **Exercise 2: Temporal Reasoning** - Student implements
   - Question 1: Production trend over time
   - Question 2: Price change 1998-2012
   - Question 3: Year with highest yield
   - Question 4: Correlation between price and production

3. **Exercise 3: Comparative Reasoning** - Student implements
   - Question 1: State with highest yield
   - Question 2: Compare ND and CA
   - Question 3: Top 5 states by production value
   - Question 4: Most consistent production

4. **Exercise 4: Filtering and Selection** - Student implements
   - Question 1: States with >10M lbs in 2010
   - Question 2: States with price >$2.00
   - Question 3: States with <10K colonies in 2012
   - Question 4: Records with yield >100 lbs

5. **Exercise 5: Multi-dimensional Queries** - Student implements
   - Question 1: Highest production value in 2012
   - Question 2: States with increased colonies AND yield
   - Question 3: Best efficiency among large producers
   - Question 4: Correlation between price and production

### Grading
- Total: 8 points
- Exercise 1 (4 questions) already implemented (no points)
- All other questions worth 0.5 points each (16 questions × 0.5 = 8 points)

### Function Naming Convention
- Functions follow pattern: `exercise{N}_q{M}()` where N is exercise number and M is question number
- Example: `exercise1_q1()`, `exercise2_q3()`, `exercise5_q4()`

---

## Key Changes Made During Development

### 1. File Renaming
- `homework_fopc_solution.py` → `homework_fopc_solutions.py` (plural)
- `homework_tables_solution.md` → `homework_tables_solutions.md` (plural)
- `homework_tables_solution.py` → `homework_tables_solutions.py` (plural)

### 2. Repository Organization
- Created separate solutions repository: `homework-1-fopc-and-tables-solutions`
- Moved all solution files from student repo to solutions repo
- Student repo now contains only student-facing files

### 3. Structure Improvements
- Added "Tips" and "Getting Started" sections to all homework files
- Positioned right after "Learning Objective" section
- Added comprehensive test cases for FOPC homework
- Added grading tables to both homework assignments

### 4. Code Consistency
- Ensured all `.md` and `.py` files match exactly
- Updated all variable names to uppercase in pyDatalog
- Fixed all query access to use `.data` attribute
- Updated all docstrings and examples

### 5. Documentation
- Added note about function definitions in Python files
- Added tip about uppercase variables in pyDatalog
- Updated "Handle results" tip to mention `.data` attribute
- Changed "reflect" to "reflect (in your mind)" in Getting Started

---

## Testing and Verification

### FOPC Solution File
- ✅ Runs without errors
- ✅ Queries return correct results using uppercase variables
- ✅ All facts encoded successfully (626 records)
- ✅ All rules work correctly
- ✅ Main function executes all queries and prints results

### Known Working Output
When `homework_fopc_solutions.py` runs successfully, it produces:
- Major producers in 2010: ['CA', 'ND', 'SD']
- High price states in 2010: ['AL', 'HI', 'IL', ...]
- Production for CA in 2010: 27,470,000 lbs
- States with valid production constraint: 40 states

---

## Environment Setup

### Python Environment
- Using `rony` pyenv environment
- pyDatalog installed: version 0.17.4
- Location: `/Users/alam/.pyenv/versions/rony/`
- `.python-version` file created in HW 1 directory to ensure IDE uses correct environment

### Dependencies
- pyDatalog: `pip install pyDatalog`
- pandas: `pip install pandas`
- numpy: `pip install numpy` (for tables homework)

---

## Important Notes for Future Sessions

1. **pyDatalog Variable Naming:** Always use uppercase (S, Y, C, etc.) - this is critical
2. **Query Results:** Always access `.data` attribute: `result.data`
3. **CSV Parsing:** Use `int(float(value))` to handle scientific notation
4. **File Consistency:** When updating solutions, update both `.md` and `.py` files
5. **Repository Separation:** Student files in main repo, solutions in solutions repo

---

## Files Removed/Cleaned Up

- Deleted "For HW 1" folder (old working directory)
- Deleted "HW 1" folder (replaced by cloned repos)
- Deleted duplicate `knowledge_graphs_tutorial.md` from working directory
- Removed solution files from student repository

---

## Next Steps / Pending Items

None currently - all homework files are complete and pushed to repositories.

---

## Contact/Reference

- Student Repository: https://github.com/NU-MSAI-371/homework-1-fopc-and-tables
- Solutions Repository: https://github.com/NU-MSAI-371/homework-1-fopc-and-tables-solutions
- Notes Repository: https://github.com/NU-MSAI-371/notes

---

## Project Proposal Instructions (In Progress)

### Repository
**Location:** `https://github.com/NU-MSAI-371/project`
**Local Location:** `/Users/alam/Code/cursor/working/honeybees/project/`

### Proposal Structure

The project proposal should include the following parts:

1. **The project idea**
2. **What the project will accomplish that can't be easily accomplished with a system like ChatGPT or Cursor**
3. **The type(s) of knowledge needed**
4. **The way(s) the knowledge will be represented. Why?**
5. **The type(s) of reasoning envisioned. Why?**
6. **Technologies and tools envisioned to be used**

### Style Requirements
- Word and organize in the same style as the classwork and homework files
- Examples will be provided for each section
- Wait for explicit instruction before creating the proposal instructions

### Sample Project Idea

**Problem:** When using GPS to go somewhere, if you want to find a McDonald's or something on the way, the GPS can't do that. It'll find the nearest such place, and that could be in a completely different direction of travel, often in the opposite direction. The goal is to create an AI that can do this.

**Knowledge Needed:** A map of locations and roads. This could be in a standard map format like how Bing maps is, for example, or a tree of nodes and edges where the nodes are places and the edges are roads that connect them.

**Representation Choice & Justification:** The reason for this representation choice is that it will allow measuring distances between places and also performing search to calculate routes if needed. While the project intends to rely on an external navigation app for main pathfinding, there may still be a need to do auxiliary pathfinding to identify the best candidate places along the main route.

**Reasoning Approach & Justification:** For reasoning, the project will mainly leverage some navigation app's found path, which will be a sequence of nodes (places), then measure distance from that path and some potential nearby places, thereby ranking them by some "goodness" metric and pick accordingly. This reasoning was chosen because it is distance-based and intuitive.

---

*Last Updated: January 16, 2025*
