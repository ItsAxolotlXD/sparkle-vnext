import React, { useState, useEffect } from 'react';
import { useSettings, getTaskbarHeightPx, FLOAT_BAR_BOTTOM_GAP_PX } from '../hooks/useSettings';

interface EvaluationWatermarkProps {
  className?: string;
  isTaskbarFloating?: boolean;
}

export const EvaluationWatermark: React.FC<EvaluationWatermarkProps> = ({ className = '', isTaskbarFloating = false }) => {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale, isTaskbarFloating);

  // In SparkleOS Mode keep watermark permanently visible on desktop; otherwise 30s on/off cycle
  useEffect(() => {
    if (settings.windowsMode) {
      setIsVisible(true);
      return;
    }

    const interval = setInterval(() => {
      setIsVisible((prev) => !prev);
    }, 30000);

    return () => clearInterval(interval);
  }, [settings.windowsMode]);

  const effectiveVisible = settings.windowsMode ? true : isVisible;

  return (
    <div
      id="in-app-evaluation-watermark"
      aria-hidden="true"
      className={`fixed ${
        settings.windowsMode ? 'right-4 sm:right-5' : 'bottom-3 right-4 sm:bottom-4 sm:right-6'
      } z-0 pointer-events-none select-none text-right transition-opacity duration-1000 ease-in-out ${
        effectiveVisible ? 'opacity-100' : 'opacity-0'
      } text-white text-[11px] sm:text-[12px] leading-[1.35] font-normal tracking-normal ${className}`}
      style={{
        bottom: settings.windowsMode ? `${taskbarHeight + (isTaskbarFloating ? FLOAT_BAR_BOTTOM_GAP_PX : 0) + 8}px` : undefined,
        fontFamily: "'Segoe UI Variable Text', 'Segoe UI', system-ui, sans-serif",
        color: '#ffffff',
        textShadow: 'none',
      }}
    >
      <div style={{ color: '#ffffff', textShadow: 'none' }}>Do not take screenshots of this build</div>
      <div style={{ color: '#ffffff', textShadow: 'none' }}>Sparkle 27M1 Insider Preview</div>
      <div style={{ color: '#ffffff', textShadow: 'none' }}>Evaluation copy. Build 27000.01 (vNext)</div>
    </div>
  );
};
