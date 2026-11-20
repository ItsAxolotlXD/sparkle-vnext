import { START_APPS } from "../data/startApps";
import { NEWS_DATA } from "../data/news";
import type { Channel } from "../types";
import type { NoteItem } from "../context/NotesContext";

export interface DesktopSearchResult {
  id: string;
  title: string;
  subtitle: string;
  kind: "app" | "channel" | "news" | "note" | "url" | "web";
  route?: string | undefined;
  externalUrl?: string | undefined;
  logo?: string | undefined;
  channel?: Channel | undefined;
  noteId?: string | undefined;
}

const URL_PATTERN = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;

export function normalizeUrlInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (URL_PATTERN.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export function buildDesktopSearchResults(
  query: string,
  options: {
    channels: Channel[];
    notes: NoteItem[];
    developerMode: boolean;
  },
): DesktopSearchResult[] {
  const q = query.trim();
  const ql = q.toLowerCase();
  const results: DesktopSearchResult[] = [];

  if (!ql) {
    for (const app of START_APPS) {
      if (app.devOnly && !options.developerMode) continue;
      if (
        [
          "app-home",
          "app-watch",
          "app-file-explorer",
          "app-notes",
          "app-gallery",
          "app-pc-settings",
        ].includes(app.id)
      ) {
        results.push({
          id: app.id,
          title: app.label,
          subtitle: "App",
          kind: "app",
          route: app.route,
          externalUrl: app.externalUrl,
        });
      }
    }
    return results;
  }

  const parsedUrl = normalizeUrlInput(q);
  if (parsedUrl) {
    results.push({
      id: `url-${parsedUrl}`,
      title: parsedUrl,
      subtitle: "Open URL in new tab",
      kind: "url",
      externalUrl: parsedUrl,
    });
  }

  if (q.startsWith("/") && q.length > 1) {
    results.push({
      id: `route-${q}`,
      title: `Open ${q}`,
      subtitle: "Sparkle Route",
      kind: "app",
      route: q,
    });
  }

  for (const app of START_APPS) {
    if (app.devOnly && !options.developerMode) continue;
    if (app.label.toLowerCase().includes(ql) || app.keywords.toLowerCase().includes(ql)) {
      results.push({
        id: app.id,
        title: app.label,
        subtitle: app.externalUrl ? "External Link" : "App",
        kind: "app",
        route: app.route,
        externalUrl: app.externalUrl,
      });
    }
  }

  for (const ch of options.channels) {
    if (
      ch.name.toLowerCase().includes(ql) ||
      (ch.shortName && ch.shortName.toLowerCase().includes(ql)) ||
      ch.slug.toLowerCase().includes(ql) ||
      (ch.category && ch.category.toLowerCase().includes(ql))
    ) {
      results.push({
        id: `ch-${ch.id}`,
        title: ch.name,
        subtitle: ch.category || "Live TV Channel",
        kind: "channel",
        route: `/live-tv?channel=${ch.slug}`,
        logo: ch.logo,
        channel: ch,
      });
    }
    if (results.length >= 12) break;
  }

  for (const note of options.notes) {
    const title = note.title.trim() || "Untitled Note";
    if (title.toLowerCase().includes(ql)) {
      results.push({
        id: `note-${note.id}`,
        title,
        subtitle: "Note",
        kind: "note",
        route: "/notes",
        noteId: note.id,
      });
    }
    if (results.length >= 14) break;
  }

  for (const art of NEWS_DATA) {
    if (
      art.title.toLowerCase().includes(ql) ||
      (art.category && art.category.toLowerCase().includes(ql))
    ) {
      results.push({
        id: `news-${art.id}`,
        title: art.title.replace(/^#\s*/, ""),
        subtitle: "Update blogs",
        kind: "news",
        route: `/article/${art.id}`,
      });
    }
    if (results.length >= 16) break;
  }

  results.push({
    id: `web-${ql}`,
    title: `Search the web for "${q}"`,
    subtitle: "Bing Search",
    kind: "web",
    externalUrl: `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  });

  return results;
}
