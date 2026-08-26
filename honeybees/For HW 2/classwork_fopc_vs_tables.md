# Classwork: Comparing FOPC and Tables

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

> **ANSWERS:**
> 
> **FOPC Attempt:**
> To express correlation in FOPC, you'd need:
> ```
> Correlation(numcol, totalprod, r) ↔
>   Mean(numcol, mean_col) ∧
>   Mean(totalprod, mean_prod) ∧
>   Covariance(numcol, totalprod, cov) ∧
>   StdDev(numcol, std_col) ∧
>   StdDev(totalprod, std_prod) ∧
>   r = cov / (std_col × std_prod)
> ```
> 
> But each of these (Mean, Covariance, StdDev) requires:
> - Summing all values (requires recursive definition or explicit enumeration)
> - Counting all values
> - Computing differences from mean for each value
> - This becomes extremely verbose and computationally expensive
> 
> **Tables Attempt:**
> ```python
> import pandas as pd
> correlation = df['numcol'].corr(df['totalprod'])
> ```
> 
> **Revelation: Tables Win**
> 
> **Why:**
> - Tables: One line of code - built-in statistical function, optimized numeric operations
> - FOPC: Would require extensive axiomatization of arithmetic operations, extremely verbose
> 
> **Key Insight:** Statistical operations are natural in tables but awkward in FOPC because FOPC lacks built-in numeric/statistical functions.

---

## Scenario 2: Complex Rule Chaining
**Task:** Chain three rules to find "Which states are expanding?"

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 3: Large-Scale Query Performance
**Task:** 1000 states × 100 years = 100,000 records. Find "Which states had production above the median in each year?"

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 4: Constraint Validation
**Task:** Validate: "For every state and year, if production > 50M AND colonies < 100K, then there must be an error."

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 5: Temporal Aggregation
**Task:** "What is the 5-year moving average of production for each state?"

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 6: Deriving New Facts from Rules
**Task:** Automatically identify all major producers without explicitly storing this fact.

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 7: Missing Data and Uncertainty
**Task:** "State X probably has high production, but we're not certain because data is incomplete."

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 8: Encoding Quantified Knowledge
**Task:** Store "There exists a state with high production (>50M lbs) in 2010" as knowledge.

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Scenario 9: Causal Relationships
**Task:** "High colony count in State A causes increased production, which influences prices in neighboring states."

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Part 3: Side-by-Side Comparison

### Exercise 3.1: The Same Problem, Two Approaches

> **ANSWERS:**
> 
> **FOPC Approach:**
> ```
> Rule 1: ∀s, y, c (HasColonies(s, c, y) ∧ c > 200000 → MajorProducer(s, y))
> Rule 2: ∀s, y, p (PricePerPound(s, y, p) ∧ p > 2.0 → HighPrice(s, y))
> Rule 3: ∀s, y1, y2, y3, p1, p2, p3 (
>   Produced(s, p1, y1) ∧ Produced(s, p2, y2) ∧ Produced(s, p3, y3) ∧
>   y2 = y1 + 1 ∧ y3 = y2 + 1 ∧
>   p2 > p1 ∧ p3 > p2 → IncreasingProduction(s, y1, y3)
> )
> 
> Query: MajorProducer(s, y) ∧ HighPrice(s, y) ∧ IncreasingProduction(s, y-2, y)
> ```
> 
> **Tables Approach:**
> ```python
> # Filter for major producers with high prices
> filtered = df[(df['numcol'] > 200000) & (df['priceperlb'] > 2.0)].copy()
> filtered = filtered.sort_values(['state', 'year'])
> 
> # Calculate lagged values
> filtered['prod_2_years_ago'] = filtered.groupby('state')['totalprod'].shift(2)
> filtered['prod_1_year_ago'] = filtered.groupby('state')['totalprod'].shift(1)
> 
> # Find increasing production
> result = filtered[
>     (filtered['totalprod'] > filtered['prod_1_year_ago']) &
>     (filtered['prod_1_year_ago'] > filtered['prod_2_years_ago']) &
>     (filtered['prod_2_years_ago'].notna())
> ]
> ```
> 
> **Comparison:**
> - **Readability:** FOPC is more explicit about logic, tables are more concise
> - **Efficiency:** Tables win (optimized queries)
> - **Modifiability:** FOPC wins (change rule, inference updates)
> - **Explicitness:** FOPC wins (logic is explicit and declarative)

---

### Exercise 3.2: When to Use What

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Part 4: Reflection and Synthesis

### Question 4.1: Fundamental Trade-offs

> **ANSWERS:**
> 
> **1. Expressiveness vs. Efficiency:**
> - **Expressiveness worth it when:** Rules are complex, need inference, domain knowledge is central, small to medium scale
> - **Efficiency critical when:** Large datasets, performance requirements, simple queries, statistical operations
> 
> **2. Declarative vs. Procedural:**
> - **Declarative (FOPC) valuable when:** Rules are central, need to reason about knowledge, want automatic inference, domain experts need to understand logic
> - **Procedural (Tables) better when:** Data retrieval is primary, need optimized execution, queries are straightforward, performance is critical
> 
> **3. Inference vs. Query:**
> - **Inference needed when:** Want to derive new facts, rules are complex, need to chain reasoning, knowledge base is central
> - **Query sufficient when:** Data retrieval is primary, facts are explicitly stored, no need for derivation, simple lookups

---

### Question 4.2: Decision Framework

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

### Question 4.3: Hybrid Approaches

> **ANSWERS:**
> 
>
> 
> ```
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> 
> ```
---

## Key Takeaways

By completing this classwork, you should understand:

- ✅ **FOPC fails when:** Statistical operations, large-scale queries, temporal aggregations, uncertainty
- ✅ **Tables fail when:** Complex rule chaining, causal relationships, constraint validation, inference
- ✅ **The trade-off:** Expressiveness vs. efficiency, declarative vs. procedural, inference vs. query
- ✅ **The solution:** Often use both - tables for data, FOPC for knowledge
- ✅ **Decision criteria:** Type of reasoning, query complexity, data size, performance needs
