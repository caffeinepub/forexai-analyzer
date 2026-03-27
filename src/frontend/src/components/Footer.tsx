import { SiGithub, SiTelegram, SiX } from "react-icons/si";

const footerLinks = {
  Platform: ["Dashboard", "Live Signals", "Markets", "Screener", "Calendar"],
  Analysis: [
    "ICT Concepts",
    "Liquidity Sweeps",
    "FVG Guide",
    "AMD Framework",
    "Risk Management",
  ],
  Company: ["About", "Blog", "Contact", "Terms of Service", "Privacy Policy"],
};

export function Footer() {
  const year = new Date().getFullYear();
  const utmUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-lg text-foreground">
                ALPHA<span className="text-primary"> FX</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Professional ICT-based forex analysis with real-time liquidity
              sweeps, FVG detection, and AMD framework signals.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Follow on X"
              >
                <SiX size={16} />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <SiGithub size={16} />
              </a>
              <a
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Telegram"
              >
                <SiTelegram size={16} />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                {category}
              </h4>
              <ul className="flex flex-col gap-2">
                {links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-muted-foreground cursor-default">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} Alpha FX. All rights reserved. Trading involves risk.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with ❤ using{" "}
            <a
              href={utmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
