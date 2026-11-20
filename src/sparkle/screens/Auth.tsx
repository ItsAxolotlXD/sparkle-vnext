import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuthSession, getAccountLabel, signOutOfSparkle } from '../services/authSession';

interface AuthProps { navigate: (route: string) => void; }

export const Auth: React.FC<AuthProps> = ({ navigate }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const session = useAuthSession();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const callbackError =
      params.get('error_description') ||
      hashParams.get('error_description') ||
      params.get('error');

    if (callbackError) {
      setError(decodeURIComponent(callbackError.replace(/\\+/g, ' ')));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // Successful sign-ins navigate home from the handlers below; a signed-in visitor sees the account panel.
  }, []);

  const signInWithProvider = async (provider: 'google' | 'apple' | 'microsoft') => {
    setError('');
    if (!import.meta.env['VITE_SUPABASE_URL'] || !import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']) {
      setError('Đăng nhập OAuth chưa khả dụng trong môi trường cục bộ (chưa cấu hình Supabase).');
      return;
    }
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    setLoading(false);
    navigate('/');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    if (mode === 'forgot') {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) setError(resetError.message);
      else setMessage('Đã gửi email. Mở liên kết trong email để xác minh và đặt mật khẩu mới.');
      setLoading(false);
      return;
    }
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: window.location.origin } });
    if (result.error) setError(result.error.message);
    else if (mode === 'signup' && !result.data.session) setMessage('Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.');
    else navigate('/');
    setLoading(false);
  };

  return <main className="min-h-screen flex items-center justify-center bg-[#282c31] px-4 py-8">
    <section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1b1f24] p-6 shadow-2xl sm:p-8" aria-labelledby="auth-title">
      <button type="button" onClick={() => navigate('/')} className="mb-8 flex items-center gap-2 text-sm text-white/60 transition hover:text-white">
        <ArrowLeft size={16} /> Về trang chủ
      </button>
      <div className="mb-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#4cc2ff] text-xl font-bold text-black">V</div>
        <h1 id="auth-title" className="text-3xl font-bold text-white">{mode === 'signin' ? 'Chào mừng trở lại' : mode === 'signup' ? 'Tạo tài khoản mới' : 'Đặt lại mật khẩu'}</h1>
        <p className="mt-2 text-sm text-white/55">{mode === 'signin' ? 'Đăng nhập để tiếp tục trải nghiệm Waves.' : mode === 'signup' ? 'Đăng ký miễn phí để lưu các nội dung yêu thích.' : 'Nhập email tài khoản của bạn. Chúng tôi sẽ gửi liên kết xác minh để bạn đặt mật khẩu mới.'}</p>
      </div>
      {session ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl bg-white/5 px-3 py-3 text-sm text-white/80">Bạn đang đăng nhập với <span className="font-semibold text-white">{getAccountLabel(session)}</span>{session.user.email && getAccountLabel(session) !== session.user.email ? ` (${session.user.email})` : ''}.</p>
          <button type="button" onClick={() => navigate('/')} className="h-11 rounded-xl bg-[#4cc2ff] font-bold text-black transition hover:bg-[#6bd0ff]">Tiếp tục</button>
          <button type="button" onClick={() => { void signOutOfSparkle(); }} className="h-11 rounded-xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10">Đăng xuất</button>
        </div>
      ) : (<>
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-white/5 p-1" role="tablist" aria-label="Loại xác thực">
        <button type="button" role="tab" aria-selected={mode === 'signin'} onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'signin' ? 'bg-[#4cc2ff] text-black' : 'text-white/60 hover:text-white'}`}>Đăng nhập</button>
        <button type="button" role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-[#4cc2ff] text-black' : 'text-white/60 hover:text-white'}`}>Đăng ký</button>
      </div>
      <div className="flex flex-col gap-2">
        <button type="button" disabled={loading} onClick={() => signInWithProvider('google')} className="flex h-11 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
          <span className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">G</span>
          Tiếp tục với Google
        </button>
        <button type="button" disabled={loading} onClick={() => signInWithProvider('apple')} className="flex h-11 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
          <span className="text-lg leading-none">●</span>
          Tiếp tục với Apple
        </button>
        <button type="button" disabled={loading} onClick={() => signInWithProvider('microsoft')} className="flex h-11 items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
          <span className="grid size-5 grid-cols-2 gap-0.5"><span className="bg-[#f25022]" /><span className="bg-[#7fba00]" /><span className="bg-[#00a4ef]" /><span className="bg-[#ffb900]" /></span>
          Tiếp tục với Microsoft
        </button>
      </div>
      <div className="my-5 flex items-center gap-3 text-xs text-white/35"><span className="h-px flex-1 bg-white/10" />hoặc email<span className="h-px flex-1 bg-white/10" /></div>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <label className="flex flex-col gap-1.5 text-xs sm:text-[13px] font-medium text-white/80">
            Tên hiển thị
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-8 sm:h-8.5 w-full rounded-[6px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#282c31] px-3 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none transition focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] no-fluent-line"
              placeholder="Tên của bạn"
            />
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-xs sm:text-[13px] font-medium text-white/80">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-8 sm:h-8.5 w-full rounded-[6px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#282c31] px-3 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none transition focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] no-fluent-line"
            placeholder="you@example.com"
          />
        </label>
        {mode !== 'forgot' && (
        <label className="flex flex-col gap-1.5 text-xs sm:text-[13px] font-medium text-white/80">
          Mật khẩu
          <div className="relative flex items-center">
            <input
              required
              minLength={6}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-8 sm:h-8.5 w-full rounded-[6px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-[#282c31] px-3 pr-10 text-xs sm:text-[13px] text-[#111827] dark:text-white placeholder-[#71717a] dark:placeholder-white outline-none transition focus:border-b-2 focus:border-b-[#005fb8] dark:focus:border-b-[#4cc2ff] no-fluent-line"
              placeholder="Tối thiểu 6 ký tự"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-2.5 text-white/40 hover:text-white p-0.5 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>
        )}
        {mode === 'signin' && (
          <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="-mt-2 self-end text-xs text-[#4cc2ff] hover:underline">Quên mật khẩu?</button>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
        <button disabled={loading} className="mt-2 h-11 rounded-xl bg-[#4cc2ff] font-bold text-black transition hover:bg-[#6bd0ff] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Đang xử lý...' : mode === 'signin' ? 'Đăng nhập' : mode === 'signup' ? 'Tạo tài khoản' : 'Gửi liên kết đặt lại'}</button>
      </form>
      {mode === 'forgot' ? (
        <button type="button" onClick={() => { setMode('signin'); setError(''); setMessage(''); }} className="mt-5 w-full text-center text-xs text-white/55 hover:text-white">Quay lại đăng nhập</button>
      ) : (
        <p className="mt-5 text-center text-xs text-white/40">Đã có tài khoản từ phiên bản trước? Chọn “Quên mật khẩu?” để xác minh email và đặt mật khẩu mới.</p>
      )}
      </>)}
    </section>
  </main>;
};
