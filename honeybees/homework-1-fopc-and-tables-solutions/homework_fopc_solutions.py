"""
SOLUTION: homework_fopc_solutions.py

This is a complete solution for the homework assignment "homework_fopc.md".
It demonstrates how to use pyDatalog for FOPC encoding and inference.

For more information, see:
- pyDatalog GitHub: https://github.com/pcarbonn/pyDatalog
- pyDatalog documentation: https://github.com/pcarbonn/pyDatalog

All required functions are implemented:
1. load_honey_data() - Loads CSV data
2. encode_facts_to_pydatalog() - Encodes facts to pyDatalog
3. encode_major_producer_rule() - Encodes major producer rule
4. encode_high_price_rule() - Encodes high price rule
5. encode_production_constraint_rule() - Encodes production constraint
6. query_major_producers() - Queries major producers
7. query_high_price_states() - Queries high price states
8. query_major_producers_with_high_price() - Combines predicates
9. query_production_for_state() - Queries specific production
10. main() - End-to-end execution
"""

import csv
from typing import List, Dict, Any
from pyDatalog import pyDatalog

# Clear any existing pyDatalog state
pyDatalog.clear()

# Create all pyDatalog terms we'll need
# Note: Variables must be uppercase (S, Y, C, etc.) for queries to work properly
pyDatalog.create_terms('HasColonies, Produced, YieldPerColony, PricePerPound, HasStocks, '
                       'MajorProducer, HighPrice, ValidProduction, '
                       'S, Y, C, Total, Yld, Price, Stocks, P')


def load_honey_data(filename: str) -> List[Dict[str, Any]]:
    """
    Load honey production data from CSV file.
    
    Args:
        filename: Path to the honeyproduction.csv file
    
    Returns:
        List of dictionaries, each representing a row
    """
    data = []
    with open(filename, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Convert numeric fields (handle scientific notation)
            row['numcol'] = int(float(row['numcol']))
            row['yieldpercol'] = float(row['yieldpercol'])
            row['totalprod'] = int(float(row['totalprod']))  # Handle scientific notation
            row['stocks'] = int(float(row['stocks']))
            row['priceperlb'] = float(row['priceperlb'])
            row['prodvalue'] = int(float(row['prodvalue']))
            row['year'] = int(row['year'])
            data.append(row)
    return data


def encode_facts_to_pydatalog(data: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Encode honey production data as pyDatalog facts.
    
    Args:
        data: The loaded honey production data (list of dicts)
    
    Returns:
        Dictionary with counts: {"HasColonies": 626, "Produced": 626, ...}
    """
    counts = {
        "HasColonies": 0,
        "Produced": 0,
        "YieldPerColony": 0,
        "PricePerPound": 0,
        "HasStocks": 0
    }
    
    for row in data:
        state = row['state']
        year = row['year']
        
        # Encode HasColonies facts
        + HasColonies(state, row['numcol'], year)
        counts["HasColonies"] += 1
        
        # Encode Produced facts
        + Produced(state, row['totalprod'], year)
        counts["Produced"] += 1
        
        # Encode YieldPerColony facts
        + YieldPerColony(state, year, row['yieldpercol'])
        counts["YieldPerColony"] += 1
        
        # Encode PricePerPound facts
        + PricePerPound(state, year, row['priceperlb'])
        counts["PricePerPound"] += 1
        
        # Encode HasStocks facts
        + HasStocks(state, year, row['stocks'])
        counts["HasStocks"] += 1
    
    return counts


def encode_major_producer_rule():
    """
    Encode the major producer rule in pyDatalog.
    
    Rule: ∀S, Y, C (HasColonies(S, C, Y) ∧ C > 200000 → MajorProducer(S, Y))
    """
    MajorProducer(S, Y) <= HasColonies(S, C, Y) & (C > 200000)


def encode_high_price_rule():
    """
    Encode the high price rule in pyDatalog.
    
    Rule: ∀S, Y, Price (PricePerPound(S, Y, Price) ∧ Price > 2.00 → HighPrice(S, Y))
    """
    HighPrice(S, Y) <= PricePerPound(S, Y, Price) & (Price > 2.00)


def encode_production_constraint_rule():
    """
    Encode the production constraint rule in pyDatalog.
    
    Rule validates: ∀S, Y, C, Yld, Total (HasColonies(S, C, Y) ∧ 
    YieldPerColony(S, Y, Yld) ∧ Produced(S, Total, Y) → Total = C × Yld)
    
    This creates a ValidProduction predicate for states/years where the constraint holds.
    """
    ValidProduction(S, Y) <= (HasColonies(S, C, Y) & 
                             YieldPerColony(S, Y, Yld) & 
                             Produced(S, Total, Y) & 
                             (Total == C * Yld))


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


def query_high_price_states(year: int) -> List[str]:
    """
    Query for states with high-priced honey in a given year.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes with price > $2.00 in that year
    """
    result = HighPrice(S, year)
    return [state[0] for state in result.data]


def query_major_producers_with_high_price(year: int) -> List[str]:
    """
    Query for states that are major producers AND have high prices.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes that satisfy both conditions
    """
    # Query for states that are both major producers AND have high prices
    result = MajorProducer(S, year) & HighPrice(S, year)
    return [state[0] for state in result.data]


def query_production_for_state(state: str, year: int) -> int:
    """
    Query production value for a specific state and year.
    
    Args:
        state: State code (e.g., 'CA')
        year: Year
    
    Returns:
        Production value in pounds, or None if not found
    """
    result = Produced(state, P, year)
    if result.data:
        return result.data[0][0]  # Extract the production value
    return None


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


if __name__ == "__main__":
    main()

