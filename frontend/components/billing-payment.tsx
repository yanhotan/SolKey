"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface BillingPaymentProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
  amount?: number; // in SOL
  
}

export function BillingPayment({
  onClose,
  onSuccess,
  onError,
  amount = 0.5,
}: BillingPaymentProps) {
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  // Fixed recipient address
  const recipientAddress = "0x483bF34b4444dB73FB0b1b5EBDB0253A4E8b714f";
  const cleanedAddress = recipientAddress.replace("0x", ""); // Remove 0x prefix if present
  
  // Solana connection - using devnet for testing
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // Format addresses for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  const handlePayment = async () => {
    if (!publicKey || !sendTransaction) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setStatus("processing");
      
      // Convert recipient address to Solana public key format
      const recipient = new PublicKey(cleanedAddress);
      
      // Create a transfer instruction
      const instruction = SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipient,
        lamports: amount * LAMPORTS_PER_SOL, // Convert SOL to lamports
      });
      
      // Create a new transaction and add the instruction
      const transaction = new Transaction().add(instruction);
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction and await confirmation
      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      
      if (confirmation.value.err) {
        throw new Error("Transaction failed to confirm");
      }
      
      setStatus("success");
      toast.success("Payment successful!");
      onSuccess();
      
    } catch (error) {
      console.error("Payment error:", error);
      setStatus("error");
      toast.error("Payment failed. Please try again.");
      onError(error as Error);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <motion.div
        className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.4 }}
      >
        <h3 className="text-xl font-bold mb-4">Complete Your Payment</h3>
        
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">From</span>
              <span className="font-medium">{publicKey ? formatAddress(publicKey.toString()) : "Your wallet"}</span>
            </div>
            
            <div className="flex justify-center my-2">
              <ArrowRight className="text-muted-foreground" />
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground">To</span>
              <span className="font-medium">{formatAddress(cleanedAddress)}</span>
            </div>
          </div>
          
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full flex items-center justify-center">
                  <img src="/images/Solana_logo.png" alt="SOL" className="h-4 w-4" />
                </div>
                <span className="font-bold text-lg">{amount} SOL</span>
              </div>
            </div>
          </div>
          
          {status === "success" && (
            <div className="rounded-lg border bg-green-500/10 border-green-500/20 p-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="font-medium">Payment successful!</span>
              </div>
              <a 
                href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:underline mt-2 inline-block"
              >
                View transaction
              </a>
            </div>
          )}
          
          {status === "error" && (
            <div className="rounded-lg border bg-red-500/10 border-red-500/20 p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="font-medium">Payment failed. Please try again.</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end space-x-2">
          {status === "idle" && (
            <Button 
              variant="default" 
              onClick={handlePayment}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              Pay {amount} SOL
            </Button>
          )}
          
          {status === "processing" && (
            <Button variant="default" disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </Button>
          )}
          
          {status === "success" ? (
            <Button variant="default" onClick={onClose}>
              Done
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={status === "processing"}>
              Cancel
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}