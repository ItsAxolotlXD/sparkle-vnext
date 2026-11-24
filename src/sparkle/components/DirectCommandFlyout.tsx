// @ts-nocheck -- ported as-is from the original Sparkle project, which was not written for this strict TypeScript setup.
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, CornerDownLeft, Trash2, ChevronRight } from 'lucide-react';
import { useSettings, getTaskbarHeightPx, SystemSettings, FLOAT_BAR_BOTTOM_GAP_PX } from '../hooks/useSettings';
import { getViveFeatures, findViveFeatureById } from '../utils/viveFeatures';
import { showAppToast } from '../utils/toast';

interface DirectCommandFlyoutProps {
  isOpen: boolean;
  onClose: () => void;
  isTaskbarFloating?: boolean;
}

interface ConsoleLine {
  text: string;
  tone?: 'default' | 'muted' | 'success' | 'error' | 'accent';
  prefillCommand?: string;
}

interface ConsoleEntry {
  id: string;
  command?: string;
  lines: ConsoleLine[];
}

interface CommandSuggestion {
  syntax: string;
  insertText: string;
  description: string;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  { syntax: '/help', insertText: '/help', description: 'Get help of all commands available' },
  { syntax: '/ui /si /small|default|large', insertText: '/ui /si /', description: 'Modifies the UI scale of SparkleOS Mode' },
  { syntax: '/theme /light|dark', insertText: '/theme /', description: 'Change the overall theme' },
  { syntax: '/search /appearance /box|button', insertText: '/search /appearance /', description: 'Change the search style on taskbar' },
  { syntax: '/taskbar /si /small|default|large', insertText: '/taskbar /si /', description: 'Modifies the taskbar scale' },
  { syntax: '/taskbar /alignment /center|left', insertText: '/taskbar /alignment /', description: 'Adjust taskbar alignment' },
  { syntax: '/vivetool /list', insertText: '/vivetool /list', description: 'Shows list of available Vive features' },
  { syntax: '/vivetool /enable /id:<ID>', insertText: '/vivetool /enable /id:', description: 'Force enable a Vive feature by 8-digit ID' },
  { syntax: '/vivetool /disable /id:<ID>', insertText: '/vivetool /disable /id:', description: 'Force disable a Vive feature by 8-digit ID' },
  { syntax: '/session /start', insertText: '/session /start', description: 'Start SparkleOS Mode' },
  { syntax: '/session /end', insertText: '/session /end', description: 'Exit SparkleOS Mode' },
];

const WELCOME_ENTRY: ConsoleEntry = {
  id: 'welcome',
  lines: [
    { text: 'Sparkle Direct Command [Version 27000.26 (vNext)]', tone: 'accent' },
    { text: 'Type /help for a list of commands. Press Tab to autocomplete.', tone: 'muted' },
  ],
};

export const DirectCommandFlyout: React.FC<DirectCommandFlyoutProps> = ({ isOpen, onClose, isTaskbarFloating = false }) => {
  const { settings, updateSetting } = useSettings();
  const isLightMode = settings.theme === 'light';
  const taskbarHeight = getTaskbarHeightPx(settings.taskbarScale, isTaskbarFloating);
  const isVerticalTaskbar = settings.taskbarPosition === 'left' || settings.taskbarPosition === 'right';
  const isTopTaskbar = settings.taskbarPosition === 'top';
  const bottomOffset = settings.windowsMode && !isVerticalTaskbar && !isTopTaskbar
    ? taskbarHeight + (isTaskbarFloating ? FLOAT_BAR_BOTTOM_GAP_PX : 0) + 8
    : 12;

  const [inputValue, setInputValue] = useState('');
  const [entries, setEntries] = useState<ConsoleEntry[]>([WELCOME_ENTRY]);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  const flyoutRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [entries, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('#btn-taskbar-direct-command')) return;
      if (target.closest('[data-windows-context-menu]')) return;
      if (flyoutRef.current && !flyoutRef.current.contains(target)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  const matchingSuggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q || !q.startsWith('/')) return [];
    const tokens = q.split(/\s+/);
    const filtered = COMMAND_SUGGESTIONS.filter((s) => {
      const lowerSyntax = s.syntax.toLowerCase();
      return tokens.every((tok) => lowerSyntax.includes(tok));
    });
    return filtered.slice(0, 5);
  }, [inputValue]);

  const appendEntry = (command: string, lines: ConsoleLine[]) => {
    setEntries((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        command,
        lines,
      },
    ]);
  };

  const executeCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    if (!trimmed) return;

    setCmdHistory((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, 40));
    setHistoryIdx(-1);
    setInputValue('');

    const normalized = trimmed.replace(/\s+/g, ' ');
    const tokens = normalized.split(' ');
    const lowerTokens = tokens.map((t) => t.toLowerCase());
    const cmd = lowerTokens[0];

    // Clear screen aliases
    if (cmd === 'cls' || cmd === '/clear' || cmd === 'clear') {
      setEntries([]);
      return;
    }

    // /help
    if (cmd === '/help' || cmd === 'help' || cmd === '/?') {
      appendEntry(trimmed, [
        { text: 'Available Sparkle Direct Commands:', tone: 'accent' },
        { text: '  /help                                  Get help of all commands available', prefillCommand: '/help' },
        { text: '  /ui /si /small|default|large           Modifies UI scale of SparkleOS Mode', prefillCommand: '/ui /si /' },
        { text: '  /theme /light|dark                     Change the overall theme', prefillCommand: '/theme /' },
        { text: '  /search /appearance /box|button        Change taskbar search style', prefillCommand: '/search /appearance /' },
        { text: '  /taskbar /si /small|default|large      Modifies the taskbar scale', prefillCommand: '/taskbar /si /' },
        { text: '  /taskbar /alignment /center|left       Adjust taskbar alignment', prefillCommand: '/taskbar /alignment /' },
        { text: '  /vivetool /enable|disable /id:<ID>     Force enable or disable Vive features', prefillCommand: '/vivetool /enable /id:' },
        { text: '  /vivetool /list                        Shows list of available Vive features', prefillCommand: '/vivetool /list' },
        { text: '  /session /end                          Exit SparkleOS Mode', prefillCommand: '/session /end' },
        { text: '  /session /start                        Start SparkleOS Mode', prefillCommand: '/session /start' },
        { text: '  cls                                    Clear command output', tone: 'muted' },
      ]);
      return;
    }

    // /ui /si /small|default|large
    if (cmd === '/ui') {
      const sub = lowerTokens[1];
      const val = lowerTokens[2];
      if (sub === '/si' && (val === '/small' || val === '/default' || val === '/large')) {
        const scale = val.slice(1) as 'small' | 'default' | 'large';
        updateSetting('windowsUiScale', scale);
        showAppToast(`SparkleOS Mode UI scale set to ${scale}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `SparkleOS Mode UI scale updated to "${scale}".`, tone: 'success' },
        ]);
      } else {
        appendEntry(trimmed, [
          { text: 'Invalid syntax for /ui.', tone: 'error' },
          { text: 'Usage: /ui /si /small|default|large', tone: 'muted' },
        ]);
      }
      return;
    }

    // /theme /light|dark
    if (cmd === '/theme') {
      const val = lowerTokens[1];
      if (val === '/light' || val === '/dark') {
        const nextTheme = val.slice(1) as 'light' | 'dark';
        updateSetting('theme', nextTheme);
        showAppToast(`Theme switched to ${nextTheme === 'light' ? 'Light' : 'Dark'} mode`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Overall theme changed to "${nextTheme}".`, tone: 'success' },
        ]);
      } else {
        appendEntry(trimmed, [
          { text: 'Invalid syntax for /theme.', tone: 'error' },
          { text: 'Usage: /theme /light|dark', tone: 'muted' },
        ]);
      }
      return;
    }

    // /search /appearance /box|button
    if (cmd === '/search') {
      const sub = lowerTokens[1];
      const val = lowerTokens[2];
      if (sub === '/appearance' && (val === '/box' || val === '/button')) {
        const style = val.slice(1) as 'box' | 'button';
        updateSetting('taskbarSearchStyle', style);
        showAppToast(`Taskbar search style set to ${style}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Taskbar search appearance changed to "${style}".`, tone: 'success' },
        ]);
      } else {
        appendEntry(trimmed, [
          { text: 'Invalid syntax for /search.', tone: 'error' },
          { text: 'Usage: /search /appearance /box|button', tone: 'muted' },
        ]);
      }
      return;
    }

    // /taskbar /si /small|default|large OR /taskbar /alignment /center|left
    if (cmd === '/taskbar') {
      const sub = lowerTokens[1];
      const val = lowerTokens[2];
      if (sub === '/si' && (val === '/small' || val === '/default' || val === '/large')) {
        const scale = val.slice(1) as 'small' | 'default' | 'large';
        updateSetting('taskbarScale', scale);
        showAppToast(`Taskbar scale set to ${scale}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Taskbar scale updated to "${scale}".`, tone: 'success' },
        ]);
        return;
      }
      if (sub === '/alignment' && (val === '/center' || val === '/left')) {
        const alignment = val.slice(1) as 'center' | 'left';
        updateSetting('taskbarAlignment', alignment);
        showAppToast(`Taskbar alignment set to ${alignment}`, { source: 'settings' });
        appendEntry(trimmed, [
          { text: `Taskbar alignment adjusted to "${alignment}".`, tone: 'success' },
        ]);
        return;
      }
      appendEntry(trimmed, [
        { text: 'Invalid syntax for /taskbar.', tone: 'error' },
        { text: 'Usage: /taskbar /si /small|default|large  |  /taskbar /alignment /center|left', tone: 'muted' },
      ]);
      return;
    }

    // /vivetool /list OR /vivetool /enable|disable /id:<ID number>
    if (cmd === '/vivetool') {
      const sub = lowerTokens[1];
      if (sub === '/list') {
        const features = getViveFeatures();
        appendEntry(trimmed, [
          { text: 'ViVeTool v0.3.3 — Available Vive Features:', tone: 'accent' },
          { text: '  ID         State      Feature Name', tone: 'muted' },
          { text: '  --------   --------   ------------------------', tone: 'muted' },
          ...features.map((f) => {
            const isEnabled = Boolean(settings[f.key]);
            const stateLabel = isEnabled ? 'Enabled ' : 'Disabled';
            const nextAction = isEnabled ? 'disable' : 'enable';
            return {
              text: `  ${f.id}   ${stateLabel}   ${f.name}`,
              tone: (isEnabled ? 'success' : 'default') as ConsoleLine['tone'],
              prefillCommand: `/vivetool /${nextAction} /id:${f.id}`,
            };
          }),
          { text: 'Tip: Click any row above to prefill its toggle command.', tone: 'muted' },
        ]);
        return;
      }

      if (sub === '/enable' || sub === '/disable') {
        const shouldEnable = sub === '/enable';
        const idArg = lowerTokens[2] || '';
        let extractedId = '';
        if (idArg.startsWith('/id:')) {
          extractedId = idArg.slice(4);
        } else if (idArg.startsWith('/id=')) {
          extractedId = idArg.slice(4);
        } else if (idArg === '/id' && lowerTokens[3]) {
          extractedId = lowerTokens[3];
        }

        if (!/^\d{8}$/.test(extractedId)) {
          appendEntry(trimmed, [
            { text: 'Error: Missing or invalid 8-digit feature ID.', tone: 'error' },
            { text: 'Usage: /vivetool /enable|disable /id:<8-digit ID>  (Run /vivetool /list to view IDs)', tone: 'muted', prefillCommand: '/vivetool /list' },
          ]);
          return;
        }

        const feature = findViveFeatureById(extractedId);
        if (!feature) {
          appendEntry(trimmed, [
            { text: `Error: Vive feature with ID "${extractedId}" was not found.`, tone: 'error' },
            { text: 'Run /vivetool /list to see valid 8-digit feature IDs.', tone: 'muted', prefillCommand: '/vivetool /list' },
          ]);
          return;
        }

        updateSetting(feature.key as keyof SystemSettings, shouldEnable as never);
        showAppToast(
          `${shouldEnable ? 'Enabled' : 'Disabled'} Vive feature: ${feature.name} (${feature.id})`,
          { source: 'settings' }
        );
        appendEntry(trimmed, [
          { text: 'Successfully set feature configuration(s).', tone: 'success' },
          { text: `  [${feature.id}] ${feature.name} -> ${shouldEnable ? 'Enabled' : 'Disabled'}`, tone: 'default' },
        ]);
        return;
      }

      appendEntry(trimmed, [
        { text: 'Invalid syntax for /vivetool.', tone: 'error' },
        { text: 'Usage: /vivetool /list  |  /vivetool /enable|disable /id:<ID number>', tone: 'muted' },
      ]);
      return;
    }

    // /session /end | /session /start
    if (cmd === '/session') {
      const sub = lowerTokens[1];
      if (sub === '/end') {
        if (!settings.windowsMode) {
          appendEntry(trimmed, [{ text: 'SparkleOS Mode is already inactive.', tone: 'muted' }]);
        } else {
          updateSetting('windowsMode', false);
          showAppToast('Exited SparkleOS Mode', { source: 'settings' });
          appendEntry(trimmed, [
            { text: 'SparkleOS Mode session ended.', tone: 'success' },
            { text: 'Run /session /start anytime to re-enter SparkleOS Mode.', tone: 'muted', prefillCommand: '/session /start' },
          ]);
        }
        return;
      }
      if (sub === '/start') {
        if (settings.windowsMode) {
          appendEntry(trimmed, [{ text: 'SparkleOS Mode is already running.', tone: 'muted' }]);
        } else {
          updateSetting('windowsMode', true);
          showAppToast('Started SparkleOS Mode', { source: 'settings' });
          appendEntry(trimmed, [{ text: 'SparkleOS Mode session started.', tone: 'success' }]);
        }
        return;
      }
      appendEntry(trimmed, [
        { text: 'Invalid syntax for /session.', tone: 'error' },
        { text: 'Usage: /session /start  |  /session /end', tone: 'muted' },
      ]);
      return;
    }

    // Unrecognized command
    appendEntry(trimmed, [
      { text: `'${tokens[0]}' is not recognized as an internal or external command.`, tone: 'error' },
      { text: 'Type /help to see all supported commands.', tone: 'muted', prefillCommand: '/help' },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      if (matchingSuggestions.length > 0) {
        e.preventDefault();
        setInputValue(matchingSuggestions[0].insertText);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      if (cmdHistory.length > 0) {
        e.preventDefault();
        const nextIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      if (historyIdx > 0) {
        e.preventDefault();
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputValue(cmdHistory[nextIdx]);
      } else if (historyIdx === 0) {
        e.preventDefault();
        setHistoryIdx(-1);
        setInputValue('');
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="windows-direct-command-flyout-wrapper"
          initial={settings.reduceAllMotion ? false : { x: '100%' }}
          animate={{
            x: 0,
            transition: settings.reduceAllMotion
              ? { duration: 0 }
              : { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
          }}
          exit={
            settings.reduceAllMotion
              ? undefined
              : { x: '100%', transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }
          }
          style={{
            zIndex: 9100,
            ...(settings.windowsMode && isVerticalTaskbar
              ? settings.taskbarPosition === 'left'
                ? { left: `${taskbarHeight + 8}px` }
                : { right: `${taskbarHeight + 8}px` }
              : settings.windowsMode && isTopTaskbar
                ? { top: `${taskbarHeight + 8}px` }
                : settings.windowsMode
                  ? { bottom: `${bottomOffset}px` }
                  : {}),
          }}
          className="pointer-events-none fixed inset-y-0 right-0 flex w-full justify-end sm:w-[min(390px,42vw)]"
        >
          <div
            ref={flyoutRef}
            id="windows-direct-command-flyout"
            role="dialog"
            aria-modal="false"
            aria-labelledby="direct-command-title"
            className={`pointer-events-auto flex h-full min-h-0 w-full flex-col overflow-hidden border-l shadow-[-18px_0_48px_rgba(0,0,0,0.18)] ${
              isLightMode
                ? 'border-black/10 bg-[#f7f7f8] text-[#242424]'
                : 'border-white/10 bg-[#202124] text-[#f5f5f5]'
            }`}
          >
            <header className={`flex h-12 shrink-0 items-center justify-between border-b px-4 ${
              isLightMode ? 'border-black/10' : 'border-white/10'
            }`}>
              <div className="flex min-w-0 items-center">
                <h2 id="direct-command-title" className="truncate text-[13px] font-semibold">Preview</h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEntries([]);
                    setInputValue('');
                    inputRef.current?.focus();
                  }}
                  title="Clear conversation"
                  aria-label="Clear conversation"
                  className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                    isLightMode ? 'text-black/60 hover:bg-black/[0.06]' : 'text-white/65 hover:bg-white/[0.08]'
                  }`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Direct Command"
                  className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                    isLightMode ? 'text-black/60 hover:bg-black/[0.06]' : 'text-white/65 hover:bg-white/[0.08]'
                  }`}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className={`sidebar-scroller min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-8 ${
              isLightMode ? 'bg-[#f7f7f8]' : 'bg-[#202124]'
            }`}>
              {!entries.some((entry) => entry.command) ? (
                <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                  <div className={`mb-4 flex size-14 items-center justify-center rounded-[18px] ${
                    isLightMode ? 'bg-gradient-to-br from-[#dcecff] to-[#f1e8ff] text-[#236cb4]' : 'bg-white/10 text-[#9ccaff]'
                  }`}>
                    <img
                      src="/assets/aistudio/direct_command_6240d59d.png"
                      alt=""
                      draggable={false}
                      className="size-9 object-contain"
                    />
                  </div>
                  <h3 className="text-[22px] font-semibold tracking-[-0.03em]">Direct Command</h3>
                  <p className={`mt-1 text-[12px] ${isLightMode ? 'text-black/55' : 'text-white/55'}`}>
                    Your quick way to control Sparkle.
                  </p>
                  <div className="mt-8 w-full text-left">
                    <p className={`mb-3 text-[11px] font-medium ${isLightMode ? 'text-black/55' : 'text-white/55'}`}>
                      Try a command
                    </p>
                    <div className="flex flex-col gap-2">
                      {COMMAND_SUGGESTIONS.slice(0, 4).map((suggestion) => (
                        <button
                          key={suggestion.syntax}
                          type="button"
                          onClick={() => {
                            setInputValue(suggestion.insertText);
                            inputRef.current?.focus();
                          }}
                          className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition-colors ${
                            isLightMode
                              ? 'bg-white hover:bg-[#f8fbff]'
                              : 'bg-white/[0.04] hover:bg-white/[0.08]'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className={`block font-mono text-[11px] font-semibold ${isLightMode ? 'text-[#1769aa]' : 'text-[#9ccaff]'}`}>
                              {suggestion.syntax}
                            </span>
                            <span className={`mt-1 block text-[11px] leading-relaxed ${isLightMode ? 'text-black/55' : 'text-white/55'}`}>
                              {suggestion.description}
                            </span>
                          </span>
                          <ChevronRight className={`size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${isLightMode ? 'text-black/35' : 'text-white/40'}`} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className={`mt-5 text-[10px] leading-relaxed ${isLightMode ? 'text-black/45' : 'text-white/40'}`}>
                    Commands run on this device. Type <span className="font-mono">/help</span> to see everything available.
                  </p>
                </div>
              ) : (
                <div className="mx-auto flex max-w-sm flex-col gap-5">
                  {entries.filter((entry) => entry.command).map((entry) => (
                    <article key={entry.id} className="flex flex-col gap-2.5">
                      <div className="flex justify-end">
                        <p className={`max-w-[90%] rounded-2xl rounded-br-md px-3.5 py-2.5 font-mono text-[12px] ${
                          isLightMode ? 'bg-[#e6f1fb] text-[#173c5b]' : 'bg-[#24435c] text-[#e8f4ff]'
                        }`}>
                          {entry.command}
                        </p>
                      </div>
                      <div className={`flex flex-col gap-1.5 rounded-2xl rounded-bl-md px-3.5 py-3 text-[12px] leading-relaxed ${
                        isLightMode ? 'bg-white text-[#303030] shadow-sm' : 'bg-white/[0.06] text-[#e8e8e8]'
                      }`}>
                        {entry.lines.map((line, index) => {
                          const toneClass = line.tone === 'error'
                            ? isLightMode ? 'text-[#b42318]' : 'text-[#ff8b8b]'
                            : line.tone === 'success'
                              ? isLightMode ? 'text-[#16733c]' : 'text-[#8bd8a7]'
                              : line.tone === 'accent'
                                ? isLightMode ? 'font-semibold text-[#1769aa]' : 'font-semibold text-[#9ccaff]'
                                : line.tone === 'muted'
                                  ? isLightMode ? 'text-black/55' : 'text-white/55'
                                  : '';
                          if (line.prefillCommand) {
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setInputValue(line.prefillCommand!);
                                  inputRef.current?.focus();
                                }}
                                className={`-mx-1 rounded-md px-1 text-left transition-colors hover:bg-black/[0.05] ${toneClass}`}
                              >
                                {line.text}
                              </button>
                            );
                          }
                          return <p key={index} className={`whitespace-pre-wrap break-words ${toneClass}`}>{line.text}</p>;
                        })}
                      </div>
                    </article>
                  ))}
                  <div ref={outputEndRef} />
                </div>
              )}

              {matchingSuggestions.length > 0 && (
                <div className="mx-auto mt-4 flex max-w-sm flex-col gap-1">
                  {matchingSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.syntax}
                      type="button"
                      onClick={() => {
                        setInputValue(suggestion.insertText);
                        inputRef.current?.focus();
                      }}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${
                        isLightMode ? 'hover:bg-black/[0.05]' : 'hover:bg-white/[0.07]'
                      }`}
                    >
                      <span className={`truncate font-mono text-[11px] ${isLightMode ? 'text-[#1769aa]' : 'text-[#9ccaff]'}`}>{suggestion.syntax}</span>
                      <span className={`truncate text-[10px] ${isLightMode ? 'text-black/50' : 'text-white/50'}`}>{suggestion.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                executeCommand(inputValue);
              }}
              className={`shrink-0 border-t px-4 pb-3 pt-3 ${isLightMode ? 'border-black/10 bg-[#f7f7f8]' : 'border-white/10 bg-[#202124]'}`}
            >
              <div className={`flex min-h-12 items-center gap-2 rounded-2xl px-3 py-2 shadow-sm ${
                isLightMode ? 'bg-white' : 'bg-white/[0.06]'
              }`}>
                <input
                  ref={inputRef}
                  id="windows-direct-command-input"
                  type="text"
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value);
                    setHistoryIdx(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Direct Command or type /help"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Enter a Direct Command"
                  className={`min-w-0 flex-1 border-0 bg-transparent text-[13px] outline-none focus:ring-0 ${
                    isLightMode ? 'text-[#242424] placeholder:text-black/45' : 'text-white placeholder:text-white/45'
                  }`}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputValue('');
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear command"
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full ${isLightMode ? 'text-black/50 hover:bg-black/[0.06]' : 'text-white/55 hover:bg-white/[0.1]'}`}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Run command"
                  title="Run command (Enter)"
                  className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#1673bb] text-white transition-colors hover:bg-[#0e5f9f] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!inputValue.trim()}
                >
                  <CornerDownLeft className="size-4" aria-hidden="true" />
                </button>
              </div>
              <p className={`mt-2 text-center text-[10px] ${isLightMode ? 'text-black/45' : 'text-white/40'}`}>
                Direct Command can only change settings available in Sparkle.
              </p>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
