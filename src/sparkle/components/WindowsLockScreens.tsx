import { useEffect, useState } from "react";
import type { FormEvent } from "react";
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
};

const LOCK_WALLPAPER =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-osbI7IpSc8lLq29ybwTKRJxb2DnGdt.png";
const SIGN_IN_WALLPAPER =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-bd8u990aN3OIoSJv5rjCI3Do8MP78v.png";

export function WindowsLockScreens({ onUnlock }: WindowsLockScreensProps) {
  const [screen, setScreen] = useState<"lock" | "signin">("lock");
  const [password, setPassword] = useState("");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (screen !== "lock") return;
    const advance = (event: KeyboardEvent) => {
      if (
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

  return (
    <div
      className="fixed inset-0 z-[2147483000] overflow-hidden bg-[#172018] text-white select-none"
      role="dialog"
      aria-modal="true"
      aria-label={screen === "lock" ? "Windows lock screen" : "Windows sign-in screen"}
    >
      {screen === "lock" ? (
        <button
          type="button"
          onClick={() => setScreen("signin")}
          className="absolute inset-0 flex cursor-pointer flex-col justify-end bg-cover bg-center text-left outline-none"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,.08) 42%, rgba(0,0,0,.48) 100%), url("${LOCK_WALLPAPER}")`,
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
          <div
            className="absolute bottom-6 right-7 flex items-center gap-5 text-white/90"
            aria-hidden="true"
          >
            <Wifi className="size-5" />
            <Accessibility className="size-5" />
            <Power className="size-5" />
          </div>
        </button>
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-cover bg-center px-5"
          style={{
            backgroundImage: `linear-gradient(rgba(11,18,8,.28), rgba(11,18,8,.42)), url("${SIGN_IN_WALLPAPER}")`,
          }}
        >
          <form
            onSubmit={unlock}
            className="flex w-full max-w-[340px] flex-col items-center text-center"
          >
            <div className="mb-3 flex size-[88px] items-center justify-center rounded-full bg-white/25 shadow-lg ring-1 ring-white/30 backdrop-blur-sm">
              <UserRound className="size-12 stroke-[1.35]" />
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
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-gray-500"
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
            <button type="button" aria-label="Trợ năng" className="rounded p-1.5 hover:bg-white/15">
              <Accessibility className="size-5" />
            </button>
            <button type="button" aria-label="Nguồn" className="rounded p-1.5 hover:bg-white/15">
              <Power className="size-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
