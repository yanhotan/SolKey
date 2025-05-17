"use client"

import { useWallet } from "@solana/wallet-adapter-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Shield, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectWalletButton } from "@/components/connect-wallet-button"
import Image from "next/image"

export function WalletSteps() {
  const { connected, publicKey } = useWallet()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50/50 via-white to-blue-50/50 p-4 md:p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400/20 to-blue-400/20 blur-lg"></div>
          <Image 
            src="/images/solsecure_logo.png" 
            alt="SolSecure Logo" 
            width={48} 
            height={48} 
            className="h-12 w-12 mb-4 relative"
          />
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[length:200%_auto]">
          SolSecure
        </h1>
      </div>
      
      <Card className="w-[380px] border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-gray-800 bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[length:200%_auto]">
            Wallet Authentication
          </CardTitle>
          <CardDescription className="text-center text-gray-600">
            Connect your Solana wallet and sign a message to access your encrypted secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Alert */}
          <Alert className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100/50 shadow-sm">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <AlertTitle className="font-medium text-purple-700">End-to-End Encryption</AlertTitle>
            <AlertDescription className="text-purple-600/90 text-sm">
              Your encryption key is derived from your wallet signature and never leaves your device.
            </AlertDescription>
          </Alert>

          {/* Step 1: Connect */}
          <div className="rounded-xl border border-purple-100/70 bg-gradient-to-r from-purple-50/50 to-white p-4 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-200/80 to-purple-100/80 shadow-inner">
                {connected ? (
                  <Check className="h-5 w-5 text-purple-500" />
                ) : (
                  <Shield className="h-5 w-5 text-purple-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Step 1: Connect Wallet</h3>
                <p className="text-sm text-gray-500">
                  Connect your Solana wallet to continue
                </p>
              </div>
              {!connected && <ConnectWalletButton/>}
            </div>
          </div>

          {/* Step 2: Sign */}
          <div className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${connected ? 'border-blue-100/70 bg-gradient-to-r from-blue-50/50 to-white' : 'border-gray-100 bg-gray-50/50'}`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full shadow-inner ${connected ? 'bg-gradient-to-br from-blue-200/80 to-blue-100/80' : 'bg-gray-100'}`}>
                <Shield className={`h-5 w-5 ${connected ? 'text-blue-500' : 'text-gray-400'}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800">Step 2: Sign Message</h3>
                <p className="text-sm text-gray-500">
                  Sign a message to derive your encryption key
                </p>
              </div>
              {connected && (
                <Button 
                  className="bg-solana-gradient animate-gradient-shift bg-[length:200%_auto] hover:shadow-lg transition-shadow hover:scale-105 duration-300"
                  disabled={!connected}
                >
                  Sign
                </Button>
              )}
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 px-2">
            Your wallet is used to securely encrypt and decrypt your secrets. We never have access to your unencrypted data.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
