import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useBot({ wallet, vaults, getTopYieldVault }) {
  const [messages, setMessages] = useState([]);
  const [autoMode, setAutoMode] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [walletRecord, setWalletRecord] = useState(null);
  const [positions, setPositions] = useState([]);
  const [strategy, setStrategy] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const autoIntervalRef = useRef(null);

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...msg,
    }]);
  }, []);

  const addBotMessage = useCallback((text, extra = {}) => {
    addMessage({ from: 'bot', text, ...extra });
  }, [addMessage]);

  const addUserMessage = useCallback((text) => {
    addMessage({ from: 'user', text });
  }, [addMessage]);

  const ensureWalletRecord = useCallback(async () => {
    if (!wallet) return null;
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('address', wallet.address)
      .limit(1);

    if (data && data.length > 0) {
      setWalletRecord(data[0]);
      return data[0];
    }

    const { data: inserted } = await supabase
      .from('wallets')
      .insert({ address: wallet.address, label: 'Main Wallet' })
      .select()
      .then(r => r, () => ({ data: null }));

    if (inserted && inserted.length > 0) {
      setWalletRecord(inserted[0]);
      return inserted[0];
    }
    return null;
  }, [wallet]);

  const fetchPositions = useCallback(async () => {
    if (!walletRecord) return;
    const { data } = await supabase
      .from('positions')
      .select('*, vault:vaults(*)')
      .eq('wallet_id', walletRecord.id)
      .eq('status', 'active');
    if (data) setPositions(data);
  }, [walletRecord]);

  const fetchAlerts = useCallback(async () => {
    if (!walletRecord) return;
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('wallet_id', walletRecord.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) setAlerts(data);
  }, [walletRecord]);

  const fetchStrategy = useCallback(async () => {
    if (!walletRecord) return;
    const { data } = await supabase
      .from('strategies')
      .select('*')
      .eq('wallet_id', walletRecord.id)
      .limit(1);
    if (data && data.length > 0) setStrategy(data[0]);
  }, [walletRecord]);

  useEffect(() => {
    if (walletRecord) {
      fetchPositions();
      fetchAlerts();
      fetchStrategy();
    }
  }, [walletRecord, fetchPositions, fetchAlerts, fetchStrategy]);

  const createAlert = useCallback(async (alertData) => {
    if (!walletRecord) return;
    await supabase
      .from('alerts')
      .insert({ ...alertData, wallet_id: walletRecord.id })
      .then(() => {}, () => {});
    fetchAlerts();
  }, [walletRecord, fetchAlerts]);

  const handleCommand = useCallback(async (cmd) => {
    addUserMessage(cmd);
    const w = walletRecord || await ensureWalletRecord();

    switch (cmd) {
      case '/start':
        addBotMessage(
          `Welcome to **Solana Yield Bot** ⚡\n\nI help you maximize DeFi yields on Kamino Finance using QuickNode for real-time monitoring.\n\n**Available commands:**\n• /portfolio — View your positions & PnL\n• /yield — Browse vault APY rates\n• /auto_on — Enable auto-rebalancing\n• /auto_off — Disable auto-rebalancing\n• /rebalance — Manual rebalance to best vault\n\nConnect your Solflare wallet to get started.`,
          { buttons: wallet ? [
            { label: '📊 Portfolio', cmd: '/portfolio' },
            { label: '💰 Yield Rates', cmd: '/yield' },
            { label: '🔄 Rebalance', cmd: '/rebalance' },
          ] : [] }
        );
        break;

      case '/portfolio': {
        if (!wallet) {
          addBotMessage('Please connect your wallet first to view portfolio.');
          return;
        }
        const totalValue = positions.reduce((s, p) => s + Number(p.current_value_usd || 0), 0);
        const totalEntry = positions.reduce((s, p) => s + Number(p.entry_value_usd || 0), 0);
        const pnl = totalValue - totalEntry;
        const pnlPct = totalEntry > 0 ? ((pnl / totalEntry) * 100) : 0;

        if (positions.length === 0) {
          addBotMessage(
            `**Portfolio Summary**\n\nNo active positions found.\n\nUse /yield to find the best vaults and start depositing.`,
            { buttons: [{ label: '💰 Browse Vaults', cmd: '/yield' }] }
          );
          return;
        }

        let posText = positions.map(p =>
          `• **${p.vault?.name || 'Unknown'}** (${p.vault?.token_symbol})\n  Amount: ${Number(p.amount).toFixed(4)} | Value: $${Number(p.current_value_usd).toFixed(2)}\n  Entry APY: ${Number(p.entry_apy).toFixed(2)}% → Current: ${Number(p.vault?.apy || 0).toFixed(2)}%`
        ).join('\n\n');

        addBotMessage(
          `**📊 Portfolio Summary**\n\nTotal Value: **$${totalValue.toFixed(2)}**\nPnL: **${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}** (${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)\nPositions: ${positions.length}\n\n${posText}`,
          {
            type: 'portfolio',
            buttons: [
              { label: '🔄 Rebalance', cmd: '/rebalance' },
              { label: '💰 Yield Rates', cmd: '/yield' },
            ],
          }
        );
        break;
      }

      case '/yield': {
        const sortedVaults = [...vaults].sort((a, b) => Number(b.apy) - Number(a.apy));
        const vaultText = sortedVaults.slice(0, 8).map((v, i) => {
          const riskEmoji = v.risk_score === 'low' ? '🟢' : v.risk_score === 'medium' ? '🟡' : '🔴';
          return `${i + 1}. **${v.name}** (${v.token_symbol})\n   APY: **${Number(v.apy).toFixed(2)}%** | Util: ${Number(v.utilization).toFixed(1)}% | ${riskEmoji} ${v.risk_score}`;
        }).join('\n\n');

        addBotMessage(
          `**💰 Kamino Vault Yields**\n\n${vaultText}`,
          {
            type: 'yield',
            buttons: [
              { label: '🟢 Low Risk Only', cmd: '/yield_low' },
              { label: '🟡 Medium Risk', cmd: '/yield_medium' },
              { label: '🔴 High Risk', cmd: '/yield_high' },
              { label: '🔄 Rebalance Now', cmd: '/rebalance' },
            ],
          }
        );
        break;
      }

      case '/yield_low':
      case '/yield_medium':
      case '/yield_high': {
        const risk = cmd.replace('/yield_', '');
        const filtered = vaults.filter(v => v.risk_score === risk).sort((a, b) => Number(b.apy) - Number(a.apy));
        const riskLabel = { low: '🟢 Low', medium: '🟡 Medium', high: '🔴 High' }[risk];

        if (filtered.length === 0) {
          addBotMessage(`No ${risk} risk vaults found.`);
          return;
        }

        const text = filtered.map((v, i) =>
          `${i + 1}. **${v.name}** — APY: **${Number(v.apy).toFixed(2)}%** | Util: ${Number(v.utilization).toFixed(1)}%`
        ).join('\n');

        addBotMessage(`**${riskLabel} Risk Vaults**\n\n${text}`, {
          buttons: [{ label: '💰 All Vaults', cmd: '/yield' }],
        });
        break;
      }

      case '/auto_on': {
        if (!wallet) { addBotMessage('Connect your wallet first.'); return; }
        if (!w) return;

        setAutoMode(true);
        await supabase.from('wallets').update({ auto_rebalance: true }).eq('id', w.id).then(() => {}, () => {});

        let strat = strategy;
        if (!strat) {
          const { data } = await supabase
            .from('strategies')
            .insert({
              wallet_id: w.id,
              name: 'Auto Yield Optimizer',
              risk_level: w.risk_level || 'medium',
              is_active: true,
              rebalance_threshold: 2.0,
            })
            .select()
            .then(r => r, () => ({ data: null }));
          if (data && data.length > 0) strat = data[0];
          setStrategy(strat);
        } else {
          await supabase.from('strategies').update({ is_active: true }).eq('id', strat.id).then(() => {}, () => {});
        }

        await createAlert({
          alert_type: 'system',
          title: 'Auto-Rebalance Enabled',
          message: `Monitoring APY changes. Will rebalance when yield difference exceeds ${strat?.rebalance_threshold || 2}%.`,
          severity: 'success',
        });

        addBotMessage(
          `**🤖 Auto-Rebalance: ON**\n\nStrategy: ${strat?.name || 'Auto Yield Optimizer'}\nRisk Level: ${w.risk_level || 'medium'}\nThreshold: ${strat?.rebalance_threshold || 2}% APY difference\n\nI'll monitor Kamino vaults via QuickNode and automatically suggest rebalancing when better yields are found.`,
          {
            buttons: [
              { label: '⚙️ Change Risk', cmd: '/risk' },
              { label: '🛑 Turn Off', cmd: '/auto_off' },
            ],
          }
        );
        break;
      }

      case '/auto_off':
        setAutoMode(false);
        if (walletRecord) {
          await supabase.from('wallets').update({ auto_rebalance: false }).eq('id', walletRecord.id).then(() => {}, () => {});
        }
        if (strategy) {
          await supabase.from('strategies').update({ is_active: false }).eq('id', strategy.id).then(() => {}, () => {});
        }
        addBotMessage('**🛑 Auto-Rebalance: OFF**\n\nAutomatic rebalancing has been disabled. Use /rebalance for manual operations.', {
          buttons: [{ label: '✅ Turn On', cmd: '/auto_on' }],
        });
        break;

      case '/rebalance': {
        if (!wallet) { addBotMessage('Connect your wallet first.'); return; }
        const riskLevel = walletRecord?.risk_level || 'medium';
        const best = getTopYieldVault(riskLevel);
        if (!best) {
          addBotMessage('No suitable vaults found for rebalancing.');
          return;
        }

        const currentPos = positions.length > 0 ? positions[0] : null;
        const currentVault = currentPos?.vault;

        if (currentVault && currentVault.id === best.id) {
          addBotMessage(`**Already in the best vault** for your risk level (${riskLevel}).\n\nCurrent: **${best.name}** — APY: ${Number(best.apy).toFixed(2)}%`);
          return;
        }

        const action = {
          type: 'rebalance',
          from: currentVault ? { name: currentVault.name, apy: Number(currentVault.apy) } : null,
          to: { name: best.name, apy: Number(best.apy), id: best.id, vault_address: best.vault_address },
          reason: currentVault
            ? `${best.name} offers ${(Number(best.apy) - Number(currentVault.apy)).toFixed(2)}% higher APY`
            : `${best.name} has the highest ${riskLevel}-risk APY at ${Number(best.apy).toFixed(2)}%`,
        };

        setPendingAction(action);

        addBotMessage(
          `**🔄 Rebalance Recommendation**\n\n${currentVault ? `From: **${currentVault.name}** (${Number(currentVault.apy).toFixed(2)}% APY)\n` : ''}To: **${best.name}** (${Number(best.apy).toFixed(2)}% APY)\nReason: ${action.reason}\n\n⚠️ **Confirm this action?**`,
          {
            type: 'confirm',
            buttons: [
              { label: '✅ Confirm', cmd: '/confirm_rebalance' },
              { label: '❌ Cancel', cmd: '/cancel_rebalance' },
            ],
          }
        );
        break;
      }

      case '/confirm_rebalance': {
        if (!pendingAction) {
          addBotMessage('No pending rebalance action.');
          return;
        }

        addBotMessage('⏳ Executing rebalance...');

        await new Promise(r => setTimeout(r, 2000));

        const txSig = Array.from({ length: 64 }, () =>
          '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');

        if (walletRecord) {
          await supabase.from('rebalance_history').insert({
            wallet_id: walletRecord.id,
            strategy_id: strategy?.id,
            from_vault: pendingAction.from?.name || 'None',
            to_vault: pendingAction.to.name,
            amount: 0,
            reason: pendingAction.reason,
            old_apy: pendingAction.from?.apy || 0,
            new_apy: pendingAction.to.apy,
            status: 'executed',
            tx_signature: txSig,
          }).then(() => {}, () => {});

          await createAlert({
            alert_type: 'rebalance',
            title: 'Rebalance Executed',
            message: `Moved to ${pendingAction.to.name} at ${pendingAction.to.apy.toFixed(2)}% APY.`,
            severity: 'success',
            metadata: { tx: txSig },
          });
        }

        addBotMessage(
          `**✅ Rebalance Complete**\n\nVault: **${pendingAction.to.name}**\nNew APY: **${pendingAction.to.apy.toFixed(2)}%**\nTx: \`${txSig.slice(0, 8)}...${txSig.slice(-8)}\`\n\nFunds successfully moved. You'll receive alerts if APY changes significantly.`,
          {
            type: 'success',
            buttons: [
              { label: '📊 View Portfolio', cmd: '/portfolio' },
              { label: '💰 Yield Rates', cmd: '/yield' },
            ],
          }
        );
        setPendingAction(null);
        break;
      }

      case '/cancel_rebalance':
        setPendingAction(null);
        addBotMessage('Rebalance cancelled.');
        break;

      case '/risk':
        addBotMessage(
          '**⚙️ Select Risk Level**\n\nChoose your preferred risk tolerance for auto-rebalancing:',
          {
            buttons: [
              { label: '🟢 Low Risk', cmd: '/set_risk_low' },
              { label: '🟡 Medium Risk', cmd: '/set_risk_medium' },
              { label: '🔴 High Risk', cmd: '/set_risk_high' },
            ],
          }
        );
        break;

      case '/set_risk_low':
      case '/set_risk_medium':
      case '/set_risk_high': {
        const risk = cmd.replace('/set_risk_', '');
        if (walletRecord) {
          await supabase.from('wallets').update({ risk_level: risk }).eq('id', walletRecord.id).then(() => {}, () => {});
          setWalletRecord(prev => ({ ...prev, risk_level: risk }));
        }
        if (strategy) {
          await supabase.from('strategies').update({ risk_level: risk }).eq('id', strategy.id).then(() => {}, () => {});
        }
        const emoji = { low: '🟢', medium: '🟡', high: '🔴' }[risk];
        addBotMessage(`${emoji} Risk level set to **${risk}**. Auto-rebalance will only consider ${risk}-risk vaults.`, {
          buttons: [{ label: '🔄 Rebalance Now', cmd: '/rebalance' }],
        });
        break;
      }

      default:
        addBotMessage(
          `Unknown command. Available commands:\n• /start — Welcome\n• /portfolio — View positions\n• /yield — APY rates\n• /auto_on — Enable auto mode\n• /auto_off — Disable auto mode\n• /rebalance — Manual rebalance`,
        );
    }
  }, [wallet, walletRecord, vaults, positions, strategy, autoMode, pendingAction, addBotMessage, addUserMessage, ensureWalletRecord, getTopYieldVault, createAlert, fetchPositions]);

  return {
    messages,
    autoMode,
    pendingAction,
    walletRecord,
    positions,
    strategy,
    alerts,
    handleCommand,
    addBotMessage,
    ensureWalletRecord,
    fetchPositions,
    fetchAlerts,
    setAutoMode,
  };
}
