import { AnchorProvider as SolanaAnchorProvider } from '@coral-xyz/anchor'
import { PropsWithChildren } from 'react'

declare module '@/components/providers/anchor-provider' {
  export function AnchorProvider(props: PropsWithChildren): JSX.Element
  export function useAnchorProvider(): SolanaAnchorProvider
}

declare module '@/components/providers/wallet-provider' {
  export function WalletConfig(props: PropsWithChildren): JSX.Element
}

declare module '@/components/providers' {
  export function Providers(props: PropsWithChildren): JSX.Element
  export { useAnchorProvider } from '@/components/providers/anchor-provider'
  export { WalletConfig } from '@/components/providers/wallet-provider'
} 