import React, { useState } from 'react';
import { X, Activity, Layers, AlertTriangle, Scissors, Eye, FileText, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreColor } from '@/lib/scoring';
import { computeMaintenanceBreakdown } from '@/lib/stewardScoring';
import { base44 } from '@/api/base44Client';

const WORK_ORDER_PROMPT = `You write maintenance-priority justifications for a NYC municipal urban forestry decision-support tool, for a city planner or forester to paste into a work order or internal memo. You receive a JSON record of an existing tree with its data fields. Write a concise maintenance justification (max ~120 words). ABSOLUTE RULE: you may only state numeric facts that appear as fields in the provided record. Never invent, estimate, infer, or round beyond the given values; if a fact is not in the record, do not claim it. You must name the recommended_action field if present. Never invent inspection findings not present in risk_factors. Treat all figures as demo/illustrative. Use plain, non-technical language. End with one line: "Sources: " listing the exact field names you cited.`;

function FactorBar({ label, normalized, contribution, weight, color }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{label}</span>
        <div className="flex gap-3">
          <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>w={weight.toFixed(2)}</span>
          <span className="text-xs font-bold" style={{ color, fontFamily: 'var(--font-mono)' }}>+{contribution.toFixed(1)} pts</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${normalized * 100}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

const conditionColor = { Good: 'var(--canopy)', Fair: 'var(--warm)', Poor: '#F97316', Critical: 'var(--hot)' };

export default function TreeDetailModal({ tree, weights, valueNormFn, onClose }) {
  const [memo, setMemo] = useState('');
  const [loadingMemo, setLoadingMemo] = useState(false);

  const score = tree._liveScore ?? 0;
  const color = scoreColor(score);
  const factors = computeMaintenanceBreakdown(tree, weights, valueNormFn);
  const weightsStamp = `wMortality=${weights.wMortality.toFixed(2)} | wValue=${weights.wValue.toFixed(2)} | wSafety=${weights.wSafety.toFixed(2)} | wEquity=${weights.wEquity.toFixed(2)}`;
  const yearsSincePruned = tree.last_pruned_year ? (2026 - tree.last_pruned_year) : null;

  const generateMemo = async () => {
    setLoadingMemo(true);
    setMemo('');
    const record = { ...tree };
    delete record._liveScore;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${WORK_ORDER_PROMPT}\n\nTree data:\n${JSON.stringify(record, null, 2)}\n\nWeights applied: ${weightsStamp}`,
    });
    setMemo(result + `\n\n---\nWeights applied: ${weightsStamp}`);
    setLoadingMemo(false);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex items-center justify-end"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
        <motion.div className="h-full overflow-y-auto w-full max-w-xl"
          initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b sticky top-0 z-10" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{tree.tree_id}</div>
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>{tree.address}</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{tree.neighborhood} · {tree.borough}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold" style={{ color, fontFamily: 'var(--font-mono)' }}>{score.toFixed(1)}</div>
              <button onClick={onClose} className="p-1.5 rounded" style={{ color: 'var(--text-dim)' }}><X size={18} /></button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Safety alert */}
            {tree.safety_risk === 'High' && (
              <div className="flex items-center gap-3 rounded-lg px-4 py-3 border" style={{ background: 'rgba(255,92,60,0.1)', borderColor: 'rgba(255,92,60,0.3)' }}>
                <AlertTriangle size={16} style={{ color: 'var(--hot)', flexShrink: 0 }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--hot)', fontFamily: 'var(--font-body)' }}>Urgent Safety Hazard — immediate action required</span>
              </div>
            )}

            {/* Status chips */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: `${conditionColor[tree.condition]}18`, color: conditionColor[tree.condition], fontFamily: 'var(--font-body)' }}>{tree.condition}</span>
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(34,211,197,0.08)', color: 'var(--cool)' }}>🌲 {tree.species}</span>
              <span className="text-sm px-3 py-1 rounded-full font-mono" style={{ background: 'rgba(255,92,60,0.08)', color: 'var(--hot)', fontFamily: 'var(--font-mono)' }}>{tree.mortality_risk_5yr_pct}% mortality risk</span>
            </div>

            {/* Score breakdown */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>Score Breakdown</div>
              <div className="flex flex-col gap-3">
                <FactorBar label="Mortality Risk" normalized={factors.mortality.normalized} contribution={factors.mortality.contribution} weight={factors.mortality.weight} color="var(--hot)" />
                <FactorBar label="Canopy Value at Stake" normalized={factors.value.normalized} contribution={factors.value.contribution} weight={factors.value.weight} color="#A78BFA" />
                <FactorBar label="Public Safety" normalized={factors.safety.normalized} contribution={factors.safety.contribution} weight={factors.safety.weight} color="var(--warm)" />
                {weights.wEquity > 0 && <FactorBar label="Equity Overlay" normalized={factors.equity.normalized} contribution={factors.equity.contribution} weight={factors.equity.weight} color="var(--canopy)" />}
              </div>
              <div className="mt-2 text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Active weights: {weightsStamp}</div>
            </div>

            {/* Tree details */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Tree Profile</div>
              {[
                ['DBH', `${tree.dbh_in}"`],
                ['Canopy contribution', `${Number(tree.canopy_contribution_sqft).toLocaleString()} sqft`],
                ['Annual benefit at risk', `$${tree.annual_benefit_at_risk_usd}`],
                ['HVI', tree.heat_vulnerability_index],
                ['Near sensitive site', tree.near_sensitive_site],
                ['Risk factors', tree.risk_factors],
                ['Recommended action', tree.recommended_action],
              ].map(([label, val]) => val && (
                <div key={label} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>{label}</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)', fontFamily: label === 'DBH' || label === 'Annual benefit at risk' || label === 'DBH' ? 'var(--font-mono)' : 'var(--font-body)', maxWidth: '55%', textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Maintenance history */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>Maintenance History</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5"><Scissors size={11} style={{ color: 'var(--text-dim)' }} /><span className="text-xs" style={{ color: 'var(--text-dim)' }}>Last pruned</span></div>
                  <div className="text-lg font-bold" style={{ color: yearsSincePruned >= 5 ? 'var(--warm)' : 'var(--canopy)', fontFamily: 'var(--font-mono)' }}>
                    {tree.last_pruned_year || '—'}
                    {yearsSincePruned !== null && <span className="text-xs ml-1 font-normal" style={{ color: 'var(--text-dim)' }}>({yearsSincePruned}yr ago)</span>}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5"><Eye size={11} style={{ color: 'var(--text-dim)' }} /><span className="text-xs" style={{ color: 'var(--text-dim)' }}>Last inspected</span></div>
                  <div className="text-lg font-bold" style={{ color: 'var(--cool)', fontFamily: 'var(--font-mono)' }}>{tree.last_inspection_year || '—'}</div>
                </div>
              </div>
            </div>

            {/* Work order memo */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>AI Work-Order Memo</div>
                <button onClick={generateMemo} disabled={loadingMemo}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: loadingMemo ? 'rgba(91,217,128,0.1)' : 'rgba(91,217,128,0.15)', color: 'var(--canopy)', border: '1px solid rgba(91,217,128,0.3)', fontFamily: 'var(--font-body)' }}>
                  {loadingMemo ? <><span className="animate-spin inline-block mr-1">⟳</span> Generating…</> : <><Sparkles size={11} /> Generate work order</>}
                </button>
              </div>
              {memo ? (
                <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: 12 }}>{memo}</div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Click "Generate work order" for a sourced, forester-ready maintenance justification grounded strictly in this tree's data fields.</div>
              )}
              <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-dim)' }}>
                <FileText size={10} /> AI recommends — planner decides.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}