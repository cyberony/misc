"""
Homework 1, Part 1: FOPC Encoding and Inference with pyDatalog

This file contains starter code for the homework assignment.
Complete all the functions according to the specifications in homework_fopc.md

Instructions:
1. Install pyDatalog: pip install pyDatalog
2. Complete each function below
3. Test your code with the provided test cases
4. Run this file to see your results
"""

import csv
from typing import List, Dict, Any
from pyDatalog import pyDatalog

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
    # TODO: Implement this function
    # - Read the CSV file
    # - Convert numeric fields to appropriate types (int/float)
    # - Return list of dictionaries
    pass


def encode_facts_to_pydatalog(data: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Encode honey production data as pyDatalog facts.
    
    Args:
        data: The loaded honey production data (list of dicts)
    
    Returns:
        Dictionary with counts: {"HasColonies": 626, "Produced": 626, ...}
    
    Requirements:
    - Create facts for at least 5 predicates:
      1. HasColonies(state, numcol, year)
      2. Produced(state, totalprod, year)
      3. YieldPerColony(state, year, yieldpercol)
      4. PricePerPound(state, year, priceperlb)
      5. HasStocks(state, year, stocks)
    - Use pyDatalog's + operator to assert facts
    - Return dictionary with counts
    """
    counts = {
        "HasColonies": 0,
        "Produced": 0,
        "YieldPerColony": 0,
        "PricePerPound": 0,
        "HasStocks": 0
    }
    
    # TODO: Implement this function
    # - Loop through data rows
    # - Assert facts using + operator (e.g., + HasColonies(state, numcol, year))
    # - Increment counts for each predicate
    
    return counts


def encode_major_producer_rule():
    """
    Encode the major producer rule in pyDatalog.
    
    Rule: ∀S, Y, C (HasColonies(S, C, Y) ∧ C > 200000 → MajorProducer(S, Y))
    
    Requirements:
    - Create predicate MajorProducer(state, year)
    - Use pyDatalog rule syntax: MajorProducer(s, y) <= condition
    """
    # Already implemented - solution provided in homework_fopc.md
    MajorProducer(S, Y) <= HasColonies(S, C, Y) & (C > 200000)


def encode_high_price_rule():
    """
    Encode the high price rule in pyDatalog.
    
    Rule: ∀S, Y, Price (PricePerPound(S, Y, Price) ∧ Price > 2.00 → HighPrice(S, Y))
    
    Requirements:
    - Create predicate HighPrice(state, year)
    """
    # TODO: Implement this function
    # - Define the rule: HighPrice(s, y) <= PricePerPound(s, y, price) & (price > 2.00)
    pass


def encode_production_constraint_rule():
    """
    Encode the production constraint rule in pyDatalog.
    
    Rule validates: ∀S, Y, C, Yld, Total (HasColonies(S, C, Y) ∧ 
    YieldPerColony(S, Y, Yld) ∧ Produced(S, Total, Y) → Total = C × Yld)
    
    Requirements:
    - Create predicate ValidProduction(state, year)
    - Check if production = colonies × yield
    """
    # TODO: Implement this function
    # - Define the rule: ValidProduction(S, Y) <= (HasColonies(S, C, Y) & 
    #   YieldPerColony(S, Y, Yld) & Produced(S, Total, Y) & (Total == C * Yld))
    pass


def query_major_producers(year: int) -> List[str]:
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
    # Already implemented - solution provided in homework_fopc.md
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
    # TODO: Implement this function
    # - Query: result = HighPrice(S, year)
    # - Access .data to get results: [state[0] for state in result.data]
    # - Return list of state codes
    pass


def query_major_producers_with_high_price(year: int) -> List[str]:
    """
    Query for states that are major producers AND have high prices.
    
    Args:
        year: The year to query
    
    Returns:
        List of state codes that satisfy both conditions
    
    Requirements:
    - Combine the MajorProducer and HighPrice predicates
    """
    # TODO: Implement this function
    # - Query: result = MajorProducer(S, year) & HighPrice(S, year)
    # - Access .data to get results: [state[0] for state in result.data]
    # - Return list of state codes
    pass


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
    # TODO: Implement this function
    # - Query: result = Produced(state, P, year)
    # - Check if result.data exists
    # - Extract production value: result.data[0][0] if result.data else None
    # - Return the value or None if not found
    pass


def main():
    """
    Main function: Load data, encode facts and rules, perform inference.
    
    Expected output:
    - Summary of facts encoded
    - Results of inference queries for 2010
    - Example queries showing inference capabilities
    """
    # Already implemented - solution provided in homework_fopc.md
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

