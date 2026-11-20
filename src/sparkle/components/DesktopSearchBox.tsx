import React, { useState, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Globe, Search, ExternalLink, X } from "lucide-react";
import { useSettings, WINDOWS_TOPBAR_HEIGHT_PX } from "../hooks/useSettings";
import { useNotes } from "../context/NotesContext";
import { TabIcon } from "./SparkleTabBar";
import type { Channel } from "../types";
import { buildDesktopSearchResults, type DesktopSearchResult } from "../utils/desktopSearch";

interface DesktopSearchBoxProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onLaunchRoute: (route: string, state?: unknown) => void;
  onToggleStartMenu: () => void;
}

export const DesktopSearchBox: React.FC<DesktopSearchBoxProps> = ({
  channels,
  onSelectChannel,
  onLaunchRoute,
  onToggleStartMenu,
}) => {
  const { settings } = useSettings();
  const { notes, setActiveNoteId } = useNotes();
  const isLightMode = settings.theme === "light";
  const dynamicIcons = settings.dynamicSidebarIcons !== false;

  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isFocused]);

  const results = useMemo(
    () =>
      buildDesktopSearchResults(query, {
        channels,
        notes,
        developerMode: Boolean(settings.developerMode),
      }).slice(0, 7),
    [query, channels, notes, settings.developerMode],
  );

  const handleSelectResult = (item: DesktopSearchResult) => {
    setIsFocused(false);
    setQuery("");
    if (item.channel) {
      onSelectChannel(item.channel);
    }
    if (item.noteId) {
      setActiveNoteId(item.noteId);
    }
    if (item.route) {
      onLaunchRoute(item.route);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topResult = results[0];
    if (topResult?.kind === "url") {
      const link = containerRef.current?.querySelector<HTMLAnchorElement>(
        'a[data-primary-external="true"]',
      );
      if (link) {
        link.click();
        return;
      }
    }
    const firstInternal = results.find((r) => !r.externalUrl);
    if (firstInternal) {
      handleSelectResult(firstInternal);
      return;
    }
    const fallbackLink = containerRef.current?.querySelector<HTMLAnchorElement>(
      'a[data-primary-external="true"]',
    );
    if (fallbackLink) {
      fallbackLink.click();
      return;
    }
    setIsFocused(true);
  };

  return (
    <div
      ref={containerRef}
      id="sparkle-desktop-search-widget"
      onMouseDown={(e) => e.stopPropagation()}
      style={{ top: `${WINDOWS_TOPBAR_HEIGHT_PX + 38}px` }}
      className="absolute left-1/2 -translate-x-1/2 z-[2] w-[min(560px,calc(100%-32px))] pointer-events-auto select-none"
    >
      <form
        id="sparkle-desktop-search-box"
        onSubmit={handleSubmit}
        style={{
          backgroundColor: isLightMode ? "rgba(255, 255, 255, 0.92)" : "rgba(34, 38, 46, 0.88)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
        }}
        className="h-[46px] sm:h-[48px] w-full rounded-full px-4 flex items-center gap-3 border border-black/[0.06] dark:border-white/[0.12] shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.38)] transition-all focus-within:ring-2 focus-within:ring-[#0078d4]/30 dark:focus-within:ring-[#4cc2ff]/35"
      >
        {/* Left: Globe inside Magnifying Glass icon (matching Picture 2) */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-[#111827] dark:text-white/90"
        >
          <circle cx="10.5" cy="10.5" r="7" stroke="currentColor" strokeWidth="1.75" />
          <ellipse cx="10.5" cy="10.5" rx="3.2" ry="7" stroke="currentColor" strokeWidth="1.35" />
          <path d="M3.7 10.5H17.3" stroke="currentColor" strokeWidth="1.35" />
          <path d="M5.2 7.2H15.8" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.2 13.8H15.8" stroke="currentColor" strokeWidth="1.2" />
          <path
            d="M15.8 15.8L20.5 20.5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsFocused(true);
          }}
          placeholder="Search the web or type a URL"
          aria-label="Search the web or type a URL"
          className="flex-1 min-w-0 bg-transparent text-[14px] sm:text-[15px] text-[#111827] dark:text-white placeholder-[#4b5563] dark:placeholder-white/70 outline-none border-none"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent shrink-0 text-[#4b5563] dark:text-white/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Right: Blue 4-pane Windows logo (matching Picture 2) */}
        <button
          type="button"
          onClick={() => {
            if (query.trim()) {
              setIsFocused(true);
            } else {
              onToggleStartMenu();
            }
          }}
          aria-label="Open Start or Search"
          title="Start"
          className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent shrink-0"
        >
          <span className="grid grid-cols-2 gap-[2px] w-[18px] h-[18px]">
            <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[1px]" />
            <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[1px]" />
            <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[1px]" />
            <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[1px]" />
          </span>
        </button>
      </form>

      {/* Dropdown results below Desktop Search Box */}
      <AnimatePresence>
        {isFocused && (query.trim().length > 0 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            style={{
              backgroundColor: isLightMode ? "rgba(248, 250, 254, 0.94)" : "rgba(30, 34, 42, 0.94)",
              backdropFilter: "blur(32px) saturate(165%)",
              WebkitBackdropFilter: "blur(32px) saturate(165%)",
            }}
            className="mt-2 w-full rounded-[16px] border border-black/10 dark:border-white/[0.12] shadow-2xl p-2 space-y-0.5 overflow-hidden"
          >
            {results.map((item) =>
              item.externalUrl ? (
                <a
                  key={item.id}
                  href={item.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-primary-external="true"
                  onClick={() => {
                    setIsFocused(false);
                    setQuery("");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-[10px] flex items-center gap-3 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors no-underline"
                >
                  <Globe className="w-4 h-4 text-[#0078d4] dark:text-[#4cc2ff] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{item.title}</div>
                    <div className="text-[11px] text-black/60 dark:text-white/60 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-55 shrink-0" />
                </a>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full px-3.5 py-2.5 rounded-[10px] flex items-center gap-3 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent"
                >
                  {item.logo ? (
                    <img
                      src={item.logo}
                      alt=""
                      className="w-4.5 h-4.5 object-contain rounded-[3px] shrink-0"
                    />
                  ) : item.route ? (
                    <TabIcon
                      route={item.route}
                      active
                      dynamicIcons={dynamicIcons}
                      className="w-4.5 h-4.5 shrink-0"
                    />
                  ) : (
                    <Search className="w-4 h-4 opacity-70 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate">{item.title}</div>
                    <div className="text-[11px] text-black/60 dark:text-white/60 truncate">
                      {item.subtitle}
                    </div>
                  </div>
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
