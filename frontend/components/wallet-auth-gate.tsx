"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useWalletAuthSkip } from "@/hooks/use-wallet-auth-skip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Shield, Check, Wallet, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import Image from "next/image";

interface WalletAuthGateProps {
  children: React.ReactNode;
}

export function WalletAuthGate({ children }: WalletAuthGateProps) {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  const { hasSkipped, skip } = useWalletAuthSkip();
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(true); // Track first visit
  const router = useRouter();

  // Store wallet address in localStorage when connected
  useEffect(() => {
    if (connected && publicKey) {
      localStorage.setItem("solkey:walletAddress", publicKey.toBase58());
      setInitializationError(null);
    } else if (!connected) {
      // Clear wallet address when disconnected
      localStorage.removeItem("solkey:walletAddress");
    }
  }, [connected, publicKey]);

  // Check if this is the user's first visit
  useEffect(() => {
    const firstVisit = localStorage.getItem("solkey:firstVisit");
    if (firstVisit === "false") {
      setIsFirstVisit(false);
    }
  }, []);

  const handleFirstVisitComplete = () => {
    localStorage.setItem("solkey:firstVisit", "false");
    setIsFirstVisit(false);
  };

  const skipAuthentication = () => {
    skip(); // Use the `skip` function from `useWalletAuthSkip`
    handleFirstVisitComplete();
    router.push("/dashboard");
  };

  // If already initialized, user has skipped, or it's not the first visit, show children
  if (connected || hasSkipped || !isFirstVisit) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-background/80 p-4 md:p-8">
      <div className="mb-8 flex flex-col items-center">
        <Image
          src="/images/solsecure_logo.png"
          alt="SolSecure Logo"
          width={64}
          height={64}
          className="h-16 w-16 mb-4"
        />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[size:200%_auto]">
          SolSecure
        </h1>
      </div>

      <Card className="w-full max-w-md border-purple-200/50 dark:border-purple-800/30 shadow-lg shadow-purple-500/10">
        <CardHeader className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-t-lg border-b border-purple-100 dark:border-purple-800/20">
          <CardTitle className="text-2xl bg-clip-text text-transparent bg-solana-gradient animate-gradient-shift bg-[size:200%_auto]">
            Wallet Authentication
          </CardTitle>
          <CardDescription>
            Connect your Solana wallet to securely access your encrypted secrets or skip to preview the app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Alert className="bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50 shadow-sm">
            <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <AlertTitle>End-to-End Encryption</AlertTitle>
            <AlertDescription>
              Your encryption key is derived from your wallet signature and never leaves your device. This ensures only
              you can access your secrets.
            </AlertDescription>
          </Alert>

          {(initializationError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{initializationError}</AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border border-purple-100 dark:border-purple-800/30 p-4 bg-white/50 dark:bg-purple-950/20 shadow-sm transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700/40">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-inner shadow-white/20">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Step 1: Connect Wallet</h3>
                <p className="text-sm text-muted-foreground">Connect your Solana wallet to continue</p>
              </div>
              {connected ? (
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full border border-green-100 dark:border-green-800/30">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Connected</span>
                </div>
              ) : (
                <WalletMultiButton
                  className="bg-solana-gradient animate-gradient-shift bg-[length:200%_auto] shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 !h-9 px-4"
                />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-purple-100 dark:border-purple-800/30 p-4 bg-white/50 dark:bg-purple-950/20 shadow-sm transition-all hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700/40">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-inner shadow-white/20">
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">Step 2: Sign Message</h3>
                <p className="text-sm text-muted-foreground">
                  Signing a message is required when encrypting and decrypting your secrets.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-purple-100 dark:border-purple-800/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-b-lg pt-4">
          <p className="text-center text-sm text-muted-foreground">
            Your wallet is used to securely encrypt and decrypt your secrets. We never have access to your unencrypted
            data.
          </p>

          <div className="w-full flex flex-col items-center">
            <Button
              variant="outline"
              onClick={skipAuthentication}
              className="w-full max-w-xs border-dashed border-purple-200 dark:border-purple-800/40 text-muted-foreground hover:bg-purple-50 dark:hover:bg-purple-900/20 group"
            >
              <Eye className="h-4 w-4 mr-2 text-purple-400 group-hover:text-purple-600 dark:text-purple-500 dark:group-hover:text-purple-400" />
              Skip and preview app
            </Button>
            <p className="mt-2 text-xs text-center text-muted-foreground px-6">
              Some features will be limited without wallet authentication
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}