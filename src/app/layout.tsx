import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Outside — AI-Powered English Learning",
  description: "在真实语境中积累词汇，AI 生成的个性化英语阅读平台",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}
