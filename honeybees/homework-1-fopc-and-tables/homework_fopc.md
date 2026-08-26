# Homework 1, Part 1: FOPC Encoding and Inference with pyDatalog

## Learning Objective
Use *pyDatalog* to encode honey production data as FOPC facts and rules, then perform logical inference. This assignment builds on the classwork where you manually encoded facts and rules, but now you'll use a real inference engine. You find pyDatalog documentation [here](https://sites.google.com/site/pydatalog/home?authuser=0).

---

## Tips

1. **Import pyDatalog correctly:**
   ```python
   from pyDatalog import pyDatalog
   pyDatalog.create_terms('HasColonies, Produced, ...')
   ```

2. **Variable names must be uppercase:**
   - In pyDatalog, variables used in queries and rules must be uppercase (S, Y, C, etc.)
   - Lowercase variables (s, y, c) will not work for queries
   - Example: `MajorProducer(S, Y) <= HasColonies(S, C, Y)` ✓
   - Example: `MajorProducer(s, y) <= HasColonies(s, c, y)` ✗

3. **Assert facts:**
   ```python
   + HasColonies('CA', 410000, 2010)
   ```

4. **Define rules:**
   ```python
   MajorProducer(S, Y) <= HasColonies(S, C, Y) & (C > 200000)
   ```

5. **Query with inference:**
   ```python
   result = MajorProducer(S, 2010)  # Returns list of tuples
   ```

6. **Handle results:**
   - Query results are Query objects, access `.data` to get list of tuples: `[('CA',), ('ND',)]`
   - Extract state codes: `[state[0] for state in result.data]`

---

## Getting Started

1. Install pyDatalog: `pip install pyDatalog`
2. Open `homework_fopc.py` and start implementing
3. Start with `load_honey_data()` - get the data loading first
4. Then implement `encode_facts_to_pydatalog()` - encode one predicate at a time
5. Test each function as you write it
6. Build up to rules and inference!

---

## Prerequisites

Install pyDatalog:
```bash
pip install pyDatalog
```

---

## Setup

Before starting, import the necessary modules:

```python
import csv
from typing import List, Dict, Any
from pyDatalog import pyDatalog

# Create all pyDatalog terms we'll need
pyDatalog.create_terms('HasColonies, Produced, YieldPerColony, PricePerPound, HasStocks, '
                       'MajorProducer, HighPrice, ValidProduction, '
                       'S, Y, C, Total, Yld, Price, Stocks, P')
```

---

## Instructions
1. Work in the provided `homework_fopc.py` file
2. Implement the functions described below
3. Test your code with the provided test cases
4. Commit your `homework_fopc.py` file

---

## Part 1: Loading Data and Encoding Facts

### Function 1.1: `load_honey_data(filename)`
**Purpose:** Load the honey production CSV file into a data structure.

**Requirements:**
- Read the CSV file (use `csv` module or `pandas`)
- Return the data in a format that's easy to work with (list of dictionaries, pandas DataFrame, etc.)
- Handle the CSV header row appropriately
- Convert numeric fields to appropriate types (int/float)

**Function signature:**
```python
def load_honey_data(filename: str):
    """
    Load honey production data from CSV file.
    
    Args:
        filename: Path to the honeyproduction.csv file
    
    Returns:
        Data structure containing the honey production data
        (list of dicts or pandas DataFrame)
    """
    pass
```

**Test case:**
```python
data = load_honey_data('honeyproduction.csv')
print(f"Loaded {len(data)} records")
print(f"First record: {data[0]}")
# Expected: Should load 626 records
# First record should have keys: 'state', 'numcol', 'yieldpercol', 'totalprod', etc.
# Numeric fields should be int/float, not strings
assert isinstance(data[0]['numcol'], int)
assert isinstance(data[0]['yieldpercol'], float)
assert isinstance(data[0]['year'], int)
```


---

### Function 1.2: `encode_facts_to_pydatalog(data)`
**Purpose:** Encode all rows from the honey data as pyDatalog facts.

**Requirements:**
- Use pyDatalog to create facts for at least 5 predicates:
  1. `HasColonies(state, numcol, year)` - colony count facts
  2. `Produced(state, totalprod, year)` - production facts
  3. `YieldPerColony(state, year, yieldpercol)` - yield facts
  4. `PricePerPound(state, year, priceperlb)` - price facts
  5. `HasStocks(state, year, stocks)` - stock facts
- Use pyDatalog's `+` operator to assert facts
- Return a dictionary mapping predicate names to the number of facts created

**Function signature:**
```python
from pyDatalog import pyDatalog

def encode_facts_to_pydatalog(data):
    """
    Encode honey production data as pyDatalog facts.
    
    Args:
        data: The loaded honey production data (list of dicts or DataFrame)
    
    Returns:
        Dictionary with counts: {"HasColonies": 626, "Produced": 626, ...}
    
    Example:
        After calling this function, you should be able to query:
        print(HasColonies('CA', C, 2010))  # Should return colony count for CA in 2010
    """
    pass
```

**Test case:**
```python
data = load_honey_data('honeyproduction.csv')
counts = encode_facts_to_pydatalog(data)
print(counts)
# Expected: {"HasColonies": 626, "Produced": 626, "YieldPerColony": 626, 
#            "PricePerPound": 626, "HasStocks": 626}
```


---

## Part 2: Encoding Rules

### Function 2.1: `encode_major_producer_rule()` (Already Implemented below)
**Purpose:** Encode the rule: "If a state has more than 200,000 colonies in a year, then it is a major honey producer that year."

**Requirements:**
- Create a new predicate `MajorProducer(state, year)`
- Use pyDatalog rule syntax: `MajorProducer(s, y) <= condition`
- The rule should be: `∀S, Y, C (HasColonies(S, C, Y) ∧ C > 200000 → MajorProducer(S, Y))`

**Function signature:**
```python
def encode_major_producer_rule():
    """
    Encode the major producer rule in pyDatalog.
    
    After calling this, you should be able to query:
    print(MajorProducer(S, 2010))  # Returns states with >200K colonies in 2010
    """
    pass
```

**Test case:**
```python
encode_major_producer_rule()
result = MajorProducer(S, 2010)
print(result)  # Should return states like ('CA',), ('ND',), etc. that have >200K colonies
```

**Solution:**
```python
def encode_major_producer_rule():
    """
    Encode the major producer rule in pyDatalog.
    
    Rule: ∀S, Y, C (HasColonies(S, C, Y) ∧ C > 200000 → MajorProducer(S, Y))
    """
    MajorProducer(S, Y) <= HasColonies(S, C, Y) & (C > 200000)
```

---

### Function 2.2: `encode_high_price_rule()`
**Purpose:** Encode the rule: "If a state's price per pound is greater than $2.00 in a year, then that state has high-priced honey that year."

**Requirements:**
- Create a new predicate `HighPrice(state, year)`
- The rule should be: `∀S, Y, Price (PricePerPound(S, Y, Price) ∧ Price > 2.00 → HighPrice(S, Y))`

**Function signature:**
```python
def encode_high_price_rule():
    """
    Encode the high price rule in pyDatalog.
    
    After calling this, you should be able to query:
    print(HighPrice(S, 2010))  # Returns states with price > $2.00 in 2010
    """
    pass
```

**Test case:**
```python
encode_high_price_rule()
result = HighPrice(S, 2010)
print(f"High price states in 2010: {result}")
# Expected: Should return states like ('VT',), ('VA',), ('HI',), etc. with price > $2.00
# Verify: Check that all returned states actually have price > 2.00
for state_tuple in result:
    state = state_tuple[0]
    price_result = PricePerPound(state, 2010, P)
    assert price_result[0][0] > 2.00, f"{state} should have price > 2.00"
```


---

### Function 2.3: `encode_production_constraint_rule()`
**Purpose:** Encode a constraint rule that validates: "A state's total production equals its number of colonies multiplied by its yield per colony."

**Requirements:**
- Create a predicate `ValidProduction(state, year)` that checks if production = colonies × yield
- The rule should validate: `∀S, Y, C, Yld, Total (HasColonies(S, C, Y) ∧ YieldPerColony(S, Y, Yld) ∧ Produced(S, Total, Y) → Total = C × Yld)`
- Return states/years where the constraint holds (or where it doesn't, depending on your implementation)

**Function signature:**
```python
def encode_production_constraint_rule():
    """
    Encode the production constraint rule in pyDatalog.
    
    This rule validates that production = colonies × yield per colony.
    
    After calling this, you should be able to query:
    print(ValidProduction(s, 2010))  # Returns states where constraint holds
    """
    pass
```

**Test case:**
```python
encode_production_constraint_rule()
result = ValidProduction(s, 2010)
print(f"States with valid production in 2010: {len(result)} states")
# Expected: Should return all or most states where production = colonies × yield
# Verify: Check that the constraint actually holds for returned states
for state_tuple in result[:5]:  # Check first 5
    state = state_tuple[0]
    colonies = HasColonies(state, C, 2010)[0][0]
    yield_val = YieldPerColony(state, 2010, Y)[0][0]
    production = Produced(state, P, 2010)[0][0]
    expected = colonies * yield_val
    assert abs(production - expected) < 1, f"{state}: {production} should equal {colonies} * {yield_val} = {expected}"
```


---

## Part 3: Performing Inference

### Function 3.1: `query_major_producers(year)` (Already Implemented below)
**Purpose:** Use inference to find all major producers in a given year.

**Requirements:**
- Query the `MajorProducer` predicate for the given year
- Return a list of state codes

**Function signature:**
```python
def query_major_producers(year: int) -> list:
    """
    Query for major producers in a given year using inference.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes that are major producers in that year
    
    Example:
        result = query_major_producers(2010)
        # Returns: ['CA', 'ND', 'SD', ...]
    """
    pass
```

**Test case:**
```python
major_producers = query_major_producers(2010)
print(f"Major producers in 2010: {sorted(major_producers)}")
# Expected: Should return list like ['CA', 'ND', 'SD', 'FL', 'MT', 'MN', 'TX']
# Verify: All returned states should have >200K colonies
for state in major_producers:
    colonies = HasColonies(state, C, 2010)[0][0]
    assert colonies > 200000, f"{state} should have >200K colonies, got {colonies}"
```

**Solution:**
```python
def query_major_producers(year: int) -> List[str]:
    """
    Query for major producers in a given year using inference.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes that are major producers in that year
    """
    result = MajorProducer(S, year)
    # Result is a Query object, access .data to get list of tuples like [('CA',), ('ND',)]
    return [state[0] for state in result.data]
```

---

### Function 3.2: `query_high_price_states(year)`
**Purpose:** Use inference to find all states with high-priced honey in a given year.

**Function signature:**
```python
def query_high_price_states(year: int) -> list:
    """
    Query for states with high-priced honey in a given year.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes with price > $2.00 in that year
    """
    pass
```

**Test case:**
```python
high_price_states = query_high_price_states(2010)
print(f"High price states in 2010: {sorted(high_price_states)}")
# Expected: Should return list like ['VT', 'VA', 'HI', 'IL', 'NC', 'NV']
# Verify: All returned states should have price > $2.00
for state in high_price_states:
    price = PricePerPound(state, 2010, P)[0][0]
    assert price > 2.00, f"{state} should have price > $2.00, got ${price:.2f}"
```


---

### Function 3.3: `query_major_producers_with_high_price(year)`
**Purpose:** Use inference to find states that are BOTH major producers AND have high prices in a given year.

**Requirements:**
- Combine the `MajorProducer` and `HighPrice` predicates
- Return states that satisfy both conditions

**Function signature:**
```python
def query_major_producers_with_high_price(year: int) -> list:
    """
    Query for states that are major producers AND have high prices.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes that satisfy both conditions
    
    Example:
        result = query_major_producers_with_high_price(2010)
        # Returns states that have >200K colonies AND price > $2.00
    """
    pass
```

**Test case:**
```python
both = query_major_producers_with_high_price(2010)
print(f"Major producers with high prices in 2010: {sorted(both)}")
# Expected: Should return list like ['IL', 'NC'] (states that are both major producers AND have high prices)
# Verify: All returned states should satisfy both conditions
for state in both:
    # Check major producer condition
    colonies = HasColonies(state, C, 2010)[0][0]
    assert colonies > 200000, f"{state} should have >200K colonies"
    # Check high price condition
    price = PricePerPound(state, 2010, P)[0][0]
    assert price > 2.00, f"{state} should have price > $2.00"
```


---

### Function 3.4: `query_production_for_state(state, year)`
**Purpose:** Query the production value for a specific state and year.

**Function signature:**
```python
def query_production_for_state(state: str, year: int) -> int:
    """
    Query production value for a specific state and year.
    
    Args:
        state: State code (e.g., 'CA')
        year: Year
    
    Returns:
        Production value in pounds, or None if not found
    
    Example:
        result = query_production_for_state('CA', 2010)
        # Returns: 27470000
    """
    pass
```

**Test case:**
```python
production = query_production_for_state('CA', 2010)
print(f"Production for CA in 2010: {production:,} lbs")
# Expected: Should return 27470000 (or the actual production value for CA in 2010)
assert production is not None, "Production should not be None"
assert isinstance(production, int), "Production should be an integer"
assert production > 0, "Production should be positive"

# Test with non-existent state/year
result = query_production_for_state('XX', 2010)
assert result is None, "Non-existent state should return None"
```


---

## Part 4: Main Function

### Function 4.1: `main()` (Already Implemented below)
**Purpose:** Main function that demonstrates the complete workflow.

**Requirements:**
- Load the honey data
- Encode all facts
- Encode all rules
- Perform several inference queries
- Print results in a readable format

**Function signature:**
```python
def main():
    """
    Main function: Load data, encode facts and rules, perform inference.
    
    Expected output:
    - Summary of facts encoded
    - Results of inference queries for 2010
    - Example queries showing inference capabilities
    """
    pass
```


**Expected output:**
```
Loading honey production data...
Encoded 626 facts for HasColonies
Encoded 626 facts for Produced
Encoded 626 facts for YieldPerColony
Encoded 626 facts for PricePerPound
Encoded 626 facts for HasStocks

Major producers in 2010: ['CA', 'ND', 'SD', 'FL', 'MT', 'MN', 'TX']
High price states in 2010: ['VT', 'VA', 'HI', 'IL', 'NC', 'NV']
Major producers with high prices in 2010: ['IL', 'NC']

Production for CA in 2010: 27470000 lbs
```

**Solution:**
```python
def main():
    """
    Main function: Load data, encode facts and rules, perform inference.
    """
    print("Loading honey production data...")
    data = load_honey_data('honeyproduction.csv')
    print(f"Loaded {len(data)} records\n")
    
    print("Encoding facts to pyDatalog...")
    counts = encode_facts_to_pydatalog(data)
    for predicate, count in counts.items():
        print(f"Encoded {count} facts for {predicate}")
    print()
    
    print("Encoding rules...")
    encode_major_producer_rule()
    encode_high_price_rule()
    encode_production_constraint_rule()
    print("Rules encoded successfully\n")
    
    # Perform inference queries for 2010
    year = 2010
    print(f"=== Inference Queries for {year} ===\n")
    
    # Query 1: Major producers
    major_producers = query_major_producers(year)
    print(f"Major producers in {year}: {sorted(major_producers)}")
    
    # Query 2: High price states
    high_price = query_high_price_states(year)
    print(f"High price states in {year}: {sorted(high_price)}")
    
    # Query 3: Major producers with high prices
    both = query_major_producers_with_high_price(year)
    print(f"Major producers with high prices in {year}: {sorted(both)}")
    print()
    
    # Query 4: Specific state production
    state = 'CA'
    production = query_production_for_state(state, year)
    if production is not None:
        print(f"Production for {state} in {year}: {production:,} lbs")
    else:
        print(f"Production for {state} in {year}: Not found")
    
    # Query 5: Validate production constraint
    valid = ValidProduction(S, year)
    valid_states = [state[0] for state in valid.data]
    print(f"States with valid production constraint in {year}: {len(valid_states)} states")
    print(f"  (Production = Colonies × Yield for all {len(valid_states)} states)")
```

---

## Submission Requirements

1. **File:** `homework_fopc.py` containing all required functions
2. **Testing:** Your code should work with the provided test cases
3. **Output:** When python `homework_fopc.py` is run, it should:
   - Load the data successfully
   - Encode all facts and rules
   - Perform inference queries
   - Print results

---

## Grading Criteria

| Criterion | Points | Description |
|-----------|--------|-------------|
| Function 1.1 | 1 | Correctly loads CSV data |
| Function 1.2 | 1 | Correctly encodes facts to pyDatalog |
| Function 2.1 |  | (Already implemented) |
| Function 2.2 | 1 | Correctly encodes high price rule |
| Function 2.3 | 1 | Correctly encodes production constraint rule |
| Function 3.1 |  | (Already implemented) |
| Function 3.2 | 1 | Correctly queries high price states |
| Function 3.3 | 1 | Correctly combines predicates for inference |
| Function 3.4 | 1 | Correctly queries specific state production |
| Function 4.1 |  | (Already implemented) |
| **Total** | **7** | |


