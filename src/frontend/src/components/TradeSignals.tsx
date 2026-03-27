import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "motion/react";
import type { TradeSignal } from "../utils/ictAnalysis";
import { formatPrice } from "../utils/mockData";

interface Props {
  signals: TradeSignal[];
}

const gradeColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  "A+": {
    bg: "bg-primary/20",
    text: "text-primary",
    border: "border-primary/40",
  },
  A: { bg: "bg-success/20", text: "text-success", border: "border-success/40" },
  B: { bg: "bg-warning/20", text: "text-warning", border: "border-warning/40" },
  C: {
    bg: "bg-destructive/20",
    text: "text-destructive",
    border: "border-destructive/40",
  },
};

function GradeBadge({ grade }: { grade: string }) {
  const style = gradeColors[grade] ?? gradeColors.C;
  return (
    <span
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold border ${style.bg} ${style.text} ${style.border}`}
    >
      {grade}
    </span>
  );
}

export function TradeSignals({ signals }: Props) {
  const sorted = [...signals].sort((a, b) => b.time - a.time).slice(0, 5);

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Trade Signals
        </h3>
        <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
          {sorted.filter((s) => s.status === "ACTIVE").length} active
        </Badge>
      </div>

      {sorted.length === 0 && (
        <div
          data-ocid="signals.empty_state"
          className="text-sm text-muted-foreground text-center py-6"
        >
          Analysing market…
        </div>
      )}

      <AnimatePresence initial={false}>
        {sorted.map((signal, idx) => {
          const isLong = signal.direction === "Long";
          return (
            <motion.div
              key={signal.id}
              data-ocid={`signals.item.${idx + 1}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="rounded-lg border border-border bg-muted/20 p-3"
            >
              <div className="flex items-start gap-2.5">
                <GradeBadge grade={signal.grade} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">
                      {signal.pair}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        isLong
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {signal.direction}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {signal.status}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      RR {signal.rr}:1
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-x-2 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Entry</p>
                      <p className="text-xs font-mono text-foreground">
                        {formatPrice(signal.pair, signal.entry)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-xs font-mono text-success">
                        {formatPrice(signal.pair, signal.target)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SL</p>
                      <p className="text-xs font-mono text-destructive">
                        {formatPrice(signal.pair, signal.stopLoss)}
                      </p>
                    </div>
                  </div>

                  {signal.confluences.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {signal.confluences.map((c) => (
                        <span
                          key={c}
                          className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
