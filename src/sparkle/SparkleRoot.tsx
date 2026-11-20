import { StrictMode, useEffect } from "react";
import App from "./SparkleApp";
import { FluentInputMirror } from "./components/FluentInputMirror";
import { FlumojsProvider } from "./components/FluentEmoji";
import { initBrowserTooltipSuppressor } from "./utils/suppressBrowserTooltips";

let tooltipSuppressorStarted = false;

// Client-only entry for the Sparkle desktop app (was src/main.tsx in the original project).
export default function SparkleRoot() {
  useEffect(() => {
    if (tooltipSuppressorStarted) return;
    tooltipSuppressorStarted = true;
    initBrowserTooltipSuppressor();
  }, []);

  return (
    <StrictMode>
      <FlumojsProvider>
        <App />
        <FluentInputMirror />
      </FlumojsProvider>
    </StrictMode>
  );
}
