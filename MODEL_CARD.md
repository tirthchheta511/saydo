# SayDo — model card

SayDo reads the promises companies make in their earnings press releases, checks them against the results they later report, scores each company, and forecasts new promises.

## Data
- Earnings press releases and official results of S&P 500 companies, filed with the SEC, 2019 to 2026.
- 35,010 promises read from 439 companies; 15,214 could be matched with an official result and scored.
- The models use 9,597 promises read from guidance sections ("confident" promises), from 295 companies.

## How well the promises are read
- A blind hand check of 90 fresh promises: about 81% read fully right (95% range 72%–89%).
- By where the promise was found: guidance section about 87% right | single sentence about 51% right. Only promises from guidance sections are used by the models.

## Model 1: will the promise be kept?
- Boosted trees, learning only from outcomes public before 2024-01-01, tested once on 3,328 promises made after that day.
- Ranking score 0.74 (95% range 0.71–0.78); a coin flip scores 0.50, the company's track record alone 0.66.
- When the model says a chance, it is close to what happens: average distance 3.0 points across five groups.
- Weakest corner of the test: operating margin (0.53). Strongest: 2026 (0.85).
- Other dividing lines between past and future: 2023-01-01: 0.71 | 2024-01-01: 0.74 | 2025-01-01: 0.77.
- Sanity check: taught scrambled answers, the model scores 0.49 on average, so its skill comes from the real outcomes.
- It leans most on: which measure (-0.009 without it); the pace so far this year (-0.007 without it); how ambitious the promise is (-0.007 without it); whether it was raised or lowered before (-0.006 without it).

## Model 2: where will revenue land?
- Learned forecaster, tested on 1,299 revenue promises made from 2024-01-01 on.
- Typical miss 1.29% of the real revenue, against 1.77% for the promise midpoint and 1.34% for "assume the top of the range".
- Against "assume the top of the range", the average miss is -0.26 points (95% range -0.44 to -0.12): smaller, proven.
- Companies' own ranges held the result 34% of the time; the forecaster's "8 out of 10" range held it 82% of the time.

## The Say-Do score
- 109 companies have enough promises both before and after 2023. Agreement between the two halves: 0.43 (95% range 0.26 to 0.59) — a lasting trait.
- The best third before 2023 kept 89% of later promises; the worst third kept 70%.

## Limits — read before using
- About 13% of the promises used are still misread. Company names at the top and bottom of the ranking need a hand check before they are published.
- Only promises that can be checked against official (GAAP) figures are scored. Promises on an adjusted basis, which are very common, are set aside.
- A high Say-Do score can mean cautious promises as much as strong results. It measures the gap between words and results, not the quality of the business.
- Only large U.S. companies that are in the S&P 500 today. Companies that left the index are missing.
- The revenue forecaster rarely warns of a miss: of 93 test promises that ended below their range, it called "likely below" for 0%. Use Model 1 for warnings.
- The forecaster is worse than the plain midpoint for: full year, made during the year, Financials, Health Care.
- Model 1 is weak (ranking under 0.60) for: operating margin, net income, Financials.
- The test period (2024 to 2026) had no shock like 2020, when far fewer promises were kept. The models have not been tested through one.
- The answer key used to build the reader was labelled with AI assistance; the hand check of a 50-label sample is not finished.
- This is a research and portfolio project. It is not investment advice.
