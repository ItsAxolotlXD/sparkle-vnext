import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TASKBAR_PINS,
  addStartPin,
  addTaskbarPin,
  isRoutePinnedToTaskbar,
  removeStartPin,
  removeTaskbarPin,
  taskbarPinId,
} from './pinStore';

describe('taskbar pins', () => {
  it('starts with File Explorer and Watch pinned', () => {
    expect(DEFAULT_TASKBAR_PINS.map((p) => p.route)).toEqual(['/file-explorer', '/live-tv']);
  });

  it('pins an open window under its app route, not the window URL', () => {
    const pins = addTaskbarPin(DEFAULT_TASKBAR_PINS, '/settings?tab=general', 'General');
    expect(pins.at(-1)).toEqual({ route: '/settings', title: 'Settings' });
  });

  it('does not pin the same app twice', () => {
    const pins = addTaskbarPin(DEFAULT_TASKBAR_PINS, '/live-tv?channel=vtv1', 'VTV1');
    expect(pins).toHaveLength(2);
  });

  it('unpinning removes the app from the taskbar', () => {
    const pins = removeTaskbarPin(DEFAULT_TASKBAR_PINS, '/file-explorer');
    expect(isRoutePinnedToTaskbar(pins, '/file-explorer')).toBe(false);
    expect(isRoutePinnedToTaskbar(pins, '/live-tv')).toBe(true);
  });

  it('keeps the existing slot ids for the default pins', () => {
    expect(taskbarPinId('/file-explorer')).toBe('pin-file-explorer');
    expect(taskbarPinId('/live-tv')).toBe('pin-live-tv');
  });
});

describe('start pins', () => {
  it('unpinning hides the app and pinning brings it back', () => {
    const hidden = removeStartPin([], 'app-camera');
    expect(hidden).toEqual(['app-camera']);
    expect(addStartPin(hidden, 'app-camera')).toEqual([]);
  });
});
