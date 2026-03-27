import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

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

const NAV_LINKS = ["Dashboard", "Signals", "Markets", "Analysis", "Settings"];

export function Navbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUTC = (d: Date) =>
    d
      .toUTCString()
      .replace(" GMT", " UTC")
      .replace(/^\w+, /, "");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 md:px-6 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/20 text-primary">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">
            ALPHA<span className="text-primary"> FX</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map((link) => (
            <button
              type="button"
              key={link}
              data-ocid={`nav.${link.toLowerCase()}.link`}
              className="px-3 py-1.5 text-sm rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {link}
            </button>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-3 ml-auto">
          {/* LIVE pill */}
          <Badge
            className="gap-1.5 text-xs px-2 py-0.5 font-medium border-0"
            style={{
              backgroundColor: "oklch(0.25 0.06 158 / 0.9)",
              color: "oklch(0.79 0.19 158)",
            }}
          >
            <span
              className="live-dot w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: "oklch(0.79 0.19 158)" }}
            />
            LIVE
          </Badge>

          {/* Timestamp */}
          <span className="hidden lg:block text-xs text-muted-foreground font-mono">
            {formatUTC(time)}
          </span>

          {/* Supported pairs count */}
          <span className="hidden md:block text-xs text-muted-foreground">
            {PAIRS.length} pairs
          </span>

          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              FX
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
