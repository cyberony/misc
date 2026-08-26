"""
SOLUTION: homework_tables_solutions.py

This is a complete solution for the homework assignment "homework_tables.md".
It demonstrates how to use pandas for reasoning with tabular data.

All required exercises are implemented:
1. Exercise 1: Aggregation Questions
2. Exercise 2: Temporal Reasoning
3. Exercise 3: Comparative Reasoning
4. Exercise 4: Filtering and Selection
5. Exercise 5: Multi-dimensional Queries
"""

import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt

# Load the data
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, 'honeyproduction.csv')
df = pd.read_csv(csv_path)

# ============================================================================
# EXERCISE 1: Aggregation Questions
# ============================================================================

def exercise1_q1():
    """
    Question 1: What was the total honey production across all states in 2010?
    """
    total_2010 = df[df['year'] == 2010]['totalprod'].sum()
    print(f"Total production in 2010: {total_2010:,.0f} lbs")
    return total_2010
    # Answer: Approximately 141-142 million lbs

def exercise1_q2():
    """
    Question 2: What is the average price per pound of honey across all years?
    """
    avg_price = df['priceperlb'].mean()
    print(f"Average price per pound: ${avg_price:.2f}")
    return avg_price
    # Answer: Approximately $1.20-$1.30 per pound

def exercise1_q3():
    """
    Question 3: How many total bee colonies existed in the United States in 2005?
    """
    total_colonies_2005 = df[df['year'] == 2005]['numcol'].sum()
    print(f"Total colonies in 2005: {total_colonies_2005:,.0f}")
    return total_colonies_2005
    # Answer: Approximately 2.4-2.5 million colonies

def exercise1_q4():
    """
    Question 4: Which state has produced the most honey in total across all years?
    """
    state_totals = df.groupby('state')['totalprod'].sum()
    top_state = state_totals.idxmax()
    top_production = state_totals.max()
    print(f"{top_state} produced the most: {top_production:,.0f} lbs total")
    return top_state, top_production
    # Answer: North Dakota (ND) - approximately 400+ million lbs across all years

# ============================================================================
# EXERCISE 2: Temporal Reasoning
# ============================================================================

def exercise2_q1():
    """
    Question 1: Is honey production increasing or decreasing over time? Show the trend.
    """
    yearly_production = df.groupby('year')['totalprod'].sum()
    print("\nYearly Total Production:")
    print(yearly_production)
    
    # Calculate trend
    first_year = yearly_production.iloc[0]
    last_year = yearly_production.iloc[-1]
    change_pct = ((last_year - first_year) / first_year) * 100
    
    print(f"\nProduction in {yearly_production.index[0]}: {first_year:,.0f} lbs")
    print(f"Production in {yearly_production.index[-1]}: {last_year:,.0f} lbs")
    print(f"Change: {change_pct:.1f}%")
    
    if change_pct < 0:
        print("Trend: DECREASING")
    else:
        print("Trend: INCREASING")
    
    # Visualize
    yearly_production.plot(kind='line', title='Total Honey Production by Year', 
                          xlabel='Year', ylabel='Total Production (lbs)')
    plt.show()
    
    return yearly_production
    # Answer: Production is DECREASING over time. From ~220M lbs in 1998 to ~141M lbs in 2012 (approximately 36% decline)

def exercise2_q2():
    """
    Question 2: How has the price per pound changed from 1998 to 2012?
    """
    price_1998 = df[df['year'] == 1998]['priceperlb'].mean()
    price_2012 = df[df['year'] == 2012]['priceperlb'].mean()
    change = ((price_2012 - price_1998) / price_1998) * 100
    
    print(f"Price in 1998: ${price_1998:.2f}")
    print(f"Price in 2012: ${price_2012:.2f}")
    print(f"Change: {change:.1f}%")
    
    if change > 0:
        print("Trend: INCREASED dramatically")
    else:
        print("Trend: DECREASED")
    
    return price_1998, price_2012, change
    # Answer: Price INCREASED dramatically from ~$0.83/lb in 1998 to ~$2.37/lb in 2012 (approximately 185% increase)

def exercise2_q3():
    """
    Question 3: Which year had the highest average yield per colony?
    """
    yearly_yield = df.groupby('year')['yieldpercol'].mean()
    best_year = yearly_yield.idxmax()
    best_yield = yearly_yield.max()
    
    print(f"Year {best_year} had highest average yield: {best_yield:.1f} lbs/colony")
    print("\nAll years (sorted by yield):")
    print(yearly_yield.sort_values(ascending=False))
    
    return best_year, best_yield
    # Answer: 1998 or 1999 had the highest average yield (approximately 70-75 lbs per colony). Yield has generally decreased over time.

def exercise2_q4():
    """
    Question 4: Is there a correlation between price and production volume?
    """
    # Overall correlation
    correlation = df['priceperlb'].corr(df['totalprod'])
    print(f"Overall correlation: {correlation:.3f}")
    
    # Yearly correlation (more meaningful)
    yearly_avg_price = df.groupby('year')['priceperlb'].mean()
    yearly_total_prod = df.groupby('year')['totalprod'].sum()
    yearly_corr = yearly_avg_price.corr(yearly_total_prod)
    
    print(f"Yearly correlation: {yearly_corr:.3f}")
    
    if yearly_corr < 0:
        print("Answer: NEGATIVE correlation - as prices increase, production decreases")
    else:
        print("Answer: POSITIVE correlation - as prices increase, production increases")
    
    return correlation, yearly_corr
    # Answer: There is a NEGATIVE correlation (approximately -0.6 to -0.8). As prices increase, total production decreases.

# ============================================================================
# EXERCISE 3: Comparative Reasoning
# ============================================================================

def exercise3_q1():
    """
    Question 1: Which state has the highest yield per colony on average?
    """
    state_avg_yield = df.groupby('state')['yieldpercol'].mean()
    top_yield_state = state_avg_yield.idxmax()
    top_yield_value = state_avg_yield.max()
    
    print(f"{top_yield_state} has highest average yield: {top_yield_value:.1f} lbs/colony")
    print("\nTop 5 states by average yield:")
    print(state_avg_yield.nlargest(5))
    
    return top_yield_state, top_yield_value
    # Answer: Hawaii (HI) typically has the highest yield per colony (often 90-120 lbs/colony)

def exercise3_q2():
    """
    Question 2: Compare North Dakota and California
    """
    nd_ca = df[df['state'].isin(['ND', 'CA'])]
    
    # Colonies
    colonies = nd_ca.groupby('state')['numcol'].mean()
    print("Average colonies:")
    print(colonies)
    
    # Production
    production = nd_ca.groupby('state')['totalprod'].mean()
    print("\nAverage production:")
    print(production)
    
    # Yield
    yield_comp = nd_ca.groupby('state')['yieldpercol'].mean()
    print("\nAverage yield per colony:")
    print(yield_comp)
    
    # Direct comparison
    print("\nComparison:")
    if colonies['ND'] > colonies['CA']:
        print(f"ND has more colonies ({colonies['ND']:,.0f} vs {colonies['CA']:,.0f})")
    else:
        print(f"CA has more colonies ({colonies['CA']:,.0f} vs {colonies['ND']:,.0f})")
    
    if production['ND'] > production['CA']:
        print(f"ND produces more honey ({production['ND']:,.0f} vs {production['CA']:,.0f} lbs)")
    else:
        print(f"CA produces more honey ({production['CA']:,.0f} vs {production['ND']:,.0f} lbs)")
    
    if yield_comp['ND'] > yield_comp['CA']:
        print(f"ND has better yield ({yield_comp['ND']:.1f} vs {yield_comp['CA']:.1f} lbs/colony)")
    else:
        print(f"CA has better yield ({yield_comp['CA']:.1f} vs {yield_comp['ND']:.1f} lbs/colony)")
    
    return colonies, production, yield_comp
    # Answer: ND typically has more colonies, produces more honey, and has better yield per colony

def exercise3_q3():
    """
    Question 3: Rank the top 5 states by total production value (prodvalue)
    """
    state_prodvalue = df.groupby('state')['prodvalue'].sum()
    top_5 = state_prodvalue.nlargest(5)
    
    print("Top 5 states by total production value:")
    for i, (state, value) in enumerate(top_5.items(), 1):
        print(f"{i}. {state}: ${value:,.0f}")
    
    return top_5
    # Answer: Typically ND, CA, SD, FL, and MT or MN

def exercise3_q4():
    """
    Question 4: Which state has the most consistent production (lowest variance)?
    """
    state_variance = df.groupby('state')['totalprod'].var()
    most_consistent = state_variance.idxmin()
    least_variance = state_variance.min()
    
    print(f"{most_consistent} has most consistent production (variance: {least_variance:,.0f})")
    print("\nTop 5 most consistent states (lowest variance):")
    print(state_variance.nsmallest(5))
    
    return most_consistent, least_variance
    # Answer: Smaller states with stable production, such as Vermont, Maine

# ============================================================================
# EXERCISE 4: Filtering and Selection
# ============================================================================

def exercise4_q1():
    """
    Question 1: Which states produced more than 10 million pounds of honey in 2010?
    """
    high_producers_2010 = df[(df['year'] == 2010) & (df['totalprod'] > 10000000)]
    states = sorted(high_producers_2010['state'].unique())
    
    print(f"States with >10M lbs in 2010 ({len(states)} states):")
    for state in states:
        prod = high_producers_2010[high_producers_2010['state'] == state]['totalprod'].values[0]
        print(f"  {state}: {prod:,.0f} lbs")
    
    return states
    # Answer: Typically includes CA, ND, SD, FL, MT, MN, TX, and a few others

def exercise4_q2():
    """
    Question 2: Find all states where the price per pound exceeded $2.00 in any year
    """
    high_price = df[df['priceperlb'] > 2.00]
    states_high_price = sorted(high_price['state'].unique())
    
    print(f"States with price >$2.00 in any year ({len(states_high_price)} states):")
    print(states_high_price)
    
    return states_high_price
    # Answer: Many states, especially in later years (2010-2012). States like VT, VA, HI, IL, NC, NV

def exercise4_q3():
    """
    Question 3: Which states had fewer than 10,000 colonies in 2012?
    """
    small_2012 = df[(df['year'] == 2012) & (df['numcol'] < 10000)]
    states_small = sorted(small_2012['state'].unique())
    
    print(f"States with <10K colonies in 2012 ({len(states_small)} states):")
    for state in states_small:
        colonies = small_2012[small_2012['state'] == state]['numcol'].values[0]
        print(f"  {state}: {colonies:,} colonies")
    
    return states_small
    # Answer: Smaller states like KY, ME, NV, VT, WV

def exercise4_q4():
    """
    Question 4: Show all records where yield per colony was above 100 lbs
    """
    high_yield = df[df['yieldpercol'] > 100]
    
    print(f"Found {len(high_yield)} records with yield >100 lbs/colony")
    print("\nRecords:")
    print(high_yield[['state', 'year', 'yieldpercol', 'totalprod', 'numcol']])
    
    return high_yield
    # Answer: Several records, often from states like HI, LA, MS, MT in certain years

# ============================================================================
# EXERCISE 5: Multi-dimensional Queries
# ============================================================================

def exercise5_q1():
    """
    Question 1: Which state had the highest production value in 2012?
    """
    df_2012 = df[df['year'] == 2012]
    top_state_2012 = df_2012.loc[df_2012['prodvalue'].idxmax()]
    
    print(f"{top_state_2012['state']} had highest production value in 2012:")
    print(f"  Production value: ${top_state_2012['prodvalue']:,.0f}")
    print(f"  Total production: {top_state_2012['totalprod']:,.0f} lbs")
    print(f"  Price per lb: ${top_state_2012['priceperlb']:.2f}")
    
    return top_state_2012
    # Answer: North Dakota (ND) - approximately $63-64 million in 2012

def exercise5_q2():
    """
    Question 2: Find states where both colonies AND yield increased from 2011 to 2012
    """
    df_2011 = df[df['year'] == 2011].set_index('state')
    df_2012 = df[df['year'] == 2012].set_index('state')
    
    # Find states in both years
    common_states = df_2011.index.intersection(df_2012.index)
    
    # Check for increases
    increased = []
    for state in common_states:
        colonies_up = df_2012.loc[state, 'numcol'] > df_2011.loc[state, 'numcol']
        yield_up = df_2012.loc[state, 'yieldpercol'] > df_2011.loc[state, 'yieldpercol']
        if colonies_up and yield_up:
            increased.append(state)
    
    print(f"States with increased colonies AND yield 2011→2012 ({len(increased)} states):")
    for state in sorted(increased):
        col_change = df_2012.loc[state, 'numcol'] - df_2011.loc[state, 'numcol']
        yield_change = df_2012.loc[state, 'yieldpercol'] - df_2011.loc[state, 'yieldpercol']
        print(f"  {state}: +{col_change:,.0f} colonies, +{yield_change:.1f} lbs/colony")
    
    return increased
    # Answer: Typically a small number of states

def exercise5_q3():
    """
    Question 3: Best efficiency (highest yield) among states with >100K colonies
    """
    large_producers = df[df['numcol'] > 100000]
    best_efficiency = large_producers.loc[large_producers['yieldpercol'].idxmax()]
    
    print(f"{best_efficiency['state']} in {best_efficiency['year']} had best efficiency:")
    print(f"  Yield per colony: {best_efficiency['yieldpercol']:.1f} lbs/colony")
    print(f"  Colonies: {best_efficiency['numcol']:,.0f}")
    print(f"  Total production: {best_efficiency['totalprod']:,.0f} lbs")
    
    return best_efficiency
    # Answer: States like MT, ND, or SD in certain years, with yields of 90-120+ lbs/colony

def exercise5_q4():
    """
    Question 4: Correlation between price per pound and total production
    """
    # Overall correlation
    correlation = df['priceperlb'].corr(df['totalprod'])
    print(f"Overall correlation: {correlation:.3f}")
    
    # Yearly correlation (more meaningful)
    yearly = df.groupby('year').agg({'priceperlb': 'mean', 'totalprod': 'sum'})
    yearly_corr = yearly['priceperlb'].corr(yearly['totalprod'])
    print(f"Yearly correlation: {yearly_corr:.3f}")
    
    if yearly_corr < 0:
        print("Answer: NEGATIVE correlation - inverse relationship between price and production")
    else:
        print("Answer: POSITIVE correlation - price and production move together")
    
    return correlation, yearly_corr
    # Answer: Negative correlation (approximately -0.6 to -0.8)

# ============================================================================
# Main execution (if run as script)
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("EXERCISE 1: Aggregation Questions")
    print("=" * 60)
    exercise1_q1()
    exercise1_q2()
    exercise1_q3()
    exercise1_q4()
    
    print("\n" + "=" * 60)
    print("EXERCISE 2: Temporal Reasoning")
    print("=" * 60)
    exercise2_q1()
    exercise2_q2()
    exercise2_q3()
    exercise2_q4()
    
    print("\n" + "=" * 60)
    print("EXERCISE 3: Comparative Reasoning")
    print("=" * 60)
    exercise3_q1()
    exercise3_q2()
    exercise3_q3()
    exercise3_q4()
    
    print("\n" + "=" * 60)
    print("EXERCISE 4: Filtering and Selection")
    print("=" * 60)
    exercise4_q1()
    exercise4_q2()
    exercise4_q3()
    exercise4_q4()
    
    print("\n" + "=" * 60)
    print("EXERCISE 5: Multi-dimensional Queries")
    print("=" * 60)
    exercise5_q1()
    exercise5_q2()
    exercise5_q3()
    exercise5_q4()

