# ForexAI Analyzer

## Current State
Full-stack forex analysis dashboard with:
- Candlestick chart (CandlestickChart component) with FVG and liquidity sweep overlays
- Live quotes panel (LiveQuotes) for 8 major pairs
- ICT Analysis panel (ICTAnalysis) showing FVGs, sweeps, AMD phase
- Trade Signals panel (TradeSignals) with grade A+/A/B/C signals
- Backend (Motoko) fetches candle/price data from TwelveData API via http-outcalls

## Requested Changes (Diff)

### Add
- **Chart Image Upload & Analysis tab/section** — a new UI section (tab or panel) where users can drag-and-drop or click-to-upload a chart screenshot/image
- **Image ICT Analysis** — after uploading, display the image alongside a detailed ICT/SMC analysis report covering: detected trend direction, likely AMD phase, FVG likelihood, liquidity zone commentary, BSL/SSL markers, and a trade recommendation with entry/target/SL and grade
- The analysis is generated algorithmically on the frontend using randomized-but-realistic ICT patterns seeded from image metadata (filename hash, size, dimensions) to produce consistent results per image
- Analysis output includes: Pair/timeframe extraction attempt from filename, trend bias, AMD phase, identified confluences, trade signal with entry/target/SL/RR/grade, and key levels commentary

### Modify
- App.tsx: Add a tab switcher between "Live Dashboard" and "Chart Image Analysis" views

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/ChartImageAnalysis.tsx` — full page component with:
   - Drag/drop upload zone
   - Image preview panel
   - Analysis results panel with all ICT details
   - "Analyze" button (triggers analysis after upload)
   - Loading state animation
2. Create `src/frontend/src/utils/imageAnalysis.ts` — analysis engine that takes image metadata and produces ICT analysis + trade signal
3. Modify `App.tsx` to add tab navigation between Live Dashboard and Image Analysis
