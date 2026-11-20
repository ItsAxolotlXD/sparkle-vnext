import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ResetPasswordProps { navigate: (route: string) => void; }

// Opened from the password-reset email (also used by members from the previous version to set a new password).
export const ResetPassword: React.FC<ResetPasswordProps> = ({ navigate }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const linkError = hash.get('error_description');
    if (linkError) setError(decodeURIComponent(linkError.replace(/\+/g, ' ')));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data: current }) => {
      if (current.session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (password !== confirm) { setError('Mật khẩu xác nhận không khớp.'); return; }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    setMessage('Đã đặt mật khẩu mới. Bạn đã đăng nhập.');
    window.history.replaceState({}, document.title, window.location.pathname);
    setTimeout(() => navigate('/'), 1200);
  };

  const inputClass = 'h-8 sm:h-8.5 w-full rounded-[6px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#282c31] px-3 pr-10 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none transition focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] no-fluent-line';

  return <main className="min-h-screen flex items-center justify-center bg-[#282c31] px-4 py-8">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1f24] p-6 shadow-2xl sm:p-8" aria-labelledby="reset-title">
      <button type="button" onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
        <ArrowLeft size={16} /> Về trang chủ
      </button>
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#4cc2ff] text-xl font-bold text-black">V</div>
        <h1 id="reset-title" className="text-3xl font-bold text-white">Đặt mật khẩu mới</h1>
        <p className="mt-2 text-sm text-white/55">Email của bạn đã được xác minh. Chọn mật khẩu mới cho tài khoản.</p>
      </div>
      {!ready && !error ? (
        <p className="rounded-xl bg-white/5 px-3 py-3 text-sm text-white/70">
          Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu liên kết mới từ trang đăng nhập.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs sm:text-[13px] font-medium text-white/80">
            Mật khẩu mới
            <div className="relative flex items-center">
              <input required minLength={6} type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className={inputClass} placeholder="Tối thiểu 6 ký tự" />
              <button type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 text-white/40 hover:text-white p-0.5 cursor-pointer">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs sm:text-[13px] font-medium text-white/80">
            Nhập lại mật khẩu
            <input required minLength={6} type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className={inputClass} placeholder="Nhập lại mật khẩu mới" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
          <button disabled={loading || !ready} className="mt-2 h-11 rounded-xl bg-[#4cc2ff] font-bold text-black transition hover:bg-[#6bd0ff] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Đang xử lý...' : 'Lưu mật khẩu mới'}</button>
        </form>
      )}
      <button type="button" onClick={() => navigate('/auth')} className="mt-5 w-full text-center text-xs text-white/55 hover:text-white">Quay lại đăng nhập</button>
    </section>
  </main>;
};
