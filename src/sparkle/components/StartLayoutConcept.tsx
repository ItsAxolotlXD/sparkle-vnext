"use client";

import React, { useMemo, useState } from "react";
import {
  Clock3,
  Download,
  FileText,
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  Music2,
  Power,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import type { StartMenuAppItem } from "./WindowsStartMenu";

type StartTab = "For you" | "Pinned" | "All Apps" | "Recents";

interface StartLayoutConceptProps {
  isLightMode: boolean;
  accountLabel: string | null;
  apps: StartMenuAppItem[];
  allApps: StartMenuAppItem[];
  recommendedItems: Array<{
    id: string;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    onClick: () => void;
  }>;
  query: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onLaunchApp: (app: StartMenuAppItem) => void;
  onOpenSettings: () => void;
  onOpenFileExplorer: () => void;
  onOpenGallery: () => void;
  onOpenAccount: () => void;
  onExitSparkle: () => void;
  onRestart: () => void;
}

const tabIcons: Record<StartTab, React.ReactNode> = {
  "For you": <Sparkles className="size-4" />,
  Pinned: <Folder className="size-4" />,
  "All Apps": <LayoutGrid className="size-4" />,
  Recents: <Clock3 className="size-4" />,
};

export function StartLayoutConcept({
  isLightMode,
  accountLabel,
  apps,
  allApps,
  recommendedItems,
  query,
  searchInputRef,
  onQueryChange,
  onLaunchApp,
  onOpenSettings,
  onOpenFileExplorer,
  onOpenGallery,
  onOpenAccount,
  onExitSparkle,
  onRestart,
}: StartLayoutConceptProps) {
  const [activeTab, setActiveTab] = useState<StartTab>("Pinned");
  const [powerMenuOpen, setPowerMenuOpen] = useState(false);
  const date = new Date();
  const timeLabel = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const dateLabel = date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
  const searchQuery = query.trim().toLowerCase();
  const matchedApps = useMemo(() => {
    const source = searchQuery || activeTab === "All Apps" ? allApps : apps;
    return source.filter(
      (app) => !searchQuery || `${app.label} ${app.keywords}`.toLowerCase().includes(searchQuery),
    );
  }, [activeTab, allApps, apps, searchQuery]);
  const suggestedApps = useMemo(() => {
    const preferred = [
      "app-file-explorer",
      "app-screenbox",
      "app-settings",
      "app-pc-settings",
      "app-html-writer",
      "app-watch",
    ];
    const byId = new Map(apps.map((app) => [app.id, app]));
    return preferred
      .map((id) => byId.get(id))
      .filter(Boolean)
      .slice(0, 6) as StartMenuAppItem[];
  }, [apps]);
  const displayedApps =
    searchQuery || activeTab === "All Apps"
      ? [...matchedApps].sort((a, b) => a.label.localeCompare(b.label))
      : matchedApps;

  const renderApp = (app: StartMenuAppItem, compact = false) => (
    <button
      key={app.id}
      type="button"
      onClick={() => onLaunchApp(app)}
      className={`group min-w-0 rounded-xl flex flex-col items-center justify-center text-center text-current transition-colors hover:bg-black/[0.06] dark:hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${compact ? "gap-1 px-1 py-2" : "gap-2 px-2 py-3"}`}
    >
      <span
        className={`${compact ? "size-8" : "size-10"} flex items-center justify-center transition-transform group-hover:scale-105`}
      >
        {app.renderIcon(compact ? "size-8" : "size-10")}
      </span>
      <span className={`w-full truncate ${compact ? "text-[11px]" : "text-[12px]"}`}>
        {app.label}
      </span>
    </button>
  );

  return (
    <div
      className="w-full max-w-[872px] h-[min(686px,calc(100vh-72px))] min-h-[440px] rounded-[14px] border border-black/10 dark:border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.24)] flex flex-col overflow-hidden text-[#101418] dark:text-white"
      style={{
        backgroundColor: isLightMode ? "rgba(231, 239, 244, 0.91)" : "rgba(31, 37, 48, 0.92)",
        backdropFilter: "blur(42px) saturate(170%)",
        WebkitBackdropFilter: "blur(42px) saturate(170%)",
      }}
    >
      <div className="px-5 sm:px-6 pt-5 pb-3 shrink-0">
        <div className="relative flex items-center gap-3">
          <label className="h-11 min-w-0 flex-1 flex items-center gap-3 px-4 rounded-md bg-white/75 dark:bg-white/[0.10] border-b-2 border-black/15 dark:border-white/20 focus-within:border-sky-500">
            <Search className="size-4 shrink-0 text-neutral-500" />
            <span className="sr-only">Search apps</span>
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Type here to search"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500"
            />
          </label>
          <button
            type="button"
            onClick={() => setPowerMenuOpen((open) => !open)}
            aria-label="Power options"
            aria-expanded={powerMenuOpen}
            className="size-9 shrink-0 rounded-lg grid place-items-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <Power className="size-4" />
          </button>
          {powerMenuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#252932]/95 p-1.5 shadow-xl backdrop-blur-xl">
              <button
                type="button"
                onClick={onExitSparkle}
                className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                Exit SparkleOS Mode
              </button>
              <button
                type="button"
                onClick={onRestart}
                className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
              >
                Restart Sparkle
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 px-4 sm:px-6 pb-4 flex flex-col">
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1.42fr)_minmax(270px,0.9fr)] gap-4">
          <section className="min-h-0 flex flex-col md:border-r md:border-black/[0.08] md:dark:border-white/[0.08] md:pr-4">
            <nav
              aria-label="Start menu sections"
              className="shrink-0 flex items-center gap-1 overflow-x-auto no-scrollbar mb-3"
            >
              {(["For you", "Pinned", "All Apps", "Recents"] as StartTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-current={activeTab === tab ? "page" : undefined}
                  className={`relative h-10 px-2.5 flex items-center gap-2 rounded-t-lg text-[12px] whitespace-nowrap transition-colors ${activeTab === tab ? "text-sky-700 dark:text-sky-300" : "text-current hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"}`}
                >
                  {tabIcons[tab]}
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 inset-x-3 h-[2px] rounded-full bg-sky-600 dark:bg-sky-300" />
                  )}
                </button>
              ))}
            </nav>

            <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-4 gap-1 sm:gap-2">
                {displayedApps.map((app) => renderApp(app))}
              </div>
              {displayedApps.length === 0 && (
                <p className="py-10 text-center text-sm text-neutral-500">No apps found.</p>
              )}
              {activeTab === "Recents" && !searchQuery && recommendedItems.length > 0 && (
                <div className="mt-4 border-t border-black/[0.08] dark:border-white/[0.1] pt-3">
                  <h2 className="mb-2 px-2 text-xs font-semibold">Recently opened</h2>
                  {recommendedItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="w-full h-11 px-2 rounded-lg flex items-center gap-3 text-left hover:bg-black/[0.05] dark:hover:bg-white/[0.07]"
                    >
                      {item.icon}
                      <span className="min-w-0 flex-1 truncate text-xs">{item.title}</span>
                      <span className="text-[10px] text-neutral-500">{item.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="hidden md:flex min-h-0 flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div
                aria-label="Weather in Hà Nội: 27 degrees, partly cloudy"
                className="min-h-[150px] rounded-xl bg-white/35 dark:bg-white/[0.07] p-3 text-left flex flex-col justify-between"
              >
                <span className="w-full flex items-center justify-between text-xs">
                  <span>Hà Nội</span>
                  <span aria-hidden="true">→</span>
                </span>
                <span className="flex flex-col items-center">
                  <Sun className="size-9 text-amber-500" />
                  <span className="mt-1 text-2xl font-light">27°C</span>
                  <span className="text-[11px]">Partly cloudy</span>
                </span>
                <span className="flex justify-center gap-1" aria-label="Weather slides">
                  <i className="size-1.5 rounded-full bg-neutral-700 dark:bg-white" />
                  <i className="size-1.5 rounded-full bg-neutral-500/40" />
                  <i className="size-1.5 rounded-full bg-neutral-500/40" />
                </span>
              </div>
              <div className="min-h-[150px] rounded-xl bg-white/35 dark:bg-white/[0.07] p-3 flex flex-col">
                <span className="flex items-center gap-2 text-xs">
                  <Clock3 className="size-3.5" />
                  Clock
                </span>
                <span className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[26px] font-light tracking-tight">{timeLabel}</span>
                  <span className="mt-1 text-[11px] text-center">{dateLabel}</span>
                </span>
              </div>
            </div>

            <div className="min-h-0 flex-1 rounded-xl bg-white/35 dark:bg-white/[0.07] px-3 py-3 overflow-y-auto no-scrollbar">
              <h2 className="mb-2 px-1 text-xs font-medium">Suggested apps</h2>
              <div className="grid grid-cols-3 gap-1">
                {suggestedApps.map((app) => renderApp(app, true))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <footer className="h-[58px] shrink-0 px-5 sm:px-6 bg-black/[0.04] dark:bg-black/20 border-t border-black/[0.08] dark:border-white/[0.08] flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenAccount}
          className="h-9 px-2 -ml-2 rounded-lg flex items-center gap-2.5 hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
        >
          <span className="size-8 rounded-full bg-sky-600 text-white grid place-items-center">
            <User className="size-4" />
          </span>
          <span className="max-w-[140px] truncate text-xs">{accountLabel ?? "Sparkle User"}</span>
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onOpenFileExplorer}
            aria-label="Documents"
            className="size-9 rounded-lg grid place-items-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <FileText className="size-4" />
          </button>
          <button
            type="button"
            onClick={onOpenFileExplorer}
            aria-label="Downloads"
            className="size-9 rounded-lg grid place-items-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <Download className="size-4" />
          </button>
          <button
            type="button"
            onClick={onOpenGallery}
            aria-label="Music"
            className="size-9 rounded-lg grid place-items-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <Music2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onOpenGallery}
            aria-label="Pictures"
            className="size-9 rounded-lg grid place-items-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <ImageIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Settings"
            className="size-9 rounded-lg grid place-items-center hover:bg-black/[0.06] dark:hover:bg-white/[0.08]"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
