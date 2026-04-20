import { TrendingUp, Activity, Shield } from 'lucide-react';
import { RISK_COLORS, formatAPY, formatPct, formatUSD } from '../config';

export default function VaultCard({ vault, compact = false }) {
  const risk = RISK_COLORS[vault.risk_score] || RISK_COLORS.medium;

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 bg-tg-surface rounded-lg">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${risk.bg.replace('/20', '')}`} />
          <span className="text-sm text-white font-medium">{vault.token_symbol}</span>
          <span className="text-xs text-tg-muted">{vault.name}</span>
        </div>
        <span className="text-sm font-semibold text-tg-green">{formatAPY(vault.apy)}</span>
      </div>
    );
  }

  return (
    <div className="bg-tg-surface rounded-xl p-4 border border-tg-border hover:border-tg-accent/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-semibold text-sm">{vault.name}</div>
          <div className="text-tg-muted text-xs mt-0.5">{vault.token_symbol} • {vault.protocol}</div>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${risk.bg} ${risk.text} border ${risk.border}`}>
          {vault.risk_score}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="flex items-center gap-1 text-tg-muted text-[10px] mb-0.5">
            <TrendingUp size={10} />
            APY
          </div>
          <div className="text-tg-green font-bold text-lg">{formatAPY(vault.apy)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-tg-muted text-[10px] mb-0.5">
            <Activity size={10} />
            Utilization
          </div>
          <div className="text-white font-semibold text-sm">{formatPct(vault.utilization)}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-tg-muted text-[10px] mb-0.5">
            <Shield size={10} />
            TVL
          </div>
          <div className="text-white font-semibold text-sm">{formatUSD(vault.tvl)}</div>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="mt-3">
        <div className="h-1.5 bg-tg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-tg-accent to-tg-green rounded-full transition-all duration-500"
            style={{ width: `${Math.min(Number(vault.utilization), 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
