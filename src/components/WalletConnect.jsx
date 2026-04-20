import { useState } from 'react';
import { Wallet, ExternalLink, Copy, Check, Unlink } from 'lucide-react';
import { truncateAddress } from '../config';

export default function WalletConnect({ wallet, balance, onConnect, onDisconnect, deepLink }) {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleConnect = () => {
    const addr = input.trim();
    if (addr.length >= 32 && addr.length <= 44) {
      onConnect(addr);
      setShowInput(false);
      setInput('');
    }
  };

  const handleCopy = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (wallet) {
    return (
      <div className="bg-tg-surface rounded-xl p-4 border border-tg-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-tg-green/20 flex items-center justify-center">
              <Wallet size={14} className="text-tg-green" />
            </div>
            <div>
              <div className="text-sm text-white font-medium">Connected</div>
              <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-tg-muted hover:text-tg-accent">
                <span className="font-mono">{truncateAddress(wallet.address)}</span>
                {copied ? <Check size={10} className="text-tg-green" /> : <Copy size={10} />}
              </button>
            </div>
          </div>
          <button
            onClick={onDisconnect}
            className="p-1.5 rounded-lg hover:bg-tg-bg text-tg-muted hover:text-tg-red transition-colors"
            title="Disconnect"
          >
            <Unlink size={14} />
          </button>
        </div>
        {balance !== null && (
          <div className="text-xs text-tg-muted">
            Balance: <span className="text-white font-medium">{balance.toFixed(4)} SOL</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-tg-surface rounded-xl p-4 border border-tg-border">
      <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Wallet size={16} className="text-tg-accent" />
        Connect Wallet
      </div>

      <a
        href={deepLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity mb-3"
      >
        <img src="https://solflare.com/favicon.ico" alt="" className="w-4 h-4" />
        Open in Solflare
        <ExternalLink size={12} />
      </a>

      <div className="text-center text-[10px] text-tg-muted mb-2">or enter address manually</div>

      {showInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
            placeholder="Solana address..."
            className="flex-1 bg-tg-bg border border-tg-border rounded-lg px-3 py-2 text-xs text-white placeholder-tg-muted outline-none focus:border-tg-accent"
          />
          <button
            onClick={handleConnect}
            disabled={input.trim().length < 32}
            className="px-3 py-2 bg-tg-accent rounded-lg text-xs text-white disabled:opacity-40"
          >
            Go
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="w-full py-2 border border-tg-border rounded-xl text-xs text-tg-muted hover:text-tg-accent hover:border-tg-accent/30 transition-colors"
        >
          Enter Address
        </button>
      )}
    </div>
  );
}
