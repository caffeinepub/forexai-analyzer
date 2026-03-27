import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ImageUp, LayoutDashboard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CandlestickChart } from "./components/CandlestickChart";
import { ChartImageAnalysis } from "./components/ChartImageAnalysis";
import { Footer } from "./components/Footer";
import { ICTAnalysis } from "./components/ICTAnalysis";
import { LiveQuotes } from "./components/LiveQuotes";
import { Navbar } from "./components/Navbar";
import { TradeSignals } from "./components/TradeSignals";
import { useCandles, useLivePrices } from "./hooks/useQueries";
import { runFullAnalysis } from "./utils/ictAnalysis";
import { generateMockCandles } from "./utils/mockData";

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

const queryClient = new QueryClient();

function Dashboard() {
  const [symbol, setSymbol] = useState("EUR/USD");
  const [timeframe, setTimeframe] = useState("1h");
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 8 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const { data: candles = [] } = useCandles(symbol, timeframe);
  const { data: prices = [] } = useLivePrices(PAIRS);

  const candlesBySymbol = useMemo(() => {
    const map: Record<string, ReturnType<typeof generateMockCandles>> = {};
    for (const pair of PAIRS) {
      map[pair] =
        pair === symbol ? candles : generateMockCandles(pair, "1h", 20);
    }
    return map;
  }, [symbol, candles]);

  const { analysis, signals } = useMemo(() => {
    if (candles.length === 0)
      return {
        analysis: {
          fvgZones: [],
          liquiditySweeps: [],
          amdPhase: "Unknown" as const,
          amdDescription: "Loading...",
        },
        signals: [],
      };
    return runFullAnalysis(symbol, candles);
  }, [symbol, candles]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 md:px-6 py-4">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold text-foreground">
            Forex Analysis Dashboard
          </h1>
          <span className="text-sm text-muted-foreground">
            ICT Smart Money Concepts
          </span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList
            data-ocid="dashboard.tab"
            className="mb-4 bg-card border border-border"
          >
            <TabsTrigger
              value="live"
              data-ocid="dashboard.live_tab"
              className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Live Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="image"
              data-ocid="dashboard.image_tab"
              className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ImageUp className="w-3.5 h-3.5" />
              Chart Analysis
            </TabsTrigger>
          </TabsList>

          {/* Live Dashboard Tab */}
          <TabsContent value="live">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-4">
              {/* LEFT COLUMN */}
              <div className="flex flex-col gap-4 min-w-0">
                <div
                  data-ocid="chart.card"
                  className="rounded-lg border border-border bg-card overflow-hidden"
                  style={{ minHeight: 400 }}
                >
                  <div className="flex items-center justify-between px-3 pt-3 pb-0">
                    <h2 className="text-sm font-semibold text-foreground">
                      Price Chart
                    </h2>
                  </div>
                  <div style={{ height: 400 }}>
                    <CandlestickChart
                      candles={candles}
                      symbol={symbol}
                      interval={timeframe}
                      fvgZones={analysis.fvgZones}
                      sweeps={analysis.liquiditySweeps}
                      onSymbolChange={setSymbol}
                      onIntervalChange={setTimeframe}
                      countdown={countdown}
                    />
                  </div>
                </div>

                <div
                  data-ocid="ict.card"
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <div className="px-4 pt-3 pb-0 border-b border-border">
                    <h2 className="text-sm font-semibold text-foreground pb-3">
                      ICT Analysis — Smart Money Concepts
                    </h2>
                  </div>
                  <ICTAnalysis analysis={analysis} symbol={symbol} />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="flex flex-col gap-4">
                <div
                  data-ocid="quotes.card"
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <LiveQuotes
                    prices={prices}
                    candlesBySymbol={candlesBySymbol}
                    selectedSymbol={symbol}
                    onSelect={setSymbol}
                  />
                </div>

                <div
                  data-ocid="signals.card"
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  <TradeSignals signals={signals} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Chart Image Analysis Tab */}
          <TabsContent value="image">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">
                  Chart Image Analysis
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload any chart screenshot for ICT analysis — FVG, liquidity
                  sweeps, AMD phases &amp; trade signals
                </p>
              </div>
              <ChartImageAnalysis />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
