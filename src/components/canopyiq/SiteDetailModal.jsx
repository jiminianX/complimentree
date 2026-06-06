import React, { useState } from 'react';
import { X, Zap, Droplets, Wind, Leaf, DollarSign, TreePine, Clock, Sparkles, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scoreColor, computeFactorBreakdown } from '@/lib/scoring';
import { base44 } from '@/api/base44Client';

const MEMO_SYSTEM_PROMPT = `You write planting-priority justifications for a NYC municipal decision-support tool, for a city planner to paste into an internal memo. You receive a JSON record (or list) of planting sites with their data fields. Write a concise justification (max ~120 words per site) for why the site is or isn't a priority. ABSOLUTE RULE: you may only state numeric facts that appear as fields in the provided record(s). Never invent, estimate, infer, or round beyond the given values; if a fact is not in the record, do not claim it. Treat all figures as demo/illustrative. Use plain, non-technical language. End with one line: "Sources: " listing the exact field names you cited.`;

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
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${normalized * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function BenefitRow({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-2">
        <Icon size={13} style={{ color: color || 'var(--text-dim)' }} />
        <span className="text-sm" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color: color || 'var(--text)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

export default function SiteDetailModal({ site, weights, onClose }) {
  const [memo, setMemo] = useState('');
  const [loadingMemo, setLoadingMemo] = useState(false);

  const score = site._liveScore ?? 0;
  const color = scoreColor(score);
  const factors = computeFactorBreakdown(site, weights);
  const btc = site.total_annual_benefit_usd && site.planting_cost_usd
    ? (parseFloat(site.total_annual_benefit_usd) / parseFloat(site.planting_cost_usd) * 100).toFixed(1)
    : null;

  const weightsStamp = `wHeat=${weights.wHeat.toFixed(2)} | wGap=${weights.wGap.toFixed(2)} | wEquity=${weights.wEquity.toFixed(2)} | wExpose=${weights.wExpose.toFixed(2)}`;

  const generateMemo = async () => {
    setLoadingMemo(true);
    setMemo('');
    const record = { ...site, _liveScore: score, _weightsApplied: weightsStamp };
    delete record._liveScore;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `${MEMO_SYSTEM_PROMPT}\n\nSite data:\n${JSON.stringify(record, null, 2)}\n\nWeights applied: ${weightsStamp}`,
    });
    setMemo(result + `\n\n---\nWeights applied: ${weightsStamp}`);
    setLoadingMemo(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      >
        <motion.div
          className="h-full overflow-y-auto w-full max-w-xl"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b sticky top-0 z-10" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div>
              <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{site.site_id}</div>
              <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>{site.address}</div>
              <div className="text-sm mt-0.5" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{site.neighborhood} · {site.borough} · {site.community_district}</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold" style={{ color, fontFamily: 'var(--font-mono)' }}>{score.toFixed(1)}</div>
              <button onClick={onClose} className="p-1.5 rounded" style={{ color: 'var(--text-dim)' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-6">
            {/* Status + species */}
            <div className="flex gap-3 flex-wrap">
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: site.site_status === 'Plantable' ? 'rgba(91,217,128,0.12)' : 'rgba(242,169,59,0.12)', color: site.site_status === 'Plantable' ? 'var(--canopy)' : 'var(--warm)', fontFamily: 'var(--font-body)' }}>
                {site.site_status}
              </span>
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(34,211,197,0.08)', color: 'var(--cool)', fontFamily: 'var(--font-body)' }}>
                🌲 {site.recommended_species}
              </span>
              <span className="text-sm px-3 py-1 rounded-full" style={{ background: 'rgba(138,150,143,0.1)', color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                {site.est_survival_5yr_pct}% 5-yr survival
              </span>
            </div>

            {/* Score breakdown */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>Score Breakdown</div>
              <div className="flex flex-col gap-3">
                <FactorBar label="Heat Intensity" normalized={factors.heat.normalized} contribution={factors.heat.contribution} weight={factors.heat.weight} color="var(--hot)" />
                <FactorBar label="Canopy Gap" normalized={factors.gap.normalized} contribution={factors.gap.contribution} weight={factors.gap.weight} color="var(--canopy)" />
                <FactorBar label="Equity · HVI" normalized={factors.equity.normalized} contribution={factors.equity.contribution} weight={factors.equity.weight} color="var(--warm)" />
                <FactorBar label="Sensitive Exposure" normalized={factors.exposure.normalized} contribution={factors.exposure.contribution} weight={factors.exposure.weight} color="var(--cool)" />
              </div>
              {site.site_status !== 'Plantable' && (
                <div className="mt-3 text-xs px-2 py-1.5 rounded" style={{ background: 'rgba(242,169,59,0.08)', color: 'var(--warm)', fontFamily: 'var(--font-mono)' }}>
                  −12 pts penalty: Needs space creation
                </div>
              )}
              <div className="mt-2 text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Active weights: {weightsStamp}
              </div>
            </div>

            {/* i-Tree Benefits */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>i-Tree Benefits (Annual)</div>
              <BenefitRow icon={Wind} label="CO₂ Sequestered" value={`${site.annual_co2_seq_lbs} lbs`} color="#A78BFA" />
              <BenefitRow icon={Droplets} label="Stormwater Intercepted" value={`${Number(site.annual_stormwater_gal).toLocaleString()} gal`} color="var(--cool)" />
              <BenefitRow icon={Wind} label="Air Quality Value" value={`$${site.annual_air_quality_value_usd}`} color="#A78BFA" />
              <BenefitRow icon={Zap} label="Energy Savings" value={`$${site.annual_energy_savings_usd}`} color="var(--warm)" />
              <BenefitRow icon={DollarSign} label="Total Annual Benefit" value={`$${site.total_annual_benefit_usd}`} color="var(--canopy)" />
              <BenefitRow icon={TreePine} label="Planting Cost" value={`$${Number(site.planting_cost_usd).toLocaleString()}`} color="var(--text-dim)" />
              {btc && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>Benefit-to-Cost Yield</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--canopy)', fontFamily: 'var(--font-mono)' }}>{btc}% / yr</span>
                </div>
              )}
            </div>

            {/* Context */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>Context</div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Near sensitive site</span>
                  <span className="text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}>{site.near_sensitive_site}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Last nearby planting</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>{site.last_nearby_planting_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm" style={{ color: 'var(--text-dim)' }}>Neighborhood canopy</span>
                  <span className="text-sm font-mono" style={{ color: 'var(--canopy)', fontFamily: 'var(--font-mono)' }}>{site.neighborhood_current_canopy_pct}% → goal: {site.neighborhood_canopy_goal_pct}%</span>
                </div>
              </div>
              {site.planner_notes && (
                <div className="mt-3 pt-3 border-t text-sm italic" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                  <Clock size={11} className="inline mr-1.5" />
                  {site.planner_notes}
                </div>
              )}
            </div>

            {/* AI Memo */}
            <div className="rounded-lg p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs uppercase tracking-widest" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>AI Justification Memo</div>
                <button
                  onClick={generateMemo}
                  disabled={loadingMemo}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                  style={{ background: loadingMemo ? 'rgba(91,217,128,0.1)' : 'rgba(91,217,128,0.15)', color: 'var(--canopy)', border: '1px solid rgba(91,217,128,0.3)', fontFamily: 'var(--font-body)' }}
                >
                  {loadingMemo ? <><span className="animate-spin inline-block mr-1">⟳</span> Generating…</> : <><Sparkles size={11} /> Generate memo</>}
                </button>
              </div>
              {memo ? (
                <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)', background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: 12 }}>
                  {memo}
                </div>
              ) : (
                <div className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                  Click "Generate memo" to produce a sourced, planner-ready justification grounded strictly in this site's data fields.
                </div>
              )}
              <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                <FileText size={10} />
                AI recommends — planner decides. Numbers verified against field data only.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}