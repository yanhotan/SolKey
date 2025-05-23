"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton, BaseWalletMultiButton } from "@solana/wallet-adapter-react-ui"
import "@solana/wallet-adapter-react-ui/styles.css"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet } from "lucide-react"

const LABELS = {
  'change-wallet': 'Change wallet',
  connecting: 'Connecting ...',
  'copy-address': 'Copy address',
  copied: 'Copied',
  disconnect: 'Disconnect',
  'has-wallet': 'Connect',
  'no-wallet': 'Select Wallet',
} as const;

export function ConnectWalletButton() {
  const { connected, publicKey } = useWallet()
  
  const shortenAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  // Show connected state with all wallet options
  if (connected && publicKey) {
    return (
      <BaseWalletMultiButton 
        labels={LABELS}
        className="!bg-transparent hover:!bg-accent !border !border-input !rounded-md !h-9 !px-3 !text-sm !font-medium gap-2"
      >
        <div className="h-2 w-2 rounded-full bg-green-500"></div>
        {shortenAddress(publicKey.toBase58())}
        <Badge variant="outline" className="ml-1 text-xs">
          Devnet
        </Badge>
      </BaseWalletMultiButton>
    )
  }

  // Show connect button
  return (
    <BaseWalletMultiButton 
      labels={LABELS}
      className="!bg-transparent hover:!bg-accent !border !border-input !rounded-md !h-3 !px-3 !text-sm !font-medium gap-2"
    >
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </BaseWalletMultiButton>
  )
}
