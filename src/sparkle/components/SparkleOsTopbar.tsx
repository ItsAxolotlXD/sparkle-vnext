import React, { useState, useEffect, useRef, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, Wifi, Globe, ExternalLink, X } from "lucide-react";
import { useSettings, WINDOWS_TOPBAR_HEIGHT_PX } from "../hooks/useSettings";
import { useCityWeather } from "../hooks/useCityWeather";
import { useNotes } from "../context/NotesContext";
import { CITY_WEATHER_DATA, loadWidgetsPrefs } from "./WindowsWidgetsBoard";
import { TabIcon, type AppTab } from "./SparkleTabBar";
import type { AppWindowState } from "./WindowFrame";
import type { Channel } from "../types";
import { buildDesktopSearchResults, type DesktopSearchResult } from "../utils/desktopSearch";

const WEATHER_ICON_URL = "/assets/aistudio/icons8-haze-96_28bff67a.png";

interface SparkleOsTopbarProps {
  tabs: AppTab[];
  activeTabId: string;
  windowStates: Record<string, AppWindowState>;
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  onLaunchRoute: (route: string, state?: unknown) => void;
  onFocusWindow: (tabId: string) => void;
  onToggleStartMenu: () => void;
}

function formatTopbarDateTime(now: Date): string {
  const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${weekday} ${month}/${day}  ${hours}:${minutes}`;
}

export const SparkleOsTopbar: React.FC<SparkleOsTopbarProps> = ({
  tabs,
  activeTabId,
  windowStates,
  channels,
  onSelectChannel,
  onLaunchRoute,
  onFocusWindow,
  onToggleStartMenu,
}) => {
  const { settings } = useSettings();
  const { notes, setActiveNoteId } = useNotes();
  const isLightMode = settings.theme === "light";
  const dynamicIcons = settings.dynamicSidebarIcons !== false;

  const [widgetsPrefs, setWidgetsPrefs] = useState(() => loadWidgetsPrefs());
  const { data: liveCityWeather } = useCityWeather(widgetsPrefs.selectedCityId);
  const [now, setNow] = useState(() => new Date());

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPrefsChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setWidgetsPrefs(detail);
      else setWidgetsPrefs(loadWidgetsPrefs());
    };
    window.addEventListener("sparkle:widgets-prefs-changed", onPrefsChanged);
    return () => window.removeEventListener("sparkle:widgets-prefs-changed", onPrefsChanged);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isSearchOpen]);

  const activeCityWeather = useMemo(() => {
    const selected =
      CITY_WEATHER_DATA.find((c) => c.id === widgetsPrefs.selectedCityId) ||
      CITY_WEATHER_DATA.find((c) => c.id === "hanoi") ||
      CITY_WEATHER_DATA[0];
    if (!selected) {
      return { temp: 28, conditionLabel: "Partly Cloudy" };
    }
    return liveCityWeather ? { ...selected, ...liveCityWeather } : selected;
  }, [widgetsPrefs.selectedCityId, liveCityWeather]);

  const activeTab = useMemo(() => {
    const current = tabs.find((t) => t.id === activeTabId);
    if (current && !windowStates[current.id]?.isMinimized) return current;
    const visibleTabs = tabs.filter((t) => !windowStates[t.id]?.isMinimized);
    const firstVisible = visibleTabs[0];
    if (!firstVisible) return null;
    return visibleTabs.reduce((best, item) => {
      const bestZ = windowStates[best.id]?.zIndex ?? 0;
      const itemZ = windowStates[item.id]?.zIndex ?? 0;
      return itemZ >= bestZ ? item : best;
    }, firstVisible);
  }, [tabs, activeTabId, windowStates]);

  const results = useMemo(
    () =>
      buildDesktopSearchResults(searchQuery, {
        channels,
        notes,
        developerMode: Boolean(settings.developerMode),
      }).slice(0, 7),
    [searchQuery, channels, notes, settings.developerMode],
  );

  const handleSelectResult = (item: DesktopSearchResult) => {
    setIsSearchOpen(false);
    setSearchQuery("");
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

  const handleActiveChipClick = () => {
    const firstTab = tabs[0];
    if (activeTab) {
      onFocusWindow(activeTab.id);
    } else if (firstTab) {
      onFocusWindow(firstTab.id);
    } else {
      onToggleStartMenu();
    }
  };

  const dateTimeText = formatTopbarDateTime(now);

  return (
    <header
      id="sparkle-os-topbar"
      role="banner"
      aria-label="Sparkle OS Top Bar"
      style={{
        height: `${WINDOWS_TOPBAR_HEIGHT_PX}px`,
        backgroundColor: isLightMode ? "rgba(235, 243, 252, 0.42)" : "rgba(18, 20, 26, 0.48)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
      }}
      className="fixed top-0 inset-x-0 z-[8800] flex items-center justify-between px-3 sm:px-4 select-none text-[#111827] dark:text-white border-b border-black/[0.05] dark:border-white/[0.06]"
    >
      {/* Left: Weather indicator (Picture 1 style) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("sparkle:toggle-widgets-board"))}
        className="flex items-center gap-1.5 h-[26px] px-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent text-left shrink-0"
        title="Open Widgets"
      >
        <img
          src={WEATHER_ICON_URL}
          alt=""
          draggable={false}
          className="w-4 h-4 object-contain shrink-0 pointer-events-none"
        />
        <span className="text-[12px] font-medium tabular-nums leading-none">
          {activeCityWeather.temp}°C
        </span>
        <span className="hidden sm:inline text-[12px] font-normal text-black/75 dark:text-white/80 leading-none">
          {activeCityWeather.conditionLabel}
        </span>
      </button>

      {/* Center: Floating pill with Search + Active App indicator (Picture 1 style) */}
      <div
        ref={searchWrapRef}
        className="relative flex items-center justify-center min-w-0 max-w-[min(460px,56vw)] sm:max-w-[460px]"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const firstInternal = results.find((r) => !r.externalUrl);
            if (firstInternal) {
              handleSelectResult(firstInternal);
            } else {
              setIsSearchOpen(true);
            }
          }}
          style={{
            backgroundColor: isLightMode
              ? "rgba(255, 255, 255, 0.52)"
              : "rgba(255, 255, 255, 0.10)",
            borderColor: isLightMode ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.14)",
          }}
          className="fluent-search-box h-[26px] rounded-full border flex items-center pl-2.5 pr-1 gap-1.5 shadow-[0_1px_6px_rgba(0,0,0,0.06)] transition-all w-full min-w-[200px] sm:min-w-[330px]"
        >
          <Search className="w-3 h-3 shrink-0 text-black/60 dark:text-white/70" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Type here to search"
            aria-label="Type here to search"
            className="flex-1 min-w-[90px] bg-transparent text-[11.5px] text-[#111827] dark:text-white placeholder-black/55 dark:placeholder-white/60 outline-none border-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer border-none bg-transparent shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Right inner capsule: active open app/window */}
          <button
            type="button"
            onClick={handleActiveChipClick}
            style={{
              backgroundColor: isLightMode
                ? "rgba(255, 255, 255, 0.78)"
                : "rgba(255, 255, 255, 0.14)",
            }}
            className="h-[20px] px-2.5 rounded-full flex items-center gap-1.5 max-w-[175px] shrink-0 hover:brightness-105 transition-all cursor-pointer border-none text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
            title={activeTab ? activeTab.title : "Sparkle vNext"}
          >
            {activeTab ? (
              <>
                <TabIcon
                  route={activeTab.route}
                  active
                  dynamicIcons={dynamicIcons}
                  className="w-3.5 h-3.5 shrink-0"
                />
                <span className="text-[11px] font-medium truncate text-[#111827] dark:text-white leading-none">
                  {activeTab.title}
                </span>
              </>
            ) : (
              <>
                <span className="grid grid-cols-2 gap-[1.5px] w-2.5 h-2.5 shrink-0">
                  <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[0.5px]" />
                  <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[0.5px]" />
                  <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[0.5px]" />
                  <span className="bg-[#0078d4] dark:bg-[#4cc2ff] rounded-[0.5px]" />
                </span>
                <span className="text-[11px] font-medium truncate text-[#111827] dark:text-white leading-none">
                  Sparkle vNext
                </span>
              </>
            )}
          </button>
        </form>

        {/* Topbar Search Results Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              style={{
                backgroundColor: isLightMode
                  ? "rgba(244, 247, 252, 0.92)"
                  : "rgba(30, 34, 42, 0.92)",
                backdropFilter: "blur(32px) saturate(165%)",
                WebkitBackdropFilter: "blur(32px) saturate(165%)",
              }}
              className="absolute top-[32px] left-1/2 -translate-x-1/2 w-[min(390px,92vw)] rounded-[12px] border border-black/10 dark:border-white/[0.12] shadow-xl p-1.5 space-y-0.5 z-[9100]"
            >
              {results.map((item) =>
                item.externalUrl ? (
                  <a
                    key={item.id}
                    href={item.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="w-full px-3 py-2 rounded-[8px] flex items-center gap-3 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors no-underline"
                  >
                    <Globe className="w-4 h-4 text-[#0078d4] dark:text-[#4cc2ff] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium truncate">{item.title}</div>
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
                    className="w-full px-3 py-2 rounded-[8px] flex items-center gap-3 text-left text-[#111827] dark:text-white hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent"
                  >
                    {item.logo ? (
                      <img
                        src={item.logo}
                        alt=""
                        className="w-4 h-4 object-contain rounded-[3px] shrink-0"
                      />
                    ) : item.route ? (
                      <TabIcon
                        route={item.route}
                        active
                        dynamicIcons={dynamicIcons}
                        className="w-4 h-4 shrink-0"
                      />
                    ) : (
                      <Search className="w-4 h-4 opacity-70 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-medium truncate">{item.title}</div>
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

      {/* Right: System icons (Wi-Fi, Battery) + Date & Time (Picture 1 style) */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("sparkle:toggle-quick-settings"))}
        className="flex items-center gap-2.5 h-[26px] px-2 rounded-full hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors cursor-pointer border-none bg-transparent shrink-0"
        title="Quick Settings & Status"
      >
        <Wifi className="w-3.5 h-3.5" strokeWidth={2} />
        {/* Crisp Battery Icon matching Picture 1 */}
        <svg
          width="17"
          height="11"
          viewBox="0 0 18 11"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect
            x="0.75"
            y="1.25"
            width="14.5"
            height="8.5"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <rect x="2.4" y="2.9" width="11.2" height="5.2" rx="0.8" fill="currentColor" />
          <path d="M16.2 3.8V7.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="text-[12px] font-medium tabular-nums whitespace-nowrap leading-none">
          {dateTimeText}
        </span>
      </button>
    </header>
  );
};
