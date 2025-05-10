import { EncryptionTest } from '@/components/encryption-test';

export default function TestEncryptionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Test Wallet Encryption</h1>
      <div className="max-w-2xl mx-auto">
        <EncryptionTest />
      </div>
    </div>
  );
}
