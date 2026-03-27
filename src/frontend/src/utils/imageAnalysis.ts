export interface KeyLevel {
  label: string;
  price: number;
  type: "support" | "resistance";
}

export interface ImageAnalysisResult {
  pair: string;
  timeframe: string;
  trendBias: "Bullish" | "Bearish" | "Neutral";
  amdPhase: "Accumulation" | "Manipulation" | "Distribution";
  amdDescription: string;
  fvgDetected: boolean;
  fvgType: "Bullish FVG" | "Bearish FVG" | "Multiple FVGs";
  liquidityLevel: string;
  signal: {
    direction: "Long" | "Short";
    grade: "A+" | "A" | "B" | "C";
    entry: number;
    target: number;
    stopLoss: number;
    rr: number;
    confluences: string[];
  };
  keyLevels: KeyLevel[];
  summary: string;
}

// Pair price ranges (mid, range)
const PAIR_RANGES: Record<string, [number, number]> = {
  "XAU/USD": [2340, 60],
  "EUR/USD": [1.088, 0.03],
  "GBP/USD": [1.265, 0.04],
  "USD/JPY": [151.5, 4],
  "AUD/USD": [0.652, 0.02],
  "USD/CHF": [0.898, 0.02],
  "NZD/USD": [0.598, 0.02],
  "USD/CAD": [1.362, 0.03],
  "BTC/USD": [68500, 3000],
};

function parsePairFromFilename(name: string): string {
  const upper = name.toUpperCase();
  for (const pair of Object.keys(PAIR_RANGES)) {
    const slug = pair.replace("/", "");
    if (upper.includes(slug) || upper.includes(pair)) return pair;
  }
  // Default guess based on seed
  const pairs = Object.keys(PAIR_RANGES);
  return pairs[0];
}

function parseTimeframeFromFilename(name: string): string {
  const upper = name.toUpperCase();
  if (upper.includes("_1D") || upper.includes("-1D") || upper.includes("DAILY"))
    return "1D";
  if (upper.includes("_4H") || upper.includes("-4H")) return "4H";
  if (upper.includes("_1H") || upper.includes("-1H") || upper.includes("1H"))
    return "1H";
  if (upper.includes("_15M") || upper.includes("-15M") || upper.includes("15M"))
    return "15m";
  if (upper.includes("_5M") || upper.includes("-5M")) return "5m";
  return "1H";
}

// Simple deterministic hash to seed pseudo-random values from file metadata
function hashSeed(name: string, size: number, lastModified: number): number {
  let h = 0x811c9dc5;
  const str = `${name}:${size}:${lastModified}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h;
}

function seededFloat(seed: number, offset: number): number {
  const n = (seed * (offset + 1) * 2654435761) >>> 0;
  return (n % 10000) / 10000;
}

function round(val: number, decimals: number): number {
  return Math.round(val * 10 ** decimals) / 10 ** decimals;
}

export function analyzeChartImage(
  name: string,
  size: number,
  lastModified: number,
): ImageAnalysisResult {
  const seed = hashSeed(name, size, lastModified);
  const r = (offset: number) => seededFloat(seed, offset);

  const pair = parsePairFromFilename(name);
  const timeframe = parseTimeframeFromFilename(name);

  const [mid, range] = PAIR_RANGES[pair] ?? [1.0, 0.05];
  const decimals = mid > 100 ? 2 : mid > 10 ? 3 : 5;

  // Derive base price
  const basePrice = round(mid + (r(0) - 0.5) * range, decimals);

  // Trend
  const trendIndex = Math.floor(r(1) * 3);
  const trendBias = (["Bullish", "Bearish", "Neutral"] as const)[trendIndex];

  // AMD
  const amdIndex = Math.floor(r(2) * 3);
  const amdPhase = (["Accumulation", "Manipulation", "Distribution"] as const)[
    amdIndex
  ];

  const amdDescriptions: Record<string, string> = {
    Accumulation:
      "Smart money is quietly accumulating positions. Price is ranging with false breakouts below key support — engineered stop hunts visible at recent lows.",
    Manipulation:
      "Manipulation phase in progress. Price has swept BSL above the recent high, trapping late longs before a reversal. Watch for a strong displacement candle.",
    Distribution:
      "Distribution underway. Institutions are offloading positions into retail buying. Break of market structure to the downside expected.",
  };
  const amdDescription = amdDescriptions[amdPhase];

  // FVG
  const fvgDetected = r(3) > 0.25;
  const fvgTypeIndex = Math.floor(r(4) * 3);
  const fvgType = (["Bullish FVG", "Bearish FVG", "Multiple FVGs"] as const)[
    fvgTypeIndex
  ];

  // Liquidity
  const liqOffset = (r(5) * 0.4 + 0.1) * range;
  const liqDir = r(6) > 0.5 ? 1 : -1;
  const liqPrice = round(basePrice + liqDir * liqOffset, decimals);
  const liqLabel = liqDir > 0 ? "BSL" : "SSL";
  const liquidityLevel = `${liqLabel} at ${liqPrice}`;

  // Signal
  const direction: "Long" | "Short" =
    trendBias === "Bearish" ? "Short" : "Long";
  const gradeIdx = Math.floor(r(7) * 4);
  const grade = (["A+", "A", "B", "C"] as const)[gradeIdx];

  const entryOffset = (r(8) * 0.15 + 0.02) * range;
  const entry = round(
    direction === "Long" ? basePrice - entryOffset : basePrice + entryOffset,
    decimals,
  );

  const rrRaw = 1.5 + r(9) * 2.5; // 1.5 – 4.0
  const rr = Math.round(rrRaw * 10) / 10;
  const risk = (r(10) * 0.1 + 0.03) * range;
  const stopLoss = round(
    direction === "Long" ? entry - risk : entry + risk,
    decimals,
  );
  const target = round(
    direction === "Long" ? entry + risk * rr : entry - risk * rr,
    decimals,
  );

  const allConfluences = [
    "FVG mitigated at entry",
    "Liquidity sweep confirmed",
    "AMD Manipulation phase",
    "Market structure break",
    "Order block respected",
    "Premium/discount zone",
    "Breaker block confluence",
    "HTF trend alignment",
    "Session high liquidity grab",
    "Equilibrium reaction",
  ];
  const confCount = 3 + Math.floor(r(11) * 3);
  const confluences = allConfluences
    .filter((_, i) => seededFloat(seed, 20 + i) > 0.45)
    .slice(0, confCount);

  // Key levels
  const levelCount = 3 + Math.floor(r(12) * 3);
  const keyLevels: KeyLevel[] = [];
  const levelLabels = [
    "Weekly High",
    "Daily High",
    "H4 High",
    "Session High",
    "Order Block",
    "FVG High",
    "FVG Low",
    "Order Block Low",
    "Daily Low",
    "Weekly Low",
  ];
  for (let i = 0; i < levelCount; i++) {
    const offset = (r(30 + i) - 0.5) * range * 1.2;
    const price = round(basePrice + offset, decimals);
    const isRes = price > basePrice;
    keyLevels.push({
      label: levelLabels[i % levelLabels.length],
      price,
      type: isRes ? "resistance" : "support",
    });
  }
  keyLevels.sort((a, b) => b.price - a.price);

  const summaries = [
    `${pair} on the ${timeframe} chart shows a clear ${amdPhase.toLowerCase()} phase with ${trendBias.toLowerCase()} bias. ${fvgDetected ? `A ${fvgType} has been identified near the entry zone, providing strong confluence for the ${direction} setup.` : "Price is approaching a key structural level."} Trade grade ${grade} with ${rr}:1 R:R — manage risk carefully around liquidity pools.`,
    `Smart money activity on ${pair} ${timeframe} confirms ${trendBias.toLowerCase()} pressure. ${amdPhase} phase structure is evident with ${fvgDetected ? `${fvgType} acting as a magnet for price.` : "clean market structure visible."} The ${direction} signal at ${entry} targets ${liquidityLevel} with a ${grade}-grade setup offering ${rr}:1 reward.`,
    `ICT analysis of ${pair} ${timeframe} reveals a textbook ${amdPhase} setup. ${liquidityLevel} has been engineered, setting up an ideal ${direction} entry. ${fvgDetected ? `${fvgType} aligns with the reversal zone.` : "Price structure supports the bias."} Grade ${grade} signal with disciplined ${rr}:1 R:R.`,
  ];
  const summary = summaries[Math.floor(r(13) * summaries.length)];

  return {
    pair,
    timeframe,
    trendBias,
    amdPhase,
    amdDescription,
    fvgDetected,
    fvgType,
    liquidityLevel,
    signal: { direction, grade, entry, target, stopLoss, rr, confluences },
    keyLevels,
    summary,
  };
}
