// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { AlertCircle, EyeOff, Eye, Copy, RefreshCcw, ShieldAlert, Key } from "lucide-react"
// import { useSecretDecryption } from "@/hooks/use-secret-decryption"
// import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
// import { useWallet } from "@solana/wallet-adapter-react"

// interface SecretItemProps {
//   id: string
//   name: string
//   type: string
// }

// export function SecretItem({ id, name, type }: SecretItemProps) {
//   const { connected, publicKey, signMessage } = useWallet()
//   const { decryptSecret, forgetSecret, isDecrypted, decryptedSecrets, loading, errors } = useSecretDecryption()
//   const { isInitialized, handleSignMessage } = useWalletEncryption()
//   const [isVisible, setIsVisible] = useState(false)
//   const [isSigning, setIsSigning] = useState(false)
//   const [signError, setSignError] = useState<string | null>(null)
  
//   // Handles the complete decryption flow
//   const handleDecryptFlow = async () => {
//     // If already decrypted, just toggle visibility
//     if (isDecrypted(id)) {
//       setIsVisible(!isVisible)
//       return
//     }
    
//     try {
//       // Clear any previous errors
//       setSignError(null)
      
//       // If wallet not initialized, we need to sign first
//       if (!isInitialized) {
//         setIsSigning(true)
//         try {
//           await handleSignMessage()
//           // No need to return here - continue with decryption
//         } catch (err) {
//           const errorMessage = err instanceof Error
//             ? err.message.includes('User rejected') 
//               ? 'Message signing was cancelled'
//               : 'Failed to sign message. Please try again.'
//             : 'Failed to sign message. Please try again.'
//           setSignError(errorMessage)
//           return // Exit if signing fails
//         } finally {
//           setIsSigning(false)
//         }
//       }
      
//       // Now decrypt the secret
//       await decryptSecret(id)
//       setIsVisible(true)
//     } catch (error) {
//       console.error("Decryption flow error:", error)
//       // Error is already handled by the hook and will be displayed
//     }
//   }
  
//   const copyToClipboard = () => {
//     if (isDecrypted(id)) {
//       navigator.clipboard.writeText(decryptedSecrets[id])
//     }
//   }
  
//   const decryptedValue = isDecrypted(id) ? decryptedSecrets[id] : null
//   const hasError = !!errors[id]
//   const isLoading = loading[id] || isSigning
  
//   return (
//     <div className="rounded-md border p-4 mb-4">
//       <div className="flex items-center justify-between mb-2">
//         <div className="flex items-center gap-2">
//           <h3 className="font-medium">{name}</h3>
//           <Badge variant="outline" className="text-xs">
//             {type}
//           </Badge>
//         </div>
        
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             size="sm"
//             disabled={isLoading}
//             onClick={handleDecryptFlow}
//           >
//             {isLoading ? (
//               <>
//                 <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
//                 {isSigning ? "Signing..." : "Decrypting..."}
//               </>
//             ) : isVisible ? (
//               <>
//                 <EyeOff className="mr-2 h-4 w-4" />
//                 Hide
//               </>
//             ) : isDecrypted(id) ? (
//               <>
//                 <Eye className="mr-2 h-4 w-4" />
//                 Show
//               </>
//             ) : (
//               <>
//                 <Key className="mr-2 h-4 w-4" />
//                 {isInitialized ? "Decrypt" : "Sign & Decrypt"}
//               </>
//             )}
//           </Button>
          
//           {isDecrypted(id) && (
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={copyToClipboard}
//             >
//               <Copy className="h-4 w-4" />
//             </Button>
//           )}
//         </div>
//       </div>
      
//       {hasError && (
//         <Alert variant="destructive" className="mb-2">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>
//             {errors[id].includes("Encryption key not available") 
//               ? "Authentication required. Please click 'Sign & Decrypt' to access this secret."
//               : errors[id]}
//           </AlertDescription>
//         </Alert>
//       )}
      
//       {signError && (
//         <Alert variant="destructive" className="mb-2">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription>{signError}</AlertDescription>
//         </Alert>
//       )}
      
//       <div className="font-mono text-sm bg-muted p-3 rounded">
//         {isVisible && decryptedValue ? (
//           <div className="break-all">{decryptedValue}</div>
//         ) : (
//           <div className="text-muted-foreground">••••••••••••••••••••••••••</div>
//         )}
//       </div>
//     </div>
//   )
// }