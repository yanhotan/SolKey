// "use client"

// import { useState } from "react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// import { Textarea } from "@/components/ui/textarea"
// import { Lock, Save, AlertCircle, Shield, Eye, EyeOff } from "lucide-react"
// import { encryptData, decryptData } from "@/lib/wallet-auth"
// import { useWalletEncryption } from "@/hooks/use-wallet-encryption"
// import type { EncryptedData } from "@/lib/crypto"

// interface Secret {
//   id: string
//   key: string
//   encryptedValue: EncryptedData
// }

// export function SecretsEditor({ environment }: { environment: string }) {
//   const [secrets, setSecrets] = useState<Secret[]>([])
//   const [newKey, setNewKey] = useState("")
//   const [newValue, setNewValue] = useState("")
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState<string | null>(null)
//   const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({})
//   const { isInitialized, encryptData, decryptData } = useWalletEncryption()

//   const addSecret = async () => {
//     if (!isInitialized) {
//       setError("Please connect and authorize your wallet first")
//       return
//     }

//     if (!newKey.trim() || !newValue.trim()) {
//       setError("Both key and value are required")
//       return
//     }

//     // Check for sensitive keys
//     const sensitiveKeys = ['DATABASE_URL', 'DB_URL', 'DATABASE', 'DB', 'URL', 'PASSWORD', 'SECRET', 'KEY']
//     const isSensitive = sensitiveKeys.some(key => newKey.toUpperCase().includes(key))
    
//     if (isSensitive) {
//       setError("This key name contains sensitive information. Please use a more specific name.")
//       return
//     }

//     try {
//       // Encrypt the value before storing
//       const encryptedValue = await encryptData(newValue)

//       const newSecret: Secret = {
//         id: crypto.randomUUID(),
//         key: newKey,
//         encryptedValue,
//       }

//       setSecrets([...secrets, newSecret])
//       setNewKey("")
//       setNewValue("")
//       setSuccess("Secret added successfully")
//       setError(null)

//       // Clear success message after 3 seconds
//       setTimeout(() => setSuccess(null), 3000)
//     } catch (err) {
//       if (err instanceof Error) {
//         setError(err.message)
//       } else {
//         setError("Failed to encrypt secret")
//       }
//     }
//   }

//   const toggleSecretVisibility = (id: string) => {
//     setVisibleSecrets(prev => ({
//       ...prev,
//       [id]: !prev[id]
//     }))
//   }

//   const viewSecret = async (encryptedValue: EncryptedData, id: string) => {
//     if (!isInitialized) {
//       return "**Please connect your wallet**"
//     }

//     if (!visibleSecrets[id]) {
//       return "••••••••••••••••••••••••••"
//     }

//     try {
//       const decrypted = await decryptData(encryptedValue)
//       if (!decrypted) {
//         throw new Error('Decryption failed')
//       }
//       return decrypted
//     } catch (err) {
//       console.error('Failed to decrypt secret:', err)
//       return "**Failed to decrypt**"
//     }
//   }

//   return (
//     <div className="space-y-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>Add New Secret</CardTitle>
//           <CardDescription>Add a new secret to the {environment} environment</CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {error && (
//             <Alert variant="destructive">
//               <AlertCircle className="h-4 w-4" />
//               <AlertTitle>Error</AlertTitle>
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           {success && (
//             <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
//               <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
//               <AlertTitle>Success</AlertTitle>
//               <AlertDescription>{success}</AlertDescription>
//             </Alert>
//           )}

//           <div className="space-y-2">
//             <Label htmlFor="secret-key">Secret Key</Label>
//             <Input
//               id="secret-key"
//               placeholder="e.g., API_KEY, CONFIG_VALUE"
//               value={newKey}
//               onChange={(e) => setNewKey(e.target.value)}
//             />
//           </div>

//           <div className="space-y-2">
//             <Label htmlFor="secret-value">Secret Value</Label>
//             <Textarea
//               id="secret-value"
//               placeholder="Enter the secret value"
//               value={newValue}
//               onChange={(e) => setNewValue(e.target.value)}
//               rows={3}
//             />
//             <p className="text-xs text-muted-foreground">This value will be encrypted using your wallet-derived key</p>
//           </div>
//         </CardContent>
//         <CardFooter>
//           <Button onClick={addSecret} className="w-full">
//             <Save className="mr-2 h-4 w-4" />
//             Add Secret
//           </Button>
//         </CardFooter>
//       </Card>

//       {secrets.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Your Secrets</CardTitle>
//             <CardDescription>These secrets are encrypted with your wallet-derived key</CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               {secrets.map((secret) => (
//                 <div key={secret.id} className="rounded-lg border p-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <div className="flex items-center gap-2">
//                       <Lock className="h-4 w-4 text-purple-500" />
//                       <span className="font-medium">{secret.key}</span>
//                     </div>
//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => toggleSecretVisibility(secret.id)}
//                     >
//                       {visibleSecrets[secret.id] ? (
//                         <EyeOff className="h-4 w-4" />
//                       ) : (
//                         <Eye className="h-4 w-4" />
//                       )}
//                     </Button>
//                   </div>
//                   <div className="font-mono text-sm bg-muted p-2 rounded">
//                     {viewSecret(secret.encryptedValue, secret.id)}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   )
// }
