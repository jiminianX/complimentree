import React, { useEffect, useState, useRef } from 'react';
import { TreePine, Leaf, DollarSign, Wind, MapPin } from 'lucide-react';

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

export default function MetricsStrip({ sites }) {
  const totalSites = sites.length;
  const plantableNow = sites.filter(s => s.site_status === 'Plantable').length;
  const totalBenefit = sites.reduce((a, s) => a + (parseFloat(s.total_annual_benefit_usd) || 0), 0);
  const totalCO2 = sites.reduce((a, s) => a + (parseFloat(s.annual_co2_seq_lbs) || 0), 0);

  const neighborhoodsBelowGoal = new Set(
    sites
      .filter(s => (parseFloat(s.neighborhood_current_canopy_pct) || 0) < (parseFloat(s.neighborhood_canopy_goal_pct) || 30))
      .map(s => s.neighborhood)
  ).size;

  const metrics = [
    { icon: MapPin, label: 'Total Sites', value: totalSites, color: 'var(--cool)', bg: 'rgba(34,211,197,0.08)', suffix: '' },
    { icon: TreePine, label: 'Plantable Now', value: plantableNow, color: 'var(--canopy)', bg: 'rgba(91,217,128,0.08)', suffix: '' },
    { icon: DollarSign, label: 'Annual Benefit', value: totalBenefit, color: 'var(--warm)', bg: 'rgba(242,169,59,0.08)', prefix: '$', suffix: '' },
    { icon: Wind, label: 'CO₂ Captured / yr', value: totalCO2, color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', suffix: ' lbs' },
    { icon: Leaf, label: 'Nbhds Below 30% Goal', value: neighborhoodsBelowGoal, color: 'var(--hot)', bg: 'rgba(255,92,60,0.08)', suffix: '' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 px-6 py-4">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="rounded-lg p-4 flex flex-col gap-2 border"
          style={{ background: m.bg, borderColor: 'var(--border)', animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center gap-2">
            <m.icon size={14} style={{ color: m.color }} />
            <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{m.label}</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: m.color, fontFamily: 'var(--font-mono)' }}>
            <CountUp target={m.value} prefix={m.prefix || ''} suffix={m.suffix} />
          </div>
        </div>
      ))}
    </div>
  );
}