import pandas as pd

df = pd.read_csv("ML Service/Anomaly/Data/dataset_final_v6_final.csv")

print("Dataset shape:")
print(df.shape)

print("\nFirst 5 rows:")
print(df.head())

print("\nColumn information:")
print(df.info())

print("\nMissing values:")
print(df.isnull().sum())



# Convert date to datetime
df['date'] = pd.to_datetime(df['date'])

# Check unique values
print("Number of products:", df['item'].nunique())
print("Number of employees:", df['employee_id'].nunique())
print("Number of stores:", df['store'].nunique())
print("Shifts:", df['shift'].unique())

# Check date range
print("\nDate range:")
print("Start:", df['date'].min())
print("End:", df['date'].max())

# Check duplicate rows
print("\nDuplicate rows:", df.duplicated().sum())



product_summary = df.groupby('item')['sales'].agg(
    ['count', 'mean', 'std', 'min', 'max']
)

print(product_summary)


print("\nSales statistics:")
print(df['sales'].describe())


print("\nSales by product:")
print(
    df.groupby('item')['sales']
      .mean()
      .sort_values(ascending=False)
)


df = df.sort_values(['item', 'date']).reset_index(drop=True)

print(df[['date', 'item', 'sales']].head(20))


print("\nFirst product:")
print(df[df['item'] == 1][['date', 'item', 'sales']].head(10))

print("\nLast product:")
print(df[df['item'] == 50][['date', 'item', 'sales']].tail(10))


product_daily = (
    df.groupby(['date', 'item'], as_index=False)['sales']
      .sum()
)

print("Shape:", product_daily.shape)

print("\nFirst 20 rows:")
print(product_daily.head(20))

print("\nNumber of products:", product_daily['item'].nunique())
print("Number of dates:", product_daily['date'].nunique())


print("\nRows per product:")
print(product_daily.groupby('item').size().head(10))



product_daily = product_daily.sort_values(
    ['item', 'date']
).reset_index(drop=True)

product_daily['previous_7_mean'] = (
    product_daily
    .groupby('item')['sales']
    .transform(lambda x: x.shift(1).rolling(7).mean())
)

product_daily['previous_7_std'] = (
    product_daily
    .groupby('item')['sales']
    .transform(lambda x: x.shift(1).rolling(7).std())
)

print(product_daily.head(15))


print("\nMissing values in baseline:")
print(
    product_daily[
        ['previous_7_mean', 'previous_7_std']
    ].isnull().sum()
)


print(
    product_daily[
        product_daily['item'] == 1
    ].iloc[5:15]
)


product_daily['product_zscore'] = (
    (product_daily['sales'] - product_daily['previous_7_mean'])
    / product_daily['previous_7_std']
)

print(
    product_daily[
        ['date', 'item', 'sales',
         'previous_7_mean', 'previous_7_std',
         'product_zscore']
    ].iloc[7:20]
)

print("\nZ-score statistics:")
print(product_daily['product_zscore'].describe())


print("\nMost extreme product deviations:")

print(
    product_daily
    .dropna(subset=['product_zscore'])
    .sort_values(
        'product_zscore',
        key=lambda x: x.abs(),
        ascending=False
    )
    [['date', 'item', 'sales',
      'previous_7_mean', 'previous_7_std',
      'product_zscore']]
    .head(20)
)



product_daily['product_anomaly'] = (
    product_daily['product_zscore'].abs() >= 3
)

print("Product anomalies:")
print(product_daily['product_anomaly'].value_counts())


product_anomalies = product_daily[
    product_daily['product_anomaly']
].copy()

print("\nNumber of product anomalies:", len(product_anomalies))

print("\nProduct anomalies:")
print(
    product_anomalies[
        [
            'date',
            'item',
            'sales',
            'previous_7_mean',
            'previous_7_std',
            'product_zscore'
        ]
    ].head(30)
)


print("\nAnomalies by product:")

print(
    product_anomalies
    .groupby('item')
    .size()
    .sort_values(ascending=False)
)


df = df.merge(
    product_daily[
        ['date', 'item', 'product_anomaly', 'product_zscore']
    ],
    on=['date', 'item'],
    how='left'
)

print("New shape:", df.shape)

print("\nProduct anomaly counts in original dataset:")
print(df['product_anomaly'].value_counts())

print("\nSample product anomaly records:")
print(
    df[df['product_anomaly'] == True][
        [
            'date',
            'item',
            'store',
            'employee_id',
            'shift',
            'sales',
            'shift_units_sold',
            'product_zscore'
        ]
    ].head(20)
)


employee_structure = df.groupby(
    ['date', 'employee_id']
).agg(
    rows=('item', 'size'),
    stores=('store', 'nunique'),
    shifts=('shift', 'nunique'),
    total_units=('shift_units_sold', 'sum')
).reset_index()

print("Employee-date shape:", employee_structure.shape)

print("\nSample:")
print(employee_structure.head(20))

print("\nRows per employee-date:")
print(employee_structure['rows'].value_counts().sort_index())

print("\nStores per employee-date:")
print(employee_structure['stores'].value_counts().sort_index())

print("\nShifts per employee-date:")
print(employee_structure['shifts'].value_counts().sort_index())



employee_daily = (
    df.groupby(['date', 'employee_id'], as_index=False)
      .agg(
          total_units_sold=('shift_units_sold', 'sum'),
          store=('store', 'first'),
          shift=('shift', 'first')
      )
)

print("Shape:", employee_daily.shape)

print("\nFirst 20 rows:")
print(employee_daily.head(20))

print("\nRows per employee:")
print(employee_daily.groupby('employee_id').size())


employee_daily = employee_daily.sort_values(
    ['employee_id', 'date']
).reset_index(drop=True)

employee_daily['previous_7_mean'] = (
    employee_daily
    .groupby('employee_id')['total_units_sold']
    .transform(lambda x: x.shift(1).rolling(7).mean())
)

employee_daily['previous_7_std'] = (
    employee_daily
    .groupby('employee_id')['total_units_sold']
    .transform(lambda x: x.shift(1).rolling(7).std())
)

print(employee_daily.head(15))

print("\nMissing baseline values:")
print(
    employee_daily[
        ['previous_7_mean', 'previous_7_std']
    ].isnull().sum()
)

employee_daily['employee_zscore'] = (
    (employee_daily['total_units_sold'] - employee_daily['previous_7_mean'])
    / employee_daily['previous_7_std']
)

print(
    employee_daily[
        [
            'date',
            'employee_id',
            'total_units_sold',
            'previous_7_mean',
            'previous_7_std',
            'employee_zscore'
        ]
    ].iloc[7:20]
)

print("\nEmployee z-score statistics:")
print(employee_daily['employee_zscore'].describe())

print("\nMost extreme employee deviations:")
print(
    employee_daily
    .dropna(subset=['employee_zscore'])
    .sort_values(
        'employee_zscore',
        key=lambda x: x.abs(),
        ascending=False
    )
    [
        [
            'date',
            'employee_id',
            'total_units_sold',
            'previous_7_mean',
            'previous_7_std',
            'employee_zscore'
        ]
    ]
    .head(20)
)


employee_daily['employee_anomaly'] = (
    employee_daily['employee_zscore'].abs() >= 3
)

print("Employee anomalies:")
print(employee_daily['employee_anomaly'].value_counts())

print("\nNumber of employee anomalies:",
      employee_daily['employee_anomaly'].sum())

print("\nEmployee anomalies:")
print(
    employee_daily[
        employee_daily['employee_anomaly']
    ][
        [
            'date',
            'employee_id',
            'store',
            'shift',
            'total_units_sold',
            'previous_7_mean',
            'previous_7_std',
            'employee_zscore'
        ]
    ]
    .sort_values(
        'employee_zscore',
        key=lambda x: x.abs(),
        ascending=False
    )
    .head(30)
)

print("\nAnomalies by employee:")
print(
    employee_daily[
        employee_daily['employee_anomaly']
    ]
    .groupby('employee_id')
    .size()
    .sort_values(ascending=False)
)

df = df.merge(
    employee_daily[
        [
            'date',
            'employee_id',
            'employee_anomaly',
            'employee_zscore'
        ]
    ],
    on=['date', 'employee_id'],
    how='left'
)

print("New shape:", df.shape)

print("\nEmployee anomaly counts in original dataset:")
print(df['employee_anomaly'].value_counts())

print("\nSample employee anomaly records:")
print(
    df[df['employee_anomaly'] == True][
        [
            'date',
            'employee_id',
            'store',
            'shift',
            'item',
            'sales',
            'shift_units_sold',
            'employee_zscore'
        ]
    ].head(20)
)


df['combined_anomaly'] = (
    df['product_anomaly'] | df['employee_anomaly']
)

df['anomaly_type'] = 'none'

df.loc[
    df['product_anomaly'] & ~df['employee_anomaly'],
    'anomaly_type'
] = 'product_anomaly'

df.loc[
    ~df['product_anomaly'] & df['employee_anomaly'],
    'anomaly_type'
] = 'employee_anomaly'

df.loc[
    df['product_anomaly'] & df['employee_anomaly'],
    'anomaly_type'
] = 'product_and_employee_anomaly'

print("Anomaly type counts:")
print(df['anomaly_type'].value_counts())


print("Unique product anomaly events:",
      product_daily['product_anomaly'].sum())

print("Unique employee anomaly events:",
      employee_daily['employee_anomaly'].sum())

print("\nUnique product + employee anomaly combinations:")

combined_events = df[
    df['combined_anomaly'] == True
][
    [
        'date',
        'item',
        'employee_id',
        'store',
        'shift',
        'product_anomaly',
        'employee_anomaly',
        'product_zscore',
        'employee_zscore',
        'anomaly_type'
    ]
].drop_duplicates()

print("Number of unique combinations:", len(combined_events))

print("\nFirst 20:")
print(combined_events.head(20))


product_anomaly_summary = (
    product_daily[product_daily['product_anomaly']]
    .groupby('item')
    .agg(
        anomaly_count=('product_anomaly', 'sum'),
        highest_zscore=('product_zscore', 'max'),
        lowest_zscore=('product_zscore', 'min')
    )
    .sort_values('anomaly_count', ascending=False)
)

print(product_anomaly_summary)


employee_anomaly_summary = (
    employee_daily[employee_daily['employee_anomaly']]
    .groupby('employee_id')
    .agg(
        anomaly_count=('employee_anomaly', 'sum'),
        highest_zscore=('employee_zscore', 'max'),
        lowest_zscore=('employee_zscore', 'min')
    )
    .sort_values('anomaly_count', ascending=False)
)

print(employee_anomaly_summary)


both_anomalies = df[
    (df['product_anomaly'] == True) &
    (df['employee_anomaly'] == True)
][
    [
        'date',
        'item',
        'employee_id',
        'store',
        'shift',
        'sales',
        'shift_units_sold',
        'product_zscore',
        'employee_zscore',
        'anomaly_type'
    ]
].drop_duplicates()

print("Number of product + employee anomaly combinations:",
      len(both_anomalies))

print("\nFirst 20:")
print(both_anomalies.head(20))



combined_daily = (
    both_anomalies
    .groupby('date')
    .agg(
        affected_items=('item', 'nunique'),
        affected_employees=('employee_id', 'nunique'),
        total_combinations=('item', 'count')
    )
    .sort_values('total_combinations', ascending=False)
)

print(combined_daily.head(20))


date_check = df[
    (df['date'] == '2017-12-04') &
    (
        (df['product_anomaly'] == True) |
        (df['employee_anomaly'] == True)
    )
][
    [
        'date',
        'item',
        'employee_id',
        'store',
        'shift',
        'sales',
        'shift_units_sold',
        'product_zscore',
        'employee_zscore',
        'anomaly_type'
    ]
].drop_duplicates()

print("Number of anomaly combinations:", len(date_check))
print("\nAnomaly type counts:")
print(date_check['anomaly_type'].value_counts())

print("\nSample:")
print(date_check.head(30))

final_anomalies = df[
    df['combined_anomaly'] == True
][
    [
        'date',
        'item',
        'employee_id',
        'store',
        'shift',
        'sales',
        'shift_units_sold',
        'product_zscore',
        'employee_zscore',
        'product_anomaly',
        'employee_anomaly',
        'anomaly_type'
    ]
].drop_duplicates(
    subset=['date', 'item', 'employee_id']
).reset_index(drop=True)

print("Final anomaly dataset shape:", final_anomalies.shape)

print("\nColumns:")
print(final_anomalies.columns.tolist())

print("\nAnomaly type counts:")
print(final_anomalies['anomaly_type'].value_counts())

print("\nFirst 10 rows:")
print(final_anomalies.head(10))


top_product_anomalies = (
    product_daily[product_daily['product_anomaly']]
    .copy()
)

top_product_anomalies['absolute_zscore'] = (
    top_product_anomalies['product_zscore'].abs()
)

top_product_anomalies = (
    top_product_anomalies
    .sort_values('absolute_zscore', ascending=False)
    .head(20)
)

print(
    top_product_anomalies[
        [
            'date',
            'item',
            'sales',
            'previous_7_mean',
            'product_zscore'
        ]
    ]
)


top_employee_anomalies = (
    employee_daily[employee_daily['employee_anomaly']]
    .copy()
)

top_employee_anomalies['absolute_zscore'] = (
    top_employee_anomalies['employee_zscore'].abs()
)

top_employee_anomalies = (
    top_employee_anomalies
    .sort_values('absolute_zscore', ascending=False)
    .head(20)
)

print(
    top_employee_anomalies[
        [
            'date',
            'employee_id',
            'store',
            'shift',
            'total_units_sold',
            'previous_7_mean',
            'employee_zscore'
        ]
    ]
)


summary = pd.DataFrame({
    'Metric': [
        'Total original records',
        'Unique products',
        'Unique employees',
        'Product anomaly events',
        'Employee anomaly events',
        'Final anomaly combinations',
        'Product-only combinations',
        'Employee-only combinations',
        'Product + Employee combinations'
    ],
    'Value': [
        len(df),
        df['item'].nunique(),
        df['employee_id'].nunique(),
        int(product_daily['product_anomaly'].sum()),
        int(employee_daily['employee_anomaly'].sum()),
        len(final_anomalies),
        int((final_anomalies['anomaly_type'] == 'product_anomaly').sum()),
        int((final_anomalies['anomaly_type'] == 'employee_anomaly').sum()),
        int((final_anomalies['anomaly_type'] == 'product_and_employee_anomaly').sum())
    ]
})

print(summary)





print("ISOLATION FOREST STEP 1")

from sklearn.ensemble import IsolationForest

product_ml = product_daily[
    ['item', 'sales', 'previous_7_mean', 'previous_7_std']
].dropna().copy()

print("Shape:", product_ml.shape)
print(product_ml.head())


product_model = IsolationForest(
    n_estimators=100,
    contamination='auto',
    random_state=42
)

product_model.fit(
    product_ml[['sales', 'previous_7_mean', 'previous_7_std']]
)

print("Product Isolation Forest model trained successfully.")



product_ml['isolation_anomaly'] = product_model.predict(
    product_ml[['sales', 'previous_7_mean', 'previous_7_std']]
)

product_ml['isolation_anomaly'] = (
    product_ml['isolation_anomaly'] == -1
)

print(product_ml['isolation_anomaly'].value_counts())


product_ml['isolation_score'] = product_model.decision_function(
    product_ml[['sales', 'previous_7_mean', 'previous_7_std']]
)

print(product_ml[['item', 'sales', 'isolation_score', 'isolation_anomaly']].head())



comparison = pd.crosstab(
    product_ml['isolation_anomaly'],
    product_daily.loc[product_ml.index, 'product_zscore'].abs() >= 3
)

print(comparison)

print(product_ml['isolation_score'].describe())


product_model = IsolationForest(
    n_estimators=100,
    contamination=0.004,
    random_state=42
)

product_model.fit(
    product_ml[['sales', 'previous_7_mean', 'previous_7_std']]
)

print("Isolation Forest retrained with 0.4% contamination.")
product_ml['isolation_anomaly'] = product_model.predict(
    product_ml[['sales', 'previous_7_mean', 'previous_7_std']]
)

product_ml['isolation_anomaly'] = (
    product_ml['isolation_anomaly'] == -1
)

print(product_ml['isolation_anomaly'].value_counts())


comparison = pd.crosstab(
    product_ml['isolation_anomaly'],
    product_daily.loc[product_ml.index, 'product_zscore'].abs() >= 3
)

print(comparison)


isolation_anomalies = product_ml[
    product_ml['isolation_anomaly']
].copy()

isolation_anomalies['product_zscore'] = (
    product_daily.loc[
        isolation_anomalies.index,
        'product_zscore'
    ]
)

print(
    isolation_anomalies[
        [
            'item',
            'sales',
            'previous_7_mean',
            'previous_7_std',
            'product_zscore'
        ]
    ]
    .sort_values(
        'product_zscore',
        key=lambda x: x.abs(),
        ascending=False
    )
    .head(20)
)

product_ml['deviation'] = (
    product_ml['sales'] - product_ml['previous_7_mean']
)

product_ml['deviation_ratio'] = (
    product_ml['sales'] / product_ml['previous_7_mean']
)

print(product_ml[['sales', 'previous_7_mean', 'deviation', 'deviation_ratio']].head())


# STEP 10 — Train Isolation Forest with improved features

product_features = [
    'sales',
    'previous_7_mean',
    'previous_7_std',
    'deviation',
    'deviation_ratio'
]

product_model = IsolationForest(
    n_estimators=100,
    contamination=0.004,
    random_state=42
)

product_model.fit(
    product_ml[product_features]
)

print("Product Isolation Forest retrained successfully.")


product_ml['isolation_anomaly'] = product_model.predict(
    product_ml[product_features]
)

product_ml['isolation_anomaly'] = (
    product_ml['isolation_anomaly'] == -1
)

print(product_ml['isolation_anomaly'].value_counts())


comparison = pd.crosstab(
    product_ml['isolation_anomaly'],
    product_daily.loc[
        product_ml.index,
        'product_zscore'
    ].abs() >= 3
)

print(comparison)


product_if_anomalies = product_ml[
    product_ml['isolation_anomaly']
].copy()

product_if_anomalies['product_zscore'] = (
    product_daily.loc[
        product_if_anomalies.index,
        'product_zscore'
    ]
)

print(
    product_if_anomalies[
        [
            'item',
            'sales',
            'previous_7_mean',
            'previous_7_std',
            'deviation',
            'deviation_ratio',
            'product_zscore'
        ]
    ]
    .sort_values(
        'product_zscore',
        key=lambda x: x.abs(),
        ascending=False
    )
    .head(20)
)

employee_ml = employee_daily[
    [
        'employee_id',
        'total_units_sold',
        'previous_7_mean',
        'previous_7_std'
    ]
].dropna().copy()

print("Employee ML shape:", employee_ml.shape)
print(employee_ml.head())



employee_ml['deviation'] = (
    employee_ml['total_units_sold']
    - employee_ml['previous_7_mean']
)

employee_ml['deviation_ratio'] = (
    employee_ml['total_units_sold']
    / employee_ml['previous_7_mean']
)

print(employee_ml[
    [
        'total_units_sold',
        'previous_7_mean',
        'previous_7_std',
        'deviation',
        'deviation_ratio'
    ]
].head())




employee_features = [
    'total_units_sold',
    'previous_7_mean',
    'previous_7_std',
    'deviation',
    'deviation_ratio'
]

employee_model = IsolationForest(
    n_estimators=100,
    contamination=0.004,
    random_state=42
)

employee_model.fit(
    employee_ml[employee_features]
)

print("Employee Isolation Forest trained successfully.")



employee_ml['isolation_anomaly'] = employee_model.predict(
    employee_ml[employee_features]
)

employee_ml['isolation_anomaly'] = (
    employee_ml['isolation_anomaly'] == -1
)

print(employee_ml['isolation_anomaly'].value_counts())


employee_comparison = pd.crosstab(
    employee_ml['isolation_anomaly'],
    employee_daily.loc[
        employee_ml.index,
        'employee_zscore'
    ].abs() >= 3
)

print(employee_comparison)


employee_if_anomalies = employee_ml[
    employee_ml['isolation_anomaly']
].copy()

employee_if_anomalies['employee_zscore'] = (
    employee_daily.loc[
        employee_if_anomalies.index,
        'employee_zscore'
    ]
)

print(
    employee_if_anomalies[
        [
            'employee_id',
            'total_units_sold',
            'previous_7_mean',
            'previous_7_std',
            'deviation',
            'deviation_ratio',
            'employee_zscore'
        ]
    ]
    .sort_values(
        'employee_zscore',
        key=lambda x: x.abs(),
        ascending=False
    )
    .head(20)
)


print("PRODUCT ISOLATION FOREST ANOMALIES:",
      product_ml['isolation_anomaly'].sum())

print("PRODUCT Z-SCORE ANOMALIES:",
      (product_daily.loc[
          product_ml.index,
          'product_zscore'
      ].abs() >= 3).sum())

print()

print("EMPLOYEE ISOLATION FOREST ANOMALIES:",
      employee_ml['isolation_anomaly'].sum())

print("EMPLOYEE Z-SCORE ANOMALIES:",
      (employee_daily.loc[
          employee_ml.index,
          'employee_zscore'
      ].abs() >= 3).sum())



# STEP 1 — Add Isolation Forest results to original dataset

df = df.merge(
    product_ml[
        ['item', 'isolation_anomaly', 'isolation_score']
    ].rename(columns={
        'isolation_anomaly': 'product_if_anomaly',
        'isolation_score': 'product_if_score'
    }),
    left_index=True,
    right_index=True,
    how='left'
)

df = df.merge(
    employee_ml[
        ['employee_id', 'isolation_anomaly']
    ].rename(columns={
        'isolation_anomaly': 'employee_if_anomaly'
    }),
    left_index=True,
    right_index=True,
    how='left'
)

print(df.shape)
print(df.columns.tolist())


# STEP 2 — Clean duplicate columns

df = df.drop(columns=['item_y', 'employee_id_y'])

df = df.rename(columns={
    'item_x': 'item',
    'employee_id_x': 'employee_id'
})

print(df.shape)
print(df.columns.tolist())


# STEP 3 — Create final anomaly dataset

final_anomalies = df[
    (df['combined_anomaly'] == True) |
    (df['product_if_anomaly'] == True) |
    (df['employee_if_anomaly'] == True)
][
    [
        'date',
        'store',
        'item',
        'sales',
        'employee_id',
        'shift',
        'shift_units_sold',
        'price',
        'expected_units',
        'product_zscore',
        'employee_zscore',
        'product_anomaly',
        'employee_anomaly',
        'product_if_anomaly',
        'employee_if_anomaly',
        'product_if_score',
        'anomaly_type'
    ]
].drop_duplicates(
    subset=['date', 'store', 'item', 'employee_id']
).reset_index(drop=True)

print(final_anomalies.shape)
print(final_anomalies.head())


# STEP 4 — Save final CSV

final_anomalies.to_csv(
    'final_anomaly_detection.csv',
    index=False
)

print("CSV created successfully!")
print("Rows:", len(final_anomalies))
print("Columns:", len(final_anomalies.columns))