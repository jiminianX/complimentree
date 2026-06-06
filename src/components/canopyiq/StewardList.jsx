import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreColor } from '@/lib/scoring';
import { AlertTriangle } from 'lucide-react';

function ScoreBar({ score }) {
  const color = scoreColor(score);
  return (
    <div className="h-1.5 rounded-full w-full mt-1" style={{ background: 'var(--border)' }}>
      <motion.div className="h-full rounded-full" style={{ background: color }}
        initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
    </div>
  );
}

function Chip({ label, color, bg }) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
      style={{ color, background: bg, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
      {label}
    </span>
  );
}

const conditionColor = { Good: 'var(--canopy)', Fair: 'var(--warm)', Poor: '#F97316', Critical: 'var(--hot)' };

export default function StewardList({ trees, onSelectTree, selectedTree }) {
  const prevOrderRef = useRef({});
  const [highlighted, setHighlighted] = useState(new Set());

  const safetyHazards = trees.filter(t => t.safety_risk === 'High');
  const rest = trees.filter(t => t.safety_risk !== 'High');

  useEffect(() => {
    const prevOrder = prevOrderRef.current;
    const newHighlighted = new Set();
    trees.forEach((t, idx) => {
      const prev = prevOrder[t.tree_id];
      if (prev !== undefined && Math.abs(prev - idx) >= 2) newHighlighted.add(t.tree_id);
    });
    setHighlighted(newHighlighted);
    prevOrderRef.current = Object.fromEntries(trees.map((t, i) => [t.tree_id, i]));
    if (newHighlighted.size > 0) {
      const timer = setTimeout(() => setHighlighted(new Set()), 1200);
      return () => clearTimeout(timer);
    }
  }, [trees]);

  const renderRow = (tree, idx, pinned = false) => {
    const score = tree._liveScore ?? 0;
    const color = scoreColor(score);
    const isSelected = selectedTree?.tree_id === tree.tree_id;
    const isHighlighted = highlighted.has(tree.tree_id);
    const yearsSincePruned = tree.last_pruned_year ? (2026 - tree.last_pruned_year) : null;

    return (
      <motion.div
        key={tree.tree_id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{
          opacity: 1, x: 0,
          backgroundColor: isHighlighted ? 'rgba(242,169,59,0.1)' : isSelected ? 'rgba(34,211,197,0.06)' : pinned ? 'rgba(255,92,60,0.04)' : 'transparent',
        }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ layout: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.25 } }}
        className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b"
        style={{ borderColor: 'var(--border)', borderLeft: isSelected ? '3px solid var(--cool)' : pinned ? '3px solid var(--hot)' : '3px solid transparent' }}
        onClick={() => onSelectTree(tree)}
      >
        <div className="text-xs font-bold mt-0.5 w-6 flex-shrink-0" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          {pinned ? <AlertTriangle size={12} style={{ color: 'var(--hot)' }} /> : idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{tree.address}</div>
              <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{tree.neighborhood} · {tree.species}</div>
            </div>
            <div className="text-base font-bold flex-shrink-0" style={{ color, fontFamily: 'var(--font-mono)' }}>{score.toFixed(1)}</div>
          </div>
          <ScoreBar score={score} />
          <div className="flex flex-wrap gap-1 mt-1.5">
            <Chip label={tree.condition} color={conditionColor[tree.condition] || 'var(--text-dim)'} bg={`${conditionColor[tree.condition]}18` || 'rgba(138,150,143,0.1)'} />
            <Chip label={`${tree.mortality_risk_5yr_pct}% mort`} color="var(--hot)" bg="rgba(255,92,60,0.1)" />
            <Chip label={`DBH ${tree.dbh_in}"`} color="var(--cool)" bg="rgba(34,211,197,0.1)" />
            {tree.safety_risk === 'High' && <Chip label="⚠ Urgent safety" color="var(--hot)" bg="rgba(255,92,60,0.15)" />}
            {yearsSincePruned !== null && <Chip label={`${yearsSincePruned}yr since pruned`} color={yearsSincePruned >= 5 ? 'var(--warm)' : 'var(--text-dim)'} bg="rgba(138,150,143,0.1)" />}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="text-xs uppercase tracking-widest px-4 py-2 flex-shrink-0" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)', borderBottom: '1px solid var(--border)' }}>
        Maintenance Ranking · {trees.length} trees
      </div>
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {safetyHazards.length > 0 && (
          <div>
            <div className="px-4 py-1.5 text-xs flex items-center gap-1.5" style={{ background: 'rgba(255,92,60,0.08)', borderBottom: '1px solid rgba(255,92,60,0.2)', color: 'var(--hot)', fontFamily: 'var(--font-body)' }}>
              <AlertTriangle size={10} /> {safetyHazards.length} urgent safety hazard{safetyHazards.length > 1 ? 's' : ''} — pinned
            </div>
            <AnimatePresence mode="popLayout">
              {safetyHazards.map((t, i) => renderRow(t, i, true))}
            </AnimatePresence>
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {rest.map((t, i) => renderRow(t, safetyHazards.length + i, false))}
        </AnimatePresence>
      </div>
    </div>
  );
}