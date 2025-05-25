// API utilities for handling backend requests
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

// Custom error class with status code
export class ApiError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Gets the base API URL from environment variables or uses a default
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Helper function to make API requests with proper error handling
 * @param endpoint - API endpoint to call (without the base URL)
 * @param options - Fetch options
 * @returns API response
 */
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // For non-2xx responses
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If we can't parse JSON, use the status text
        errorMessage = `${errorMessage} - ${response.statusText}`;
      }
      
      const error = new ApiError(errorMessage, response.status);
      throw error;
    }
    
    // Return JSON for successful responses
    return await response.json();
  } catch (error) {
    console.error(`API Request Error (${url}):`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error');
  }
}

// Helper functions for making specific API requests

/**
 * Makes a GET request to the API
 * @param endpoint - API endpoint
 * @param options - Additional fetch options
 * @returns API response
 */
export async function getRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * Makes a POST request to the API
 * @param endpoint - API endpoint
 * @param data - Request body data
 * @param options - Additional fetch options
 * @returns API response
 */
export async function postRequest<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

export async function getUserByWallet<T = any>(walletAddress: string): Promise<T | null> {
  if (!walletAddress) {
    throw new ApiError('Wallet address is required', 400);
  }
  
  try {
    return await getRequest<T>(`api/users/wallet/${walletAddress}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createOrUpdateUser<T = any>(walletAddress: string, userData = {}): Promise<T> {
  if (!walletAddress) {
    throw new ApiError('Wallet address is required', 400);
  }
  
  return postRequest<T>('api/users', {
    wallet_address: walletAddress,
    ...userData
  });
}
