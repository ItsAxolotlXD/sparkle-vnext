import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Flame,
  Globe,
  Cpu,
  HeartPulse,
  Users,
  History,
  Settings,
  Search,
  RefreshCw,
  ChevronRight,
  FolderPlus,
  Trash2,
  Play,
  Square,
  HardDrive,
  BatteryCharging,
  Clock,
  Lock,
  Check,
  X,
} from "lucide-react";
import { Fluent3DDefenderIcon } from "../components/Fluent3DIcons";
import { showAppToast } from "../utils/toast";

type DefenderSectionId =
  | "home"
  | "virus"
  | "account"
  | "firewall"
  | "browser"
  | "device"
  | "performance"
  | "family"
  | "history"
  | "settings";

type ScanProfile = "quick" | "full" | "custom" | "offline";

interface ProtectionEvent {
  id: string;
  title: string;
  category: string;
  severity: "Low" | "Medium" | "Clean";
  status: "Quarantined" | "Blocked" | "Allowed" | "Completed";
  timestamp: string;
  path: string;
}

interface FirewallAppRule {
  id: string;
  name: string;
  privateNet: boolean;
  publicNet: boolean;
}

interface DefenderState {
  realTimeProtection: boolean;
  cloudProtection: boolean;
  automaticSampleSubmission: boolean;
  tamperProtection: boolean;
  controlledFolderAccess: boolean;
  domainFirewall: boolean;
  privateFirewall: boolean;
  publicFirewall: boolean;
  smartScreenApps: boolean;
  smartScreenEdge: boolean;
  puaBlocking: boolean;
  memoryIntegrity: boolean;
  windowsHelloPin: boolean;
  dynamicLock: boolean;
  familyContentFilter: boolean;
  securityNotifications: boolean;
  lastScanType: string;
  lastScanTime: string;
  lastScanDuration: string;
  lastFilesScanned: number;
  threatsFound: number;
  definitionVersion: string;
  lastDefinitionUpdate: string;
  exclusions: string[];
  firewallApps: FirewallAppRule[];
  history: ProtectionEvent[];
}

const DEFENDER_STORAGE_KEY = "sparkle_defender_state_v1";

const DEFAULT_DEFENDER_STATE: DefenderState = {
  realTimeProtection: true,
  cloudProtection: true,
  automaticSampleSubmission: true,
  tamperProtection: true,
  controlledFolderAccess: false,
  domainFirewall: true,
  privateFirewall: true,
  publicFirewall: true,
  smartScreenApps: true,
  smartScreenEdge: true,
  puaBlocking: true,
  memoryIntegrity: true,
  windowsHelloPin: true,
  dynamicLock: false,
  familyContentFilter: false,
  securityNotifications: true,
  lastScanType: "Quick scan",
  lastScanTime: "Today, 09:42 AM",
  lastScanDuration: "0m 18s",
  lastFilesScanned: 42860,
  threatsFound: 0,
  definitionVersion: "1.421.184.0",
  lastDefinitionUpdate: "Today",
  exclusions: ["C:\\Users\\Sparkle\\Projects\\workspace", "C:\\ProgramData\\Sparkle\\Cache"],
  firewallApps: [
    { id: "fw-1", name: "Sparkle Media Streamer", privateNet: true, publicNet: false },
    { id: "fw-2", name: "Screenbox Media Player", privateNet: true, publicNet: true },
    { id: "fw-3", name: "HTML Writer Live Preview", privateNet: true, publicNet: false },
    { id: "fw-4", name: "File Explorer Network Share", privateNet: true, publicNet: false },
  ],
  history: [
    {
      id: "hist-1",
      title: "Quick scan completed — 0 threats found",
      category: "Scan",
      severity: "Clean",
      status: "Completed",
      timestamp: "Today, 09:42 AM",
      path: "System memory & startup sectors",
    },
    {
      id: "hist-2",
      title: "PUA:Win32/BundleLoader",
      category: "Potentially unwanted app",
      severity: "Low",
      status: "Blocked",
      timestamp: "Yesterday, 04:15 PM",
      path: "C:\\Users\\Sparkle\\Downloads\\installer_tmp.exe",
    },
    {
      id: "hist-3",
      title: "Suspicious inbound UDP probe dropped",
      category: "Firewall",
      severity: "Medium",
      status: "Blocked",
      timestamp: "2 days ago",
      path: "Public interface (Port 445)",
    },
  ],
};

function loadDefenderState(): DefenderState {
  try {
    const raw = localStorage.getItem(DEFENDER_STORAGE_KEY);
    if (!raw) return DEFAULT_DEFENDER_STATE;
    const parsed = JSON.parse(raw) as Partial<DefenderState>;
    return {
      ...DEFAULT_DEFENDER_STATE,
      ...parsed,
      exclusions: Array.isArray(parsed.exclusions)
        ? parsed.exclusions
        : DEFAULT_DEFENDER_STATE.exclusions,
      firewallApps: Array.isArray(parsed.firewallApps)
        ? parsed.firewallApps
        : DEFAULT_DEFENDER_STATE.firewallApps,
      history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_DEFENDER_STATE.history,
    };
  } catch {
    return DEFAULT_DEFENDER_STATE;
  }
}

const WinSwitch: React.FC<{
  checked: boolean;
  onToggle: () => void;
  label: string;
}> = ({ checked, onToggle, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={`relative w-[40px] h-[20px] rounded-full transition-colors cursor-pointer shrink-0 border ${
      checked
        ? "bg-[#0067b8] dark:bg-[#4cc2ff] border-transparent"
        : "bg-black/[0.06] dark:bg-white/[0.08] border-black/35 dark:border-white/40"
    }`}
  >
    <span
      className={`block w-[12px] h-[12px] rounded-full transition-transform duration-150 ${
        checked
          ? "translate-x-[23px] bg-white dark:bg-[#111827]"
          : "translate-x-[3px] bg-[#4b5563] dark:bg-[#d1d5db]"
      }`}
    />
  </button>
);

const StatusBadgeIcon: React.FC<{
  status: "good" | "warning" | "info";
  size?: "sm" | "md";
}> = ({ status, size = "sm" }) => {
  const dim = size === "md" ? "w-5 h-5" : "w-4 h-4";
  if (status === "good") {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`fluent-3d-icon ${dim} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="def_ok_g"
            x1="2"
            y1="2"
            x2="18"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>
        </defs>
        <circle cx="10" cy="10" r="8.5" fill="url(#def_ok_g)" />
        <path
          d="M6.4 10.2L8.8 12.6L13.8 7.5"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === "warning") {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="none"
        className={`fluent-3d-icon ${dim} shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="def_warn_g"
            x1="3"
            y1="2"
            x2="17"
            y2="18"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>
        <path
          d="M9.12 3.1C9.5 2.43 10.5 2.43 10.88 3.1L17.9 15.6C18.27 16.27 17.79 17.1 17.02 17.1H2.98C2.21 17.1 1.73 16.27 2.1 15.6L9.12 3.1Z"
          fill="url(#def_warn_g)"
        />
        <path d="M10 7.2V11.3" stroke="#111827" strokeWidth="1.9" strokeLinecap="round" />
        <circle cx="10" cy="14" r="1" fill="#111827" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`fluent-3d-icon ${dim} shrink-0`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="def_info_g"
          x1="2"
          y1="2"
          x2="18"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="8.5" fill="url(#def_info_g)" />
      <path d="M10 9V14" stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="10" cy="6.4" r="1.05" fill="#FFFFFF" />
    </svg>
  );
};

interface DefenderProps {
  navigate?: (route: string) => void;
}

const SCAN_PATHS = [
  "C:\\Windows\\System32\\ntoskrnl.exe",
  "C:\\Windows\\System32\\drivers\\wdfilter.sys",
  "C:\\Program Files\\Sparkle\\sparkle-core.dll",
  "C:\\Users\\Sparkle\\AppData\\Local\\Temp\\cache.bin",
  "C:\\Users\\Sparkle\\Documents\\workspace\\index.ts",
  "C:\\Windows\\WinSxS\\Manifests\\amd64_defender.manifest",
];

export const DefenderScreen: React.FC<DefenderProps> = () => {
  const [state, setState] = useState<DefenderState>(loadDefenderState);
  const [activeSection, setActiveSection] = useState<DefenderSectionId>("home");
  const [scanProfile, setScanProfile] = useState<ScanProfile>("quick");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCount, setScanCount] = useState(0);
  const [scanTargetPath, setScanTargetPath] = useState("");
  const [isUpdatingDefs, setIsUpdatingDefs] = useState(false);
  const [newExclusion, setNewExclusion] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"All" | "Low" | "Medium" | "Clean">("All");
  const [historyQuery, setHistoryQuery] = useState("");
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(DEFENDER_STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore localStorage quota errors */
    }
  }, [state]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current !== null) {
        window.clearInterval(scanTimerRef.current);
      }
    };
  }, []);

  const updateField = <K extends keyof DefenderState>(key: K, value: DefenderState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const virusHealthy = state.realTimeProtection && state.cloudProtection;
  const accountHealthy = state.windowsHelloPin;
  const firewallHealthy = state.domainFirewall && state.privateFirewall && state.publicFirewall;
  const browserHealthy = state.smartScreenApps && state.smartScreenEdge && state.puaBlocking;
  const deviceHealthy = state.memoryIntegrity;
  const overallHealthy =
    virusHealthy && accountHealthy && firewallHealthy && browserHealthy && deviceHealthy;

  const attentionCount = [
    virusHealthy,
    accountHealthy,
    firewallHealthy,
    browserHealthy,
    deviceHealthy,
  ].filter((ok) => !ok).length;

  const startScan = (profile: ScanProfile) => {
    if (isScanning) return;
    setScanProfile(profile);
    setIsScanning(true);
    setScanProgress(4);
    setScanCount(120);
    setScanTargetPath(SCAN_PATHS[0] ?? "C:\\Windows\\System32");

    const labelMap: Record<ScanProfile, string> = {
      quick: "Quick scan",
      full: "Full scan",
      custom: "Custom scan",
      offline: "Microsoft Defender Offline scan",
    };
    const stepSize = profile === "full" ? 6 : profile === "offline" ? 8 : 14;
    const filesIncrement = profile === "full" ? 7840 : 3420;
    let tick = 0;

    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
    }

    scanTimerRef.current = window.setInterval(() => {
      tick += 1;
      setScanTargetPath(SCAN_PATHS[tick % SCAN_PATHS.length] ?? "C:\\Windows\\System32");
      setScanCount((prev) => prev + filesIncrement + ((tick * 137) % 410));
      setScanProgress((prev) => {
        const next = Math.min(100, prev + stepSize);
        if (next >= 100) {
          if (scanTimerRef.current !== null) {
            window.clearInterval(scanTimerRef.current);
            scanTimerRef.current = null;
          }
          setIsScanning(false);
          const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const finalLabel = labelMap[profile];
          const finalFiles = profile === "full" ? 312480 : profile === "custom" ? 18420 : 44190;
          setScanCount(finalFiles);
          const completedEvent: ProtectionEvent = {
            id: `hist-${Date.now()}`,
            title: `${finalLabel} completed — 0 threats found`,
            category: "Scan",
            severity: "Clean",
            status: "Completed",
            timestamp: `Today, ${nowStr}`,
            path: `${finalFiles.toLocaleString()} items verified`,
          };
          setState((curr) => ({
            ...curr,
            lastScanType: finalLabel,
            lastScanTime: `Today, ${nowStr}`,
            lastScanDuration: profile === "full" ? "1m 14s" : "0m 14s",
            lastFilesScanned: finalFiles,
            threatsFound: 0,
            history: [completedEvent, ...curr.history].slice(0, 15),
          }));
          showAppToast(`${finalLabel} finished. No current threats.`);
        }
        return next;
      });
    }, 210);
  };

  const cancelScan = () => {
    if (scanTimerRef.current !== null) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    setIsScanning(false);
    setScanProgress(0);
    setScanTargetPath("");
    showAppToast("Scan canceled.");
  };

  const handleCheckDefinitions = () => {
    if (isUpdatingDefs) return;
    setIsUpdatingDefs(true);
    window.setTimeout(() => {
      setIsUpdatingDefs(false);
      const parts = state.definitionVersion.split(".");
      const buildNum = Number(parts[2] ?? "184") + 1;
      const nextVer = `${parts[0] ?? "1"}.${parts[1] ?? "421"}.${buildNum}.0`;
      const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setState((prev) => ({
        ...prev,
        definitionVersion: nextVer,
        lastDefinitionUpdate: `Today, ${nowStr}`,
      }));
      showAppToast(`Security intelligence updated to v${nextVer}.`);
    }, 950);
  };

  const handleEnableAllRecommended = () => {
    setState((prev) => ({
      ...prev,
      realTimeProtection: true,
      cloudProtection: true,
      domainFirewall: true,
      privateFirewall: true,
      publicFirewall: true,
      smartScreenApps: true,
      smartScreenEdge: true,
      puaBlocking: true,
      memoryIntegrity: true,
      windowsHelloPin: true,
    }));
    showAppToast("All Windows Security protections enabled.");
  };

  const handleAddExclusion = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newExclusion.trim();
    if (!trimmed) return;
    if (state.exclusions.includes(trimmed)) {
      showAppToast("Path is already excluded.");
      return;
    }
    setState((prev) => ({
      ...prev,
      exclusions: [trimmed, ...prev.exclusions],
    }));
    setNewExclusion("");
    showAppToast("Added folder/file exclusion.");
  };

  const navItems: Array<{
    id: DefenderSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    healthy?: boolean;
  }> = [
    { id: "home", label: "Home", icon: Shield, healthy: overallHealthy },
    { id: "virus", label: "Virus & threat protection", icon: ShieldCheck, healthy: virusHealthy },
    { id: "account", label: "Account protection", icon: UserCheck, healthy: accountHealthy },
    {
      id: "firewall",
      label: "Firewall & network protection",
      icon: Flame,
      healthy: firewallHealthy,
    },
    { id: "browser", label: "App & browser control", icon: Globe, healthy: browserHealthy },
    { id: "device", label: "Device security", icon: Cpu, healthy: deviceHealthy },
    { id: "performance", label: "Device performance & health", icon: HeartPulse, healthy: true },
    { id: "family", label: "Family options", icon: Users, healthy: true },
    { id: "history", label: "Protection history", icon: History },
  ];

  const cardClass =
    "rounded-[8px] bg-white/90 dark:bg-white/[0.045] border border-black/[0.07] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]";
  const rowClass = `${cardClass} px-4 py-3.5 flex items-center justify-between gap-4`;

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return state.history.filter((item) => {
      if (historyFilter !== "All" && item.severity !== historyFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q)
      );
    });
  }, [state.history, historyFilter, historyQuery]);

  const homeOverviewCards: Array<{
    id: DefenderSectionId;
    title: string;
    subtitle: string;
    healthy: boolean;
    icon: React.ComponentType<{ className?: string }>;
    quickFix?: { label: string; onFix: () => void } | undefined;
  }> = [
    {
      id: "virus",
      title: "Virus & threat protection",
      subtitle: virusHealthy
        ? `No action needed · Last scan: ${state.lastScanTime}`
        : "Real-time or cloud protection is turned off.",
      healthy: virusHealthy,
      icon: ShieldCheck,
      quickFix: virusHealthy
        ? undefined
        : {
            label: "Turn on",
            onFix: () =>
              setState((p) => ({ ...p, realTimeProtection: true, cloudProtection: true })),
          },
    },
    {
      id: "account",
      title: "Account protection",
      subtitle: accountHealthy
        ? "Windows Hello PIN & account lock are active."
        : "Review sign-in security options.",
      healthy: accountHealthy,
      icon: UserCheck,
      quickFix: accountHealthy
        ? undefined
        : {
            label: "Enable PIN",
            onFix: () => updateField("windowsHelloPin", true),
          },
    },
    {
      id: "firewall",
      title: "Firewall & network protection",
      subtitle: firewallHealthy
        ? "Domain, Private, and Public firewalls are on."
        : "One or more firewall profiles are turned off.",
      healthy: firewallHealthy,
      icon: Flame,
      quickFix: firewallHealthy
        ? undefined
        : {
            label: "Restore firewall",
            onFix: () =>
              setState((p) => ({
                ...p,
                domainFirewall: true,
                privateFirewall: true,
                publicFirewall: true,
              })),
          },
    },
    {
      id: "browser",
      title: "App & browser control",
      subtitle: browserHealthy
        ? "SmartScreen & PUA blocking are protecting your device."
        : "Reputation-based protection is partially disabled.",
      healthy: browserHealthy,
      icon: Globe,
      quickFix: browserHealthy
        ? undefined
        : {
            label: "Turn on",
            onFix: () =>
              setState((p) => ({
                ...p,
                smartScreenApps: true,
                smartScreenEdge: true,
                puaBlocking: true,
              })),
          },
    },
    {
      id: "device",
      title: "Device security",
      subtitle: deviceHealthy
        ? "Core isolation & TPM 2.0 security processor active."
        : "Memory integrity is turned off.",
      healthy: deviceHealthy,
      icon: Cpu,
      quickFix: deviceHealthy
        ? undefined
        : {
            label: "Turn on",
            onFix: () => updateField("memoryIntegrity", true),
          },
    },
    {
      id: "performance",
      title: "Device performance & health",
      subtitle: "Storage capacity, battery life, and time service are healthy.",
      healthy: true,
      icon: HeartPulse,
    },
    {
      id: "family",
      title: "Family options",
      subtitle: state.familyContentFilter
        ? "Web content filtering is enabled."
        : "Manage parental controls & screen time limits.",
      healthy: true,
      icon: Users,
    },
  ];

  return (
    <div
      id="windows-defender-app"
      className="winui3 w-full h-full flex flex-col md:flex-row bg-[#f3f4f6] dark:bg-[#1c2026] text-[#111827] dark:text-[#f3f4f6] select-none overflow-hidden"
    >
      {/* Left WinUI 3 NavigationView Pane */}
      <aside className="w-full md:w-[252px] shrink-0 border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.07] bg-[#edf0f5]/85 dark:bg-[#171a20]/90 flex flex-col">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <Fluent3DDefenderIcon className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <div className="text-[14px] font-semibold truncate">Windows Security</div>
            <div className="text-[11.5px] text-black/60 dark:text-white/60 truncate">
              {overallHealthy ? "Device protected" : `${attentionCount} action(s) needed`}
            </div>
          </div>
        </div>

        <nav
          aria-label="Windows Security sections"
          className="flex md:flex-col gap-1 px-2 pb-2 md:pb-3 overflow-x-auto md:overflow-y-auto flex-1"
        >
          {navItems.map((item) => {
            const IconComp = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`relative shrink-0 md:w-full h-[36px] px-3 rounded-[6px] flex items-center gap-2.5 text-[13px] transition-colors cursor-pointer border-none ${
                  active
                    ? "bg-black/[0.06] dark:bg-white/[0.09] font-semibold text-[#111827] dark:text-white"
                    : "bg-transparent font-normal text-black/80 dark:text-white/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-full bg-[#0063b8] dark:bg-[#4cc2ff]"
                  />
                )}
                <IconComp className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap truncate flex-1 text-left">{item.label}</span>
                {item.healthy === false && <StatusBadgeIcon status="warning" size="sm" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom Settings Navigation Item */}
        <div className="hidden md:block p-2 border-t border-black/[0.06] dark:border-white/[0.07]">
          <button
            type="button"
            onClick={() => setActiveSection("settings")}
            className={`relative w-full h-[36px] px-3 rounded-[6px] flex items-center gap-2.5 text-[13px] transition-colors cursor-pointer border-none ${
              activeSection === "settings"
                ? "bg-black/[0.06] dark:bg-white/[0.09] font-semibold text-[#111827] dark:text-white"
                : "bg-transparent font-normal text-black/80 dark:text-white/80 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
            }`}
          >
            {activeSection === "settings" && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[16px] rounded-full bg-[#0063b8] dark:bg-[#4cc2ff]"
              />
            )}
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5 sm:p-7">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto space-y-5"
        >
          {/* HOME: SECURITY AT A GLANCE */}
          {activeSection === "home" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-semibold tracking-tight">
                    Security at a glance
                  </h1>
                  <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                    See what’s happening with the security and health of your device and take any
                    actions needed.
                  </p>
                </div>
                {!overallHealthy && (
                  <button
                    type="button"
                    onClick={handleEnableAllRecommended}
                    className="fluent-btn-primary h-[32px] px-4 rounded-[6px] text-[12.5px] font-semibold cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Turn on all protections
                  </button>
                )}
              </div>

              {/* Overall Health Summary Card */}
              <div
                className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="flex items-center gap-3.5">
                  <StatusBadgeIcon status={overallHealthy ? "good" : "warning"} size="md" />
                  <div>
                    <div className="text-[15px] font-semibold">
                      {overallHealthy ? "No actions needed" : "Actions recommended"}
                    </div>
                    <div className="text-[12.5px] text-black/65 dark:text-white/65">
                      {overallHealthy
                        ? `Microsoft Defender Antivirus & Firewall are actively monitoring · Definitions v${state.definitionVersion}`
                        : `${attentionCount} security area(s) require attention to keep your device protected.`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSection("virus");
                      startScan("quick");
                    }}
                    className="h-[32px] px-3.5 rounded-[6px] border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[12.5px] font-medium cursor-pointer whitespace-nowrap"
                  >
                    Run quick scan
                  </button>
                </div>
              </div>

              {/* 7-Tile Security Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {homeOverviewCards.map((card) => {
                  const IconComp = card.icon;
                  return (
                    <div
                      key={card.id}
                      className={`${cardClass} p-4 flex flex-col justify-between gap-4 hover:border-black/15 dark:hover:border-white/20 transition-colors`}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveSection(card.id)}
                        className="text-left bg-transparent border-none p-0 cursor-pointer space-y-3 w-full"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-10 h-10 rounded-[8px] bg-[#0067b8]/10 dark:bg-[#4cc2ff]/12 flex items-center justify-center relative">
                            <IconComp className="w-5 h-5 text-[#0067b8] dark:text-[#4cc2ff]" />
                            <span className="absolute -bottom-1 -right-1">
                              <StatusBadgeIcon status={card.healthy ? "good" : "warning"} />
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-45 shrink-0 mt-1" />
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold leading-snug">{card.title}</div>
                          <div className="text-[12px] text-black/65 dark:text-white/65 mt-1 leading-relaxed">
                            {card.subtitle}
                          </div>
                        </div>
                      </button>

                      {card.quickFix ? (
                        <button
                          type="button"
                          onClick={card.quickFix.onFix}
                          className="fluent-btn-primary h-[28px] px-3 rounded-[5px] text-[12px] font-semibold cursor-pointer self-start"
                        >
                          {card.quickFix.label}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActiveSection(card.id)}
                          className="text-[12px] font-medium text-[#0067b8] dark:text-[#4cc2ff] hover:underline bg-transparent border-none p-0 cursor-pointer self-start"
                        >
                          Open details
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* VIRUS & THREAT PROTECTION */}
          {activeSection === "virus" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">
                  Virus & threat protection
                </h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Protection for your device against threats, ransomware, and malicious apps.
                </p>
              </div>

              {/* Current Threats & Live Scan Card */}
              <div className={`${cardClass} p-5 space-y-4`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StatusBadgeIcon status={virusHealthy ? "good" : "warning"} size="md" />
                    <div>
                      <div className="text-[15px] font-semibold">
                        {isScanning ? "Scanning your device..." : "No current threats."}
                      </div>
                      <div className="text-[12.5px] text-black/65 dark:text-white/65 tabular-nums">
                        {isScanning
                          ? `${scanCount.toLocaleString()} files scanned · ${scanProgress}% complete`
                          : `${state.lastScanType}: ${state.lastScanTime} · ${state.lastScanDuration} · ${state.lastFilesScanned.toLocaleString()} files scanned`}
                      </div>
                    </div>
                  </div>
                  {isScanning ? (
                    <button
                      type="button"
                      onClick={cancelScan}
                      className="h-[32px] px-4 rounded-[6px] border border-black/15 dark:border-white/15 bg-black/[0.04] dark:bg-white/[0.08] text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startScan(scanProfile)}
                      className="fluent-btn-primary h-[32px] px-4 rounded-[6px] text-[12.5px] font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Quick scan
                    </button>
                  )}
                </div>

                {isScanning && (
                  <div className="space-y-1.5">
                    <div className="h-2 rounded-full bg-black/[0.08] dark:bg-white/[0.1] overflow-hidden">
                      <div
                        className="h-full bg-[#0067b8] dark:bg-[#4cc2ff] transition-all duration-200"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <div className="text-[11.5px] font-mono text-black/60 dark:text-white/60 truncate">
                      {scanTargetPath}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.07]">
                  <div className="text-[12.5px] font-medium mb-2">Scan options</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(
                      [
                        {
                          id: "quick",
                          label: "Quick scan",
                          desc: "Checks folders where threats are commonly found.",
                        },
                        {
                          id: "full",
                          label: "Full scan",
                          desc: "Checks all files and running programs on your disk.",
                        },
                        {
                          id: "custom",
                          label: "Custom scan",
                          desc: "Choose which files or workspace folders to check.",
                        },
                        {
                          id: "offline",
                          label: "Microsoft Defender Offline scan",
                          desc: "Deep boot-level check for persistent rootkits.",
                        },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isScanning}
                        onClick={() => startScan(opt.id)}
                        className={`p-3 rounded-[6px] border text-left transition-colors cursor-pointer disabled:opacity-55 ${
                          scanProfile === opt.id
                            ? "border-[#0067b8]/50 dark:border-[#4cc2ff]/50 bg-[#0067b8]/[0.06] dark:bg-[#4cc2ff]/[0.08]"
                            : "border-black/[0.07] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="text-[13px] font-semibold">{opt.label}</div>
                        <div className="text-[11.5px] text-black/60 dark:text-white/60 mt-0.5">
                          {opt.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Virus & Threat Protection Settings */}
              <div className="space-y-2.5">
                <h2 className="text-[15px] font-semibold">Virus & threat protection settings</h2>
                <div className={rowClass}>
                  <div>
                    <div className="text-[13.5px] font-medium">Real-time protection</div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      Locates and stops malware from installing or running on your device.
                    </div>
                  </div>
                  <WinSwitch
                    label="Real-time protection"
                    checked={state.realTimeProtection}
                    onToggle={() => updateField("realTimeProtection", !state.realTimeProtection)}
                  />
                </div>
                <div className={rowClass}>
                  <div>
                    <div className="text-[13.5px] font-medium">Cloud-delivered protection</div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      Provides increased and faster protection with cloud threat intelligence.
                    </div>
                  </div>
                  <WinSwitch
                    label="Cloud-delivered protection"
                    checked={state.cloudProtection}
                    onToggle={() => updateField("cloudProtection", !state.cloudProtection)}
                  />
                </div>
                <div className={rowClass}>
                  <div>
                    <div className="text-[13.5px] font-medium">Automatic sample submission</div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      Send suspicious sample files to help verify potential threats.
                    </div>
                  </div>
                  <WinSwitch
                    label="Automatic sample submission"
                    checked={state.automaticSampleSubmission}
                    onToggle={() =>
                      updateField("automaticSampleSubmission", !state.automaticSampleSubmission)
                    }
                  />
                </div>
                <div className={rowClass}>
                  <div>
                    <div className="text-[13.5px] font-medium">Tamper Protection</div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      Prevents unauthorized apps from changing important security features.
                    </div>
                  </div>
                  <WinSwitch
                    label="Tamper Protection"
                    checked={state.tamperProtection}
                    onToggle={() => updateField("tamperProtection", !state.tamperProtection)}
                  />
                </div>
                <div className={rowClass}>
                  <div>
                    <div className="text-[13.5px] font-medium">
                      Ransomware protection (Controlled folder access)
                    </div>
                    <div className="text-[12px] text-black/60 dark:text-white/60">
                      Protect files, folders, and memory areas from unauthorized changes.
                    </div>
                  </div>
                  <WinSwitch
                    label="Controlled folder access"
                    checked={state.controlledFolderAccess}
                    onToggle={() =>
                      updateField("controlledFolderAccess", !state.controlledFolderAccess)
                    }
                  />
                </div>
              </div>

              {/* Security Intelligence Updates */}
              <div
                className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
              >
                <div>
                  <div className="text-[14px] font-semibold">Virus & threat protection updates</div>
                  <div className="text-[12px] text-black/65 dark:text-white/65 tabular-nums">
                    Security intelligence version: {state.definitionVersion} · Updated:{" "}
                    {state.lastDefinitionUpdate}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckDefinitions}
                  disabled={isUpdatingDefs}
                  className="h-[32px] px-3.5 rounded-[6px] border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[12.5px] font-medium flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingDefs ? "animate-spin" : ""}`} />
                  {isUpdatingDefs ? "Checking..." : "Check for updates"}
                </button>
              </div>

              {/* Trusted Exclusions */}
              <div className={`${cardClass} p-4 space-y-3`}>
                <div>
                  <div className="text-[14px] font-semibold">Exclusions</div>
                  <div className="text-[12px] text-black/65 dark:text-white/65">
                    Microsoft Defender Antivirus won’t scan items that you exclude.
                  </div>
                </div>
                <form onSubmit={handleAddExclusion} className="flex items-center gap-2">
                  <div className="winui-search-input flex-1 flex items-center h-[34px] px-3 rounded-[6px] bg-white dark:bg-[#242830] border border-black/10 dark:border-white/12">
                    <FolderPlus className="w-4 h-4 opacity-60 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={newExclusion}
                      onChange={(e) => setNewExclusion(e.target.value)}
                      placeholder="Add folder or file path (e.g. C:\Builds)"
                      className="w-full bg-transparent text-[12.5px] outline-none border-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="fluent-btn-primary h-[34px] px-3.5 rounded-[6px] text-[12.5px] font-semibold cursor-pointer shrink-0"
                  >
                    Add exclusion
                  </button>
                </form>
                <div className="space-y-1.5">
                  {state.exclusions.map((path) => (
                    <div
                      key={path}
                      className="px-3 py-2 rounded-[6px] bg-black/[0.03] dark:bg-white/[0.04] flex items-center justify-between gap-2"
                    >
                      <span className="text-[12.5px] font-mono truncate">{path}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateField(
                            "exclusions",
                            state.exclusions.filter((p) => p !== path),
                          )
                        }
                        aria-label={`Remove ${path}`}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ACCOUNT PROTECTION */}
          {activeSection === "account" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">Account protection</h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Manage sign-in protection, Windows Hello PIN, and automatic device locking.
                </p>
              </div>
              <div className={rowClass}>
                <div className="flex items-center gap-3">
                  <StatusBadgeIcon status="good" size="md" />
                  <div>
                    <div className="text-[14px] font-semibold">Sparkle Account</div>
                    <div className="text-[12px] text-black/65 dark:text-white/65">
                      Signed in as local administrator · Credential Guard active
                    </div>
                  </div>
                </div>
                <span className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
                  Protected
                </span>
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Windows Hello PIN sign-in</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Require biometric or hardware-backed PIN to sign in and approve security
                    prompts.
                  </div>
                </div>
                <WinSwitch
                  label="Windows Hello PIN"
                  checked={state.windowsHelloPin}
                  onToggle={() => updateField("windowsHelloPin", !state.windowsHelloPin)}
                />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Dynamic lock</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Automatically lock your Sparkle PC when paired Bluetooth devices go out of
                    range.
                  </div>
                </div>
                <WinSwitch
                  label="Dynamic lock"
                  checked={state.dynamicLock}
                  onToggle={() => updateField("dynamicLock", !state.dynamicLock)}
                />
              </div>
            </>
          )}

          {/* FIREWALL & NETWORK PROTECTION */}
          {activeSection === "firewall" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">
                  Firewall & network protection
                </h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  View network connections and manage Microsoft Defender Firewall profiles.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    key: "domainFirewall" as const,
                    title: "Domain network",
                    desc: "Enterprise workplace domain rules.",
                    active: state.domainFirewall,
                  },
                  {
                    key: "privateFirewall" as const,
                    title: "Private network",
                    desc: "Trusted home or studio Wi-Fi network.",
                    active: state.privateFirewall,
                  },
                  {
                    key: "publicFirewall" as const,
                    title: "Public network",
                    desc: "Strict protection on public hotspots.",
                    active: state.publicFirewall,
                  },
                ].map((net) => (
                  <div key={net.key} className={`${cardClass} p-4 space-y-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadgeIcon status={net.active ? "good" : "warning"} size="md" />
                      <WinSwitch
                        label={net.title}
                        checked={net.active}
                        onToggle={() => updateField(net.key, !net.active)}
                      />
                    </div>
                    <div>
                      <div className="text-[14px] font-semibold">{net.title}</div>
                      <div className="text-[12px] text-black/65 dark:text-white/65 mt-0.5">
                        {net.active ? "Firewall is on" : "Firewall is off"} · {net.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${cardClass} p-4 space-y-3`}>
                <div className="text-[14px] font-semibold">Allow an app through firewall</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[12.5px]">
                    <thead>
                      <tr className="border-b border-black/[0.07] dark:border-white/[0.08] text-black/65 dark:text-white/65">
                        <th className="py-2 font-medium">Allowed app</th>
                        <th className="py-2 font-medium text-center">Private</th>
                        <th className="py-2 font-medium text-center">Public</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.firewallApps.map((appRule) => (
                        <tr
                          key={appRule.id}
                          className="border-b last:border-b-0 border-black/[0.05] dark:border-white/[0.05]"
                        >
                          <td className="py-2.5 font-medium">{appRule.name}</td>
                          <td className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${appRule.name} private network`}
                              checked={appRule.privateNet}
                              onChange={() =>
                                updateField(
                                  "firewallApps",
                                  state.firewallApps.map((r) =>
                                    r.id === appRule.id ? { ...r, privateNet: !r.privateNet } : r,
                                  ),
                                )
                              }
                              className="winui-checkbox w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <input
                              type="checkbox"
                              aria-label={`${appRule.name} public network`}
                              checked={appRule.publicNet}
                              onChange={() =>
                                updateField(
                                  "firewallApps",
                                  state.firewallApps.map((r) =>
                                    r.id === appRule.id ? { ...r, publicNet: !r.publicNet } : r,
                                  ),
                                )
                              }
                              className="winui-checkbox w-4 h-4 cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* APP & BROWSER CONTROL */}
          {activeSection === "browser" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">App & browser control</h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Microsoft Defender SmartScreen protects against malicious sites and downloads.
                </p>
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Check apps and files</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Warns before running unrecognized apps downloaded from the web.
                  </div>
                </div>
                <WinSwitch
                  label="Check apps and files"
                  checked={state.smartScreenApps}
                  onToggle={() => updateField("smartScreenApps", !state.smartScreenApps)}
                />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">SmartScreen for Sparkle Browser</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Helps protect against phishing sites and malicious downloads in URL search.
                  </div>
                </div>
                <WinSwitch
                  label="SmartScreen for browser"
                  checked={state.smartScreenEdge}
                  onToggle={() => updateField("smartScreenEdge", !state.smartScreenEdge)}
                />
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Potentially unwanted app blocking</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Blocks low-reputation adware and bundleware before execution.
                  </div>
                </div>
                <WinSwitch
                  label="Potentially unwanted app blocking"
                  checked={state.puaBlocking}
                  onToggle={() => updateField("puaBlocking", !state.puaBlocking)}
                />
              </div>
            </>
          )}

          {/* DEVICE SECURITY */}
          {activeSection === "device" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">Device security</h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Built-in hardware isolation and security processor protection.
                </p>
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Core isolation — Memory integrity</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Prevents attacks from inserting malicious code into high-security processes.
                  </div>
                </div>
                <WinSwitch
                  label="Memory integrity"
                  checked={state.memoryIntegrity}
                  onToggle={() => updateField("memoryIntegrity", !state.memoryIntegrity)}
                />
              </div>
              <div className={`${cardClass} p-4 space-y-2.5`}>
                <div className="flex items-center gap-2.5">
                  <Lock className="w-4 h-4 shrink-0" />
                  <div className="text-[14px] font-semibold">Security processor (TPM 2.0)</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px] pt-1">
                  <div className="p-3 rounded-[6px] bg-black/[0.03] dark:bg-white/[0.04]">
                    <div className="text-black/60 dark:text-white/60">Specification version</div>
                    <div className="font-semibold tabular-nums mt-0.5">2.0</div>
                  </div>
                  <div className="p-3 rounded-[6px] bg-black/[0.03] dark:bg-white/[0.04]">
                    <div className="text-black/60 dark:text-white/60">Attestation status</div>
                    <div className="font-semibold mt-0.5">Ready</div>
                  </div>
                  <div className="p-3 rounded-[6px] bg-black/[0.03] dark:bg-white/[0.04]">
                    <div className="text-black/60 dark:text-white/60">Secure Boot</div>
                    <div className="font-semibold mt-0.5">On</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* DEVICE PERFORMANCE & HEALTH */}
          {activeSection === "performance" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">
                  Device performance & health
                </h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Health report for your device’s storage, battery, apps, and system clock.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    icon: HardDrive,
                    title: "Storage capacity",
                    detail: "184 GB free of 512 GB NVMe SSD · No issues.",
                  },
                  {
                    icon: BatteryCharging,
                    title: "Battery life",
                    detail: "Power efficiency & brightness policies balanced.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Apps and software",
                    detail: "All Sparkle apps & WinUI 3 runtimes up to date.",
                  },
                  {
                    icon: Clock,
                    title: "Windows time service",
                    detail: "System clock synchronized automatically.",
                  },
                ].map((row) => {
                  const IconComp = row.icon;
                  return (
                    <div key={row.title} className={`${cardClass} p-4 flex items-start gap-3`}>
                      <IconComp className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold">{row.title}</span>
                          <StatusBadgeIcon status="good" />
                        </div>
                        <div className="text-[12px] text-black/65 dark:text-white/65 mt-1">
                          {row.detail}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* FAMILY OPTIONS */}
          {activeSection === "family" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">Family options</h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Configure content filters and safe browsing rules for family profiles.
                </p>
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Web & search content filtering</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Filter mature search queries and block unsafe websites automatically.
                  </div>
                </div>
                <WinSwitch
                  label="Family content filter"
                  checked={state.familyContentFilter}
                  onToggle={() => updateField("familyContentFilter", !state.familyContentFilter)}
                />
              </div>
            </>
          )}

          {/* PROTECTION HISTORY */}
          {activeSection === "history" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-[24px] font-semibold tracking-tight">Protection history</h1>
                  <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                    Recent scans, blocked threats, and firewall events.
                  </p>
                </div>
                {state.history.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField("history", []);
                      showAppToast("Protection history cleared.");
                    }}
                    className="h-[30px] px-3 rounded-[6px] border border-black/15 dark:border-white/15 bg-black/[0.03] dark:bg-white/[0.06] text-[12px] font-medium cursor-pointer shrink-0"
                  >
                    Clear history
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="winui-search-input flex-1 flex items-center h-[34px] px-3 rounded-[6px] bg-white dark:bg-[#242830] border border-black/10 dark:border-white/12">
                  <Search className="w-3.5 h-3.5 opacity-60 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    placeholder="Filter protection history"
                    className="w-full bg-transparent text-[12.5px] outline-none border-none"
                  />
                  {historyQuery && (
                    <button
                      type="button"
                      onClick={() => setHistoryQuery("")}
                      aria-label="Clear filter"
                      className="p-0.5 border-none bg-transparent cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 p-1 rounded-[7px] bg-black/[0.05] dark:bg-white/[0.06]">
                  {(["All", "Clean", "Low", "Medium"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setHistoryFilter(lvl)}
                      className={`h-[26px] px-2.5 rounded-[5px] text-[12px] font-medium cursor-pointer border-none transition-colors ${
                        historyFilter === lvl
                          ? "bg-white dark:bg-white/15 text-[#111827] dark:text-white shadow-xs"
                          : "bg-transparent text-black/70 dark:text-white/70"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className={`${cardClass} p-6 text-center space-y-2`}>
                  <ShieldAlert className="w-7 h-7 mx-auto opacity-55" />
                  <div className="text-[14px] font-semibold">No recent actions</div>
                  <div className="text-[12.5px] text-black/65 dark:text-white/65">
                    Run a Quick scan in Virus & threat protection to verify system integrity.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`${cardClass} p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <StatusBadgeIcon status={item.severity === "Clean" ? "good" : "warning"} />
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold truncate">{item.title}</div>
                          <div className="text-[12px] text-black/60 dark:text-white/60">
                            {item.category} · {item.severity} · {item.timestamp}
                          </div>
                          <div className="text-[11.5px] font-mono text-black/55 dark:text-white/55 truncate mt-0.5">
                            {item.path}
                          </div>
                        </div>
                      </div>
                      <span className="text-[12px] font-medium px-2.5 py-1 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.07] shrink-0 self-start sm:self-center">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* SETTINGS */}
          {activeSection === "settings" && (
            <>
              <div>
                <h1 className="text-[24px] font-semibold tracking-tight">Settings</h1>
                <p className="text-[13px] text-black/65 dark:text-white/65 mt-0.5">
                  Notifications, security providers, and Windows Security client details.
                </p>
              </div>
              <div className={rowClass}>
                <div>
                  <div className="text-[13.5px] font-medium">Security notifications</div>
                  <div className="text-[12px] text-black/60 dark:text-white/60">
                    Receive alerts when scans complete or threats are blocked.
                  </div>
                </div>
                <WinSwitch
                  label="Security notifications"
                  checked={state.securityNotifications}
                  onToggle={() =>
                    updateField("securityNotifications", !state.securityNotifications)
                  }
                />
              </div>
              <div className={`${cardClass} p-4 space-y-2`}>
                <div className="text-[14px] font-semibold">About Windows Security</div>
                <div className="text-[12.5px] text-black/65 dark:text-white/65 space-y-1 tabular-nums">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>Sparkle Defender Antivirus Client: 4.18.26100.1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>Security intelligence version: {state.definitionVersion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5" />
                    <span>WinUI 3 Windows Security Shell · Build vNext</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};
