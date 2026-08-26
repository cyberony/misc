# Homework: Hands-On Comparison of FOPC vs. Tables

## Learning Objective
Implement the same problems using both FOPC (with pyDatalog) and tabular data (with pandas) to experience firsthand when each representation excels and when each struggles. This assignment demonstrates the practical trade-offs through hands-on coding.

---

## Prerequisites

Install required packages:
```bash
pip install pyDatalog pandas numpy
```

---

## Instructions
1. Create a Python file named `fopc_vs_tables_comparison.py`
2. **Implement BOTH the FOPC version and the tables version for each task** (don't assume which will work better)
3. Compare performance, readability, and ease of implementation
4. After implementing, see the "Revelation" section to discover which approach wins and why
5. Submit your `fopc_vs_tables_comparison.py` file and a brief reflection document

---

## Task 1: Rule Chaining
**Problem:** Implement three chained rules:
1. If colonies > 200K, then major producer
2. If major producer AND price > $2, then profitable
3. If profitable AND production increased, then expanding

Find all expanding states.

**Requirements:**
1. Implement `expanding_states_tables(data)` using pandas
2. Implement `expanding_states_fopc(data)` using pyDatalog rules
3. Compare how rules are expressed and maintained
4. Measure execution time for both approaches

**Function signatures:**
```python
def expanding_states_tables(data):
    """
    Find expanding states using table queries.
    Must chain multiple filtering/joining operations.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        List of state codes that are expanding
    """
    pass

def expanding_states_fopc(data):
    """
    Find expanding states using FOPC rules.
    Define rules and let inference find the answer.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of state codes that are expanding
    """
    pass
```

**Your Implementation:**
- Try implementing both approaches
- Compare: Which makes the rules more explicit? Which is easier to modify if rules change?
- Measure: Which is faster? Which is more readable?

**After you implement, see the revelation below:**
<details>
<summary>Click to reveal: Which approach wins?</summary>

**Revelation: FOPC Wins**

**Why:**
- **FOPC:** Rules are declarative and explicit. Can chain automatically: `MajorProducer(s,y) <= ...`, `Profitable(s,y) <= MajorProducer(s,y) & ...`, `Expanding(s,y) <= Profitable(s,y) & ...` - rules stored as first-class knowledge
- **Tables:** Must write multiple filtering operations, rules embedded procedurally, harder to modify

**Key Insight:** Rule chaining is natural in FOPC because rules are first-class knowledge, but awkward in tables where rules are embedded in procedural code.
</details>

**Reflection questions:**
- Which approach makes the rules more explicit?
- Which is easier to modify if rules change?
- How does FOPC's declarative nature help?

---

## Task 2: Statistical Correlation
**Problem:** Calculate the correlation between colony count (`numcol`) and total production (`totalprod`) across all states and years.

**Requirements:**
1. Implement `correlation_with_tables(data)` using pandas
2. Attempt to implement `correlation_with_fopc(data)` using pyDatalog
3. Compare the implementation complexity
4. Measure execution time for both (if FOPC version is feasible)

**Function signatures:**
```python
def correlation_with_tables(data):
    """
    Calculate correlation using pandas.
    
    Args:
        data: List of dictionaries or pandas DataFrame
    
    Returns:
        float: Correlation coefficient
    """
    pass

def correlation_with_fopc(data):
    """
    Attempt to calculate correlation using pyDatalog.
    Note: This may be very difficult or impractical.
    
    Args:
        data: List of dictionaries
    
    Returns:
        float: Correlation coefficient (if feasible)
    """
    pass
```

**Your Implementation:**
- Try implementing both approaches
- Compare: Which was easier? Which was faster?
- Note: Don't worry if FOPC is very difficult - the point is to experience why

**After you implement, see the revelation below:**
<details>
<summary>Click to reveal: Which approach wins?</summary>

**Revelation: Tables Win**

**Why:**
- **Tables:** One line of code: `df['numcol'].corr(df['totalprod'])` - built-in statistical function, optimized numeric operations
- **FOPC:** Would require extensive axiomatization of mean, covariance, standard deviation - extremely verbose and slow

**Key Insight:** Statistical operations are natural in tables but awkward in FOPC because FOPC lacks built-in numeric/statistical functions.
</details>

**Reflection questions:**
- Which implementation was easier?
- Which was faster?
- Why does FOPC struggle with this?

---

## Task 3: Automatic Inference
**Problem:** Automatically identify all major producers (colonies > 200K) without explicitly storing this fact. Then use this derived fact in another query: "Find major producers with high prices."

**Requirements:**
1. Implement `major_producers_tables(data)` - must compute each time or store explicitly
2. Implement `major_producers_fopc(data)` - define rule, let inference derive facts
3. Implement `major_producers_high_price_tables(data)` and `major_producers_high_price_fopc(data)`
4. Compare maintenance and reusability

**Function signatures:**
```python
def major_producers_tables(data):
    """
    Find major producers using tables.
    Option 1: Compute in query each time
    Option 2: Add column and maintain it
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with major producers
    """
    pass

def major_producers_fopc(data):
    """
    Find major producers using FOPC inference.
    Define rule once, inference derives facts automatically.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    pass

def major_producers_high_price_tables(data):
    """
    Find major producers with high prices using tables.
    Must recompute or join with major_producers result.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with major producers that have high prices
    """
    pass

def major_producers_high_price_fopc(data):
    """
    Find major producers with high prices using FOPC.
    Can directly query derived facts.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    pass
```

**Your Implementation:**
- Try implementing both approaches
- Compare: Can you derive new facts automatically in each approach? How do you maintain derived data?

**After you implement, see the revelation below:**
<details>
<summary>Click to reveal: Which approach wins?</summary>

**Revelation: FOPC Wins**

**Why:**
- **FOPC:** Define rule once: `MajorProducer(s,y) <= HasColonies(s,c,y) & (c > 200000)`, then query `MajorProducer(s,y)` - facts automatically inferred. Can use derived facts in other rules: `MajorProducer(s,y) & HighPrice(s,y)`
- **Tables:** Must compute in query each time, or store explicitly and maintain consistency manually

**Key Insight:** Automatic inference is powerful in FOPC - you can derive facts from rules without storing them explicitly, but tables require explicit computation or storage.
</details>

**Reflection questions:**
- How does FOPC enable automatic derivation?
- What's the maintenance burden in each approach?
- When is inference valuable?

---

## Task 4: Temporal Aggregation
**Problem:** Calculate the 3-year moving average of production for each state.

**Requirements:**
1. Implement `moving_average_tables(data)` using pandas
2. Attempt to implement `moving_average_fopc(data)` using pyDatalog
3. Compare complexity and readability

**Function signatures:**
```python
def moving_average_tables(data, window=3):
    """
    Calculate moving average using pandas.
    
    Args:
        data: pandas DataFrame with columns: state, year, totalprod
        window: Size of moving window (default 3)
    
    Returns:
        pandas DataFrame with added 'moving_avg' column
    """
    pass

def moving_average_fopc(data, window=3):
    """
    Attempt to calculate moving average using pyDatalog.
    
    Args:
        data: List of dictionaries
        window: Size of moving window (default 3)
    
    Returns:
        Dictionary mapping (state, year) to moving average
    """
    pass
```

**Your Implementation:**
- Try implementing both approaches
- Compare: Which approach handles temporal computations more naturally?

**After you implement, see the revelation below:**
<details>
<summary>Click to reveal: Which approach wins?</summary>

**Revelation: Tables Win**

**Why:**
- **Tables:** Built-in windowing functions: `df.groupby('state')['totalprod'].transform(lambda x: x.rolling(window=5).mean())` - natural and efficient
- **FOPC:** Would need to define temporal ordering, window membership, handle frame problem - very awkward and verbose

**Key Insight:** Temporal analysis is natural in tables because of built-in windowing functions, but awkward in FOPC due to the frame problem and lack of temporal operators.
</details>

**Reflection questions:**
- Which approach was more natural for temporal analysis?
- How does the frame problem affect FOPC implementation?
- Why are windowing functions easier in tables?

---

## Task 5: Constraint Validation
**Problem:** Validate that for every state and year, production = colonies × yield per colony. Find all violations.

**Requirements:**
1. Implement `validate_constraint_tables(data)` using pandas
2. Implement `validate_constraint_fopc(data)` using pyDatalog
3. Compare how constraints are expressed

**Function signatures:**
```python
def validate_constraint_tables(data):
    """
    Validate production = colonies × yield using tables.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with rows that violate the constraint
    """
    pass

def validate_constraint_fopc(data):
    """
    Validate constraint using FOPC.
    Express constraint as a rule and find violations.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples that violate constraint
    """
    pass
```

**Your Implementation:**
- Try implementing both approaches
- Compare: Which approach makes the constraint more explicit? Which is easier to reason about?

**After you implement, see the revelation below:**
<details>
<summary>Click to reveal: Which approach wins?</summary>

**Revelation: FOPC Wins**

**Why:**
- **FOPC:** Constraint is explicit and declarative: `∀s,y (Produced(s,p,y) ∧ HasColonies(s,c,y) ∧ YieldPerColony(s,y,yield) → p = c × yield)` - stored as domain knowledge
- **Tables:** Constraint embedded in code, not stored as knowledge, harder to reason about violations

**Key Insight:** Constraints are natural in FOPC because they're explicit domain knowledge, but in tables they're often just procedural code.
</details>

**Reflection questions:**
- Which approach makes the constraint more explicit?
- How does FOPC enable reasoning about constraints?
- When would you use FOPC for validation?

---

## Task 6: Large-Scale Filtering
**Problem:** Find all states that had production above the median in each year. Test with the full dataset.

**Requirements:**
1. Implement `above_median_tables(data)` using pandas
2. Implement `above_median_fopc(data)` using pyDatalog
3. Compare execution time for both approaches
4. Test with progressively larger subsets of data

**Function signatures:**
```python
def above_median_tables(data):
    """
    Find states with production above median in each year using pandas.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with states above median per year
    """
    pass

def above_median_fopc(data):
    """
    Find states with production above median using pyDatalog.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    pass
```

**Performance comparison:**
```python
import time

# Test with different data sizes
for size in [100, 500, 1000, len(data)]:
    subset = data[:size]
    start = time.time()
    result_tables = above_median_tables(subset)
    time_tables = time.time() - start
    
    start = time.time()
    result_fopc = above_median_fopc(subset)
    time_fopc = time.time() - start
    
    print(f"Size {size}: Tables={time_tables:.4f}s, FOPC={time_fopc:.4f}s")
```

**Your Implementation:**
- Try implementing both approaches
- Compare: Which approach scales better? What makes one more efficient than the other?

**After you implement, see the revelation below:**
<details>
<summary>Click to reveal: Which approach wins?</summary>

**Revelation: Tables Win**

**Why:**
- **Tables:** Efficient groupby operations, optimized pandas operations, single pass through data
- **FOPC:** Universal quantifiers require checking all instances, no indexing, computational complexity O(n log n) or worse

**Key Insight:** Tables scale better for large datasets because of optimized operations, while FOPC reasoning can become computationally expensive at scale.
</details>

**Reflection questions:**
- How does performance scale for each approach?
- At what point does FOPC become impractical?
- What makes tables more efficient for this query?

---

## Part 3: Performance Comparison

### Task 3.1: Benchmark Suite
**Problem:** Create a benchmark that compares FOPC and tables on multiple tasks.

**Requirements:**
1. Implement `benchmark_comparison(data)` that runs all tasks
2. Measure execution time for each approach
3. Create a summary table

**Function signature:**
```python
def benchmark_comparison(data):
    """
    Run all tasks and compare performance.
    
    Args:
        data: pandas DataFrame or list of dicts
    
    Returns:
        Dictionary with timing results
    """
    results = {
        'correlation': {'tables': 0, 'fopc': 0},
        'moving_average': {'tables': 0, 'fopc': 0},
        'above_median': {'tables': 0, 'fopc': 0},
        'expanding_states': {'tables': 0, 'fopc': 0},
        'validate_constraint': {'tables': 0, 'fopc': 0},
        'major_producers': {'tables': 0, 'fopc': 0},
    }
    # Implement timing for each task
    return results
```

**Expected output:**
```
Benchmark Results:
Task                  Tables (s)    FOPC (s)     Winner
--------------------------------------------------------
correlation           0.001          N/A          Tables
moving_average        0.002         0.150        Tables
above_median          0.003         0.200        Tables
expanding_states      0.010         0.005        FOPC
validate_constraint   0.002         0.003        Tables
major_producers       0.001         0.002        Tables
```

---

## Part 4: Reflection and Analysis

### Task 4.1: Write Reflection Document
Create a document (`reflection.md`) that answers:

1. **When did tables clearly outperform FOPC?**
   - List specific tasks
   - Explain why (computational complexity, built-in functions, etc.)
   - Provide evidence (timing results)

2. **When did FOPC clearly outperform tables?**
   - List specific tasks
   - Explain why (rule chaining, inference, declarative nature, etc.)
   - Provide evidence

3. **Which tasks were roughly equivalent?**
   - Why were they similar?
   - What factors made them comparable?

4. **What surprised you?**
   - Were there tasks where your initial expectation was wrong?
   - What did you learn about the trade-offs?

5. **Decision Framework:**
   - Based on your experience, create a simple decision framework
   - When would you choose FOPC?
   - When would you choose tables?
   - When would you use both?

---

## Submission Requirements

1. **File:** `fopc_vs_tables_comparison.py` containing all required functions
2. **File:** `reflection.md` with your analysis
3. **Documentation:** Each function should have a docstring
4. **Testing:** Your code should work with the honey production dataset
5. **Output:** When I run your code, it should:
   - Execute all tasks
   - Print comparison results
   - Show timing information

---

## Grading Criteria

| Criterion | Points | Description |
|-----------|--------|-------------|
| Task 1 (Rule Chaining) | 15 | Correct FOPC rules, table queries |
| Task 2 (Correlation) | 10 | Correct implementation in both approaches |
| Task 3 (Inference) | 15 | Demonstrates automatic inference |
| Task 4 (Moving Average) | 10 | Correct implementation, comparison |
| Task 5 (Constraint) | 10 | Correct constraint validation |
| Task 6 (Above Median) | 10 | Correct implementation, performance analysis |
| Task 3.1 (Benchmark) | 10 | Complete benchmark suite |
| Task 4.1 (Reflection) | 20 | Thoughtful analysis, clear insights |
| Code quality | 10 | Clean, readable, well-documented |
| **Total** | **120** | |

---

## Tips

1. **Try both approaches:** Don't skip to the answer - actually implement both FOPC and tables for each task
2. **Don't worry if FOPC fails:** The point is to experience why it fails
3. **Measure everything:** Use `time.time()` to measure execution time
4. **Document struggles:** Note in comments where FOPC becomes impractical
5. **Compare fairly:** Use similar data structures and preprocessing for fair comparison

---

## Getting Started

1. Load the data:
   ```python
   import pandas as pd
   df = pd.read_csv('honeyproduction.csv')
   data = df.to_dict('records')  # For FOPC
   ```

2. Set up pyDatalog:
   ```python
   from pyDatalog import pyDatalog
   pyDatalog.create_terms('HasColonies, Produced, ...')
   ```

3. Implement one task at a time
4. Test each implementation
5. Compare and reflect

Good luck!
