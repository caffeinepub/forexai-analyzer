import { useQuery } from "@tanstack/react-query";
import {
  generateMockCandles,
  getBasePrice,
  getSymbolForAPI,
  getVolatility,
} from "../utils/mockData";
import type { Candle } from "../utils/mockData";
import { useActor } from "./useActor";

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

function parseCandles(
  json: string,
  symbol: string,
  interval: string,
): Candle[] {
  try {
    const data = JSON.parse(json);
    if (
      data.status === "error" ||
      !data.values ||
      !Array.isArray(data.values)
    ) {
      return generateMockCandles(symbol, interval);
    }
    const values: TwelveDataCandle[] = data.values;
    return values
      .map((v) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: Number.parseFloat(v.open),
        high: Number.parseFloat(v.high),
        low: Number.parseFloat(v.low),
        close: Number.parseFloat(v.close),
        volume: Number.parseFloat(v.volume || "0"),
      }))
      .sort((a, b) => a.time - b.time);
  } catch {
    return generateMockCandles(symbol, interval);
  }
}

export function useCandles(symbol: string, interval: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Candle[]>({
    queryKey: ["candles", symbol, interval],
    queryFn: async () => {
      if (!actor) return generateMockCandles(symbol, interval);
      try {
        const apiSymbol = getSymbolForAPI(symbol);
        const json = await actor.getCandles(apiSymbol, interval);
        return parseCandles(json, symbol, interval);
      } catch {
        return generateMockCandles(symbol, interval);
      }
    },
    enabled: !isFetching,
    refetchInterval: 8000,
    staleTime: 7000,
    placeholderData: () => generateMockCandles(symbol, interval),
  });
}

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

function parsePrice(json: string, symbol: string): PriceData {
  try {
    const data = JSON.parse(json);
    if (data.status === "error" || !data.price) {
      const base = getBasePrice(symbol);
      const vol = getVolatility(symbol);
      const change = (Math.random() - 0.5) * vol * 10;
      return {
        symbol,
        price: base + change,
        change,
        changePct: (change / base) * 100,
      };
    }
    const price = Number.parseFloat(data.price);
    const close = Number.parseFloat(data.close || data.price);
    const change = price - close;
    return { symbol, price, change, changePct: (change / close) * 100 };
  } catch {
    const base = getBasePrice(symbol);
    return { symbol, price: base, change: 0, changePct: 0 };
  }
}

export function useLivePrices(symbols: string[]) {
  const { actor, isFetching } = useActor();
  return useQuery<PriceData[]>({
    queryKey: ["livePrices", symbols.join(",")],
    queryFn: async () => {
      if (!actor) {
        return symbols.map((s) => {
          const base = getBasePrice(s);
          const vol = getVolatility(s);
          const change = (Math.random() - 0.5) * vol * 5;
          return {
            symbol: s,
            price: base + change,
            change,
            changePct: (change / base) * 100,
          };
        });
      }
      try {
        const results = await Promise.all(
          symbols.map(async (symbol) => {
            const apiSymbol = getSymbolForAPI(symbol);
            const json = await actor.getPrice(apiSymbol);
            return parsePrice(json, symbol);
          }),
        );
        return results;
      } catch {
        return symbols.map((s) => {
          const base = getBasePrice(s);
          const vol = getVolatility(s);
          const change = (Math.random() - 0.5) * vol * 5;
          return {
            symbol: s,
            price: base + change,
            change,
            changePct: (change / base) * 100,
          };
        });
      }
    },
    enabled: !isFetching,
    refetchInterval: 8000,
    staleTime: 7000,
  });
}
