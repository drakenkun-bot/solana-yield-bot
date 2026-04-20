import { Bell, AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

const SEVERITY_CONFIG = {
  info: { icon: Info, color: 'text-tg-accent', bg: 'bg-tg-accent/10', border: 'border-tg-accent/20' },
  warning: { icon: AlertTriangle, color: 'text-tg-orange', bg: 'bg-tg-orange/10', border: 'border-tg-orange/20' },
  critical: { icon: XCircle, color: 'text-tg-red', bg: 'bg-tg-red/10', border: 'border-tg-red/20' },
  success: { icon: CheckCircle, color: 'text-tg-green', bg: 'bg-tg-green/10', border: 'border-tg-green/20' },
};

export default function AlertsList({ alerts }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-tg-muted">
        <Bell size={32} className="mb-3 opacity-30" />
        <div className="text-sm">No alerts yet</div>
        <div className="text-xs mt-1">Alerts will appear here when APY changes or rebalances occur</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map(alert => {
        const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
        const Icon = config.icon;
        const time = new Date(alert.created_at).toLocaleString([], {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });

        return (
          <div
            key={alert.id}
            className={`rounded-xl p-3 border ${config.border} ${config.bg} ${
              !alert.is_read ? 'ring-1 ring-tg-accent/20' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <Icon size={16} className={`${config.color} mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-white truncate">{alert.title}</div>
                  <span className="text-[10px] text-tg-muted flex-shrink-0">{time}</span>
                </div>
                <div className="text-xs text-tg-muted mt-0.5">{alert.message}</div>
                {alert.metadata?.tx && (
                  <div className="text-[10px] text-tg-accent mt-1 font-mono">
                    Tx: {alert.metadata.tx.slice(0, 12)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
