import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ClientProviders } from "@/components/client-providers"

const inter = Inter({ subsets: ["latin"] })

// Update the title and description
export const metadata: Metadata = {
  title: "SolSecure - Lock Down Your Secrets. Only Your Solana Wallet Holds the Key",
  description: "SolSecure protects your API keys and environment variables with end-to-end encryption tied to your Solana wallet — no passwords, no leaks, no compromises. Just pure, wallet-based control.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="solsecure-theme"
        >
          <ClientProviders>
            {children}
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
