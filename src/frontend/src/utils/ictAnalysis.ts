import type { Candle } from "./mockData";

export interface FVGZone {
  type: "bullish" | "bearish";
  top: number;
  bottom: number;
  time: number;
  filled: boolean;
}

export interface LiquiditySweep {
  type: "bullish" | "bearish";
  price: number;
  time: number;
  description: string;
}

export type AMDPhase =
  | "Accumulation"
  | "Manipulation"
  | "Distribution"
  | "Unknown";

export interface ICTAnalysis {
  fvgZones: FVGZone[];
  liquiditySweeps: LiquiditySweep[];
  amdPhase: AMDPhase;
  amdDescription: string;
}

export interface TradeSignal {
  id: string;
  pair: string;
  direction: "Long" | "Short";
  grade: "A+" | "A" | "B" | "C";
  entry: number;
  target: number;
  stopLoss: number;
  rr: number;
  time: number;
  status: "ACTIVE" | "TP HIT" | "SL HIT";
  confluences: string[];
}

export function detectFVGs(candles: Candle[]): FVGZone[] {
  const zones: FVGZone[] = [];
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const next = candles[i + 1];

    // Bullish FVG: gap between prev high and next low
    if (prev.high < next.low) {
      zones.push({
        type: "bullish",
        top: next.low,
        bottom: prev.high,
        time: curr.time,
        filled: false,
      });
    }

    // Bearish FVG: gap between prev low and next high
    if (prev.low > next.high) {
      zones.push({
        type: "bearish",
        top: prev.low,
        bottom: next.high,
        time: curr.time,
        filled: false,
      });
    }
  }

  // Mark filled FVGs
  const recentCandles = candles.slice(-20);
  return zones.slice(-10).map((zone) => {
    const filled = recentCandles.some((c) => {
      if (zone.type === "bullish") return c.low <= zone.bottom;
      return c.high >= zone.top;
    });
    return { ...zone, filled };
  });
}

export function detectLiquiditySweeps(candles: Candle[]): LiquiditySweep[] {
  const sweeps: LiquiditySweep[] = [];
  const threshold = 0.001; // within 0.1% for equal highs/lows

  for (let i = 5; i < candles.length - 1; i++) {
    const lookback = candles.slice(i - 5, i);
    const curr = candles[i];

    // Check for equal highs swept
    const avgHigh = lookback.reduce((s, c) => s + c.high, 0) / lookback.length;
    const equalHighs = lookback.filter(
      (c) => Math.abs(c.high - avgHigh) / avgHigh < threshold,
    );
    if (equalHighs.length >= 2 && curr.high > avgHigh && curr.close < avgHigh) {
      sweeps.push({
        type: "bearish",
        price: curr.high,
        time: curr.time,
        description: "Equal Highs Swept",
      });
    }

    // Check for equal lows swept
    const avgLow = lookback.reduce((s, c) => s + c.low, 0) / lookback.length;
    const equalLows = lookback.filter(
      (c) => Math.abs(c.low - avgLow) / avgLow < threshold,
    );
    if (equalLows.length >= 2 && curr.low < avgLow && curr.close > avgLow) {
      sweeps.push({
        type: "bullish",
        price: curr.low,
        time: curr.time,
        description: "Equal Lows Swept",
      });
    }
  }

  return sweeps.slice(-5);
}

export function detectAMDPhase(candles: Candle[]): {
  phase: AMDPhase;
  description: string;
} {
  if (candles.length < 20)
    return { phase: "Unknown", description: "Insufficient data" };

  const recent = candles.slice(-30);
  const atrValues: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const tr = Math.max(
      recent[i].high - recent[i].low,
      Math.abs(recent[i].high - recent[i - 1].close),
      Math.abs(recent[i].low - recent[i - 1].close),
    );
    atrValues.push(tr);
  }
  const avgATR = atrValues.reduce((s, v) => s + v, 0) / atrValues.length;
  const lastATR = atrValues.slice(-5).reduce((s, v) => s + v, 0) / 5;

  const last10 = recent.slice(-10);
  const rangeHigh = Math.max(...last10.map((c) => c.high));
  const rangeLow = Math.min(...last10.map((c) => c.low));
  const rangeSize = rangeHigh - rangeLow;
  const rangeATR = rangeSize / 10;

  // Check for manipulation: a wick that exceeds the range then reverses
  const prevRange5 = recent.slice(-15, -5);
  const prevHigh = Math.max(...prevRange5.map((c) => c.high));
  const prevLow = Math.min(...prevRange5.map((c) => c.low));
  const lastCandle = recent[recent.length - 1];
  const manipulationUp =
    lastCandle.high > prevHigh * 1.001 && lastCandle.close < prevHigh;
  const manipulationDown =
    lastCandle.low < prevLow * 0.999 && lastCandle.close > prevLow;

  if (manipulationUp || manipulationDown) {
    return {
      phase: "Manipulation",
      description: manipulationUp
        ? "Judas Swing Up – Bearish reversal expected"
        : "Judas Swing Down – Bullish reversal expected",
    };
  }

  // Accumulation: low ATR, tight range
  if (rangeATR < avgATR * 0.7) {
    return {
      phase: "Accumulation",
      description: "Tight range consolidation – Smart money loading",
    };
  }

  // Distribution: trending after manipulation (higher ATR)
  if (lastATR > avgATR * 1.2) {
    const bullish = lastCandle.close > recent[recent.length - 5].close;
    return {
      phase: "Distribution",
      description: bullish
        ? "Bullish distribution – Trending higher"
        : "Bearish distribution – Trending lower",
    };
  }

  return {
    phase: "Accumulation",
    description: "Ranging market – Wait for manipulation",
  };
}

export function generateTradeSignals(
  pair: string,
  candles: Candle[],
  fvgs: FVGZone[],
  sweeps: LiquiditySweep[],
  amdPhase: AMDPhase,
): TradeSignal[] {
  if (candles.length < 10) return [];

  const signals: TradeSignal[] = [];
  const lastCandle = candles[candles.length - 1];
  const recentFVGs = fvgs.filter((z) => !z.filled).slice(-3);
  const recentSweeps = sweeps.slice(-2);

  for (const sweep of recentSweeps) {
    const direction = sweep.type === "bullish" ? "Long" : "Short";
    const confluences: string[] = [`Liquidity Sweep (${sweep.description})`];

    // Find aligned FVG
    const alignedFVG = recentFVGs.find((z) => {
      if (direction === "Long") return z.type === "bullish";
      return z.type === "bearish";
    });

    if (alignedFVG) confluences.push("Fair Value Gap");
    if (
      (amdPhase === "Manipulation" && direction === "Long") ||
      (amdPhase === "Distribution" && direction === "Long") ||
      amdPhase === "Accumulation"
    ) {
      confluences.push(`AMD: ${amdPhase}`);
    }

    let entry: number;
    let stopLoss: number;
    let target: number;

    if (direction === "Long") {
      entry = alignedFVG
        ? (alignedFVG.top + alignedFVG.bottom) / 2
        : lastCandle.close * 0.9998;
      stopLoss = sweep.price * 0.9995;
      target = lastCandle.close * 1.003;
    } else {
      entry = alignedFVG
        ? (alignedFVG.top + alignedFVG.bottom) / 2
        : lastCandle.close * 1.0002;
      stopLoss = sweep.price * 1.0005;
      target = lastCandle.close * 0.997;
    }

    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(target - entry);
    const rr = risk > 0 ? reward / risk : 0;

    // Grade the signal
    let grade: "A+" | "A" | "B" | "C";
    if (confluences.length >= 3 && rr >= 3) grade = "A+";
    else if (confluences.length >= 2 && rr >= 2) grade = "A";
    else if (confluences.length >= 1 && rr >= 1.5) grade = "B";
    else grade = "C";

    signals.push({
      id: `${pair}-${sweep.time}-${direction}`,
      pair,
      direction,
      grade,
      entry,
      target,
      stopLoss,
      rr: Math.round(rr * 10) / 10,
      time: sweep.time,
      status: "ACTIVE",
      confluences,
    });
  }

  return signals;
}

export function runFullAnalysis(
  pair: string,
  candles: Candle[],
): { analysis: ICTAnalysis; signals: TradeSignal[] } {
  const fvgZones = detectFVGs(candles);
  const liquiditySweeps = detectLiquiditySweeps(candles);
  const { phase, description } = detectAMDPhase(candles);
  const signals = generateTradeSignals(
    pair,
    candles,
    fvgZones,
    liquiditySweeps,
    phase,
  );

  return {
    analysis: {
      fvgZones,
      liquiditySweeps,
      amdPhase: phase,
      amdDescription: description,
    },
    signals,
  };
}
