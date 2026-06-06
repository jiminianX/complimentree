import React, { useEffect, useState, useRef } from 'react';
import { TreePine, AlertTriangle, DollarSign, Layers, Activity } from 'lucide-react';

function CountUp({ target, duration = 1200, prefix = '', suffix = '', decimals = 0 }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef();
  const startRef = useRef();
  useEffect(() => {
    if (!target && target !== 0) return;
    startRef.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
  return <span>{prefix}{display}{suffix}</span>;
}

export default function StewardMetricsStrip({ trees }) {
  const total = trees.length;
  const poorCritical = trees.filter(t => t.condition === 'Poor' || t.condition === 'Critical').length;
  const totalBenefitAtRisk = trees.reduce((a, t) => a + (parseFloat(t.annual_benefit_at_risk_usd) || 0), 0);
  const totalCanopyAtRisk = trees.reduce((a, t) => a + (parseFloat(t.canopy_contribution_sqft) || 0), 0);
  const avgMortality = trees.length > 0
    ? trees.reduce((a, t) => a + (parseFloat(t.mortality_risk_5yr_pct) || 0), 0) / trees.length
    : 0;

  const metrics = [
    { icon: TreePine, label: 'Trees Tracked', value: total, color: 'var(--cool)', bg: 'rgba(34,211,197,0.08)', suffix: '' },
    { icon: AlertTriangle, label: 'Poor / Critical', value: poorCritical, color: 'var(--hot)', bg: 'rgba(255,92,60,0.08)', suffix: '' },
    { icon: DollarSign, label: 'Annual Benefit at Risk', value: totalBenefitAtRisk, color: 'var(--warm)', bg: 'rgba(242,169,59,0.08)', prefix: '$', suffix: '' },
    { icon: Layers, label: 'Canopy at Risk (sqft)', value: totalCanopyAtRisk, color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', suffix: '' },
    { icon: Activity, label: 'Avg 5-yr Mortality', value: avgMortality, color: 'var(--hot)', bg: 'rgba(255,92,60,0.08)', suffix: '%', decimals: 1 },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 px-6 py-4">
      {metrics.map((m, i) => (
        <div key={i} className="rounded-lg p-4 flex flex-col gap-2 border" style={{ background: m.bg, borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <m.icon size={14} style={{ color: m.color }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{m.label}</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-mono)' }}>
            <CountUp target={m.value} prefix={m.prefix || ''} suffix={m.suffix} decimals={m.decimals || 0} />
          </div>
        </div>
      ))}
    </div>
  );
}