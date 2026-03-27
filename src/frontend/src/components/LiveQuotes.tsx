import type { Candle } from "../utils/mockData";
import { formatPrice } from "../utils/mockData";

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

interface Props {
  prices: PriceData[];
  candlesBySymbol: Record<string, Candle[]>;
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

function Sparkline({ candles, isUp }: { candles: Candle[]; isUp: boolean }) {
  const points = candles.slice(-20).map((c) => c.close);
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 80;
  const h = 28;

  const pathD = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="overflow-visible"
      aria-label={isUp ? "Price trending up" : "Price trending down"}
      role="img"
    >
      <path
        d={pathD}
        fill="none"
        stroke={isUp ? "#28D17C" : "#FF5B5B"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

export function LiveQuotes({
  prices,
  candlesBySymbol,
  selectedSymbol,
  onSelect,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5 p-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        Live Quotes
      </h3>
      {prices.map((p, idx) => {
        const candles = candlesBySymbol[p.symbol] ?? [];
        const isUp = p.changePct >= 0;
        const isSelected = p.symbol === selectedSymbol;
        return (
          <button
            type="button"
            key={p.symbol}
            data-ocid={`quotes.item.${idx + 1}`}
            onClick={() => onSelect(p.symbol)}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded border transition-all text-left ${
              isSelected
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/30"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {p.symbol}
                </span>
                <span
                  className={`text-xs font-mono font-medium ${
                    isUp ? "text-success" : "text-destructive"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {p.changePct.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xs font-mono text-foreground">
                  {formatPrice(p.symbol, p.price)}
                </span>
                <span
                  className={`text-xs font-mono ${
                    isUp ? "text-success/70" : "text-destructive/70"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {formatPrice(p.symbol, Math.abs(p.change))}
                </span>
              </div>
            </div>
            <div className="shrink-0">
              <Sparkline candles={candles} isUp={isUp} />
            </div>
          </button>
        );
      })}
      {prices.length === 0 && (
        <p
          data-ocid="quotes.empty_state"
          className="text-sm text-muted-foreground text-center py-4"
        >
          Loading quotes...
        </p>
      )}
    </div>
  );
}
