import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import os

# Load the data
# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
# CSV is in parent directory (honeybees root)
parent_dir = os.path.dirname(script_dir)
csv_path = os.path.join(parent_dir, 'honeyproduction.csv')
df = pd.read_csv(csv_path)

# Display basic info
print("=" * 60)
print("HONEY PRODUCTION DATA ANALYSIS")
print("=" * 60)
print(f"\nDataset Shape: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"Years covered: {df['year'].min()} to {df['year'].max()}")
print(f"Number of states: {df['state'].nunique()}")

# Basic statistics
print("\n" + "=" * 60)
print("BASIC STATISTICS")
print("=" * 60)
print(df.describe())

# Top producing states (by total production across all years)
print("\n" + "=" * 60)
print("TOP 10 STATES BY TOTAL PRODUCTION (All Years)")
print("=" * 60)
state_totals = df.groupby('state')['totalprod'].sum().sort_values(ascending=False)
print(state_totals.head(10))

# Production trends over time
print("\n" + "=" * 60)
print("NATIONAL PRODUCTION TRENDS")
print("=" * 60)
yearly_totals = df.groupby('year').agg({
    'totalprod': 'sum',
    'numcol': 'sum',
    'priceperlb': 'mean',
    'prodvalue': 'sum'
}).round(2)
print(yearly_totals)

# Average yield per colony by year
print("\n" + "=" * 60)
print("AVERAGE YIELD PER COLONY BY YEAR")
print("=" * 60)
yearly_yield = df.groupby('year')['yieldpercol'].mean().round(2)
print(yearly_yield)

# Price trends
print("\n" + "=" * 60)
print("AVERAGE PRICE PER POUND BY YEAR")
print("=" * 60)
yearly_price = df.groupby('year')['priceperlb'].mean().round(2)
print(yearly_price)

# Create visualizations
sns.set_style("whitegrid")
fig, axes = plt.subplots(2, 2, figsize=(15, 12))

# 1. Total Production Over Time
ax1 = axes[0, 0]
yearly_prod = df.groupby('year')['totalprod'].sum() / 1e6  # Convert to millions
ax1.plot(yearly_prod.index, yearly_prod.values, marker='o', linewidth=2, markersize=8)
ax1.set_title('Total Honey Production Over Time', fontsize=14, fontweight='bold')
ax1.set_xlabel('Year')
ax1.set_ylabel('Total Production (Millions of lbs)')
ax1.grid(True, alpha=0.3)

# 2. Top 10 States by Total Production
ax2 = axes[0, 1]
top_states = state_totals.head(10) / 1e6  # Convert to millions
ax2.barh(range(len(top_states)), top_states.values)
ax2.set_yticks(range(len(top_states)))
ax2.set_yticklabels(top_states.index)
ax2.set_title('Top 10 States by Total Production', fontsize=14, fontweight='bold')
ax2.set_xlabel('Total Production (Millions of lbs)')
ax2.invert_yaxis()

# 3. Average Price Per Pound Over Time
ax3 = axes[1, 0]
ax3.plot(yearly_price.index, yearly_price.values, marker='s', linewidth=2, markersize=8, color='orange')
ax3.set_title('Average Price Per Pound Over Time', fontsize=14, fontweight='bold')
ax3.set_xlabel('Year')
ax3.set_ylabel('Price Per Pound ($)')
ax3.grid(True, alpha=0.3)

# 4. Number of Colonies Over Time
ax4 = axes[1, 1]
yearly_colonies = df.groupby('year')['numcol'].sum() / 1e6  # Convert to millions
ax4.plot(yearly_colonies.index, yearly_colonies.values, marker='^', linewidth=2, markersize=8, color='green')
ax4.set_title('Total Number of Colonies Over Time', fontsize=14, fontweight='bold')
ax4.set_xlabel('Year')
ax4.set_ylabel('Number of Colonies (Millions)')
ax4.grid(True, alpha=0.3)

plt.tight_layout()
viz_path = os.path.join(script_dir, 'honey_analysis.png')
plt.savefig(viz_path, dpi=300, bbox_inches='tight')
print("\n" + "=" * 60)
print(f"Visualization saved as '{viz_path}'")
print("=" * 60)

# Additional analysis: States with highest production in recent years
print("\n" + "=" * 60)
print("TOP 10 STATES BY PRODUCTION (2010-2012 AVERAGE)")
print("=" * 60)
recent_years = df[df['year'] >= 2010]
recent_state_avg = recent_years.groupby('state')['totalprod'].mean().sort_values(ascending=False)
print((recent_state_avg.head(10) / 1e6).round(2))

# Yield analysis
print("\n" + "=" * 60)
print("STATES WITH HIGHEST AVERAGE YIELD PER COLONY")
print("=" * 60)
state_yield = df.groupby('state')['yieldpercol'].mean().sort_values(ascending=False)
print(state_yield.head(10).round(2))

plt.show()

