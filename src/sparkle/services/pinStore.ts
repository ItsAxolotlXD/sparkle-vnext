import { useSyncExternalStore } from 'react';
import { START_APPS, type StartAppDef } from '../data/startApps';

/** An app pinned to the taskbar, identified by its route. */
export interface TaskbarPin {
  route: string;
  title: string;
}

export interface PinState {
  taskbarPins: TaskbarPin[];
  /** Start app ids the user removed from the Start "Pinned" grid. */
  startUnpinned: string[];
}

export const DEFAULT_TASKBAR_PINS: readonly TaskbarPin[] = [
  { route: '/file-explorer', title: 'File Explorer' },
  { route: '/live-tv', title: 'Watch' },
];

const TASKBAR_PINS_KEY = 'sparkle_taskbar_pins_v1';
const TASKBAR_PINS_MIGRATED_V2_KEY = 'sparkle_taskbar_pins_migrated_v2';
const START_UNPINNED_KEY = 'sparkle_start_unpinned_v1';

// ---------- pure helpers ----------

const stripQuery = (route: string): string => {
  const base = route.split(/[?#]/)[0] ?? '';
  if (!base || base === '/') return '/';
  return base.replace(/\/+$/, '') || '/';
};

/** True when `route` belongs to the app living at `appRoute` (sub-pages and query strings included). */
export const routeBelongsTo = (route: string, appRoute: string): boolean => {
  const base = stripQuery(route);
  if (appRoute === '/') return base === '/';
  return base === appRoute || base.startsWith(`${appRoute}/`);
};

/** The Start app that owns this route, if any. */
export const findStartAppForRoute = (route: string): StartAppDef | undefined =>
  START_APPS.find((app) => app.route !== undefined && routeBelongsTo(route, app.route));

/** Route a window/app should be pinned under: the owning Start app's route, else the path without query. */
export const canonicalPinRoute = (route: string): string =>
  findStartAppForRoute(route)?.route ?? stripQuery(route);

export const isRoutePinnedToTaskbar = (pins: readonly TaskbarPin[], route: string): boolean =>
  pins.some((pin) => routeBelongsTo(route, pin.route));

export const addTaskbarPin = (pins: readonly TaskbarPin[], route: string, title: string): TaskbarPin[] => {
  const canonical = canonicalPinRoute(route);
  if (pins.some((pin) => pin.route === canonical)) return [...pins];
  const label = findStartAppForRoute(route)?.label ?? title;
  return [...pins, { route: canonical, title: label }];
};

export const removeTaskbarPin = (pins: readonly TaskbarPin[], route: string): TaskbarPin[] =>
  pins.filter((pin) => !routeBelongsTo(route, pin.route));

export const addStartPin = (unpinned: readonly string[], appId: string): string[] =>
  unpinned.filter((id) => id !== appId);

export const removeStartPin = (unpinned: readonly string[], appId: string): string[] =>
  unpinned.includes(appId) ? [...unpinned] : [...unpinned, appId];

/** Stable slot id used by the taskbar order list, e.g. "/file-explorer" -> "pin-file-explorer". */
export const taskbarPinId = (route: string): string =>
  `pin-${route.replace(/^\/+/, '').replace(/\//g, '-') || 'home'}`;

// ---------- persisted store ----------

const readJson = (key: string): unknown => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
};

const loadState = (): PinState => {
  if (typeof window === 'undefined') {
    return { taskbarPins: [...DEFAULT_TASKBAR_PINS], startUnpinned: [] };
  }
  const rawPins = readJson(TASKBAR_PINS_KEY);
  let taskbarPins = Array.isArray(rawPins)
    ? rawPins.filter(
        (p): p is TaskbarPin =>
          typeof p === 'object' && p !== null && typeof p.route === 'string' && typeof p.title === 'string'
      )
    : [...DEFAULT_TASKBAR_PINS];

  try {
    if (!localStorage.getItem(TASKBAR_PINS_MIGRATED_V2_KEY)) {
      if (Array.isArray(rawPins)) {
        taskbarPins = removeTaskbarPin(taskbarPins, '/settings');
        taskbarPins = addTaskbarPin(taskbarPins, '/live-tv', 'Watch');
        localStorage.setItem(TASKBAR_PINS_KEY, JSON.stringify(taskbarPins));
      }
      localStorage.setItem(TASKBAR_PINS_MIGRATED_V2_KEY, '1');
    }
  } catch {
    // ignore storage errors
  }

  const rawUnpinned = readJson(START_UNPINNED_KEY);
  const startUnpinned = Array.isArray(rawUnpinned)
    ? rawUnpinned.filter((id): id is string => typeof id === 'string')
    : [];
  return { taskbarPins, startUnpinned };
};

let state: PinState | null = null;
const listeners = new Set<() => void>();

const getState = (): PinState => {
  if (!state) state = loadState();
  return state;
};

const setState = (next: PinState) => {
  state = next;
  try {
    localStorage.setItem(TASKBAR_PINS_KEY, JSON.stringify(next.taskbarPins));
    localStorage.setItem(START_UNPINNED_KEY, JSON.stringify(next.startUnpinned));
  } catch {
    // storage full or blocked: keep in-memory state
  }
  listeners.forEach((fn) => fn());
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const pinActions = {
  pinToTaskbar(route: string, title: string) {
    const s = getState();
    setState({ ...s, taskbarPins: addTaskbarPin(s.taskbarPins, route, title) });
  },
  unpinFromTaskbar(route: string) {
    const s = getState();
    setState({ ...s, taskbarPins: removeTaskbarPin(s.taskbarPins, route) });
  },
  pinToStart(appId: string) {
    const s = getState();
    setState({ ...s, startUnpinned: addStartPin(s.startUnpinned, appId) });
  },
  unpinFromStart(appId: string) {
    const s = getState();
    setState({ ...s, startUnpinned: removeStartPin(s.startUnpinned, appId) });
  },
};

export const usePinState = (): PinState => useSyncExternalStore(subscribe, getState, getState);
