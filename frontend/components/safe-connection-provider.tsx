'use client';

import { createContext, useMemo, useState, useContext, useEffect, ReactNode } from 'react';
import { Connection, ConnectionConfig } from '@solana/web3.js';

type ConnectionContextState = {
  connection: Connection | null;
  endpoint: string;
  setEndpoint: (endpoint: string, config?: ConnectionConfig) => void;
};

const ConnectionContext = createContext<ConnectionContextState>({
  connection: null,
  endpoint: '',
  setEndpoint: () => {},
});

export function useConnectionContext() {
  return useContext(ConnectionContext);
}

export function SafeConnectionProvider({ 
  endpoint, 
  config, 
  children 
}: { 
  endpoint: string; 
  config?: ConnectionConfig; 
  children: ReactNode 
}) {
  const [currentEndpoint, setCurrentEndpoint] = useState(endpoint);
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig | undefined>(config);
  const [connection, setConnection] = useState<Connection | null>(null);

  // Create connection in useEffect to ensure it's only created client-side
  useEffect(() => {
    try {
      // Only create connection on the client
      if (typeof window !== 'undefined') {
        const newConnection = new Connection(currentEndpoint, connectionConfig);
        setConnection(newConnection);
      }
    } catch (error) {
      console.error('Failed to create Solana connection:', error);
      setConnection(null);
    }
  }, [currentEndpoint, connectionConfig]);

  const setEndpoint = useMemo(
    () => (newEndpoint: string, newConfig?: ConnectionConfig) => {
      setCurrentEndpoint(newEndpoint);
      if (newConfig) {
        setConnectionConfig(newConfig);
      }
    },
    []
  );

  return (
    <ConnectionContext.Provider
      value={{
        connection,
        endpoint: currentEndpoint,
        setEndpoint,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}

export default SafeConnectionProvider;
