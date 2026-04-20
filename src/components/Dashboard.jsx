import { useState } from 'react';
import { TrendingUp, Wallet, Activity, Bell, RefreshCw, Zap, BarChart3, Shield } from 'lucide-react';
import VaultCard from './VaultCard';
import AlertsList from './AlertsList';
import PerformanceChart from './PerformanceChart';
import { formatAPY, formatUSD, truncateAddress, RISK_LABELS } from '../config';

export default function Dashboard({
  wallet,
  balance,
  vaults,
  positions,
  alerts,
  autoMode,
  strategy,
  walletRecord,
  onRefresh,
  onCommand,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const totalValue = positions.reduce((s, p) => s + Number(p.current_value_usd || 0), 0);
  const totalEntry = positions.reduce((s, p) => s + Number(p.entry_value_usd || 0), 0);
  const pnl = totalValue - totalEntry;
  const avgApy = vaults.length > 0
    ? vaults.reduce((s, v) => s + Number(v.apy), 0) / vaults.length
    : 0;
  const topVault = vaults.length > 0 ? vaults[0] : null;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'vaults', label: 'Vaults', icon: TrendingUp },
    { key: 'alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="h-full flex flex-col bg-tg-bg overflow-y-auto">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-tg-panel border-b border-tg-border">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <Zap size={20} className="text-tg-accent" />
            Dashboard
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-tg-surface text-tg-muted hover:text-tg-accent transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Wallet info bar */}
        {wallet ? (
          <div className="flex items-center gap-3 bg-tg-surface rounded-lg px-3 py-2">
            <Wallet size={14} className="text-tg-accent" />
            <span className="text-xs text-tg-muted font-mono">{truncateAddress(wallet.address)}</span>
            {balance !== null && (
              <span className="text-xs text-white ml-auto">{balance.toFixed(4)} SOL</span>
            )}
            <span className={`w-2 h-2 rounded-full ${autoMode ? 'bg-tg-green animate-pulse-dot' : 'bg-tg-muted'}`} />
          </div>
        ) : (
          <div className="bg-tg-surface rounded-lg px-3 py-2 text-xs text-tg-muted text-center">
            No wallet connected — use the chat to connect
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-tg-border">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === t.key
                ? 'text-tg-accent border-b-2 border-tg-accent'
                : 'text-tg-muted hover:text-white'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {t.key === 'alerts' && alerts.filter(a => !a.is_read).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-tg-red text-[9px] text-white flex items-center justify-center">
                {alerts.filter(a => !a.is_read).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto">
        {activeTab === 'overview' && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                label="Portfolio Value"
                value={totalValue > 0 ? formatUSD(totalValue) : '$0.00'}
                sub={pnl !== 0 ? `${pnl >= 0 ? '+' : ''}${formatUSD(pnl)}` : null}
                subColor={pnl >= 0 ? 'text-tg-green' : 'text-tg-red'}
                icon={Wallet}
              />
              <StatCard
                label="Avg. Vault APY"
                value={formatAPY(avgApy)}
                sub={`${vaults.length} vaults tracked`}
                icon={TrendingUp}
              />
              <StatCard
                label="Auto Mode"
                value={autoMode ? 'Active' : 'Off'}
                sub={strategy ? RISK_LABELS[strategy.risk_level] : 'No strategy'}
                valueColor={autoMode ? 'text-tg-green' : 'text-tg-muted'}
                icon={Activity}
              />
              <StatCard
                label="Top Vault"
                value={topVault ? formatAPY(topVault.apy) : 'N/A'}
                sub={topVault?.name || ''}
                icon={Shield}
              />
            </div>

            {/* Performance chart */}
            <PerformanceChart vaults={vaults} />

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2">
              <QuickAction label="Rebalance" icon="🔄" onClick={() => onCommand('/rebalance')} />
              <QuickAction label={autoMode ? 'Auto Off' : 'Auto On'} icon="🤖" onClick={() => onCommand(autoMode ? '/auto_off' : '/auto_on')} />
              <QuickAction label="Yield" icon="💰" onClick={() => onCommand('/yield')} />
            </div>
          </>
        )}

        {activeTab === 'vaults' && (
          <div className="space-y-2">
            {vaults.map(v => <VaultCard key={v.id} vault={v} />)}
            {vaults.length === 0 && (
              <div className="text-center text-tg-muted text-sm py-8">Loading vaults...</div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <AlertsList alerts={alerts} />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, subColor, valueColor, icon: Icon }) {
  return (
    <div className="bg-tg-surface rounded-xl p-3 border border-tg-border">
      <div className="flex items-center gap-1.5 text-tg-muted text-[10px] mb-1">
        <Icon size={10} />
        {label}
      </div>
      <div className={`text-lg font-bold ${valueColor || 'text-white'}`}>{value}</div>
      {sub && <div className={`text-[10px] mt-0.5 ${subColor || 'text-tg-muted'}`}>{sub}</div>}
    </div>
  );
}

function QuickAction({ label, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-3 bg-tg-surface rounded-xl border border-tg-border
                 hover:border-tg-accent/30 transition-colors"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[10px] text-tg-muted">{label}</span>
    </button>
  );
}
