// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = {
  secrets: {
    decrypt: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/decrypt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to decrypt secret');
      }

      return response.json();
    },
  },
}; 