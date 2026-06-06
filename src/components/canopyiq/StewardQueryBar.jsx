import React, { useState } from 'react';
import { Search, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EXAMPLES = [
  "Show me high-mortality-risk trees near schools we haven't pruned in five years",
  "Find Critical condition trees in Brownsville with High safety risk",
  "Prioritize large DBH trees in Mott Haven that are losing canopy value",
];

export default function StewardQueryBar({ allTrees, weights, onQueryResult, onClear }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rationale, setRationale] = useState('');
  const [hasResult, setHasResult] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setRationale('');

    const summary = allTrees.map(t => ({
      tree_id: t.tree_id, address: t.address, neighborhood: t.neighborhood, borough: t.borough,
      species: t.species, condition: t.condition, mortality_risk_5yr_pct: t.mortality_risk_5yr_pct,
      safety_risk: t.safety_risk, near_sensitive_site: t.near_sensitive_site,
      last_pruned_year: t.last_pruned_year, dbh_in: t.dbh_in, _liveScore: t._liveScore,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a maintenance-prioritization assistant for NYC urban forestry. 
Current weights: wMortality=${weights.wMortality}, wValue=${weights.wValue}, wSafety=${weights.wSafety}, wEquity=${weights.wEquity}
Planner's goal: "${query}"
Trees (summarized): ${JSON.stringify(summary, null, 2)}
Return JSON: { "matching_tree_ids": string[], "weight_adjustments": { wMortality|wValue|wSafety|wEquity: number|null }, "rationale": string }`,
      response_json_schema: {
        type: 'object',
        properties: {
          matching_tree_ids: { type: 'array', items: { type: 'string' } },
          weight_adjustments: { type: 'object' },
          rationale: { type: 'string' },
        },
        required: ['matching_tree_ids', 'weight_adjustments', 'rationale']
      }
    });

    const { matching_tree_ids, weight_adjustments, rationale: rat } = result;
    const newWeights = { ...weights };
    if (weight_adjustments) {
      Object.keys(weight_adjustments).forEach(k => {
        if (weight_adjustments[k] !== null && weight_adjustments[k] !== undefined) newWeights[k] = weight_adjustments[k];
      });
    }
    let filtered = allTrees;
    if (matching_tree_ids?.length > 0) {
      const idSet = new Set(matching_tree_ids);
      filtered = allTrees.filter(t => idSet.has(t.tree_id));
      filtered.sort((a, b) => matching_tree_ids.indexOf(a.tree_id) - matching_tree_ids.indexOf(b.tree_id));
    }
    setRationale(rat || '');
    setHasResult(true);
    onQueryResult(filtered, newWeights, rat);
    setLoading(false);
  };

  const handleClear = () => { setQuery(''); setRationale(''); setHasResult(false); onClear(); };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ background: 'var(--surface-2)', borderColor: hasResult ? 'rgba(255,92,60,0.4)' : 'var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "High-mortality trees near schools not pruned in 5 years..."'
            className="flex-1 bg-transparent text-sm outline-none" style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }} />
          <button type="button" onClick={() => setShowExamples(v => !v)} style={{ color: 'var(--text-dim)' }}>
            {showExamples ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <button type="submit" disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'rgba(255,92,60,0.12)', color: 'var(--hot)', border: '1px solid rgba(255,92,60,0.25)', fontFamily: 'var(--font-body)' }}>
          {loading ? <span className="animate-spin">⟳</span> : <Sparkles size={13} />}
          {loading ? 'Analyzing…' : 'Ask AI'}
        </button>
        {hasResult && (
          <button type="button" onClick={handleClear} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(255,92,60,0.1)', color: 'var(--hot)', border: '1px solid rgba(255,92,60,0.2)' }}>
            <X size={13} /> Clear
          </button>
        )}
      </form>
      {showExamples && (
        <div className="flex flex-col gap-1 pl-2">
          {EXAMPLES.map((q, i) => (
            <button key={i} onClick={() => { setQuery(q); setShowExamples(false); }}
              className="text-left text-xs px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>↳ {q}</button>
          ))}
        </div>
      )}
      {rationale && (
        <div className="rounded-lg p-3 text-sm border" style={{ background: 'rgba(255,92,60,0.05)', borderColor: 'rgba(255,92,60,0.2)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={11} style={{ color: 'var(--hot)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--hot)' }}>AI Rationale</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{rationale}</p>
        </div>
      )}
    </div>
  );
}