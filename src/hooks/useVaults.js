import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { KAMINO_API, QUICKNODE_RPC } from '../config';

export function useVaults() {
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  const fetchVaults = useCallback(async () => {
    const { data, error } = await supabase
      .from('vaults')
      .select('*')
      .order('apy', { ascending: false });

    if (!error && data) {
      setVaults(data);
      setLastRefresh(new Date());
    }
    setLoading(false);
  }, []);

  const refreshApyFromChain = useCallback(async () => {
    try {
      const res = await fetch(KAMINO_API('/strategies/metrics'));
      if (res.ok) {
        const metrics = await res.json();
        if (Array.isArray(metrics)) {
          for (const m of metrics) {
            const matchingVault = vaults.find(v => v.vault_address === m.address);
            if (matchingVault && m.apy !== undefined) {
              await supabase
                .from('vaults')
                .update({ apy: m.apy, utilization: m.utilization || matchingVault.utilization, last_updated: new Date().toISOString() })
                .eq('vault_address', m.address)
                .then(() => {}, () => {});
            }
          }
          await fetchVaults();
        }
      }
    } catch (e) {
      console.warn('Kamino API refresh failed, using cached data:', e.message);
    }
  }, [vaults, fetchVaults]);

  const simulateApyUpdate = useCallback(async () => {
    if (vaults.length === 0) return;
    const randomVault = vaults[Math.floor(Math.random() * vaults.length)];
    const change = (Math.random() - 0.5) * 2;
    const newApy = Math.max(0.5, Number(randomVault.apy) + change);

    await supabase
      .from('vaults')
      .update({ apy: newApy.toFixed(4), last_updated: new Date().toISOString() })
      .eq('id', randomVault.id)
      .then(() => {}, () => {});

    await fetchVaults();
    return { vault: randomVault, oldApy: Number(randomVault.apy), newApy };
  }, [vaults, fetchVaults]);

  useEffect(() => {
    fetchVaults();

    const sub = supabase
      .channel('vaults-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vaults' }, () => {
        fetchVaults();
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [fetchVaults]);

  const getVaultsByRisk = useCallback((risk) => {
    return vaults.filter(v => v.risk_score === risk).sort((a, b) => Number(b.apy) - Number(a.apy));
  }, [vaults]);

  const getTopYieldVault = useCallback((risk) => {
    const filtered = risk === 'all' ? vaults : vaults.filter(v => v.risk_score === risk);
    return filtered.sort((a, b) => Number(b.apy) - Number(a.apy))[0] || null;
  }, [vaults]);

  return {
    vaults,
    loading,
    lastRefresh,
    fetchVaults,
    refreshApyFromChain,
    simulateApyUpdate,
    getVaultsByRisk,
    getTopYieldVault,
  };
}
