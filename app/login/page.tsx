import { signInWithEmail, signInWithGoogle, signInWithPassword } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const { message } = await searchParams
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1F] px-4 font-light text-[#E5E5E5]">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-[#141418] p-10 shadow-2xl border border-[#2A2A32]">
        <div className="text-center">
          <div className="mx-auto w-10 h-10 bg-[#F5E642] rounded-sm flex items-center justify-center mb-4 shadow-lg shadow-[#F5E642]/10">
            <span className="text-[#1A1A1F] font-black text-xl">V</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white uppercase">VibeRef</h1>
          <p className="mt-2 text-sm text-[#666666]">AI 연동 디자인 레퍼런스 관리 도구</p>
        </div>

        <div className="mt-8 space-y-6">
          {/* Magic Link Login */}
          <form action={signInWithEmail} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border border-[#2A2A32] bg-[#1A1A1F] px-3 py-2 text-[#E5E5E5] placeholder-[#444] focus:z-10 focus:border-[#F5E642] focus:outline-none focus:ring-1 focus:ring-[#F5E642] sm:text-sm transition-all"
                placeholder="이메일을 입력하세요"
              />
            </div>
            <button
              type="submit"
              className="group relative flex w-full justify-center rounded-lg bg-[#F5E642] py-2.5 px-4 text-sm font-bold text-[#1A1A1F] hover:bg-[#e0d23a] transition-all shadow-lg shadow-[#F5E642]/5"
            >
              매직 링크 발송
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2A2A32]" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]">
              <span className="bg-[#141418] px-3 text-[#444]">Or continue with</span>
            </div>
          </div>

          {/* Google Login */}
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#2A2A32] bg-[#1A1A1F] py-2.5 px-4 text-sm font-medium text-[#E5E5E5] hover:bg-[#222228] transition-all"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#F5E642"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#F5E642" fillOpacity="0.6"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#F5E642" fillOpacity="0.4"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#F5E642" fillOpacity="0.8"/>
              </svg>
              Google 계정으로 로그인
            </button>
          </form>

          {/* Development Password Login */}
          {isDevelopment && (
            <div className="pt-8 border-t border-[#2A2A32] mt-8">
              <div className="mb-5 text-center">
                <span className="px-2 py-1 bg-yellow-500/5 text-[#F5E642] text-[9px] font-bold uppercase tracking-[0.2em] rounded border border-[#F5E642]/20">
                  Development Mode
                </span>
              </div>
              <form action={signInWithPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="dev-email" className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Test Email</label>
                  <input
                    id="dev-email"
                    name="email"
                    type="email"
                    required
                    className="relative block w-full rounded-lg border border-[#2A2A32] bg-[#1A1A1F] px-3 py-2 text-[#E5E5E5] placeholder-[#444] focus:z-10 focus:border-[#F5E642] focus:outline-none focus:ring-1 focus:ring-[#F5E642] sm:text-sm transition-all"
                    placeholder="test@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="relative block w-full rounded-lg border border-[#2A2A32] bg-[#1A1A1F] px-3 py-2 text-[#E5E5E5] placeholder-[#444] focus:z-10 focus:border-[#F5E642] focus:outline-none focus:ring-1 focus:ring-[#F5E642] sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-[#2A2A32] rounded-lg text-xs font-bold text-[#666666] hover:text-[#F5E642] hover:bg-[#222228] transition-all"
                >
                  비밀번호로 즉시 로그인
                </button>
              </form>
            </div>
          )}

          {message && (
            <div className="mt-4 text-center text-sm font-medium text-[#F5E642] bg-[#F5E642]/5 py-2 rounded-md border border-[#F5E642]/10 animate-pulse">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
