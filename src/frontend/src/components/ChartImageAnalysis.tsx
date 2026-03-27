import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  Brain,
  CheckCircle2,
  FileImage,
  Loader2,
  Minus,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import {
  type ImageAnalysisResult,
  analyzeChartImage,
} from "../utils/imageAnalysis";

const ANALYSIS_STEPS = [
  "Detecting trend structure...",
  "Scanning for FVG zones...",
  "Identifying liquidity sweeps...",
  "Generating trade signal...",
];

function gradeColor(grade: string) {
  if (grade === "A+")
    return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  if (grade === "A")
    return "bg-green-500/20 text-green-400 border-green-500/40";
  if (grade === "B")
    return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
  return "bg-muted text-muted-foreground border-border";
}

function directionColor(dir: string) {
  return dir === "Long"
    ? "bg-green-500/20 text-green-400 border-green-500/40"
    : "bg-red-500/20 text-red-400 border-red-500/40";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChartImageAnalysis() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(-1);
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setAnalysisStep(-1);
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f?.type.startsWith("image/")) handleFile(f);
    },
    [handleFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleAnalyze = () => {
    if (!file) return;
    setResult(null);
    setAnalysisStep(0);

    ANALYSIS_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setAnalysisStep(i);
      }, i * 550);
    });

    setTimeout(
      () => {
        const res = analyzeChartImage(file.name, file.size, file.lastModified);
        setResult(res);
        setAnalysisStep(4);
      },
      ANALYSIS_STEPS.length * 550 + 300,
    );
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setAnalysisStep(-1);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isAnalyzing = analysisStep >= 0 && analysisStep < 4;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT PANEL */}
        <div className="flex flex-col gap-3">
          {/* Drop zone — using a label so clicking activates the hidden file input */}
          <label
            htmlFor="chart-upload-input"
            data-ocid="chart_analysis.dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative rounded-lg border-2 border-dashed transition-colors overflow-hidden block
              ${file ? "border-border cursor-default pointer-events-none" : "cursor-pointer hover:border-primary/60"}
              ${isDragging ? "border-primary bg-primary/5" : "border-border bg-card"}
            `}
            style={{ minHeight: 320 }}
          >
            <input
              id="chart-upload-input"
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
              data-ocid="chart_analysis.upload_button"
            />

            <AnimatePresence mode="wait">
              {preview ? (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <img
                    src={preview}
                    alt="Chart preview"
                    className="w-full h-full object-contain"
                    style={{ minHeight: 280 }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center gap-3 p-10 text-center"
                  style={{ minHeight: 280 }}
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Drop chart image here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP supported
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </label>

          {/* File info */}
          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="rounded-lg border border-border bg-card px-3 py-2 flex flex-wrap items-center gap-2"
              >
                <FileImage className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-xs text-foreground font-medium truncate max-w-[160px]">
                  {file.name}
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatSize(file.size)}
                </Badge>
                {result && (
                  <>
                    <Badge
                      variant="outline"
                      className="text-xs text-primary border-primary/40"
                    >
                      {result.pair}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {result.timeframe}
                    </Badge>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              data-ocid="chart_analysis.primary_button"
              className="flex-1"
              onClick={handleAnalyze}
              disabled={!file || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analysing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" /> Analyze Chart
                </>
              )}
            </Button>
            {file && (
              <Button
                data-ocid="chart_analysis.cancel_button"
                variant="outline"
                size="icon"
                onClick={handleClear}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-3 min-h-[320px]">
          <AnimatePresence mode="wait">
            {/* Idle state */}
            {analysisStep === -1 && !result && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                data-ocid="chart_analysis.empty_state"
                className="flex-1 rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-4 p-10 text-center"
                style={{ minHeight: 320 }}
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Brain className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Upload a chart image
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    to get ICT analysis
                  </p>
                </div>
              </motion.div>
            )}

            {/* Loading state */}
            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                data-ocid="chart_analysis.loading_state"
                className="flex-1 rounded-lg border border-border bg-card flex flex-col items-center justify-center gap-5 p-10"
                style={{ minHeight: 320 }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {ANALYSIS_STEPS.map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: i <= analysisStep ? 1 : 0.3, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      {i < analysisStep ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                      ) : i === analysisStep ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                      )}
                      <span
                        className={
                          i <= analysisStep
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {step}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Results */}
            {result && analysisStep === 4 && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-ocid="chart_analysis.success_state"
                className="flex flex-col gap-3"
              >
                {/* Signal Card */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                      Trade Signal
                    </span>
                    <div className="flex gap-2">
                      <Badge
                        className={`border text-xs font-bold ${directionColor(result.signal.direction)}`}
                      >
                        {result.signal.direction === "Long" ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {result.signal.direction}
                      </Badge>
                      <Badge
                        className={`border text-xs font-bold ${gradeColor(result.signal.grade)}`}
                      >
                        {result.signal.grade}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                      { label: "Entry", value: result.signal.entry },
                      { label: "Target", value: result.signal.target },
                      { label: "Stop Loss", value: result.signal.stopLoss },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-md bg-muted/40 p-2 text-center"
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {label}
                        </div>
                        <div className="text-sm font-mono font-semibold text-foreground">
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      Risk:Reward
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {result.signal.rr}:1
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {result.signal.confluences.map((c) => (
                      <span
                        key={c}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Market Structure Card */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">
                    Market Structure
                  </span>
                  <div className="flex flex-wrap gap-3 mb-2">
                    <div className="flex items-center gap-1.5">
                      {result.trendBias === "Bullish" ? (
                        <ArrowUp className="w-4 h-4 text-green-400" />
                      ) : result.trendBias === "Bearish" ? (
                        <ArrowDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span
                        className={`text-sm font-semibold
                        ${result.trendBias === "Bullish" ? "text-green-400" : result.trendBias === "Bearish" ? "text-red-400" : "text-muted-foreground"}`}
                      >
                        {result.trendBias}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {result.amdPhase}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {result.amdDescription}
                  </p>
                </div>

                {/* ICT Patterns Card */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-3">
                    ICT Patterns
                  </span>
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">FVG</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${result.fvgDetected ? "text-primary border-primary/40" : ""}`}
                      >
                        {result.fvgDetected ? result.fvgType : "None detected"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">
                        Liquidity
                      </span>
                      <span className="text-xs font-mono text-foreground">
                        {result.liquidityLevel}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      Key Levels
                    </div>
                    <div className="flex flex-col gap-1">
                      {result.keyLevels.map((lvl) => (
                        <div
                          key={`${lvl.label}-${lvl.price}`}
                          className="flex items-center justify-between py-0.5"
                        >
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${lvl.type === "resistance" ? "bg-red-400" : "bg-green-400"}`}
                            />
                            <span className="text-xs text-muted-foreground">
                              {lvl.label}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-foreground">
                            {lvl.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block mb-2">
                    Summary
                  </span>
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    {result.summary}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
