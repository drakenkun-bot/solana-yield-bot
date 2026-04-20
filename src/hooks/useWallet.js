import { useState, useCallback, useEffect } from 'react';
import { QUICKNODE_RPC } from '../config';

const WALLET_KEY = 'yield_bot_wallet';

export function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(WALLET_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setWallet(parsed);
        fetchBalance(parsed.address);
      } catch (e) { localStorage.removeItem(WALLET_KEY); }
    }
  }, []);

  const fetchBalance = async (address) => {
    try {
      const res = await fetch(QUICKNODE_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });
      const data = await res.json();
      if (data.result) {
        setBalance(data.result.value / 1e9);
      }
    } catch (e) {
      console.warn('Balance fetch failed:', e);
    }
  };

  const connect = useCallback(async (address) => {
    setLoading(true);
    setError(null);
    try {
      const walletData = { address, connectedAt: new Date().toISOString() };
      localStorage.setItem(WALLET_KEY, JSON.stringify(walletData));
      setWallet(walletData);
      await fetchBalance(address);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    localStorage.removeItem(WALLET_KEY);
    setWallet(null);
    setBalance(null);
  }, []);

  const generateSolflareDeepLink = useCallback(() => {
    const dappUrl = encodeURIComponent(window.location.origin);
    return `https://solflare.com/ul/v1/browse/${dappUrl}?cluster=mainnet-beta`;
  }, []);

  return {
    wallet,
    balance,
    loading,
    error,
    connect,
    disconnect,
    generateSolflareDeepLink,
    isConnected: !!wallet,
    refreshBalance: () => wallet && fetchBalance(wallet.address),
  };
}
