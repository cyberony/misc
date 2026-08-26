# Homework 1, Part 2: Reasoning with Tabular Data using Pandas

## Learning Objective
Understand how different data representations enable different kinds of reasoning. Explore why tabular data (CSV/DataFrame) is particularly well-suited for certain types of questions and analyses.

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

## Instructions
1. Work in the provided `homework_tables.py` file
2. For each question in the exercises below, there is a corresponding function definition provided in `homework_tables.py`
3. Implement each function according to the question requirements
4. Run the file to test your solutions

---

## Part 1: Questions That Tabular Data Enables

### Exercise 1: Aggregation Questions (Already Implemented below)
**Task:** Answer these questions using the honey production data. For each question, explain:
- What makes this question easy to answer with tabular data?
- How would you answer this if the data were in paragraph form (natural language)?

**Questions:**
1. What was the total honey production across all states in 2010?
2. What is the average price per pound of honey across all years?
3. How many total bee colonies existed in the United States in 2005?
4. Which state has produced the most honey in total across all years?

**Reflection:** Why can you answer these questions with a single line of code? What property of tabular data makes aggregation operations natural?

**Solution:**
```python
# Question 1: Total production in 2010
def exercise1_q1():
    total_2010 = df[df['year'] == 2010]['totalprod'].sum()
    print(f"Total production in 2010: {total_2010:,.0f} lbs")
    return total_2010

# Question 2: Average price per pound
def exercise1_q2():
    avg_price = df['priceperlb'].mean()
    print(f"Average price per pound: ${avg_price:.2f}")
    return avg_price

# Question 3: Total colonies in 2005
def exercise1_q3():
    total_colonies_2005 = df[df['year'] == 2005]['numcol'].sum()
    print(f"Total colonies in 2005: {total_colonies_2005:,.0f}")
    return total_colonies_2005

# Question 4: State with most total production
def exercise1_q4():
    state_totals = df.groupby('state')['totalprod'].sum()
    top_state = state_totals.idxmax()
    top_production = state_totals.max()
    print(f"{top_state} produced the most: {top_production:,.0f} lbs total")
    return top_state, top_production
```

---

### Exercise 2: Temporal Reasoning
**Task:** Analyze trends over time and answer:

1. Is honey production increasing or decreasing over time? Show the trend.
2. How has the price per pound changed from 1998 to 2012?
3. Which year had the highest average yield per colony?
4. Is there a correlation between price and production volume? (When prices go up, does production go down?)

**Reflection:** 
- How does having a `year` column enable temporal reasoning?
- Could you answer these questions if the data were organized alphabetically by state name instead?
- What if each year's data were in a separate file? How would that change your reasoning process?

---

### Exercise 3: Comparative Reasoning
**Task:** Compare states and answer:

1. Which state has the highest yield per colony on average?
2. Compare North Dakota and California: which has more colonies? Which produces more honey? Which has better yield per colony?
3. Rank the top 5 states by total production value (prodvalue).
4. Which state has the most consistent production (lowest variance) across years?

**Reflection:**
- How does having all states in the same table make comparison easy?
- What if each state's data were in a separate document? How would comparison change?
- Why is it useful that all states have the same columns (schema)?

---

### Exercise 4: Filtering and Selection
**Task:** Answer questions that require filtering:

1. Which states produced more than 10 million pounds of honey in 2010?
2. Find all states where the price per pound exceeded $2.00 in any year.
3. Which states had fewer than 10,000 colonies in 2012?
4. Show all records where yield per colony was above 100 lbs.

**Reflection:**
- How does tabular structure make filtering operations straightforward?
- What if you had to search through paragraphs of text to find this information?
- How does having consistent column names help with filtering?

---

### Exercise 5: Multi-dimensional Queries
**Task:** Answer questions that require reasoning across multiple dimensions:

1. Which state had the highest production value (prodvalue) in the most recent year (2012)?
2. Find states where both the number of colonies AND yield per colony increased from 2011 to 2012.
3. Which state had the best "efficiency" (highest yield per colony) among states with more than 100,000 colonies?
4. Calculate the correlation between price per pound and total production across all years.

**Reflection:**
- How does having multiple columns in the same row enable multi-dimensional reasoning?
- What makes it easy to combine conditions (e.g., "high colonies AND high yield")?
- How would you answer these if data were in separate tables for each dimension?

---

## Submission Requirements

1. **File:** `homework_tables.py` containing all required functions
2. **Testing:** Your code should work correctly with the honey production data
3. **Output:** When `python homework_tables.py` is run, it should execute all exercises and print results

---

## Grading Criteria

| Criterion | Points | Description |
|-----------|--------|-------------|
| Exercise 1, Question 1 |  | (Already implemented) |
| Exercise 1, Question 2 |  | (Already implemented) |
| Exercise 1, Question 3 |  | (Already implemented) |
| Exercise 1, Question 4 |  | (Already implemented) |
| Exercise 2, Question 1 | 0.5 | Correctly analyzes production trend over time |
| Exercise 2, Question 2 | 0.5 | Correctly calculates price change from 1998 to 2012 |
| Exercise 2, Question 3 | 0.5 | Correctly identifies year with highest average yield |
| Exercise 2, Question 4 | 0.5 | Correctly calculates correlation between price and production |
| Exercise 3, Question 1 | 0.5 | Correctly identifies state with highest yield per colony |
| Exercise 3, Question 2 | 0.5 | Correctly compares North Dakota and California |
| Exercise 3, Question 3 | 0.5 | Correctly ranks top 5 states by production value |
| Exercise 3, Question 4 | 0.5 | Correctly identifies state with most consistent production |
| Exercise 4, Question 1 | 0.5 | Correctly filters states with >10M lbs in 2010 |
| Exercise 4, Question 2 | 0.5 | Correctly finds states with price >$2.00 |
| Exercise 4, Question 3 | 0.5 | Correctly filters states with <10K colonies in 2012 |
| Exercise 4, Question 4 | 0.5 | Correctly filters records with yield >100 lbs |
| Exercise 5, Question 1 | 0.5 | Correctly identifies state with highest production value in 2012 |
| Exercise 5, Question 2 | 0.5 | Correctly finds states with increased colonies AND yield |
| Exercise 5, Question 3 | 0.5 | Correctly finds best efficiency among large producers |
| Exercise 5, Question 4 | 0.5 | Correctly calculates correlation between price and production |
| **Total** | **8** | |

---
