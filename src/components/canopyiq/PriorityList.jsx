import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreColor } from '@/lib/scoring';

function ScoreBar({ score }) {
  const color = scoreColor(score);
  return (
    <div className="h-1.5 rounded-full w-full mt-1" style={{ background: 'var(--border)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

function Chip({ label, color, bg }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color, background: bg, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      {label}
    </span>
  );
}

export default function PriorityList({ sites, onSelectSite, selectedSite }) {
  const prevOrderRef = useRef({});
  const [highlighted, setHighlighted] = useState(new Set());

  useEffect(() => {
    const prevOrder = prevOrderRef.current;
    const newHighlighted = new Set();
    sites.forEach((site, idx) => {
      const prev = prevOrder[site.site_id];
      if (prev !== undefined && Math.abs(prev - idx) >= 2) {
        newHighlighted.add(site.site_id);
      }
    });
    setHighlighted(newHighlighted);
    prevOrderRef.current = Object.fromEntries(sites.map((s, i) => [s.site_id, i]));

    if (newHighlighted.size > 0) {
      const timer = setTimeout(() => setHighlighted(new Set()), 1200);
      return () => clearTimeout(timer);
    }
  }, [sites]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="text-xs uppercase tracking-widest px-4 py-2 flex-shrink-0" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)' }}>
        Priority Ranking · {sites.length} sites
      </div>
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <AnimatePresence mode="popLayout">
          {sites.map((site, idx) => {
            const score = site._liveScore ?? 0;
            const color = scoreColor(score);
            const isSelected = selectedSite?.site_id === site.site_id;
            const isHighlighted = highlighted.has(site.site_id);

            return (
              <motion.div
                key={site.site_id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  backgroundColor: isHighlighted ? 'rgba(242,169,59,0.1)' : isSelected ? 'rgba(34,211,197,0.06)' : 'transparent',
                  transition: { backgroundColor: { duration: 0.4 } }
                }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.25 }, delay: idx * 0.015 }}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b"
                style={{ borderColor: 'var(--border)', borderLeft: isSelected ? `3px solid var(--cool)` : '3px solid transparent' }}
                onClick={() => onSelectSite(site)}
              >
                <div className="text-xs font-bold mt-0.5 w-6 flex-shrink-0" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{site.address}</div>
                      <div className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{site.neighborhood}</div>
                    </div>
                    <div className="text-base font-bold flex-shrink-0" style={{ color, fontFamily: 'var(--font-mono)' }}>
                      {score.toFixed(1)}
                    </div>
                  </div>
                  <ScoreBar score={score} />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <Chip label={`HVI ${site.heat_vulnerability_index}`} color="var(--warm)" bg="rgba(242,169,59,0.1)" />
                    <Chip label={`${site.area_canopy_pct}% canopy`} color="var(--canopy)" bg="rgba(91,217,128,0.1)" />
                    <Chip label={`+${site.surface_temp_anomaly_f}°F`} color="var(--hot)" bg="rgba(255,92,60,0.1)" />
                    <Chip
                      label={site.site_status === 'Plantable' ? '🌱 Plantable' : '🔧 Space needed'}
                      color={site.site_status === 'Plantable' ? 'var(--canopy)' : 'var(--text-dim)'}
                      bg={site.site_status === 'Plantable' ? 'rgba(91,217,128,0.1)' : 'rgba(138,150,143,0.1)'}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}