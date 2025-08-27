# Simple Statistics Report

This short report covers only the two basic analyses kept on the statistics page: correlation and a straight-line (linear) regression.

## Goal
See whether countries with higher Internet usage (%) also report higher happiness scores.

## Data
- Internet usage 2024 (% of population using the Internet)
- World Happiness Report 2024 (Happiness ladder score 0–10)
Only countries present in both files with valid numbers were used.

## Method (Very Simple)
1. Load both CSV files in the browser.
2. Match rows by exact country name.
3. Create pairs: (Internet %, Happiness score).
4. Calculate two correlations: Pearson (linear) and Spearman (rank).
5. Fit a linear regression: Happiness = intercept + slope * Internet%.
6. Draw a scatter plot with the fitted line and list slope, intercept, R².

## Correlation Results (Fill In After Running)
- Pearson: ____ (interpret: weak / moderate / strong, positive or negative)
- Spearman: ____ (similar or different? note it)

Interpretation guide: |r| near 0 = weak, ~0.3 = small, ~0.5 = moderate, >=0.7 = strong.

## Regression Results (Fill In After Running)
- Slope: ____ (meaning: a +1% Internet usage relates to about ___ change in happiness)
- Intercept: ____ (happiness when Internet% = 0; not very meaningful, but part of the equation)
- R²: ____ (0–1, higher means the line explains more variation)

Example wording once values known: A 10 percentage point higher Internet usage is associated with about X higher happiness score (on a 0–10 scale), with an R² of Y (meaning Y*100% of variation explained by this single factor).

## Limitations
- Correlation does not prove causation.
- Many other factors (income, health, freedom) not included.
- Single year only; no trend information.
- Linear shape assumed; real relationship could curve.

## Summary Sentence (Write After Viewing Page)
Internet usage and happiness show a (weak/moderate/strong) (positive/negative) relationship (give Pearson value), but other factors matter and causation is not shown.
