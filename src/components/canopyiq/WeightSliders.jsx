import React from 'react';
import { Flame, Leaf, Users, AlertTriangle } from 'lucide-react';

const sliders = [
  { key: 'wHeat', label: 'Heat Intensity', icon: Flame, color: 'var(--hot)', desc: 'Surface temp anomaly (°F above median)' },
  { key: 'wGap', label: 'Canopy Gap', icon: Leaf, color: 'var(--canopy)', desc: 'Distance from 30% goal' },
  { key: 'wEquity', label: 'Equity · HVI', icon: Users, color: 'var(--warm)', desc: 'Heat vulnerability of residents', isEquity: true },
  { key: 'wExpose', label: 'Sensitive Exposure', icon: AlertTriangle, color: 'var(--cool)', desc: 'Proximity to schools, senior centers' },
];

export default function WeightSliders({ weights, onChange }) {
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>Priority Weights</div>

      {sliders.map(({ key, label, icon: Icon, color, desc, isEquity }) => (
        <div key={key} className={`flex flex-col gap-1.5 ${isEquity ? 'rounded-lg p-3 border mb-1' : 'mb-1'}`}
          style={isEquity ? { background: 'rgba(242,169,59,0.05)', borderColor: 'rgba(242,169,59,0.2)' } : {}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={isEquity ? 14 : 12} style={{ color }} />
              <span className={`${isEquity ? 'text-sm font-semibold' : 'text-xs'}`} style={{ color: isEquity ? color : 'var(--text)', fontFamily: 'var(--font-body)' }}>
                {label}
                {isEquity && <span className="ml-2 text-xs opacity-70">— centerpiece</span>}
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color, fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'right' }}>
              {weights[key].toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.01"
            value={weights[key]}
            className={isEquity ? 'equity-slider' : ''}
            style={{ '--track-color': color }}
            onChange={e => onChange({ ...weights, [key]: parseFloat(e.target.value) })}
          />
          <div className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{desc}</div>
        </div>
      ))}

      <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
        Σ weights: {(weights.wHeat + weights.wGap + weights.wEquity + weights.wExpose).toFixed(2)}
        <span className="ml-2 opacity-60">· active on all outputs</span>
      </div>
    </div>
  );
}