# Homework 1, Part 2: Reasoning with Tabular Data using Pandas - Solutions

## Learning Objective
Understand how different data representations enable different kinds of reasoning. Explore why tabular data (CSV/DataFrame) is particularly well-suited for certain types of questions and analyses.

**Note:** All code solutions are available in `homework_tables_solutions.py`. Run that file to execute all solutions.

**Function Definitions:** For each question in the exercises below, there is a corresponding implemented function definition in `homework_tables_solutions.py`. Each function is named following the pattern `exercise{N}_q{M}()` where N is the exercise number and M is the question number (e.g., `exercise1_q1()`, `exercise2_q3()`, etc.).

---

## Tips

1. **Load data with pandas:**
   ```python
   import pandas as pd
   df = pd.read_csv('honeyproduction.csv')
   ```

2. **Filter data:**
   ```python
   df_2010 = df[df['year'] == 2010]
   ```

3. **Aggregate data:**
   ```python
   total = df['totalprod'].sum()
   average = df['priceperlb'].mean()
   ```

4. **Group by:**
   ```python
   yearly = df.groupby('year')['totalprod'].sum()
   state_avg = df.groupby('state')['yieldpercol'].mean()
   ```

5. **Combine conditions:**
   ```python
   filtered = df[(df['year'] == 2010) & (df['totalprod'] > 10000000)]
   ```

---

## Getting Started

1. Install pandas: `pip install pandas`
2. Load the honey production CSV file
3. Start with Exercise 1 - these are the simplest aggregation questions
4. Work through each exercise in order
5. For each question, write code, run it, and reflect (in your mind) on why tabular data makes it easy

---

## Part 1: Questions That Tabular Data Enables

### Exercise 1: Aggregation Questions

**Question 1: What was the total honey production across all states in 2010?**

> **SOLUTION:**
> ```python
> total_2010 = df[df['year'] == 2010]['totalprod'].sum()
> print(f"Total production in 2010: {total_2010:,.0f} lbs")
> ```
> **Answer:** Approximately **141-142 million lbs**
> 
> **What makes this easy:** All 2010 data is in one column (`year`), easy to filter. All production values are in one column (`totalprod`), easy to sum. Tabular structure allows a single aggregation operation.
> 
> **If data were in paragraphs:** You'd need to read through all text, identify 2010 mentions, extract production numbers, and manually sum them - very time-consuming and error-prone.

**Question 2: What is the average price per pound of honey across all years?**

> **SOLUTION:**
> ```python
> avg_price = df['priceperlb'].mean()
> print(f"Average price per pound: ${avg_price:.2f}")
> ```
> **Answer:** Approximately **$1.20-$1.30 per pound**
> 
> **What makes this easy:** All prices in one column, single aggregation function. No need to parse different formats or units. Built-in statistical functions work directly.

**Question 3: How many total bee colonies existed in the United States in 2005?**

> **SOLUTION:**
> ```python
> total_colonies_2005 = df[df['year'] == 2005]['numcol'].sum()
> print(f"Total colonies in 2005: {total_colonies_2005:,.0f}")
> ```
> **Answer:** Approximately **2.4-2.5 million colonies**

**Question 4: Which state has produced the most honey in total across all years?**

> **SOLUTION:**
> ```python
> state_totals = df.groupby('state')['totalprod'].sum()
> top_state = state_totals.idxmax()
> top_production = state_totals.max()
> print(f"{top_state} produced the most: {top_production:,.0f} lbs total")
> ```
> **Answer:** **North Dakota (ND)** - approximately 400+ million lbs across all years

**Reflection:** Why can you answer these questions with a single line of code? What property of tabular data makes aggregation operations natural?

> **SOLUTION:**
> 
> **Single-line queries possible because:**
> 1. **Uniform structure:** All rows have the same columns, enabling consistent operations
> 2. **Columnar organization:** Related values are in the same column, enabling vectorized operations
> 3. **Built-in aggregation:** Tables have optimized aggregation functions (sum, mean, count, max, min)
> 4. **Filtering + aggregation:** Can combine filter conditions with aggregations in one operation
> 
> **Properties that make aggregation natural:**
> - **Homogeneity:** All values in a column are the same type (numeric, text, date)
> - **Regularity:** Every row has the same structure
> - **Vectorization:** Operations can be applied to entire columns at once
> - **Indexing:** Can efficiently filter and group by any column

---

### Exercise 2: Temporal Reasoning

**Question 1: Is honey production increasing or decreasing over time? Show the trend.**

> **SOLUTION:**
> ```python
> yearly_production = df.groupby('year')['totalprod'].sum()
> print(yearly_production)
> 
> # Calculate trend
> first_year = yearly_production.iloc[0]
> last_year = yearly_production.iloc[-1]
> change_pct = ((last_year - first_year) / first_year) * 100
> 
> if change_pct < 0:
>     print("Trend: DECREASING")
> else:
>     print("Trend: INCREASING")
> ```
> **Answer:** Production is **DECREASING** over time. From ~220M lbs in 1998 to ~141M lbs in 2012 (approximately **36% decline**).

**Question 2: How has the price per pound changed from 1998 to 2012?**

> **SOLUTION:**
> ```python
> price_1998 = df[df['year'] == 1998]['priceperlb'].mean()
> price_2012 = df[df['year'] == 2012]['priceperlb'].mean()
> change = ((price_2012 - price_1998) / price_1998) * 100
> 
> print(f"Price in 1998: ${price_1998:.2f}")
> print(f"Price in 2012: ${price_2012:.2f}")
> print(f"Change: {change:.1f}%")
> ```
> **Answer:** Price **INCREASED dramatically** from ~$0.83/lb in 1998 to ~$2.37/lb in 2012 (approximately **185% increase**).

**Question 3: Which year had the highest average yield per colony?**

> **SOLUTION:**
> ```python
> yearly_yield = df.groupby('year')['yieldpercol'].mean()
> best_year = yearly_yield.idxmax()
> best_yield = yearly_yield.max()
> print(f"Year {best_year} had highest average yield: {best_yield:.1f} lbs/colony")
> ```
> **Answer:** **1998 or 1999** had the highest average yield (approximately 70-75 lbs per colony). Yield has generally **decreased over time**.

**Question 4: Is there a correlation between price and production volume?**

> **SOLUTION:**
> ```python
> # Yearly correlation (more meaningful)
> yearly_avg_price = df.groupby('year')['priceperlb'].mean()
> yearly_total_prod = df.groupby('year')['totalprod'].sum()
> yearly_corr = yearly_avg_price.corr(yearly_total_prod)
> 
> print(f"Yearly correlation: {yearly_corr:.3f}")
> ```
> **Answer:** There is a **NEGATIVE correlation** (approximately -0.6 to -0.8). As prices increase, total production decreases. This suggests supply and demand dynamics.

**Reflection:** 
- How does having a `year` column enable temporal reasoning?
- Could you answer these questions if the data were organized alphabetically by state name instead?
- What if each year's data were in a separate file?

> **SOLUTION:**
> 
> **Year column enables temporal reasoning:**
> - **Time as a dimension:** Year is a first-class attribute that can be used for grouping, filtering, and ordering
> - **Temporal queries:** Can ask "what happened in year X?" or "how did Y change over time?"
> - **Trend analysis:** Can aggregate by year to see patterns
> 
> **If organized alphabetically by state:** Harder but still possible. You'd need to filter by year first, then aggregate. The year column still exists, just the row order changes.
> 
> **If each year in separate file:** Much harder. Would need to load multiple files, concatenate data, more complex code. Temporal reasoning becomes a file management problem.

---

### Exercise 3: Comparative Reasoning

**Question 1: Which state has the highest yield per colony on average?**

> **SOLUTION:**
> ```python
> state_avg_yield = df.groupby('state')['yieldpercol'].mean()
> top_yield_state = state_avg_yield.idxmax()
> top_yield_value = state_avg_yield.max()
> print(f"{top_yield_state} has highest average yield: {top_yield_value:.1f} lbs/colony")
> ```
> **Answer:** **Hawaii (HI)** typically has the highest yield per colony (often 90-120 lbs/colony)

**Question 2: Compare North Dakota and California**

> **SOLUTION:**
> ```python
> nd_ca = df[df['state'].isin(['ND', 'CA'])]
> 
> colonies = nd_ca.groupby('state')['numcol'].mean()
> production = nd_ca.groupby('state')['totalprod'].mean()
> yield_comp = nd_ca.groupby('state')['yieldpercol'].mean()
> 
> print("Colonies:", colonies)
> print("Production:", production)
> print("Yield:", yield_comp)
> ```
> **Answer:** 
> - **Colonies:** North Dakota typically has more colonies (400K-500K) than California (350K-450K)
> - **Production:** North Dakota produces more honey (30M-46M lbs) than California (11M-32M lbs) in recent years
> - **Yield:** North Dakota has better yield per colony (70-90 lbs) than California (35-75 lbs)

**Question 3: Rank the top 5 states by total production value (prodvalue)**

> **SOLUTION:**
> ```python
> state_prodvalue = df.groupby('state')['prodvalue'].sum()
> top_5 = state_prodvalue.nlargest(5)
> print("Top 5 states by total production value:")
> print(top_5)
> ```
> **Answer:** Typically:
> 1. North Dakota (ND)
> 2. California (CA)
> 3. South Dakota (SD)
> 4. Florida (FL)
> 5. Montana (MT) or Minnesota (MN)

**Question 4: Which state has the most consistent production (lowest variance)?**

> **SOLUTION:**
> ```python
> state_variance = df.groupby('state')['totalprod'].var()
> most_consistent = state_variance.idxmin()
> least_variance = state_variance.min()
> print(f"{most_consistent} has most consistent production (variance: {least_variance:,.0f})")
> ```
> **Answer:** Smaller states with stable production, such as **Vermont, Maine**, or other states with consistent small-scale production.

**Reflection:**
- How does having all states in the same table make comparison easy?
- What if each state's data were in a separate document?
- Why is it useful that all states have the same columns (schema)?

> **SOLUTION:**
> 
> **Same table enables easy comparison:**
> - **Direct comparison:** Can filter by state and compare values side-by-side
> - **Consistent operations:** Same aggregation functions work for all states
> - **Grouping:** Can group by state and apply same operations to all
> - **Ranking:** Can rank all states using same metric
> 
> **If each state in separate document:** Much harder. Would need to load multiple files, extract values manually, no direct operations like groupby or ranking.
> 
> **Same schema is crucial:** All states have same attributes, enabling direct comparison. Operations work universally. No data transformation needed.

---

### Exercise 4: Filtering and Selection

**Question 1: Which states produced more than 10 million pounds of honey in 2010?**

> **SOLUTION:**
> ```python
> high_producers_2010 = df[(df['year'] == 2010) & (df['totalprod'] > 10000000)]
> states = sorted(high_producers_2010['state'].unique())
> print(f"States with >10M lbs in 2010: {states}")
> ```
> **Answer:** Typically includes **CA, ND, SD, FL, MT, MN, TX**, and a few others.

**Question 2: Find all states where the price per pound exceeded $2.00 in any year**

> **SOLUTION:**
> ```python
> high_price = df[df['priceperlb'] > 2.00]
> states_high_price = sorted(high_price['state'].unique())
> print(f"States with price >$2.00 in any year: {states_high_price}")
> ```
> **Answer:** Many states, especially in later years (2010-2012). States like **VT, VA, HI, IL, NC, NV** often have high prices.

**Question 3: Which states had fewer than 10,000 colonies in 2012?**

> **SOLUTION:**
> ```python
> small_2012 = df[(df['year'] == 2012) & (df['numcol'] < 10000)]
> states_small = sorted(small_2012['state'].unique())
> print(f"States with <10K colonies in 2012: {states_small}")
> ```
> **Answer:** Smaller states like **KY, ME, NV, VT, WV**

**Question 4: Show all records where yield per colony was above 100 lbs**

> **SOLUTION:**
> ```python
> high_yield = df[df['yieldpercol'] > 100]
> print(f"Found {len(high_yield)} records with yield >100 lbs/colony")
> print(high_yield[['state', 'year', 'yieldpercol', 'totalprod']])
> ```
> **Answer:** Several records, often from states like **HI, LA, MS, MT** in certain years.

**Reflection:**
- How does tabular structure make filtering operations straightforward?
- What if you had to search through paragraphs of text?
- How does having consistent column names help with filtering?

> **SOLUTION:**
> 
> **Tabular structure makes filtering straightforward:**
> - **Boolean indexing:** Can use simple conditions (column == value, column > value)
> - **Multiple conditions:** Can combine with AND (&), OR (|), NOT (~)
> - **Vectorized operations:** Filtering is fast and efficient
> - **Consistent syntax:** Same filtering approach works for all columns
> 
> **If searching paragraphs:** Very slow, error-prone, would need to parse text, very manual and time-consuming.
> 
> **Consistent column names enable:** Predictable queries, reusable code, documentation of available data, type safety, efficiency.

---

### Exercise 5: Multi-dimensional Queries

**Question 1: Which state had the highest production value in 2012?**

> **SOLUTION:**
> ```python
> df_2012 = df[df['year'] == 2012]
> top_state_2012 = df_2012.loc[df_2012['prodvalue'].idxmax()]
> print(f"{top_state_2012['state']} had highest production value in 2012: ${top_state_2012['prodvalue']:,.0f}")
> ```
> **Answer:** **North Dakota (ND)** - approximately $63-64 million in 2012

**Question 2: Find states where both colonies AND yield increased from 2011 to 2012**

> **SOLUTION:**
> ```python
> df_2011 = df[df['year'] == 2011].set_index('state')
> df_2012 = df[df['year'] == 2012].set_index('state')
> 
> common_states = df_2011.index.intersection(df_2012.index)
> increased = []
> for state in common_states:
>     colonies_up = df_2012.loc[state, 'numcol'] > df_2011.loc[state, 'numcol']
>     yield_up = df_2012.loc[state, 'yieldpercol'] > df_2011.loc[state, 'yieldpercol']
>     if colonies_up and yield_up:
>         increased.append(state)
> 
> print(f"States with increased colonies AND yield: {increased}")
> ```
> **Answer:** Typically a small number of states that had recovery or growth.

**Question 3: Best efficiency (highest yield) among states with >100K colonies**

> **SOLUTION:**
> ```python
> large_producers = df[df['numcol'] > 100000]
> best_efficiency = large_producers.loc[large_producers['yieldpercol'].idxmax()]
> print(f"{best_efficiency['state']} in {best_efficiency['year']} had best efficiency: {best_efficiency['yieldpercol']:.1f} lbs/colony")
> ```
> **Answer:** States like **Montana, North Dakota, or South Dakota** in certain years, with yields of **90-120+ lbs/colony**.

**Question 4: Correlation between price per pound and total production**

> **SOLUTION:**
> ```python
> yearly = df.groupby('year').agg({'priceperlb': 'mean', 'totalprod': 'sum'})
> yearly_corr = yearly['priceperlb'].corr(yearly['totalprod'])
> print(f"Yearly correlation: {yearly_corr:.3f}")
> ```
> **Answer:** **Negative correlation** (approximately -0.6 to -0.8), indicating inverse relationship between price and production volume.

**Reflection:**
- How does having multiple columns in the same row enable multi-dimensional reasoning?
- What makes it easy to combine conditions (e.g., "high colonies AND high yield")?
- How would you answer these if data were in separate tables for each dimension?

> **SOLUTION:**
> 
> **Multiple columns in same row enable:**
> - **Joint conditions:** Can filter on multiple attributes simultaneously
> - **Cross-dimensional queries:** Can ask "which states have high X AND high Y?"
> - **Efficiency:** All related data in one place, no joins needed
> - **Atomic facts:** Each row represents a complete observation
> 
> **Combining conditions is easy:**
> - **Boolean operators:** Simple AND (&), OR (|), NOT (~)
> - **Vectorized:** Operations work on entire columns
> - **Readable:** Code reads like natural language
> 
> **If data in separate tables:** Requires joins, more complex queries, slower performance. Still possible but more complex.

---
