import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from './hooks/useWallet';
import { useVaults } from './hooks/useVaults';
import { useBot } from './hooks/useBot';
import ChatPanel from './components/ChatPanel';
import Dashboard from './components/Dashboard';
import WalletConnect from './components/WalletConnect';
import { ChevronLeft, ChevronRight, LayoutDashboard, MessageSquare } from 'lucide-react';

export default function App() {
  const { wallet, balance, connect, disconnect, generateSolflareDeepLink, isConnected, refreshBalance } = useWallet();
  const { vaults, loading: vaultsLoading, fetchVaults, simulateApyUpdate, getTopYieldVault } = useVaults();
  const bot = useBot({ wallet, vaults, getTopYieldVault });
  const [view, setView] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const autoTimerRef = useRef(null);

  // Ensure wallet record when wallet connects
  useEffect(() => {
    if (wallet && !bot.walletRecord) {
      bot.ensureWalletRecord();
    }
  }, [wallet]);

  // Auto-rebalance monitoring
  useEffect(() => {
    if (bot.autoMode && isConnected) {
      autoTimerRef.current = setInterval(async () => {
        const update = await simulateApyUpdate();
        if (update) {
          const riskLevel = bot.walletRecord?.risk_level || 'medium';
          const best = getTopYieldVault(riskLevel);
          if (best && update.vault.id !== best.id) {
            const diff = Math.abs(Number(best.apy) - update.newApy);
            if (diff > (bot.strategy?.rebalance_threshold || 2)) {
              bot.addBotMessage(
                `**⚡ APY Change Detected**\n\n${update.vault.name}: ${update.oldApy.toFixed(2)}% → ${update.newApy.toFixed(2)}%\n\nBetter opportunity: **${best.name}** at **${Number(best.apy).toFixed(2)}%** APY\n\nShould I rebalance?`,
                {
                  type: 'alert',
                  buttons: [
                    { label: '✅ Rebalance', cmd: '/rebalance' },
                    { label: '❌ Skip', cmd: '/cancel_rebalance' },
                  ],
                }
              );
            }
          }
        }
      }, 30000);

      return () => clearInterval(autoTimerRef.current);
    } else {
      clearInterval(autoTimerRef.current);
    }
  }, [bot.autoMode, isConnected, bot.walletRecord]);

  const handleRefresh = useCallback(() => {
    fetchVaults();
    if (isConnected) refreshBalance();
    bot.fetchPositions();
    bot.fetchAlerts();
  }, [fetchVaults, isConnected, refreshBalance, bot.fetchPositions, bot.fetchAlerts]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="h-screen flex bg-tg-bg overflow-hidden">
      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-tg-panel border-t border-tg-border flex">
        <button
          onClick={() => setView('chat')}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${
            view === 'chat' ? 'text-tg-accent' : 'text-tg-muted'
          }`}
        >
          <MessageSquare size={18} />
          <span className="text-[10px]">Bot</span>
        </button>
        <button
          onClick={() => setView('dashboard')}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 ${
            view === 'dashboard' ? 'text-tg-accent' : 'text-tg-muted'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px]">Dashboard</span>
        </button>
      </div>

      {/* Chat */}
      <div className={`${isMobile ? (view === 'chat' ? 'flex' : 'hidden') : 'flex'} flex-col w-full md:w-[420px] md:min-w-[420px] border-r border-tg-border h-full md:pb-0 pb-12`}>
        <ChatPanel
          messages={bot.messages}
          onCommand={bot.handleCommand}
          autoMode={bot.autoMode}
        />
      </div>

      {/* Dashboard + Sidebar */}
      <div className={`${isMobile ? (view === 'dashboard' ? 'flex' : 'hidden') : 'flex'} flex-1 flex-col md:flex-row h-full md:pb-0 pb-12`}>
        {/* Main dashboard */}
        <div className="flex-1 h-full overflow-hidden">
          <Dashboard
            wallet={wallet}
            balance={balance}
            vaults={vaults}
            positions={bot.positions}
            alerts={bot.alerts}
            autoMode={bot.autoMode}
            strategy={bot.strategy}
            walletRecord={bot.walletRecord}
            onRefresh={handleRefresh}
            onCommand={bot.handleCommand}
          />
        </div>

        {/* Right sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} hidden md:block transition-all duration-200 overflow-hidden border-l border-tg-border`}>
          <div className="w-72 h-full overflow-y-auto p-3 space-y-3 bg-tg-panel">
            <WalletConnect
              wallet={wallet}
              balance={balance}
              onConnect={connect}
              onDisconnect={disconnect}
              deepLink={generateSolflareDeepLink()}
            />

            {/* Strategy info */}
            {bot.strategy && (
              <div className="bg-tg-surface rounded-xl p-4 border border-tg-border">
                <div className="text-xs font-semibold text-white mb-2">Active Strategy</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-tg-muted">Name</span>
                    <span className="text-white">{bot.strategy.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-tg-muted">Risk</span>
                    <span className="text-white capitalize">{bot.strategy.risk_level}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-tg-muted">Threshold</span>
                    <span className="text-white">{bot.strategy.rebalance_threshold}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-tg-muted">Status</span>
                    <span className={bot.strategy.is_active ? 'text-tg-green' : 'text-tg-muted'}>
                      {bot.strategy.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick vault list */}
            <div className="bg-tg-surface rounded-xl p-4 border border-tg-border">
              <div className="text-xs font-semibold text-white mb-2">Top Vaults</div>
              <div className="space-y-1.5">
                {vaults.slice(0, 5).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        v.risk_score === 'low' ? 'bg-tg-green' : v.risk_score === 'medium' ? 'bg-tg-orange' : 'bg-tg-red'
                      }`} />
                      <span className="text-tg-muted">{v.token_symbol}</span>
                    </div>
                    <span className="text-tg-green font-medium">{Number(v.apy).toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RPC Status */}
            <div className="bg-tg-surface rounded-xl p-4 border border-tg-border">
              <div className="text-xs font-semibold text-white mb-2">Infrastructure</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-tg-green animate-pulse-dot" />
                  <span className="text-tg-muted">QuickNode RPC</span>
                  <span className="text-tg-green ml-auto">Connected</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-tg-green animate-pulse-dot" />
                  <span className="text-tg-muted">Kamino Finance</span>
                  <span className="text-tg-green ml-auto">Active</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-tg-green animate-pulse-dot" />
                  <span className="text-tg-muted">Database</span>
                  <span className="text-tg-green ml-auto">Synced</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-5 h-10 bg-tg-panel border border-tg-border rounded-l-lg items-center justify-center text-tg-muted hover:text-tg-accent z-10"
          style={{ right: sidebarOpen ? '288px' : '0' }}
        >
          {sidebarOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>
    </div>
  );
}
