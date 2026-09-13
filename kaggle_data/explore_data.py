import pandas as pd

df = pd.read_csv("train copy.csv")

print("Shape:", df.shape)
print("\nColumns:", df.columns.tolist())
print("\nFirst 5 rows:")
print(df.head())
print("\nData types:")
print(df.dtypes)
print("\nMissing values:")
print(df.isnull().sum())
print("\nDate range:", df['date'].min(), "to", df['date'].max())
print("\nUnique stores:", df['store'].nunique())
print("Unique items:", df['item'].nunique())