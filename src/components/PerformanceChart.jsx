import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = {
  low: '#4FAE4E',
  medium: '#FF9800',
  high: '#E53935',
};

export default function PerformanceChart({ vaults }) {
  const data = useMemo(() => {
    return vaults
      .sort((a, b) => Number(b.apy) - Number(a.apy))
      .slice(0, 8)
      .map(v => ({
        name: v.token_symbol,
        apy: Number(v.apy),
        risk: v.risk_score,
        fullName: v.name,
      }));
  }, [vaults]);

  if (data.length === 0) return null;

  return (
    <div className="bg-tg-surface rounded-xl p-4 border border-tg-border">
      <div className="text-xs font-semibold text-white mb-3">Vault APY Comparison</div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fill: '#8B9CAF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8B9CAF', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1E2C3A',
              border: '1px solid #2B3945',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value, name, props) => [
              `${value.toFixed(2)}%`,
              props.payload.fullName,
            ]}
          />
          <Bar dataKey="apy" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[entry.risk] || COLORS.medium} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-2">
        {Object.entries(COLORS).map(([risk, color]) => (
          <div key={risk} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-tg-muted capitalize">{risk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
