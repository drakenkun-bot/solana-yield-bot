import { Bot, User } from 'lucide-react';

function formatMarkdown(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let processed = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-tg-bg px-1.5 py-0.5 rounded text-xs font-mono text-tg-accent">$1</code>');

    if (line.startsWith('• ')) {
      processed = `<span class="text-tg-accent mr-1">•</span>${processed.slice(2)}`;
      return `<div key="${i}" class="ml-2 mb-0.5">${processed}</div>`;
    }
    return `<div key="${i}" class="${line === '' ? 'h-2' : ''}">${processed}</div>`;
  }).join('');
}

export default function BotMessage({ message, onCommand }) {
  const isBot = message.from === 'bot';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-2 animate-slide-up ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isBot ? 'bg-tg-accent/20' : 'bg-tg-green/20'
      }`}>
        {isBot ? <Bot size={16} className="text-tg-accent" /> : <User size={16} className="text-tg-green" />}
      </div>

      <div className={`max-w-[85%] ${isBot ? '' : 'text-right'}`}>
        <div className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isBot
            ? 'bg-tg-surface text-tg-muted rounded-tl-sm'
            : 'bg-tg-accent text-white rounded-tr-sm'
        }`}>
          <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.text) }} />
        </div>

        {message.buttons && message.buttons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.buttons.map((btn, i) => (
              <button
                key={i}
                onClick={() => onCommand(btn.cmd)}
                className="px-3 py-1.5 bg-tg-panel border border-tg-border rounded-lg text-xs
                           text-tg-accent hover:bg-tg-surface transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        )}

        <div className={`text-[10px] text-tg-muted/50 mt-1 ${isBot ? '' : 'text-right'}`}>
          {time}
        </div>
      </div>
    </div>
  );
}
