"use client"

import { EncryptionTest } from "@/components/encryption-test"
import { TestEncryptionForm } from "@/components/test-encryption-form"
import { PageHeader } from "@/components/page-header"

export default function EncryptionTestPage() {
  return (
    <div className="container py-6 space-y-8">
      <PageHeader 
        heading="Encryption Test" 
        text="Test the end-to-end encryption system using WebCrypto API."
      />
      
      <div className="grid gap-8">
        <TestEncryptionForm />
        
        <div>
          <h2 className="text-xl font-semibold mb-4">WebCrypto Compatibility Test</h2>
          <EncryptionTest />
        </div>
      </div>
    </div>
  )
} 