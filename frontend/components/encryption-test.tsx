"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoaderCircle, CheckCircle2, XCircle } from "lucide-react"
import { 
  generateEncryptionKey, 
  encryptData, 
  decryptData,
  exportKeyToBase64,
  importKeyFromBase64,
  checkWebCryptoSupport,
  hexToUint8Array,
  base64ToUint8Array
} from "@/lib/crypto"

export function EncryptionTest() {
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [keyBase64, setKeyBase64] = useState<string>("")
  const [plaintext, setPlaintext] = useState<string>("")
  const [encrypted, setEncrypted] = useState<any>(null)
  const [decrypted, setDecrypted] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false)
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [isDebugging, setIsDebugging] = useState<boolean>(false)

  // Generate encryption key
  const handleGenerateKey = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const newKey = await generateEncryptionKey()
      setKey(newKey)
      
      // Export the key to base64 for display
      const exportedKey = await exportKeyToBase64(newKey)
      setKeyBase64(exportedKey)
      
      console.log("Generated key:", {
        algorithm: newKey.algorithm,
        type: newKey.type,
        extractable: newKey.extractable,
        base64Length: exportedKey.length
      })
    } catch (err) {
      console.error("Error generating key:", err)
      setError(err instanceof Error ? err.message : "Failed to generate key")
    } finally {
      setIsGenerating(false)
    }
  }

  // Encrypt data
  const handleEncrypt = async () => {
    if (!key) {
      setError("No encryption key available")
      return
    }
    
    if (!plaintext) {
      setError("Please enter text to encrypt")
      return
    }
    
    setIsEncrypting(true)
    setError(null)
    
    try {
      const plaintextBytes = new TextEncoder().encode(plaintext);
      const encryptedData = await encryptData(plaintext, key)
      setEncrypted({
        ...encryptedData,
        plaintextLength: plaintextBytes.length,
        expectedCiphertextLength: plaintextBytes.length + 16 // plaintext + 16 byte auth tag
      })
      
      console.log("Encrypted data:", {
        plaintextBytesLength: plaintextBytes.length,
        encryptedBase64Length: encryptedData.encrypted.length,
        expectedCiphertextBytesLength: plaintextBytes.length + 16,
        ivLength: encryptedData.iv.length,
        format: "encrypted=base64(ciphertext+authTag), iv=hex"
      })
    } catch (err) {
      console.error("Error encrypting data:", err)
      setError(err instanceof Error ? err.message : "Failed to encrypt data")
    } finally {
      setIsEncrypting(false)
    }
  }

  // Decrypt data
  const handleDecrypt = async () => {
    if (!key) {
      setError("No encryption key available")
      return
    }
    
    if (!encrypted) {
      setError("No encrypted data available")
      return
    }
    
    setIsDecrypting(true)
    setError(null)
    
    try {
      const decryptedText = await decryptData(encrypted, key)
      setDecrypted(decryptedText)
      
      console.log("Decryption successful:", {
        decryptedLength: decryptedText.length,
        matches: decryptedText === plaintext
      })
    } catch (err) {
      console.error("Error decrypting data:", err)
      setError(err instanceof Error ? err.message : "Failed to decrypt data")
    } finally {
      setIsDecrypting(false)
    }
  }

  // Test importing the key
  const handleImportKey = async () => {
    if (!keyBase64) {
      setError("No key to import")
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const importedKey = await importKeyFromBase64(keyBase64)
      setKey(importedKey)
      
      console.log("Key imported successfully:", {
        algorithm: importedKey.algorithm,
        type: importedKey.type,
        extractable: importedKey.extractable
      })
    } catch (err) {
      console.error("Error importing key:", err)
      setError(err instanceof Error ? err.message : "Failed to import key")
    } finally {
      setIsGenerating(false)
    }
  }

  // Check WebCrypto support
  const handleCheckSupport = async () => {
    try {
      const isSupported = await checkWebCryptoSupport()
      setSupported(isSupported)
      
      console.log("WebCrypto support:", isSupported)
    } catch (err) {
      console.error("Error checking WebCrypto support:", err)
      setError(err instanceof Error ? err.message : "Failed to check WebCrypto support")
    }
  }

  // Debug direct WebCrypto decryption
  const handleDebugWebCrypto = async () => {
    if (!key || !encrypted) {
      setError("No key or encrypted data available")
      return
    }
    
    setIsDebugging(true)
    setError(null)
    
    try {
      console.log("🔬 DEBUG: Direct WebCrypto test without wrappers")
      
      // Get values
      const ciphertext = encrypted.encrypted;
      const iv = encrypted.iv;
      
      console.log(" Using key:", {
        algorithm: key.algorithm,
        type: key.type,
        extractable: key.extractable,
        usages: key.usages
      })
      
      // Convert hex IV to Uint8Array directly
      const ivBytes = hexToUint8Array(iv);
      console.log("🔤 IV bytes:", {
        hex: iv,
        bytesLength: ivBytes.length,
        bytes: Array.from(ivBytes).map(b => b.toString(16).padStart(2, '0')).join(' ')
      })
      
      // Convert base64 ciphertext to Uint8Array directly
      let paddedCiphertext = ciphertext;
      while (paddedCiphertext.length % 4 !== 0) {
        paddedCiphertext += '=';
      }
      
      // Convert using browser's built-in conversion
      const rawData = atob(paddedCiphertext);
      const ciphertextBytes = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        ciphertextBytes[i] = rawData.charCodeAt(i);
      }
      
      console.log(" Ciphertext bytes:", {
        base64: ciphertext,
        bytesLength: ciphertextBytes.length,
        firstBytes: Array.from(ciphertextBytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        lastBytes: Array.from(ciphertextBytes.slice(-16)).map(b => b.toString(16).padStart(2, '0')).join(' ')
      })
      
      // Try direct WebCrypto decryption
      try {
        console.log("🔄 Attempting direct WebCrypto decryption...")
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: ivBytes,
            tagLength: 128
          },
          key,
          ciphertextBytes
        );
        
        const decryptedText = new TextDecoder().decode(decryptedBuffer);
        console.log("✅ Direct WebCrypto decryption succeeded:", {
          decryptedLength: decryptedText.length,
          decrypted: decryptedText
        })
        
        setDecrypted(decryptedText);
      } catch (decryptError) {
        console.error("❌ Direct WebCrypto decryption failed:", decryptError)
        
        // Try to diagnose potential issues
        if (ciphertextBytes.length < 16) {
          console.error("Ciphertext too short to contain auth tag")
        }
        
        // Try with alternative approach - removing auth tag
        try {
          console.log("🔄 Trying alternative approach - separate auth tag")
          if (ciphertextBytes.length >= 32) {
            const cipherOnly = ciphertextBytes.slice(0, ciphertextBytes.length - 16);
            const authTag = ciphertextBytes.slice(ciphertextBytes.length - 16);
            
            console.log("Split data:", {
              cipherOnlyLength: cipherOnly.length,
              authTagLength: authTag.length,
              authTagHex: Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join(' ')
            })
          }
        } catch (err) {
          console.error("Alternative approach also failed:", err)
        }
        
        throw decryptError;
      }
    } catch (err) {
      console.error("Debug error:", err)
      setError(err instanceof Error ? err.message : "Debug WebCrypto test failed")
    } finally {
      setIsDebugging(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Encryption Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WebCrypto Support */}
        <div className="flex items-center justify-between">
          <span>WebCrypto Support:</span>
          <div className="flex items-center space-x-4">
            {supported === null ? (
              <Button onClick={handleCheckSupport} variant="outline" size="sm">
                Check Support
              </Button>
            ) : supported ? (
              <div className="flex items-center text-green-500">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Supported
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <XCircle className="h-5 w-5 mr-2" />
                Not Supported
              </div>
            )}
          </div>
        </div>
        
        {/* Key Generation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Encryption Key:</Label>
            <Button 
              onClick={handleGenerateKey} 
              disabled={isGenerating}
              variant="outline" 
              size="sm"
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Key"
              )}
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Input 
              value={keyBase64} 
              onChange={(e) => setKeyBase64(e.target.value)}
              placeholder="Base64-encoded key"
              className="font-mono text-xs"
            />
            <Button 
              onClick={handleImportKey} 
              disabled={!keyBase64}
              variant="outline" 
              size="sm"
            >
              Import
            </Button>
          </div>
          
          <div className="flex items-center h-6">
            {key && (
              <div className="text-green-500 flex items-center text-sm">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Key ready
              </div>
            )}
          </div>
        </div>
        
        {/* Encryption */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Plaintext:</Label>
            <Button 
              onClick={handleEncrypt} 
              disabled={isEncrypting || !key || !plaintext}
              variant="outline" 
              size="sm"
            >
              {isEncrypting ? (
                <>
                  <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting...
                </>
              ) : (
                "Encrypt"
              )}
            </Button>
          </div>
          
          <Input 
            value={plaintext} 
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Text to encrypt"
          />
        </div>
        
        {/* Encrypted Data */}
        {encrypted && (
          <div className="space-y-2 border p-3 rounded-md bg-gray-50 dark:bg-gray-900">
            <Label>Encrypted Data:</Label>
            <div className="text-xs mb-2 text-gray-500 dark:text-gray-400">
              Format: base64(ciphertext+authTag) + hex(iv)
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono break-all">
                <span className="font-semibold">Encrypted Value (base64):</span> 
                <div className="mt-1 p-1 bg-black/5 rounded">
                  {encrypted.encrypted.length > 60 
                    ? encrypted.encrypted.substring(0, 60) + '...'
                    : encrypted.encrypted}
                  <div className="text-xs mt-1 text-gray-500">
                    Length: {encrypted.encrypted.length} characters (base64)
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono break-all">
                <span className="font-semibold">IV (hex):</span> 
                <div className="mt-1 p-1 bg-black/5 rounded">
                  {encrypted.iv}
                  <div className="text-xs mt-1 text-gray-500">
                    Length: {encrypted.iv.length} characters (hex) = {encrypted.iv.length/2} bytes
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono break-all">
                <span className="font-semibold">Auth Tag (hex):</span> 
                <div className="mt-1 p-1 bg-black/5 rounded text-gray-500">
                  {encrypted.authTag}
                  <div className="text-xs mt-1 text-amber-600">
                    Note: Auth tag is already included in the encrypted value above.
                    This is shown for debugging purposes only.
                  </div>
                </div>
              </div>
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <div className="text-xs">
                  <span className="font-semibold">Debug Info:</span>
                  <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Plaintext length: {encrypted.plaintextLength} bytes</li>
                    <li>Expected ciphertext+authTag length: {encrypted.expectedCiphertextLength} bytes</li>
                    <li>Base64 padding correct: {encrypted.encrypted.length % 4 === 0 ? 'Yes' : 'No'}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Debug button */}
            <div className="mt-4">
              <Button 
                onClick={handleDebugWebCrypto} 
                disabled={isDebugging || !key || !encrypted}
                variant="outline" 
                size="sm"
                className="w-full"
              >
                {isDebugging ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Debugging...
                  </>
                ) : (
                  "Debug with Direct WebCrypto"
                )}
              </Button>
            </div>
          </div>
        )}
        
        {/* Decryption */}
        {encrypted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Decryption:</Label>
              <Button 
                onClick={handleDecrypt} 
                disabled={isDecrypting || !key || !encrypted}
                variant="outline" 
                size="sm"
              >
                {isDecrypting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  "Decrypt"
                )}
              </Button>
            </div>
            
            {decrypted && (
              <div className="border p-3 rounded-md bg-gray-50 dark:bg-gray-900">
                <Label>Decrypted Text:</Label>
                <div className="mt-1">{decrypted}</div>
                
                {plaintext === decrypted && (
                  <div className="mt-2 text-green-500 flex items-center text-sm">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Decryption matches original text
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="text-red-500 text-sm flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 