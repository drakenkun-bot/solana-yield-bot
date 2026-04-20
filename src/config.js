const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.eitherway.ai';

export const PROXY_API = (url) => `${API_BASE_URL}/api/proxy-api?url=${encodeURIComponent(url)}`;
export const QUICKNODE_RPC = `${API_BASE_URL}/api/quicknode/rpc/solana`;
export const KAMINO_API = (path) => PROXY_API(`https://api.kamino.finance${path}`);

export const RISK_COLORS = {
  low: { bg: 'bg-tg-green/20', text: 'text-tg-green', border: 'border-tg-green/30' },
  medium: { bg: 'bg-tg-orange/20', text: 'text-tg-orange', border: 'border-tg-orange/30' },
  high: { bg: 'bg-tg-red/20', text: 'text-tg-red', border: 'border-tg-red/30' },
};

export const RISK_LABELS = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' };

export const formatUSD = (v) => {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${Number(v).toFixed(2)}`;
};

export const formatAPY = (v) => `${Number(v).toFixed(2)}%`;
export const formatPct = (v) => `${Number(v).toFixed(1)}%`;

export const truncateAddress = (addr) =>
  addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '';
