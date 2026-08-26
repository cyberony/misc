"""
SOLUTION: homework_fopc_vs_tables_solution.py

This file demonstrates hands-on comparison of FOPC vs. Tables for various tasks.
It shows when each representation excels and when each struggles.

All required functions are implemented for both FOPC and tables approaches.
"""

import csv
import time
import pandas as pd
import numpy as np
from typing import List, Dict, Any, Tuple
from pyDatalog import pyDatalog

# Create all pyDatalog terms we'll need
pyDatalog.create_terms('HasColonies, Produced, YieldPerColony, PricePerPound, '
                       'MajorProducer, HighPrice, Profitable, Expanding, '
                       'AboveMedian, ValidProduction, '
                       's, y, c, total, yield, price, p, p1, p2, median, avg, window')


def load_honey_data(filename: str) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
    """
    Load honey production data in both formats.
    
    Args:
        filename: Path to the honeyproduction.csv file
    
    Returns:
        Tuple of (pandas DataFrame, list of dictionaries)
    """
    df = pd.read_csv(filename)
    
    # Convert to list of dicts for FOPC
    data = df.to_dict('records')
    
    # Convert numeric fields
    for row in data:
        row['numcol'] = int(row['numcol'])
        row['yieldpercol'] = float(row['yieldpercol'])
        row['totalprod'] = int(float(row['totalprod']))
        row['priceperlb'] = float(row['priceperlb'])
        row['year'] = int(row['year'])
    
    return df, data


# ============================================================================
# TASK 1: Rule Chaining
# ============================================================================

def expanding_states_tables(data):
    """
    Find expanding states using table queries.
    Must chain multiple filtering/joining operations.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        List of state codes that are expanding
    """
    # SOLUTION: Chain multiple filtering operations
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    # Step 1: Major producers (colonies > 200K)
    major = df[df['numcol'] > 200000].copy()
    
    # Step 2: Profitable (major producers with high price)
    profitable = major[major['priceperlb'] > 2.0].copy()
    
    # Step 3: Expanding (profitable with increasing production)
    # Need to compare year-over-year
    profitable = profitable.sort_values(['state', 'year'])
    profitable['prev_prod'] = profitable.groupby('state')['totalprod'].shift(1)
    profitable['increasing'] = profitable['totalprod'] > profitable['prev_prod']
    
    expanding = profitable[profitable['increasing'] == True]
    return sorted(expanding['state'].unique().tolist())


def expanding_states_fopc(data):
    """
    Find expanding states using FOPC rules.
    Define rules and let inference find the answer.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of state codes that are expanding
    """
    # SOLUTION: Define rules declaratively and let inference chain them
    # Clear pyDatalog facts first
    pyDatalog.clear()
    pyDatalog.create_terms('HasColonies, Produced, PricePerPound, '
                           'MajorProducer, Profitable, Expanding, '
                           's, y, c, p, p1, p2, price')
    
    # Encode facts
    for row in data:
        + HasColonies(row['state'], row['numcol'], row['year'])
        + Produced(row['state'], row['totalprod'], row['year'])
        + PricePerPound(row['state'], row['year'], row['priceperlb'])
    
    # Rule 1: Major producer
    MajorProducer(s, y) <= HasColonies(s, c, y) & (c > 200000)
    
    # Rule 2: Profitable (major producer with high price)
    Profitable(s, y) <= MajorProducer(s, y) & PricePerPound(s, y, price) & (price > 2.0)
    
    # Rule 3: Expanding (profitable with increasing production)
    # Need to handle year comparison - this is still tricky in pyDatalog
    # We'll use a simplified version
    
    # For each profitable state-year, check if production increased
    expanding_states = set()
    
    # Get all profitable states
    profitable_result = Profitable(s, y)
    
    for (state, year) in profitable_result:
        # Check if production increased from previous year
        current_prod = None
        prev_prod = None
        
        for row in data:
            if row['state'] == state and row['year'] == year:
                current_prod = row['totalprod']
            if row['state'] == state and row['year'] == year - 1:
                prev_prod = row['totalprod']
        
        if current_prod and prev_prod and current_prod > prev_prod:
            expanding_states.add(state)
    
    return sorted(list(expanding_states))


# ============================================================================
# TASK 2: Statistical Correlation
# ============================================================================

def correlation_with_tables(data):
    """
    Calculate correlation using pandas.
    
    Args:
        data: List of dictionaries or pandas DataFrame
    
    Returns:
        float: Correlation coefficient
    """
    # SOLUTION: Convert to DataFrame if needed, then compute correlation
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    return df['numcol'].corr(df['totalprod'])


def correlation_with_fopc(data):
    """
    Attempt to calculate correlation using pyDatalog.
    Note: This may be very difficult or impractical.
    
    Args:
        data: List of dictionaries
    
    Returns:
        float: Correlation coefficient (if feasible)
    """
    # SOLUTION: FOPC has no built-in correlation function.
    # To compute correlation, you'd need to:
    # 1. Define Mean predicate (requires summing all values, counting)
    # 2. Define Covariance (requires computing differences from mean for each pair)
    # 3. Define StandardDeviation (requires variance computation)
    # 4. Divide covariance by product of standard deviations
    #
    # This would require hundreds of lines of FOPC axioms and be extremely slow.
    # This demonstrates why FOPC struggles with statistics.
    # FOPC doesn't have built-in statistical functions
    # We'd need to encode all arithmetic operations
    # This is so impractical that we'll just use Python
    
    # Extract values
    numcols = [row['numcol'] for row in data]
    totalprods = [row['totalprod'] for row in data]
    
    # Use numpy (not pure FOPC, but shows the point)
    return np.corrcoef(numcols, totalprods)[0, 1]
    
    # Note: A pure FOPC implementation would require:
    # - Defining Mean predicate recursively
    # - Defining Covariance with nested quantifiers
    # - Defining StandardDeviation
    # - All of this would be extremely verbose and slow


# ============================================================================
# TASK 3: Automatic Inference
# ============================================================================

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
    # SOLUTION: Option 1 - compute in query each time
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    return df[df['numcol'] > 200000].copy()


def major_producers_fopc(data):
    """
    Find major producers using FOPC inference.
    Define rule once, inference derives facts automatically.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    # SOLUTION: Define rule, let inference derive facts automatically
    pyDatalog.clear()
    pyDatalog.create_terms('HasColonies, MajorProducer, s, y, c')
    
    # Encode facts
    for row in data:
        + HasColonies(row['state'], row['numcol'], row['year'])
    
    # Rule: Major producer
    MajorProducer(s, y) <= HasColonies(s, c, y) & (c > 200000)
    
    # Query - inference automatically derives facts!
    result = MajorProducer(s, y)
    return result


def major_producers_high_price_tables(data):
    """
    Find major producers with high prices using tables.
    Must recompute or join with major_producers result.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with major producers that have high prices
    """
    # SOLUTION: Must recompute major producers or filter
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    major = df[df['numcol'] > 200000]
    return major[major['priceperlb'] > 2.0]


def major_producers_high_price_fopc(data):
    """
    Find major producers with high prices using FOPC.
    Can directly query derived facts.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    # SOLUTION: Can directly query derived facts (MajorProducer) and combine
    pyDatalog.clear()
    pyDatalog.create_terms('HasColonies, PricePerPound, MajorProducer, HighPrice, '
                           's, y, c, price')
    
    # Encode facts
    for row in data:
        + HasColonies(row['state'], row['numcol'], row['year'])
        + PricePerPound(row['state'], row['year'], row['priceperlb'])
    
    # Rule: Major producer (derived fact)
    MajorProducer(s, y) <= HasColonies(s, c, y) & (c > 200000)
    
    # Rule: High price
    HighPrice(s, y) <= PricePerPound(s, y, price) & (price > 2.0)
    
    # Query: Major producers with high prices
    # Can directly use derived fact!
    result = MajorProducer(s, y) & HighPrice(s, y)
    return result


# ============================================================================
# TASK 4: Temporal Aggregation
# ============================================================================

def moving_average_tables(data, window=3):
    """
    Calculate moving average using pandas.
    
    Args:
        data: pandas DataFrame with columns: state, year, totalprod
        window: Size of moving window (default 3)
    
    Returns:
        pandas DataFrame with added 'moving_avg' column
    """
    # SOLUTION: Use pandas rolling window function
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data.copy()
    result = df.copy()
    result['moving_avg'] = (
        result.groupby('state')['totalprod']
        .transform(lambda x: x.rolling(window=window, center=True, min_periods=1).mean())
    )
    return result


def moving_average_fopc(data, window=3):
    """
    Attempt to calculate moving average using pyDatalog.
    
    Args:
        data: List of dictionaries
        window: Size of moving window (default 3)
    
    Returns:
        Dictionary mapping (state, year) to moving average
    """
    # SOLUTION: FOPC would need to:
    # 1. Define temporal ordering (NextYear predicate)
    # 2. Define window membership (InWindow predicate)
    # 3. Sum production values in window
    # 4. Divide by window size
    # 5. Handle frame problem (what doesn't change)
    #
    # This is very awkward and verbose. We'll use Python to compute.
    # Encode facts
    for row in data:
        + Produced(row['state'], row['totalprod'], row['year'])
    
    # FOPC would need to:
    # 1. Define temporal ordering: NextYear(y1, y2)
    # 2. Define window: InWindow(s, y, y1, y2, y3) where y1, y2, y3 are consecutive
    # 3. Sum production in window
    # 4. Divide by window size
    
    # This is so complex that we'll compute in Python
    result = {}
    states = set(row['state'] for row in data)
    
    for state in states:
        state_data = [r for r in data if r['state'] == state]
        state_data.sort(key=lambda x: x['year'])
        
        for i in range(len(state_data)):
            window_start = max(0, i - window // 2)
            window_end = min(len(state_data), i + window // 2 + 1)
            window_data = state_data[window_start:window_end]
            
            avg = sum(r['totalprod'] for r in window_data) / len(window_data)
            result[(state, state_data[i]['year'])] = avg
    
    return result


def above_median_tables(data):
    """
    Find states with production above median in each year using pandas.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with states above median per year
    """
    # SOLUTION: Use groupby to compute medians, then filter
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    medians = df.groupby('year')['totalprod'].median()
    result = df.merge(medians.rename('median_prod'), left_on='year', right_index=True)
    return result[result['totalprod'] > result['median_prod']]


def above_median_fopc(data):
    """
    Find states with production above median using pyDatalog.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    # SOLUTION: FOPC would need to:
    # 1. Compute median for each year (requires sorting, which is complex in FOPC)
    # 2. Compare each state's production to median
    # 3. Universal quantifier requires checking all instances
    #
    # This is computationally expensive in FOPC.
    # Encode facts
    for row in data:
        + Produced(row['state'], row['totalprod'], row['year'])
    
    # Compute medians in Python (FOPC would struggle)
    years = set(row['year'] for row in data)
    medians = {}
    
    for year in years:
        year_data = [r['totalprod'] for r in data if r['year'] == year]
        medians[year] = np.median(year_data)
    
    # Now use FOPC to find above median (but median computation was in Python)
    # Define median facts
    for year, median in medians.items():
        # We'd need a Median predicate, but pyDatalog doesn't handle this well
        # So we'll query directly
        pass
    
    # Query for states above median
    result = []
    for row in data:
        if row['totalprod'] > medians[row['year']]:
            result.append((row['state'], row['year']))
    
    return result


# ============================================================================
# TASK 5: Constraint Validation
# ============================================================================

def validate_constraint_tables(data):
    """
    Validate production = colonies × yield using tables.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with rows that violate the constraint
    """
    # SOLUTION: Compute expected production and find violations
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data.copy()
    df = df.copy()
    df['expected_prod'] = df['numcol'] * df['yieldpercol']
    df['violation'] = abs(df['totalprod'] - df['expected_prod']) > 0.01  # Allow small rounding
    return df[df['violation'] == True]


def validate_constraint_fopc(data):
    """
    Validate constraint using FOPC.
    Express constraint as a rule and find violations.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples that violate constraint
    """
    # SOLUTION: Express constraint as FOPC rule, find violations
    pyDatalog.clear()
    pyDatalog.create_terms('HasColonies, Produced, YieldPerColony, '
                           'ValidProduction, s, y, c, yield, total')
    
    # Encode facts
    for row in data:
        + HasColonies(row['state'], row['numcol'], row['year'])
        + Produced(row['state'], row['totalprod'], row['year'])
        + YieldPerColony(row['state'], row['year'], row['yieldpercol'])
    
    # Constraint: ValidProduction holds when production = colonies × yield
    ValidProduction(s, y) <= (
        HasColonies(s, c, y) & 
        YieldPerColony(s, y, yield) & 
        Produced(s, total, y) & 
        (total == c * yield)
    )
    
    # Find violations: states/years where ValidProduction doesn't hold
    valid = ValidProduction(s, y)
    valid_set = set(valid)
    
    violations = []
    for row in data:
        key = (row['state'], row['year'])
        if key not in valid_set:
            violations.append(key)
    
    return violations


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
    # SOLUTION: Option 1 - compute in query each time
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    return df[df['numcol'] > 200000].copy()


def major_producers_fopc(data):
    """
    Find major producers using FOPC inference.
    Define rule once, inference derives facts automatically.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    # SOLUTION: Define rule, let inference derive facts automatically
    pyDatalog.clear()
    pyDatalog.create_terms('HasColonies, MajorProducer, s, y, c')
    
    # Encode facts
    for row in data:
        + HasColonies(row['state'], row['numcol'], row['year'])
    
    # Rule: Major producer
    MajorProducer(s, y) <= HasColonies(s, c, y) & (c > 200000)
    
    # Query - inference automatically derives facts!
    result = MajorProducer(s, y)
    return result


def major_producers_high_price_tables(data):
    """
    Find major producers with high prices using tables.
    Must recompute or join with major_producers result.
    
    Args:
        data: pandas DataFrame
    
    Returns:
        pandas DataFrame with major producers that have high prices
    """
    # SOLUTION: Must recompute major producers or filter
    if isinstance(data, list):
        df = pd.DataFrame(data)
    else:
        df = data
    major = df[df['numcol'] > 200000]
    return major[major['priceperlb'] > 2.0]


def major_producers_high_price_fopc(data):
    """
    Find major producers with high prices using FOPC.
    Can directly query derived facts.
    
    Args:
        data: List of dictionaries
    
    Returns:
        List of (state, year) tuples
    """
    # SOLUTION: Can directly query derived facts (MajorProducer) and combine
    pyDatalog.clear()
    pyDatalog.create_terms('HasColonies, PricePerPound, MajorProducer, HighPrice, '
                           's, y, c, price')
    
    # Encode facts
    for row in data:
        + HasColonies(row['state'], row['numcol'], row['year'])
        + PricePerPound(row['state'], row['year'], row['priceperlb'])
    
    # Rule: Major producer (derived fact)
    MajorProducer(s, y) <= HasColonies(s, c, y) & (c > 200000)
    
    # Rule: High price
    HighPrice(s, y) <= PricePerPound(s, y, price) & (price > 2.0)
    
    # Query: Major producers with high prices
    # Can directly use derived fact!
    result = MajorProducer(s, y) & HighPrice(s, y)
    return result


# ============================================================================
# PART 3: Performance Comparison
# ============================================================================

def benchmark_comparison(data):
    """
    Run all tasks and compare performance.
    
    Args:
        data: pandas DataFrame or list of dicts
    
    Returns:
        Dictionary with timing results
    """
    # SOLUTION: Run all tasks and measure execution time
    if isinstance(data, pd.DataFrame):
        df = data
        data_list = data.to_dict('records')
    else:
        df = pd.DataFrame(data)
        data_list = data
    results = {
        'correlation': {'tables': 0, 'fopc': 0},
        'moving_average': {'tables': 0, 'fopc': 0},
        'above_median': {'tables': 0, 'fopc': 0},
        'expanding_states': {'tables': 0, 'fopc': 0},
        'validate_constraint': {'tables': 0, 'fopc': 0},
        'major_producers': {'tables': 0, 'fopc': 0},
    }
    
    # Correlation
    start = time.time()
    corr_tables = correlation_with_tables(df)
    results['correlation']['tables'] = time.time() - start
    
    start = time.time()
    corr_fopc = correlation_with_fopc(data_list)
    results['correlation']['fopc'] = time.time() - start
    
    # Moving average
    start = time.time()
    ma_tables = moving_average_tables(df)
    results['moving_average']['tables'] = time.time() - start
    
    start = time.time()
    ma_fopc = moving_average_fopc(data_list)
    results['moving_average']['fopc'] = time.time() - start
    
    # Above median
    start = time.time()
    am_tables = above_median_tables(df)
    results['above_median']['tables'] = time.time() - start
    
    start = time.time()
    am_fopc = above_median_fopc(data_list)
    results['above_median']['fopc'] = time.time() - start
    
    # Expanding states
    start = time.time()
    exp_tables = expanding_states_tables(df)
    results['expanding_states']['tables'] = time.time() - start
    
    start = time.time()
    exp_fopc = expanding_states_fopc(data_list)
    results['expanding_states']['fopc'] = time.time() - start
    
    # Validate constraint
    start = time.time()
    val_tables = validate_constraint_tables(df)
    results['validate_constraint']['tables'] = time.time() - start
    
    start = time.time()
    val_fopc = validate_constraint_fopc(data_list)
    results['validate_constraint']['fopc'] = time.time() - start
    
    # Major producers
    start = time.time()
    mp_tables = major_producers_tables(df)
    results['major_producers']['tables'] = time.time() - start
    
    start = time.time()
    mp_fopc = major_producers_fopc(data_list)
    results['major_producers']['fopc'] = time.time() - start
    
    return results


def print_benchmark_results(results: Dict[str, Dict[str, float]]):
    """
    Print benchmark results in a readable format.
    """
    print("\n" + "=" * 60)
    print("BENCHMARK RESULTS: FOPC vs. Tables")
    print("=" * 60)
    print(f"{'Task':<20} {'Tables (s)':<15} {'FOPC (s)':<15} {'Winner':<10}")
    print("-" * 60)
    
    for task, times in results.items():
        tables_time = times['tables']
        fopc_time = times['fopc']
        
        if fopc_time == 0 or fopc_time > tables_time * 10:
            winner = "Tables"
        elif tables_time > fopc_time * 10:
            winner = "FOPC"
        else:
            winner = "Similar"
        
        print(f"{task:<20} {tables_time:<15.4f} {fopc_time:<15.4f} {winner:<10}")
    
    print("=" * 60)


# ============================================================================
# MAIN FUNCTION
# ============================================================================

def main():
    """
    Main function: Run all comparisons and show results.
    """
    print("Loading honey production data...")
    df, data_list = load_honey_data('honeyproduction.csv')
    print(f"Loaded {len(df)} records\n")
    
    # Task 1: Rule Chaining
    print("=" * 60)
    print("TASK 1: Rule Chaining")
    print("=" * 60)
    exp_tables = expanding_states_tables(df)
    exp_fopc = expanding_states_fopc(data_list)
    print(f"  Tables: {len(exp_tables)} states (procedural queries)")
    print(f"  FOPC: {len(exp_fopc)} states (declarative rules)")
    print("  → FOPC wins: Rules are explicit and chainable")
    
    # Task 2: Statistical Correlation
    print("\n" + "=" * 60)
    print("TASK 2: Statistical Correlation")
    print("=" * 60)
    corr_tables = correlation_with_tables(df)
    corr_fopc = correlation_with_fopc(data_list)
    print(f"  Tables: {corr_tables:.4f}")
    print(f"  FOPC: {corr_fopc:.4f} (required Python help)")
    print("  → Tables win: Built-in statistical functions")
    
    # Task 3: Automatic Inference
    print("\n" + "=" * 60)
    print("TASK 3: Automatic Inference")
    print("=" * 60)
    mp_tables = major_producers_tables(df)
    mp_fopc = major_producers_fopc(data_list)
    print(f"  Tables: {len(mp_tables)} records (computed in query)")
    print(f"  FOPC: {len(mp_fopc)} facts (automatically inferred)")
    print("  → FOPC wins: Can derive facts from rules")
    
    # Task 4: Temporal Aggregation
    print("\n" + "=" * 60)
    print("TASK 4: Temporal Aggregation")
    print("=" * 60)
    ma_tables = moving_average_tables(df)
    ma_fopc = moving_average_fopc(data_list)
    print(f"  Tables: Computed for {len(ma_tables)} records")
    print(f"  FOPC: Computed for {len(ma_fopc)} state-year pairs")
    print("  → Tables win: Natural windowing functions")
    
    # Task 5: Constraint Validation
    print("\n" + "=" * 60)
    print("TASK 5: Constraint Validation")
    print("=" * 60)
    val_tables = validate_constraint_tables(df)
    val_fopc = validate_constraint_fopc(data_list)
    print(f"  Tables: {len(val_tables)} violations found")
    print(f"  FOPC: {len(val_fopc)} violations found")
    print("  → FOPC wins: Constraint is explicit and declarative")
    
    # Task 6: Large-Scale Filtering
    print("\n" + "=" * 60)
    print("TASK 6: Large-Scale Filtering")
    print("=" * 60)
    am_tables = above_median_tables(df)
    am_fopc = above_median_fopc(data_list)
    print(f"  Tables: Found {len(am_tables)} records")
    print(f"  FOPC: Found {len(am_fopc)} state-year pairs")
    print("  → Tables win: Efficient groupby operations")
    
    # Part 3: Benchmark
    print("\n" + "=" * 60)
    print("PART 3: Performance Benchmark")
    print("=" * 60)
    results = benchmark_comparison(df)
    print_benchmark_results(results)
    
    print("\n" + "=" * 60)
    print("KEY INSIGHTS")
    print("=" * 60)
    print("""
    Tables Excel When:
    - Statistical operations (correlation, aggregation)
    - Temporal analysis (moving averages, time series)
    - Large-scale queries (efficient groupby, indexing)
    - Performance is critical
    
    FOPC Excels When:
    - Rule chaining (declarative rules)
    - Constraint validation (explicit constraints)
    - Automatic inference (deriving new facts)
    - Complex logical relationships
    
    The choice depends on the task!
    """)


if __name__ == "__main__":
    main()

