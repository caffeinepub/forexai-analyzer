import { Badge } from "@/components/ui/badge";
import type { ICTAnalysis as ICTAnalysisType } from "../utils/ictAnalysis";

interface Props {
  analysis: ICTAnalysisType;
  symbol: string;
}

const phaseColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Accumulation: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/30",
  },
  Manipulation: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
  },
  Distribution: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
  },
  Unknown: {
    bg: "bg-muted/50",
    text: "text-muted-foreground",
    border: "border-border",
  },
};

export function ICTAnalysis({ analysis, symbol }: Props) {
  const phaseStyle = phaseColors[analysis.amdPhase] ?? phaseColors.Unknown;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* AMD Phase */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          AMD Phase — {symbol}
        </h3>
        <div
          className={`rounded-lg border p-3 ${phaseStyle.bg} ${phaseStyle.border}`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-base font-bold ${phaseStyle.text}`}>
              {analysis.amdPhase}
            </span>
            <div className={`flex-1 h-px ${phaseStyle.border} border-t`} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {analysis.amdDescription}
          </p>
        </div>
      </div>

      {/* FVG Zones */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Fair Value Gaps ({analysis.fvgZones.filter((z) => !z.filled).length}{" "}
          active)
        </h3>
        <div className="flex flex-col gap-1.5">
          {analysis.fvgZones.length === 0 && (
            <p className="text-sm text-muted-foreground">No FVGs detected</p>
          )}
          {analysis.fvgZones.slice(0, 4).map((zone, idx) => (
            <div
              key={`fvg-${zone.time}-${zone.type}`}
              data-ocid={`ict.fvg.item.${idx + 1}`}
              className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                zone.type === "bullish"
                  ? "bg-success/5 border-success/20 text-success"
                  : "bg-destructive/5 border-destructive/20 text-destructive"
              } ${zone.filled ? "opacity-40" : ""}`}
            >
              <span className="font-medium">
                {zone.type === "bullish" ? "▲ Bull FVG" : "▼ Bear FVG"}
              </span>
              <span className="font-mono">
                {zone.bottom.toFixed(5)} – {zone.top.toFixed(5)}
              </span>
              {zone.filled && (
                <Badge className="text-xs px-1 py-0 bg-muted/50 text-muted-foreground border-0">
                  Filled
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Liquidity Sweeps */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Liquidity Sweeps ({analysis.liquiditySweeps.length})
        </h3>
        <div className="flex flex-col gap-1.5">
          {analysis.liquiditySweeps.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No recent sweeps detected
            </p>
          )}
          {analysis.liquiditySweeps.slice(0, 4).map((sweep, idx) => (
            <div
              key={`sweep-${sweep.time}-${sweep.type}`}
              data-ocid={`ict.sweep.item.${idx + 1}`}
              className={`flex items-center justify-between px-3 py-2 rounded border text-xs ${
                sweep.type === "bullish"
                  ? "bg-success/5 border-success/20 text-success"
                  : "bg-destructive/5 border-destructive/20 text-destructive"
              }`}
            >
              <span className="font-medium">
                {sweep.type === "bullish"
                  ? "↑ Bullish Sweep"
                  : "↓ Bearish Sweep"}
              </span>
              <span className="font-mono">{sweep.price.toFixed(5)}</span>
              <span className="text-muted-foreground">{sweep.description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
