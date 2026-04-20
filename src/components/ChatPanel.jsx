import { useState, useRef, useEffect } from 'react';
import { Send, Zap, Menu } from 'lucide-react';
import BotMessage from './BotMessage';

const QUICK_COMMANDS = [
  { label: '/start', icon: '⚡' },
  { label: '/portfolio', icon: '📊' },
  { label: '/yield', icon: '💰' },
  { label: '/rebalance', icon: '🔄' },
  { label: '/auto_on', icon: '🤖' },
  { label: '/auto_off', icon: '🛑' },
];

export default function ChatPanel({ messages, onCommand, autoMode }) {
  const [input, setInput] = useState('');
  const [showQuick, setShowQuick] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    onCommand(cmd.startsWith('/') ? cmd : `/${cmd}`);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-tg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-tg-panel border-b border-tg-border">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tg-accent to-tg-green flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">Solana Yield Bot</div>
          <div className="flex items-center gap-1.5 text-xs text-tg-muted">
            <span className={`w-2 h-2 rounded-full ${autoMode ? 'bg-tg-green animate-pulse-dot' : 'bg-tg-muted'}`} />
            {autoMode ? 'Auto-rebalancing active' : 'Manual mode'}
          </div>
        </div>
        <button
          onClick={() => setShowQuick(v => !v)}
          className="p-2 rounded-lg hover:bg-tg-surface text-tg-muted"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Quick commands bar */}
      {showQuick && (
        <div className="flex gap-1.5 px-3 py-2 bg-tg-panel/80 border-b border-tg-border overflow-x-auto">
          {QUICK_COMMANDS.map(c => (
            <button
              key={c.label}
              onClick={() => { onCommand(c.label); setShowQuick(false); }}
              className="flex items-center gap-1 px-2.5 py-1 bg-tg-surface rounded-full text-xs text-tg-muted hover:text-tg-accent whitespace-nowrap"
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-tg-accent/30 to-tg-green/30 flex items-center justify-center mb-4">
              <Zap size={28} className="text-tg-accent" />
            </div>
            <div className="text-white font-semibold mb-1">Solana Yield Bot</div>
            <div className="text-tg-muted text-sm mb-6">
              Automated DeFi yield optimization on Kamino Finance
            </div>
            <button
              onClick={() => onCommand('/start')}
              className="px-6 py-2.5 bg-tg-accent rounded-xl text-white text-sm font-medium hover:bg-tg-accent/90 transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {messages.map(msg => (
          <BotMessage key={msg.id} message={msg} onCommand={onCommand} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2 bg-tg-panel border-t border-tg-border">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a command..."
          className="flex-1 bg-tg-input text-sm text-white placeholder-tg-muted rounded-xl px-4 py-2.5 outline-none border border-tg-border focus:border-tg-accent transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2.5 rounded-xl bg-tg-accent text-white disabled:opacity-40 hover:bg-tg-accent/90 transition-colors"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
