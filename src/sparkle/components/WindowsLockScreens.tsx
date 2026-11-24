import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Accessibility,
  ArrowRight,
  Globe2,
  LockKeyhole,
  Power,
  UserRound,
  Wifi,
} from "lucide-react";

type WindowsLockScreensProps = {
  onUnlock: () => void;
  wallpaperUrl: string;
};

export function WindowsLockScreens({ onUnlock, wallpaperUrl }: WindowsLockScreensProps) {
  const [screen, setScreen] = useState<"lock" | "signin" | "shutdown">("lock");
  const [password, setPassword] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [isPowerMenuOpen, setIsPowerMenuOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screen !== "lock") return;
    const advance = (event: KeyboardEvent) => {
      if (
        (event.target instanceof HTMLElement && event.target.closest("button, input")) ||
        event.key === "Tab" ||
        event.key === "Shift" ||
        event.key === "Control" ||
        event.key === "Alt"
      )
        return;
      event.preventDefault();
      setScreen("signin");
    };
    window.addEventListener("keydown", advance);
    return () => window.removeEventListener("keydown", advance);
  }, [screen]);

  const unlock = (event: FormEvent) => {
    event.preventDefault();
    if (!password.trim()) return;
    onUnlock();
  };

  const handlePowerAction = (action: "sleep" | "shutdown" | "restart") => {
    setIsPowerMenuOpen(false);
    if (action === "shutdown") {
      setScreen("shutdown");
      return;
    }
    setPassword("");
    setScreen("lock");
  };

  const powerMenu = isPowerMenuOpen ? (
    <div
      role="menu"
      aria-label="Tùy chọn nguồn"
      className="absolute bottom-12 right-0 z-20 min-w-40 overflow-hidden border border-white/25 bg-[#171717]/95 py-1 shadow-2xl backdrop-blur-xl"
    >
      {(
        [
          ["sleep", "Ngủ"],
          ["shutdown", "Tắt máy"],
          ["restart", "Khởi động lại"],
        ] as const
      ).map(([action, label]) => (
        <button
          key={action}
          type="button"
          role="menuitem"
          onClick={() => handlePowerAction(action)}
          className="block w-full px-5 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/15 focus-visible:bg-white/15 focus-visible:outline-none"
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-[2147483000] overflow-hidden bg-[#172018] text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label={
        screen === "lock"
          ? "Windows lock screen"
          : screen === "signin"
            ? "Windows sign-in screen"
            : "Windows shutdown screen"
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {screen === "lock" ? (
          <motion.div
            key="lock-screen"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <button
              type="button"
              onClick={() => setScreen("signin")}
              className="absolute inset-0 flex cursor-pointer flex-col justify-end bg-cover bg-center text-left outline-none"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08) 42%, rgba(0,0,0,.48) 100%), url("${wallpaperUrl}")`,
              }}
              aria-label="Mở màn hình đăng nhập"
            >
              <div className="px-6 pb-10 sm:px-10 sm:pb-14">
                <time
                  className="block text-[76px] font-light leading-none tracking-[-0.06em] drop-shadow-lg sm:text-[112px]"
                  dateTime={now.toISOString()}
                >
                  {now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </time>
                <div className="mt-3 text-2xl font-light drop-shadow-md sm:text-[34px]">
                  {now.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="mt-10 flex items-center gap-2 text-sm text-white/90">
                  <span className="flex size-7 items-center justify-center rounded-full border border-white/80">
                    <LockKeyhole className="size-4" />
                  </span>
                  <span>Nhấn phím bất kỳ hoặc chạm để đăng nhập</span>
                </div>
              </div>
            </button>
            <div className="absolute bottom-6 right-6 z-10 flex items-center gap-5 text-white/90">
              <Wifi className="size-5" aria-label="Wi-Fi" />
              <Accessibility className="size-5" aria-label="Trợ năng" />
              <div className="relative">
                <button
                  type="button"
                  aria-label="Nguồn"
                  aria-haspopup="menu"
                  aria-expanded={isPowerMenuOpen}
                  onClick={() => setIsPowerMenuOpen((open) => !open)}
                  className="rounded p-1 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Power className="size-5" />
                </button>
                {powerMenu}
              </div>
            </div>
          </motion.div>
        ) : screen === "signin" ? (
          <motion.div
            key="signin-screen"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-12%" }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden px-5"
          >
            <div
              aria-hidden="true"
              className="absolute inset-[-28px] bg-cover bg-center blur-[24px]"
              style={{ backgroundImage: `url("${wallpaperUrl}")` }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
            <form
              onSubmit={unlock}
              className="relative z-10 flex w-full max-w-[340px] flex-col items-center text-center"
            >
              <div className="mb-3 flex size-[128px] items-center justify-center rounded-full bg-white/25 shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
                <UserRound className="size-16 stroke-[1.35]" />
              </div>
              <h1 className="text-[25px] font-light tracking-wide drop-shadow">Sparkle User</h1>
              <label htmlFor="windows-signin-password" className="sr-only">
                Mật khẩu
              </label>
              <div className="mt-5 flex h-10 w-full max-w-[270px] overflow-hidden border border-white/65 bg-white text-gray-800 shadow-lg focus-within:ring-2 focus-within:ring-[#4cc2ff]">
                <input
                  id="windows-signin-password"
                  autoFocus
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mật khẩu"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 bg-[#ffffff] px-3 text-sm text-gray-800 outline-none placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={!password.trim()}
                  aria-label="Đăng nhập"
                  className="flex w-11 items-center justify-center bg-black/10 transition hover:bg-[#0078d4] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowRight className="size-5" />
                </button>
              </div>
              <p className="mt-3 max-w-[270px] text-xs text-white/80 drop-shadow">
                Màn hình mô phỏng Windows — nhập bất kỳ mật khẩu nào để quay lại Sparkle.
              </p>
              <button
                type="button"
                onClick={() => setScreen("lock")}
                className="mt-6 rounded px-3 py-2 text-sm text-white/90 transition hover:bg-white/15"
              >
                Quay lại màn hình khóa
              </button>
            </form>
            <div
              className="absolute bottom-6 right-6 flex items-center gap-5 text-sm text-white drop-shadow"
              aria-label="Tùy chọn hệ thống"
            >
              <span className="flex items-center gap-1.5">
                <Globe2 className="size-4" /> ENG
              </span>
              <button
                type="button"
                aria-label="Trợ năng"
                className="rounded p-1.5 hover:bg-white/15"
              >
                <Accessibility className="size-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Nguồn"
                  aria-haspopup="menu"
                  aria-expanded={isPowerMenuOpen}
                  onClick={() => setIsPowerMenuOpen((open) => !open)}
                  className="rounded p-1.5 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Power className="size-5" />
                </button>
                {powerMenu}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="shutdown-screen"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-black text-center"
          >
            <Power className="size-10 text-white/80" />
            <p className="text-lg font-light">Sparkle đã tắt</p>
            <button
              type="button"
              onClick={() => handlePowerAction("restart")}
              className="rounded border border-white/40 px-4 py-2 text-sm text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Khởi động lại
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
