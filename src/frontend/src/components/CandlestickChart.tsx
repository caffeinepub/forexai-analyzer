import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type CandlestickData,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FVGZone, LiquiditySweep } from "../utils/ictAnalysis";
import type { Candle } from "../utils/mockData";
import { formatPrice } from "../utils/mockData";

const PAIRS = [
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "USD/CHF",
  "NZD/USD",
  "USD/CAD",
  "XAU/USD",
];
const TIMEFRAMES = [
  { label: "15m", value: "15min" },
  { label: "1H", value: "1h" },
  { label: "4H", value: "4h" },
  { label: "1D", value: "1day" },
];

interface Props {
  candles: Candle[];
  symbol: string;
  interval: string;
  fvgZones: FVGZone[];
  sweeps: LiquiditySweep[];
  onSymbolChange: (symbol: string) => void;
  onIntervalChange: (interval: string) => void;
  countdown: number;
}

export function CandlestickChart({
  candles,
  symbol,
  interval,
  fvgZones,
  sweeps,
  onSymbolChange,
  onIntervalChange,
  countdown,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0B0F14" },
        textColor: "#9AA7B6",
        fontFamily: "Satoshi, Inter, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1A2535" },
        horzLines: { color: "#1A2535" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#243142", labelBackgroundColor: "#243142" },
        horzLine: { color: "#243142", labelBackgroundColor: "#243142" },
      },
      rightPriceScale: {
        borderColor: "#243142",
        textColor: "#9AA7B6",
      },
      timeScale: {
        borderColor: "#243142",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const d = new Date(time * 1000);
          return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
      width: containerRef.current.clientWidth,
      height: 340,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#28D17C",
      downColor: "#FF5B5B",
      borderUpColor: "#28D17C",
      borderDownColor: "#FF5B5B",
      wickUpColor: "#28D17C",
      wickDownColor: "#FF5B5B",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleSeriesRef.current = null;
      }
    };
  }, [initChart]);

  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const data: CandlestickData[] = candles.map((c) => ({
      time: c.time as unknown as import("lightweight-charts").Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeriesRef.current.setData(data);

    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    setLastPrice(last.close);
    setPriceChange(prev ? ((last.close - prev.close) / prev.close) * 100 : 0);

    // Add FVG zones as price lines
    for (const zone of fvgZones.slice(-4)) {
      if (!zone.filled && candleSeriesRef.current) {
        candleSeriesRef.current.createPriceLine({
          price: zone.type === "bullish" ? zone.top : zone.bottom,
          color: zone.type === "bullish" ? "#28D17C55" : "#FF5B5B55",
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: false,
          title: zone.type === "bullish" ? "Bull FVG" : "Bear FVG",
        });
      }
    }

    // Add liquidity sweep markers using v5 API
    if (candleSeriesRef.current && sweeps.length > 0) {
      const markers = sweeps.slice(-3).map((sweep) => ({
        time: sweep.time as unknown as import("lightweight-charts").Time,
        position:
          sweep.type === "bullish"
            ? ("belowBar" as const)
            : ("aboveBar" as const),
        color: sweep.type === "bullish" ? "#28D17C" : "#FF5B5B",
        shape:
          sweep.type === "bullish"
            ? ("arrowUp" as const)
            : ("arrowDown" as const),
        text: sweep.type === "bullish" ? "BSL" : "SSL",
        size: 1,
      }));

      try {
        createSeriesMarkers(candleSeriesRef.current, markers);
      } catch {
        // ignore marker errors
      }
    }

    chartRef.current?.timeScale().fitContent();
  }, [candles, fvgZones, sweeps]);

  const isUp = priceChange >= 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
        <Select value={symbol} onValueChange={onSymbolChange}>
          <SelectTrigger
            data-ocid="chart.symbol.select"
            className="w-32 h-8 text-sm bg-muted border-border"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAIRS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              type="button"
              key={tf.value}
              data-ocid={`chart.${tf.label.toLowerCase()}.tab`}
              onClick={() => onIntervalChange(tf.value)}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                interval === tf.value
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          {lastPrice !== null && (
            <>
              <span className="text-lg font-bold font-mono text-foreground">
                {formatPrice(symbol, lastPrice)}
              </span>
              <Badge
                className={`text-xs border-0 ${
                  isUp
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                {isUp ? "+" : ""}
                {priceChange.toFixed(3)}%
              </Badge>
            </>
          )}
          <span className="text-xs text-muted-foreground font-mono">
            Refresh in <span className="text-primary">{countdown}s</span>
          </span>
        </div>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
