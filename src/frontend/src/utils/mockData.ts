export interface Candle {
  time: number; // unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateMockCandles(
  symbol: string,
  interval: string,
  count = 200,
): Candle[] {
  const basePrice = getBasePrice(symbol);
  const volatility = getVolatility(symbol);
  const intervalSeconds = getIntervalSeconds(interval);
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * intervalSeconds;

  const candles: Candle[] = [];
  let price = basePrice;
  // Add some trend bias
  const trendBias = (Math.random() - 0.5) * 0.0002;

  for (let i = 0; i < count; i++) {
    const time = startTime + i * intervalSeconds;
    const change = (Math.random() - 0.5) * volatility + trendBias;
    const open = price;
    const close = Math.max(price * (1 + change), 0.0001);
    const highExtra = Math.random() * volatility * 0.5;
    const lowExtra = Math.random() * volatility * 0.5;
    const high = Math.max(open, close) * (1 + highExtra);
    const low = Math.min(open, close) * (1 - lowExtra);
    const volume = Math.floor(Math.random() * 10000 + 1000);

    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export function getBasePrice(symbol: string): number {
  const prices: Record<string, number> = {
    "EUR/USD": 1.08542,
    "GBP/USD": 1.26318,
    "USD/JPY": 149.872,
    "AUD/USD": 0.65234,
    "USD/CHF": 0.89412,
    "NZD/USD": 0.60123,
    "USD/CAD": 1.35678,
    "XAU/USD": 2341.5,
  };
  return prices[symbol] ?? 1.0;
}

export function getVolatility(symbol: string): number {
  const vols: Record<string, number> = {
    "EUR/USD": 0.0008,
    "GBP/USD": 0.0012,
    "USD/JPY": 0.001,
    "AUD/USD": 0.001,
    "USD/CHF": 0.001,
    "NZD/USD": 0.001,
    "USD/CAD": 0.001,
    "XAU/USD": 0.005,
  };
  return vols[symbol] ?? 0.001;
}

export function getIntervalSeconds(interval: string): number {
  const map: Record<string, number> = {
    "15min": 900,
    "1h": 3600,
    "4h": 14400,
    "1day": 86400,
  };
  return map[interval] ?? 3600;
}

export function formatPrice(symbol: string, price: number): string {
  if (symbol === "XAU/USD") return price.toFixed(2);
  if (symbol === "USD/JPY") return price.toFixed(3);
  return price.toFixed(5);
}

export function getSymbolForAPI(symbol: string): string {
  return symbol.replace("/", "");
}
