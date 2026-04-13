export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - gradient branding */}
      <div
        className="hidden md:flex w-1/2 flex-col justify-center px-16"
        style={{
          background: 'linear-gradient(180deg, #5856D6 0%, #7B79E8 100%)',
        }}
      >
        <h1 className="text-[44px] font-bold text-white/95 leading-tight" style={{ fontFamily: 'Geist, sans-serif', letterSpacing: '-1.5px' }}>
          Outside
        </h1>
        <p className="text-[18px] text-white/60 mt-6">
          Read. Learn. Remember.
        </p>
        <p className="text-[15px] text-white/40 mt-6 leading-relaxed max-w-[300px]">
          AI 驱动的英语阅读学习平台{'\n'}在真实语境中积累词汇
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-surface-card px-6">
        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>
    </div>
  )
}
