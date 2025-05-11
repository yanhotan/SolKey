'use client'

import { PropsWithChildren } from 'react'
import dynamic from 'next/dynamic'

const WalletProviders = dynamic(
  () => import("@/components/providers").then(mod => mod.Providers),
  { ssr: false }
)

export function ClientProviders({ children }: PropsWithChildren) {
  return <WalletProviders>{children}</WalletProviders>
}
