"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import dynamic from 'next/dynamic'
import { shortenAddress } from "@/lib/utils"

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

export function ConnectWalletButton() {
  const { connected, disconnect, publicKey } = useWallet()

  if (connected && publicKey) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2" 
        onClick={() => disconnect()}
      >
        <div className="h-4 w-4 rounded-full bg-green-500"></div>
        {shortenAddress(publicKey.toBase58())}
        <Badge variant="outline" className="ml-1 text-xs">
          Connected
        </Badge>
      </Button>
    )
  }

  return (
    <WalletMultiButton className="wallet-adapter-button bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 w-auto inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  )
}
