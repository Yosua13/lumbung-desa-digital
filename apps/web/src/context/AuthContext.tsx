import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
  id: number;
  wallet_address: string;
  role: string; // 'warung', 'supplier', 'funder', 'admin'
  name: string;
}

interface AuthContextType {
  user: User | null;
  wallet: string;
  login: (walletAddress: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = 'http://localhost:8080/api';

  useEffect(() => {
    // Check local storage for existing session
    const storedWallet = localStorage.getItem('wallet_address');
    if (storedWallet) {
      setWallet(storedWallet);
      fetchUser(storedWallet);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (walletAddress: string) => {
    try {
      const res = await fetch(`${API_URL}/me`, {
        headers: {
          'X-Wallet-Address': walletAddress
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        // Session invalid
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (walletAddress: string, userData: User) => {
    setWallet(walletAddress);
    setUser(userData);
    localStorage.setItem('wallet_address', walletAddress);
  };

  const logout = () => {
    setWallet('');
    setUser(null);
    localStorage.removeItem('wallet_address');
  };

  const refreshUser = async () => {
    if (wallet) {
      await fetchUser(wallet);
    }
  };

  return (
    <AuthContext.Provider value={{ user, wallet, login, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
