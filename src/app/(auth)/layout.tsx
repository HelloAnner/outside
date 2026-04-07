export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-light tracking-wide text-foreground">Outside</h1>
          <p className="text-sm text-secondary mt-1">AI-Powered English Learning</p>
        </div>
        {children}
      </div>
    </div>
  )
}
