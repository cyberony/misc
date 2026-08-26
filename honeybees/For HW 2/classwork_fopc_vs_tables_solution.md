# Classwork: Comparing FOPC and Tables - SOLUTION

## Learning Objective
Explore the same problems using both FOPC and tabular representations. Through hands-on attempts, discover when each approach excels and when each struggles. This classwork demonstrates that neither representation is universally superior—the choice depends on the task.

---


## Instructions
1. Read each scenario carefully
2. **Attempt to solve the problem using BOTH FOPC and tables** (don't assume which will work better)
3. Compare your attempts: Which was easier? Which was more natural?
4. After attempting, read the "Revelation" section to see which approach wins and why
5. Reflect on what you learned from the comparison
6. Fill out all the gray areas in this document

---
## Scenario 1: Statistical Correlation
**Task:** "What is the correlation between colony count and total production across all states and years?"

<details>
<summary><strong>ANSWERS:</strong></summary>

**FOPC Attempt:**
To express correlation in FOPC, you'd need:
```
Correlation(numcol, totalprod, r) ↔
  Mean(numcol, mean_col) ∧
  Mean(totalprod, mean_prod) ∧
  Covariance(numcol, totalprod, cov) ∧
  StdDev(numcol, std_col) ∧
  StdDev(totalprod, std_prod) ∧
  r = cov / (std_col × std_prod)
```

But each of these (Mean, Covariance, StdDev) requires:
- Summing all values (requires recursive definition or explicit enumeration)
- Counting all values
- Computing differences from mean for each value
- This becomes extremely verbose and computationally expensive

**Tables Attempt:**
```python
import pandas as pd
correlation = df['numcol'].corr(df['totalprod'])
```

**Revelation: Tables Win**

**Why:**
- Tables: One line of code - built-in statistical function, optimized numeric operations
- FOPC: Would require extensive axiomatization of arithmetic operations, extremely verbose

**Key Insight:** Statistical operations are natural in tables but awkward in FOPC because FOPC lacks built-in numeric/statistical functions.

</details>
---

## Scenario 2: Complex Rule Chaining
**Task:** Chain three rules to find "Which states are expanding?"

<details>
<summary><strong>ANSWERS:</strong></summary>

**Tables Attempt:**
```python
# Step 1: Find major producers
major = df[df['numcol'] > 200000].copy()

# Step 2: Find profitable (major producers with high price)
profitable = major[major['priceperlb'] > 2.0].copy()

# Step 3: Find expanding (profitable with increasing production)
profitable = profitable.sort_values(['state', 'year'])
profitable['prev_prod'] = profitable.groupby('state')['totalprod'].shift(1)
profitable['increasing'] = profitable['totalprod'] > profitable['prev_prod']

expanding = profitable[profitable['increasing'] == True]
```

**Problems:**
- Requires multiple filtering/grouping operations
- Must manually chain operations
- Rules are embedded in code, not stored as knowledge
- Hard to modify rules (must rewrite code)

**FOPC Attempt:**
```
Rule 1: ∀s, y, c (HasColonies(s, c, y) ∧ c > 200000 → MajorProducer(s, y))
Rule 2: ∀s, y (MajorProducer(s, y) ∧ PricePerPound(s, y, p) ∧ p > 2.0 → Profitable(s, y))
Rule 3: ∀s, y1, y2, p1, p2 (Profitable(s, y1) ∧ Produced(s, p1, y1) ∧ Produced(s, p2, y2) ∧ y2 = y1 + 1 ∧ p2 > p1 → Expanding(s, y2))

Query: Expanding(s, y)
```

**Revelation: FOPC Wins**

**Why:**
- FOPC: Rules are declarative and explicit, can chain automatically, stored as first-class knowledge
- Tables: Rules embedded procedurally, must manually chain queries, harder to modify

**Key Insight:** Rule chaining is natural in FOPC because rules are first-class knowledge, but awkward in tables where rules are embedded in procedural queries.

</details>
---

## Scenario 3: Large-Scale Query Performance
**Task:** 1000 states × 100 years = 100,000 records. Find "Which states had production above the median in each year?"

<details>
<summary><strong>ANSWERS:</strong></summary>

**FOPC Attempt:**
```
∀y ∃median (MedianProduction(y, median) ∧ 
  ∀s (Produced(s, p, y) ∧ p > median → AboveMedian(s, y)))
```

**Computational complexity:**
- For each year y: Need to find median (requires sorting all states)
- For each state s: Check if p > median
- Total: O(years × states × log(states)) = O(100 × 1000 × log(1000)) ≈ O(1,000,000) operations
- Worse: FOPC reasoner may need to check each fact individually
- No indexing or optimization

**Tables Attempt:**
```python
medians = df.groupby('year')['totalprod'].median()
result = df.merge(medians.rename('median_prod'), left_on='year', right_index=True)
above_median = result[result['totalprod'] > result['median_prod']]
```

**Revelation: Tables Win**

**Why:**
- Tables: Efficient groupby operations, optimized pandas operations, single pass through data
- FOPC: Universal quantifiers require checking all instances, no indexing, computational complexity O(n log n) or worse

**Key Insight:** Tables scale better for large datasets because of query optimization and indexing, while FOPC reasoning can become computationally expensive at scale.

</details>
---

## Scenario 4: Constraint Validation
**Task:** Validate: "For every state and year, if production > 50M AND colonies < 100K, then there must be an error."

<details>
<summary><strong>ANSWERS:</strong></summary>

**Tables Attempt:**
```python
# Find violations
violations = df[(df['totalprod'] > 50000000) & (df['numcol'] < 100000)]
```

**Problems:**
- Constraint is embedded in query, not stored as knowledge
- Must write query each time you want to check
- Can't easily reason about the constraint

**FOPC Attempt:**
```
Constraint: ∀s, y, p, c (Produced(s, p, y) ∧ HasColonies(s, c, y) ∧ p > 50000000 ∧ c < 100000 → Error(s, y))

Can automatically check: Error(s, y) for all states and years
Can reason: If Error(s, y) then data is inconsistent
```

**Revelation: FOPC Wins**

**Why:**
- FOPC: Constraints are declarative and explicit, stored as domain knowledge, can reason about violations
- Tables: Constraints are procedural (queries), not stored as domain knowledge, harder to reason about

**Key Insight:** Constraints are natural in FOPC because they're explicit domain knowledge, but in tables they're often just procedural queries.

</details>
---

## Scenario 5: Temporal Aggregation
**Task:** "What is the 5-year moving average of production for each state?"

<details>
<summary><strong>ANSWERS:</strong></summary>

**FOPC Attempt:**
```
MovingAverage(s, y, avg) ↔
  Produced(s, p1, y-2) ∧
  Produced(s, p2, y-1) ∧
  Produced(s, p3, y) ∧
  Produced(s, p4, y+1) ∧
  Produced(s, p5, y+2) ∧
  avg = (p1 + p2 + p3 + p4 + p5) / 5
```

**Problems:**
- Need explicit predicates for each year in window
- Must handle edge cases (beginning/end of time series)
- Frame problem: Must state what doesn't change
- Very verbose for each state-year combination
- No built-in windowing functions

**Tables Attempt:**
```python
df['moving_avg'] = df.groupby('state')['totalprod'].transform(
    lambda x: x.rolling(window=5, center=True).mean()
)
```

**Revelation: Tables Win**

**Why:**
- Tables: Built-in windowing functions, natural time series support, efficient computation
- FOPC: Temporal computations require explicit time handling, frame problem makes it worse, awkward for time series analysis

**Key Insight:** Temporal analysis is natural in tables because of built-in windowing functions, but awkward in FOPC due to the frame problem and lack of temporal operators.

</details>
---

## Scenario 6: Deriving New Facts from Rules
**Task:** Automatically identify all major producers without explicitly storing this fact.

<details>
<summary><strong>ANSWERS:</strong></summary>

**Tables Attempt:**
```python
# Option 1: Store as column (must maintain)
df['is_major_producer'] = df['numcol'] > 200000
# Problem: Must update whenever numcol changes

# Option 2: Compute in query each time
major_producers = df[df['numcol'] > 200000]
# Problem: Rule is embedded in code, not stored as knowledge
```

**Problems:**
- If stored: Must maintain consistency (update when data changes)
- If computed: Rule not stored, must write query each time
- No automatic derivation

**FOPC Attempt:**
```
Rule: ∀s, y, c (HasColonies(s, c, y) ∧ c > 200000 → MajorProducer(s, y))

Given: HasColonies(CA, 250000, 2010)
Inference: MajorProducer(CA, 2010)  (automatically derived)

Can query: MajorProducer(s, y) and get all derived facts
```

**Revelation: FOPC Wins**

**Why:**
- FOPC: Automatic inference derives new facts, rule stored as knowledge, derived facts automatically updated when base facts change
- Tables: Can only retrieve stored data or compute in queries, no inference engine, must manually maintain derived data

**Key Insight:** Automatic inference is powerful in FOPC - you can derive facts from rules without storing them explicitly, but tables require explicit computation or storage.

</details>
---

## Scenario 7: Missing Data and Uncertainty
**Task:** "State X probably has high production, but we're not certain because data is incomplete."

<details>
<summary><strong>ANSWERS:</strong></summary>

**FOPC Attempt:**
Pure FOPC cannot represent:
- "probably" (no probability operator)
- "maybe" (no possibility operator)
- Degrees of confidence
- Incomplete knowledge gracefully

**Workarounds (all problematic):**
1. Use negation as failure: `¬HasLowProduction(X) → ProbablyHighProduction(X)`
   - But this assumes closed world (everything not known is false)
2. Use special "Unknown" constant: `Production(X, Unknown)`
   - But this breaks standard FOPC semantics
3. Leave unstated: Just don't assert anything
   - But then universal quantifiers may fail

**Tables Attempt:**
```python
# Handle missing data naturally
df['totalprod'].fillna(df['totalprod'].mean())  # Impute
df['totalprod'].isna()  # Check for missing

# Or use uncertainty columns
df['totalprod'] = 50000000
df['confidence'] = 0.7  # 70% confident
```

**Revelation: Tables Win**

**Why:**
- Tables: Natural handling of NULL/missing values, can add confidence columns, statistical imputation methods
- FOPC: Requires complete knowledge, no built-in uncertainty representation, would need extensions (probabilistic FOPC) for uncertainty

**Key Insight:** Tables handle missing data and uncertainty naturally, while FOPC requires complete knowledge and struggles with uncertainty without extensions.

</details>
---

## Scenario 8: Encoding Quantified Knowledge
**Task:** Store "There exists a state with high production (>50M lbs) in 2010" as knowledge.

<details>
<summary><strong>ANSWERS:</strong></summary>

**Tables Attempt:**
```python
# Can only store ground facts
df = pd.DataFrame({
    'state': ['CA', 'ND'],
    'year': [2010, 2010],
    'totalprod': [27500000, 45000000],
    ...
})

# Cannot store "there exists" as a fact
# Must query every time:
high_producers = df[(df['year'] == 2010) & (df['totalprod'] > 50000000)]
if len(high_producers) > 0:
    # Exists, but not stored as a fact
```

**Problems:**
- Tables can only store ground facts (specific state, specific production)
- Cannot store existential statements ("there exists") as facts
- Must query every time you want to check
- Query result is not stored knowledge, just data retrieval

**FOPC Attempt:**
```
-- Ground facts
Produced(CA, 27500000, 2010)
Produced(ND, 45000000, 2010)

-- Rule: Derive existential fact
∃s, p (Produced(s, p, 2010) ∧ p > 50000000) → ExistsHighProducer(2010)

-- Inference: ExistsHighProducer(2010) ✓ (stored as derived fact)

-- Can use in other rules:
ExistsHighProducer(y) → MarketHealthy(y)
```

**Revelation: FOPC Wins**

**Why:**
- **FOPC:** Can encode existential knowledge as a derived fact. Once `ExistsHighProducer(2010)` is inferred, it's a stored fact in the knowledge base that can be used in other rules without re-querying
- **Tables:** Can only store ground facts, cannot store "there exists" as knowledge. Must query every time, and the query result is not stored as reusable knowledge

**Key Insight:** 
- **Representation-level quantifiers (FOPC):** Quantified knowledge can be encoded as facts in the knowledge base itself
- **Query-level quantifiers (in table operations):** Quantifiers only exist in query operations, not in stored representation
- This allows FOPC to store derived quantified facts that can be reused, while tables must recompute queries each time

**Example of power:**
```
-- FOPC: Can chain quantified facts
ExistsHighProducer(2010) → MarketHealthy(2010)
MarketHealthy(2010) → GoodInvestmentYear(2010)

-- Tables: Must query each time
-- No way to store "market is healthy" as a fact derived from "exists high producer"
```

</details>
---

## Scenario 9: Causal Relationships
**Task:** "High colony count in State A causes increased production, which influences prices in neighboring states."

<details>
<summary><strong>ANSWERS:</strong></summary>

**Tables Attempt:**
```python
# Can only store correlations, not causality
# Would need a neighbors table/DataFrame
neighbors_df = pd.DataFrame({'state': ['CA'], 'neighbor': ['NV']})  # example
result = df.merge(neighbors_df, on='state').merge(
    df, left_on=['neighbor', 'year'], right_on=['state', 'year'], 
    suffixes=('_a', '_b')
)
result = result[result['numcol_a'] > 200000]
```

**Problems:**
- Only shows correlation, not causation
- Can't express "causes" or "influences" explicitly
- No way to reason about causal chains

**FOPC Attempt:**
```
Causes(HighColonies(A, y), HighProduction(A, y))
Influences(HighProduction(A, y), HighPrice(Neighbor(A), y))

Where Neighbor(A) represents neighboring states

Can reason: If HighColonies(A) then (by Rule 1) HighProduction(A), 
           then (by Rule 2) HighPrice(Neighbor(A))
```

**Revelation: FOPC Wins**

**Why:**
- FOPC: Can express causal relationships explicitly, relationships are first-class (predicates), can reason about causal chains
- Tables: Can only show correlations, not causation - relationships must be pre-computed or joined

**Key Insight:** FOPC can express causal relationships explicitly as first-class predicates, while tables can only represent correlations through data relationships.

</details>
---

## Part 3: Side-by-Side Comparison

### Exercise 3.1: The Same Problem, Two Approaches

<details>
<summary><strong>ANSWERS:</strong></summary>

**FOPC Approach:**
```
Rule 1: ∀s, y, c (HasColonies(s, c, y) ∧ c > 200000 → MajorProducer(s, y))
Rule 2: ∀s, y, p (PricePerPound(s, y, p) ∧ p > 2.0 → HighPrice(s, y))
Rule 3: ∀s, y1, y2, y3, p1, p2, p3 (
  Produced(s, p1, y1) ∧ Produced(s, p2, y2) ∧ Produced(s, p3, y3) ∧
  y2 = y1 + 1 ∧ y3 = y2 + 1 ∧
  p2 > p1 ∧ p3 > p2 → IncreasingProduction(s, y1, y3)
)

Query: MajorProducer(s, y) ∧ HighPrice(s, y) ∧ IncreasingProduction(s, y-2, y)
```

**Tables Approach:**
```python
# Filter for major producers with high prices
filtered = df[(df['numcol'] > 200000) & (df['priceperlb'] > 2.0)].copy()
filtered = filtered.sort_values(['state', 'year'])

# Calculate lagged values
filtered['prod_2_years_ago'] = filtered.groupby('state')['totalprod'].shift(2)
filtered['prod_1_year_ago'] = filtered.groupby('state')['totalprod'].shift(1)

# Find increasing production
result = filtered[
    (filtered['totalprod'] > filtered['prod_1_year_ago']) &
    (filtered['prod_1_year_ago'] > filtered['prod_2_years_ago']) &
    (filtered['prod_2_years_ago'].notna())
]
```

**Comparison:**
- **Readability:** FOPC is more explicit about logic, tables are more concise
- **Efficiency:** Tables win (optimized queries)
- **Modifiability:** FOPC wins (change rule, inference updates)
- **Explicitness:** FOPC wins (logic is explicit and declarative)

</details>
---

### Exercise 3.2: When to Use What

<details>
<summary><strong>ANSWERS:</strong></summary>

1. **"What is the average production across all states in 2010?"**
   - **Choice:** Tables
   - **Why:** Simple aggregation, built-in function, efficient

2. **"If production > 50M and price < $2, then there's oversupply"**
   - **Choice:** FOPC
   - **Why:** Rule-based reasoning, can chain with other rules, declarative

3. **"Which states had declining production every year for 5 years?"**
   - **Choice:** Tables (with window functions)
   - **Why:** Temporal analysis, efficient windowing, built-in functions

4. **"High colony count causes high production"**
   - **Choice:** FOPC
   - **Why:** Causal relationship, explicit semantics, can reason about causality

5. **"Find the correlation between price and production"**
   - **Choice:** Tables
   - **Why:** Statistical operation, built-in function, efficient

6. **"If a state is a major producer AND profitable, then it's expanding"**
   - **Choice:** FOPC
   - **Why:** Rule chaining, automatic inference, declarative

7. **"What is the standard deviation of yields?"**
   - **Choice:** Tables
   - **Why:** Statistical operation, built-in function

8. **"For all states, production must equal colonies × yield"**
   - **Choice:** FOPC (for constraint) or Tables (for validation)
   - **Why:** FOPC makes constraint explicit, Tables can validate efficiently

</details>
---

## Part 4: Reflection and Synthesis

### Question 4.1: Fundamental Trade-offs

<details>
<summary><strong>ANSWERS:</strong></summary>

**1. Expressiveness vs. Efficiency:**
- **Expressiveness worth it when:** Rules are complex, need inference, domain knowledge is central, small to medium scale
- **Efficiency critical when:** Large datasets, performance requirements, simple queries, statistical operations

**2. Declarative vs. Procedural:**
- **Declarative (FOPC) valuable when:** Rules are central, need to reason about knowledge, want automatic inference, domain experts need to understand logic
- **Procedural (Tables) better when:** Data retrieval is primary, need optimized execution, queries are straightforward, performance is critical

**3. Inference vs. Query:**
- **Inference needed when:** Want to derive new facts, rules are complex, need to chain reasoning, knowledge base is central
- **Query sufficient when:** Data retrieval is primary, facts are explicitly stored, no need for derivation, simple lookups

</details>
---

### Question 4.2: Decision Framework

<details>
<summary><strong>ANSWERS:</strong></summary>

**Decision Tree:**

```
Start: What type of reasoning?
  │
  ├─ Statistical/Aggregation? → Tables
  │
  ├─ Rule-based/Logical? → FOPC
  │
  ├─ Simple data retrieval? → Tables
  │
  ├─ Complex rule chaining? → FOPC
  │
  ├─ Large dataset (>100K records)? → Tables (unless rules are critical)
  │
  ├─ Need inference? → FOPC
  │
  └─ Need causal relationships? → FOPC
```

**Decision Matrix:**

| Criterion | FOPC | Tables |
|-----------|------|--------|
| Statistical operations | ✗ | ✓ |
| Rule chaining | ✓ | ✗ |
| Large datasets | ✗ | ✓ |
| Inference | ✓ | ✗ |
| Aggregations | ✗ | ✓ |
| Causal relationships | ✓ | ✗ |
| Performance critical | ✗ | ✓ |
| Temporal analysis | ✗ | ✓ |
| Constraint validation | ✓ | Partial |
| Missing data | ✗ | ✓ |

</details>
---

### Question 4.3: Hybrid Approaches

<details>
<summary><strong>ANSWERS:</strong></summary>

**1. What data should stay in tables?**
- Raw honey production data (state, year, production, price, colonies, yield)
- Historical time series
- Any data needed for statistical analysis
- Large datasets

**2. What knowledge should be in FOPC?**
- Domain rules: `∀s,y (HighColonies(s,y) → MajorProducer(s,y))`
- Constraints: `∀s,y,p (Produced(s,p,y) → p ≥ 0)`
- Causal relationships: `Causes(HighProduction, HighPrice)`
- Inference rules for deriving new facts

**3. How do they interact?**
- FOPC reasoner queries tables for facts
- Tables provide ground facts for FOPC reasoning
- FOPC can derive new facts that get stored back in tables
- Query planner routes queries to appropriate system

**4. When to use which?**
- **Tables:** Statistical queries, aggregations, time series, data retrieval
- **FOPC:** Rule-based queries, constraint checking, logical inference, causal reasoning

</details>
---

## Key Takeaways

By completing this classwork, you should understand:

- ✅ **FOPC fails when:** Statistical operations, large-scale queries, temporal aggregations, uncertainty
- ✅ **Tables fail when:** Complex rule chaining, causal relationships, constraint validation, inference
- ✅ **The trade-off:** Expressiveness vs. efficiency, declarative vs. procedural, inference vs. query
- ✅ **The solution:** Often use both - tables for data, FOPC for knowledge
- ✅ **Decision criteria:** Type of reasoning, query complexity, data size, performance needs
