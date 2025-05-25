"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
} from "@solana/spl-token";
import { toast } from "sonner";

interface BillingPaymentProps {
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: Error) => void;
  amount?: number;
  currency?: "usdc" | "sol";     

  
}

export function BillingPayment({
  onClose,
  onSuccess,
  onError,
  amount = 0.095,
  currency = "sol",
}: BillingPaymentProps) {
  const { publicKey, sendTransaction } = useWallet();
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  
  // Fixed recipient address
  const recipientAddress = "5aMv8CXmw3BUYZq8WYENaZUGz8cDhfrxAWbDirCB66Zo";
  const PYUSD_MINT = new PublicKey("Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr");
  
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
      const recipient = new PublicKey(recipientAddress);
        if (currency === "sol") {
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
        
        try {
          console.log("Sending SOL transaction...");
          // Send transaction and await confirmation
          const signature = await sendTransaction(transaction, connection);
          console.log("Transaction sent with signature:", signature);
          setTxSignature(signature);
          
          // Wait for confirmation
          console.log("Waiting for confirmation...");
          const confirmation = await connection.confirmTransaction(signature, "confirmed");
          console.log("Confirmation received:", confirmation);
          
          if (confirmation.value.err) {
            throw new Error("Transaction failed to confirm");
          }
          
          // Important: Set success BEFORE calling onSuccess
          console.log("Setting status to success");
          setStatus("success");
          toast.success("SOL payment successful!");
          
          // Delay onSuccess call to allow UI to update
          setTimeout(() => {
            onSuccess();
          }, 3000);
        } catch (txError) {
          console.error("Transaction error:", txError);
          throw txError;
        }
      } else {
        // PYUSD payment (USDC equivalent on devnet)
        toast.info("Processing PYUSD payment (USDC equivalent)");
          // Get the associated token accounts for the sender and recipient
        const senderTokenAccount = await getAssociatedTokenAddress(
          PYUSD_MINT, 
          publicKey
        );
        
        const recipientTokenAccount = await getAssociatedTokenAddress(
          PYUSD_MINT,
          recipient
        );
        
        // Create a new transaction
        const transaction = new Transaction();
        
        // Check if recipient token account exists, if not create it
        try {
          await connection.getAccountInfo(recipientTokenAccount);
        } catch (error) {
          // Create the recipient's associated token account if it doesn't exist
          transaction.add(
            createAssociatedTokenAccountInstruction(
              publicKey, // payer
              recipientTokenAccount, // associated token account
              recipient, // owner
              PYUSD_MINT // token mint
            )
          );
        }
        
        // PYUSD has 6 decimals like USDC (convert to smallest units)
        const tokenAmount = amount * 1000000; 
          // Add the transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccount, // source
            recipientTokenAccount, // destination
            publicKey, // owner
            tokenAmount, // amount in smallest units
            [] // multi-signature signers (empty array if not used)
          )
        );
        
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
          throw new Error("PYUSD transaction failed to confirm");
        }
        
        // Set success here for USDC payments
        setStatus("success");
        toast.success("USDC payment successful!");
      }
      
      // Call onSuccess callback
      onSuccess();
      
    } catch (error) {
      console.error("Payment error:", error);
      setStatus("error");
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Payment failed: ${errorMessage}`); // Fixed 'erro' typo to 'error'
      onError(error as Error);
    }
  }; // Missing closing bracket for handlePayment function

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
              <span className="font-medium">{formatAddress(recipientAddress)}</span>
            </div>
          </div>
          
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount</span>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full flex items-center justify-center">
                  {currency === "usdc" ? (
                    <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                      $
                    </div>
                  ) : (
                    <img src="/images/Solana_logo.png" alt="SOL" className="h-4 w-4" />
                  )}
                </div>
                <span className="font-bold text-lg">{amount} {currency === "usdc" ? "USDC" : "SOL"}</span>
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
                Pay {amount} {currency === "usdc" ? "USDC" : "SOL"}
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