import React from 'react';
import { Activity, Layers, AlertTriangle, Users } from 'lucide-react';

const sliders = [
  { key: 'wMortality', label: 'Mortality Risk', icon: Activity, color: 'var(--hot)', desc: '5-yr predicted death probability' },
  { key: 'wValue', label: 'Canopy Value at Stake', icon: Layers, color: '#A78BFA', desc: 'Annual benefit lost if tree dies' },
  { key: 'wSafety', label: 'Public Safety', icon: AlertTriangle, color: 'var(--warm)', desc: 'Hazard to people (deadwood, structural)' },
  { key: 'wEquity', label: 'Equity Overlay · HVI', icon: Users, color: 'var(--canopy)', desc: 'Multiplier: loss in heat-vulnerable block = bigger loss', isEquity: true },
];

export default function StewardWeightSliders({ weights, onChange }) {
  return (
    <div className="rounded-lg border p-4 flex flex-col gap-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>Maintenance Weights</div>
      {sliders.map(({ key, label, icon: Icon, color, desc, isEquity }) => (
        <div key={key} className={`flex flex-col gap-1.5 ${isEquity ? 'rounded-lg p-3 border mb-1' : 'mb-1'}`}
          style={isEquity ? { background: 'rgba(91,217,128,0.05)', borderColor: 'rgba(91,217,128,0.2)' } : {}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon size={isEquity ? 14 : 12} style={{ color }} />
              <span className={`${isEquity ? 'text-sm font-semibold' : 'text-xs'}`} style={{ color: isEquity ? color : 'var(--text)', fontFamily: 'var(--font-body)' }}>
                {label}
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color, fontFamily: 'var(--font-mono)', minWidth: 36, textAlign: 'right' }}>
              {weights[key].toFixed(2)}
            </span>
          </div>
          <input
            type="range" min="0" max="1" step="0.01"
            value={weights[key]}
            className={isEquity ? 'equity-slider' : ''}
            onChange={e => onChange({ ...weights, [key]: parseFloat(e.target.value) })}
          />
          <div className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{desc}</div>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
        wMort={weights.wMortality.toFixed(2)} | wVal={weights.wValue.toFixed(2)} | wSafe={weights.wSafety.toFixed(2)} | wEq={weights.wEquity.toFixed(2)}
      </div>
    </div>
  );
}