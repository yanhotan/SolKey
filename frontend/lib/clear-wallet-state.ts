import { clearEncryptionKey } from './wallet-auth';

export function clearWalletState() {
  // Clear encryption key
  clearEncryptionKey();
  
  // Clear any stored wallet data from localStorage
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (!key.startsWith('encrypted:')) {
      localStorage.removeItem(key);
    }
  });
}
