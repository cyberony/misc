# FOPC vs. Tables: Proof of Concept
## Identifying Major Producers Through Inference

**Goal:** Demonstrate how the same logical inference can be performed using FOPC (First-Order Predicate Calculus) and tabular data, comparing the ease and naturalness of each approach.

**Rule:** "If a state has more than 100,000 colonies, it is a major producer"

---

## Scenario Setup

We want to identify which states are "major producers" based on the rule that states with more than 100,000 colonies are considered major producers.

**Sample Data (Year 2010):**
- California (CA): 250,000 colonies
- North Dakota (ND): 500,000 colonies  
- South Dakota (SD): 280,000 colonies
- Florida (FL): 230,000 colonies
- Texas (TX): 120,000 colonies
- Montana (MT): 115,000 colonies
- Minnesota (MN): 140,000 colonies
- Idaho (ID): 95,000 colonies
- Wisconsin (WI): 60,000 colonies
- Michigan (MI): 55,000 colonies

---

## Approach 1: FOPC Representation and Inference

### Step 1: Represent Data in FOPC

First, we represent the facts about colony counts in FOPC notation:

```
HasColonies(CA, 250000, 2010)
HasColonies(ND, 500000, 2010)
HasColonies(SD, 280000, 2010)
HasColonies(FL, 230000, 2010)
HasColonies(TX, 120000, 2010)
HasColonies(MT, 115000, 2010)
HasColonies(MN, 140000, 2010)
HasColonies(ID, 95000, 2010)
HasColonies(WI, 60000, 2010)
HasColonies(MI, 55000, 2010)
```

### Step 2: Express the Rule in FOPC

The rule "If a state has more than 100,000 colonies, it is a major producer" is expressed as:

```
∀s, y, c (HasColonies(s, c, y) ∧ c > 100000 → MajorProducer(s, y))
```

**Read as:** "For all states s, years y, and colony counts c: if state s has c colonies in year y, and c is greater than 100,000, then s is a major producer in year y."

### Step 3: Perform FOPC Inference

Using **Modus Ponens** (if P → Q and P is true, then Q is true), we can infer major producers:

**Inference for California:**
1. Rule instance: `HasColonies(CA, 250000, 2010) ∧ 250000 > 100000 → MajorProducer(CA, 2010)`
2. Premise: `HasColonies(CA, 250000, 2010)` ✓ (given)
3. Premise: `250000 > 100000` ✓ (arithmetic)
4. **Conclusion:** `MajorProducer(CA, 2010)` ✓

**Inference for North Dakota:**
1. Rule instance: `HasColonies(ND, 500000, 2010) ∧ 500000 > 100000 → MajorProducer(ND, 2010)`
2. Premise: `HasColonies(ND, 500000, 2010)` ✓
3. Premise: `500000 > 100000` ✓
4. **Conclusion:** `MajorProducer(ND, 2010)` ✓

**Inference for Idaho:**
1. Rule instance: `HasColonies(ID, 95000, 2010) ∧ 95000 > 100000 → MajorProducer(ID, 2010)`
2. Premise: `HasColonies(ID, 95000, 2010)` ✓
3. Premise: `95000 > 100000` ✗ (false)
4. **Conclusion:** Cannot infer `MajorProducer(ID, 2010)` (premise is false)

### Step 4: Complete Inference Results

By applying the rule to all states, we derive:

```
MajorProducer(CA, 2010)    ✓ (250,000 > 100,000)
MajorProducer(ND, 2010)    ✓ (500,000 > 100,000)
MajorProducer(SD, 2010)    ✓ (280,000 > 100,000)
MajorProducer(FL, 2010)    ✓ (230,000 > 100,000)
MajorProducer(TX, 2010)    ✓ (120,000 > 100,000)
MajorProducer(MT, 2010)    ✓ (115,000 > 100,000)
MajorProducer(MN, 2010)    ✓ (140,000 > 100,000)
MajorProducer(ID, 2010)    ✗ (95,000 ≤ 100,000)
MajorProducer(WI, 2010)    ✗ (60,000 ≤ 100,000)
MajorProducer(MI, 2010)    ✗ (55,000 ≤ 100,000)
```

### Step 5: Automated FOPC Reasoning

In a FOPC reasoner, this inference can be automated:

```prolog
% Prolog-style FOPC reasoning
major_producer(State, Year) :-
    has_colonies(State, Colonies, Year),
    Colonies > 100000.

% Facts
has_colonies(ca, 250000, 2010).
has_colonies(nd, 500000, 2010).
has_colonies(sd, 280000, 2010).
has_colonies(fl, 230000, 2010).
has_colonies(tx, 120000, 2010).
has_colonies(mt, 115000, 2010).
has_colonies(mn, 140000, 2010).
has_colonies(id, 95000, 2010).
has_colonies(wi, 60000, 2010).
has_colonies(mi, 55000, 2010).

% Query: ?- major_producer(State, 2010).
% Returns: ca, nd, sd, fl, tx, mt, mn
```

**Key Characteristics of FOPC Approach:**
- ✅ Rule is explicit and declarative
- ✅ Inference is automatic (reasoner applies rule)
- ✅ Can derive new facts not explicitly stored
- ✅ Formal semantics (precise meaning)
- ⚠️ Requires a reasoner/theorem prover
- ⚠️ More verbose for simple queries

---

## Approach 2: Table-Based Inference

### Step 1: Data in Tabular Format

The same data is naturally represented as a table:

| state | year | numcol | totalprod |
|-------|------|--------|-----------|
| CA    | 2010 | 250000 | 27500000  |
| ND    | 2010 | 500000 | 45000000  |
| SD    | 2010 | 280000 | 28000000  |
| FL    | 2010 | 230000 | 23000000  |
| TX    | 2010 | 120000 | 12000000  |
| MT    | 2010 | 115000 | 11500000  |
| MN    | 2010 | 140000 | 14000000  |
| ID    | 2010 | 95000  | 9500000   |
| WI    | 2010 | 60000  | 6000000   |
| MI    | 2010 | 55000  | 5500000   |

### Step 2: Express the Rule as a Query

The rule "If a state has more than 100,000 colonies, it is a major producer" becomes a **filter condition**:

**SQL:**
```sql
SELECT state, year, numcol
FROM honey
WHERE year = 2010 
  AND numcol > 100000;
```

**Pandas:**
```python
major_producers = df[
    (df['year'] == 2010) & 
    (df['numcol'] > 100000)
][['state', 'year', 'numcol']]
```

### Step 3: Execute the Query

**SQL Result:**
| state | year | numcol |
|-------|------|--------|
| CA    | 2010 | 250000 |
| ND    | 2010 | 500000 |
| SD    | 2010 | 280000 |
| FL    | 2010 | 230000 |
| TX    | 2010 | 120000 |
| MT    | 2010 | 115000 |
| MN    | 2010 | 140000 |

**Pandas Result:**
```
   state  year   numcol
0     CA  2010   250000
1     ND  2010   500000
2     SD  2010   280000
3     FL  2010   230000
4     TX  2010   120000
5     MT  2010   115000
6     MN  2010   140000
```

### Step 4: Add Derived Column (Optional)

If we want to explicitly store "major producer" status:

**SQL:**
```sql
SELECT 
    state, 
    year, 
    numcol,
    CASE 
        WHEN numcol > 100000 THEN 'Yes' 
        ELSE 'No' 
    END AS is_major_producer
FROM honey
WHERE year = 2010;
```

**Pandas:**
```python
df_2010 = df[df['year'] == 2010].copy()
df_2010['is_major_producer'] = df_2010['numcol'] > 100000
```

**Key Characteristics of Table Approach:**
- ✅ Direct and intuitive
- ✅ Efficient execution (optimized by database/pandas)
- ✅ Easy to understand and modify
- ✅ No special reasoner needed
- ⚠️ Rule is implicit in query (not stored as knowledge)
- ⚠️ Can't automatically derive new facts (must write query)

---

## Side-by-Side Comparison

### Expressing the Rule

| Aspect | FOPC | Tables |
|--------|------|--------|
| **Rule representation** | `∀s,y,c (HasColonies(s,c,y) ∧ c>100000 → MajorProducer(s,y))` | `WHERE numcol > 100000` |
| **Type** | Declarative (what is true) | Procedural (how to find) |
| **Stored as** | First-class knowledge | Query condition |
| **Readability** | Formal, precise | Intuitive, direct |

### Performing Inference

| Aspect | FOPC | Tables |
|--------|------|--------|
| **Method** | Logical inference (Modus Ponens) | Filter/query execution |
| **Automation** | Automatic (reasoner applies rule) | Manual (must write query) |
| **New facts** | Can derive facts not in database | Only retrieves existing data |
| **Efficiency** | Can be slow (theorem proving) | Fast (optimized queries) |

### Code Complexity

**FOPC (Prolog-style):**
```prolog
major_producer(State, Year) :-
    has_colonies(State, Colonies, Year),
    Colonies > 100000.
```
- 3 lines
- Rule is reusable
- Automatic inference

**Tables (SQL):**
```sql
SELECT state, year 
FROM honey 
WHERE year = 2010 AND numcol > 100000;
```
- 3 lines
- Query must be written each time
- Direct execution

**Tables (Pandas):**
```python
major_producers = df[(df['year'] == 2010) & (df['numcol'] > 100000)]
```
- 1 line
- Query must be written each time
- Direct execution

### When to Use Each

**Use FOPC when:**
- ✅ Rules are complex and need to be chained
- ✅ You need to derive new facts automatically
- ✅ Rules are central to the system (knowledge base)
- ✅ You need formal semantics and provability
- ✅ Domain is small enough for reasoning to be tractable

**Use Tables when:**
- ✅ Data retrieval is the primary operation
- ✅ Performance is critical
- ✅ Rules are simple filter conditions
- ✅ You need statistical/aggregation operations
- ✅ Data is large

---

## Pedagogical Observations

### What This Demonstrates

1. **Same Logical Operation, Different Representations**
   - Both approaches identify states with >100,000 colonies
   - FOPC: Declarative rule + automatic inference
   - Tables: Procedural query + direct execution

2. **Trade-offs in Expressiveness**
   - FOPC makes the rule explicit and reusable
   - Tables embed the rule in the query (implicit)

3. **Trade-offs in Efficiency**
   - Tables are optimized for fast queries
   - FOPC reasoning can be computationally expensive

4. **When Each Shines**
   - **FOPC:** Complex rule-based reasoning, knowledge bases
   - **Tables:** Data analysis, aggregations, large datasets

### Key Insight

The **same logical inference** can be performed in both representations, but:
- **FOPC** treats it as **knowledge** (rule + facts → inference)
- **Tables** treat it as **computation** (query → result)

This fundamental difference affects:
- How you think about the problem
- What operations are natural
- What systems you need
- When each approach is appropriate

---

## Extending the Example

### More Complex Rule: "Major producers with declining production are at risk"

**FOPC:**
```
∀s, y1, y2, p1, p2 (
    MajorProducer(s, y1) ∧ 
    MajorProducer(s, y2) ∧ 
    y2 = y1 + 1 ∧
    Produced(s, p1, y1) ∧ 
    Produced(s, p2, y2) ∧ 
    p2 < p1 
    → AtRisk(s, y2)
)
```

**Tables (SQL):**
```sql
WITH production_changes AS (
    SELECT 
        state,
        year,
        totalprod,
        LAG(totalprod) OVER (PARTITION BY state ORDER BY year) as prev_prod
    FROM honey
    WHERE numcol > 100000
)
SELECT state, year
FROM production_changes
WHERE prev_prod IS NOT NULL 
  AND totalprod < prev_prod;
```

**Observation:** As rules become more complex, FOPC's declarative nature becomes more valuable, while SQL requires more complex query construction.

---

## Conclusion

This proof-of-concept demonstrates that:

1. ✅ **Both FOPC and tables can perform the same logical inference**
2. ✅ **FOPC is more declarative** (rule as knowledge)
3. ✅ **Tables are more procedural** (rule as query)
4. ✅ **Tables are more efficient** for simple queries
5. ✅ **FOPC enables automatic inference** and rule chaining
6. ✅ **The choice depends on:** complexity, performance needs, and reasoning requirements

**For pedagogical purposes:** This comparison helps students understand that representation choice affects not just *what* you can express, but *how naturally* you can express it and *how efficiently* you can reason about it.






