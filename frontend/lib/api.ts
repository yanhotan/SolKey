// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = {
  secrets: {
    list: async (data: { walletAddress: string; signature: string }) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/secrets?walletAddress=${data.walletAddress}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to fetch secrets list:', {
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error in list secrets:', error);
        throw error instanceof Error 
          ? new Error(`Failed to fetch secrets: ${error.message}`)
          : new Error('Failed to fetch secrets');
      }
    },
    
    // Debug function to directly test the API endpoint
    debugFetchRaw: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      console.log(`DEBUG - Testing API endpoint for secret ${secretId}`, {
        url: `${API_BASE_URL}/api/secrets/${secretId}/decrypt`,
        walletAddress: data.walletAddress,
        signatureLength: data.signature?.length || 0
      });
      
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/secrets/${secretId}/decrypt`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          }
        );
        
        // Get raw response text first
        const responseText = await response.text();
        console.log(`DEBUG - Raw API response (${response.status})`, responseText.substring(0, 500));
        
        // Try to parse as JSON if applicable
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { error: 'Invalid JSON response', rawResponse: responseText.substring(0, 200) };
        }
        
        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          data: responseData
        };
      } catch (error) {
        return {
          status: 0,
          statusText: 'Network Error',
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    
    fetchEncrypted: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      try {
        console.log(`Fetching encrypted data for secret ${secretId}`, { 
          walletAddress: data.walletAddress,
          signatureLength: data.signature?.length || 0,
          url: `${API_BASE_URL}/api/secrets/${secretId}/decrypt`
        });
        
        // Verify input data before making request
        if (!secretId) {
          console.error('Missing secretId for fetchEncrypted');
          throw new Error('Secret ID is required');
        }
        
        if (!data.walletAddress) {
          console.error('Missing walletAddress for fetchEncrypted');
          throw new Error('Wallet address is required');
        }
        
        if (!data.signature) {
          console.error('Missing signature for fetchEncrypted');
          throw new Error('Signature is required');
        }
        
        // We're using signature instead of privateKey to authenticate the user
        const response = await fetch(
          `${API_BASE_URL}/api/secrets/${secretId}/decrypt`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText || 'Unknown error' };
          }
          
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to fetch encrypted secret data:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            responseText: errorText.substring(0, 200) // Limit to first 200 chars
          });
          throw new Error(errorMessage);
        }

        const responseData = await response.json();
        
        // Validate response data
        if (!responseData || !responseData.encrypted_value || !responseData.iv || !responseData.auth_tag) {
          console.error('Invalid response format:', { 
            hasData: !!responseData,
            hasEncryptedValue: !!responseData?.encrypted_value,
            hasIV: !!responseData?.iv,
            hasAuthTag: !!responseData?.auth_tag
          });
          throw new Error('Server returned incomplete encryption data');
        }
        
        // Map backend field names to frontend expected names
        const mappedResponse = {
          ...responseData,
          nonce: responseData.iv  // Map iv to nonce for frontend compatibility
        };
        
        console.log('Successfully fetched encrypted data');
        return mappedResponse;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error in fetchEncrypted:', {
          secretId,
          error: errorMessage,
          stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw new Error(`Failed to fetch encrypted secret: ${errorMessage}`);
      }
    },
    
    get: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/decrypt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to decrypt secret:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error in get:', error);
        throw error instanceof Error 
          ? new Error(`Failed to get secret: ${error.message}`)
          : new Error('Failed to get secret');
      }
    },
    
    decrypt: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/decrypt`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Failed to decrypt secret:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error in decrypt:', error);
        throw error instanceof Error 
          ? new Error(`Failed to decrypt secret: ${error.message}`)
          : new Error('Failed to decrypt secret');
      }
    },
    
    // New diagnostic function to test the encryption system
    runDiagnostic: async (secretId: string, data: { walletAddress: string; signature: string }) => {
      try {
        console.log(`Running encryption diagnostic for secret ${secretId}`, {
          walletAddress: data.walletAddress,
          signatureLength: data.signature?.length || 0
        });
        
        const response = await fetch(`${API_BASE_URL}/api/secrets/${secretId}/diagnostic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          const errorMessage = errorData.error || `Server returned ${response.status}: ${response.statusText}`;
          console.error('Diagnostic failed:', {
            secretId,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage
          });
          throw new Error(errorMessage);
        }

        return response.json();
      } catch (error) {
        console.error('Error in diagnostic:', error);
        throw error instanceof Error 
          ? new Error(`Diagnostic failed: ${error.message}`)
          : new Error('Diagnostic failed');
      }
    }
  },
}; 