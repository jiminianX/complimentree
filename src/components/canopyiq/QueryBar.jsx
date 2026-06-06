import React, { useState } from 'react';
import { Search, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const EXAMPLE_QUERIES = [
  "Budget for 40 trees this quarter — prioritize heat-vulnerable blocks near schools, skip anything planted nearby since 2024",
  "Focus on senior centers in the Bronx with canopy below 15%",
  "Show plantable sites in Brooklyn with HVI 4 or 5",
];

export default function QueryBar({ allSites, weights, onQueryResult, onClear }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [rationale, setRationale] = useState('');
  const [appliedFilters, setAppliedFilters] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setRationale('');

    const sitesSummary = allSites.map(s => ({
      site_id: s.site_id,
      address: s.address,
      neighborhood: s.neighborhood,
      borough: s.borough,
      site_status: s.site_status,
      heat_vulnerability_index: s.heat_vulnerability_index,
      area_canopy_pct: s.area_canopy_pct,
      surface_temp_anomaly_f: s.surface_temp_anomaly_f,
      near_sensitive_site: s.near_sensitive_site,
      last_nearby_planting_year: s.last_nearby_planting_year,
      _liveScore: s._liveScore,
    }));

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a planting-site prioritization assistant for NYC city planners. 
Current priority weights: wHeat=${weights.wHeat}, wGap=${weights.wGap}, wEquity=${weights.wEquity}, wExpose=${weights.wExpose}

Planner's goal: "${query}"

Available sites (42 total, summarized):
${JSON.stringify(sitesSummary, null, 2)}

Return a JSON object with:
1. "filters": { "boroughs": string[] | null, "site_status": string | null, "near_sensitive_site_keywords": string[] | null, "exclude_planted_since_year": number | null, "max_sites": number | null, "min_hvi": number | null, "min_canopy_gap": number | null }
2. "weight_adjustments": { "wHeat": number | null, "wGap": number | null, "wEquity": number | null, "wExpose": number | null } — only include keys you want to change, use null to keep current
3. "matching_site_ids": string[] — list of site_ids that best match the goal, ordered by priority, max per planner's budget if stated
4. "rationale": string — 2-3 sentence explanation in plain English of what you filtered and why`,
      response_json_schema: {
        type: 'object',
        properties: {
          weight_adjustments: { type: 'object' },
          matching_site_ids: { type: 'array', items: { type: 'string' } },
          rationale: { type: 'string' },
        },
        required: ['weight_adjustments', 'matching_site_ids', 'rationale']
      }
    });

    const { filters, weight_adjustments, matching_site_ids, rationale: rat } = result;

    // Apply weight adjustments if provided
    const newWeights = { ...weights };
    if (weight_adjustments) {
      Object.keys(weight_adjustments).forEach(k => {
        if (weight_adjustments[k] !== null && weight_adjustments[k] !== undefined) {
          newWeights[k] = weight_adjustments[k];
        }
      });
    }

    // Filter sites
    let filtered = allSites;
    if (matching_site_ids && matching_site_ids.length > 0) {
      const idSet = new Set(matching_site_ids);
      filtered = allSites.filter(s => idSet.has(s.site_id));
      // Sort by matching_site_ids order
      filtered.sort((a, b) => matching_site_ids.indexOf(a.site_id) - matching_site_ids.indexOf(b.site_id));
    }

    setRationale(rat || '');
    setAppliedFilters({ filters, weight_adjustments });
    setHasResult(true);
    onQueryResult(filtered, newWeights, rat);
    setLoading(false);
  };

  const handleClear = () => {
    setQuery('');
    setRationale('');
    setAppliedFilters(null);
    setHasResult(false);
    onClear();
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ background: 'var(--surface-2)', borderColor: hasResult ? 'rgba(91,217,128,0.4)' : 'var(--border)' }}>
          <Search size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='e.g. "Budget for 40 trees — prioritize heat-vulnerable blocks near schools..."'
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-body)' }}
          />
          <button type="button" onClick={() => setShowExamples(v => !v)} style={{ color: 'var(--text-dim)' }}>
            {showExamples ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: 'rgba(91,217,128,0.15)', color: 'var(--canopy)', border: '1px solid rgba(91,217,128,0.3)', fontFamily: 'var(--font-body)' }}
        >
          {loading ? <span className="animate-spin">⟳</span> : <Sparkles size={13} />}
          {loading ? 'Analyzing…' : 'Ask AI'}
        </button>
        {hasResult && (
          <button type="button" onClick={handleClear} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all hover:opacity-80" style={{ background: 'rgba(255,92,60,0.1)', color: 'var(--hot)', border: '1px solid rgba(255,92,60,0.2)' }}>
            <X size={13} /> Clear
          </button>
        )}
      </form>

      {showExamples && (
        <div className="flex flex-col gap-1 pl-2">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => { setQuery(q); setShowExamples(false); }}
              className="text-left text-xs px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}
            >
              ↳ {q}
            </button>
          ))}
        </div>
      )}

      {rationale && (
        <motion_div
          className="rounded-lg p-3 text-sm border"
          style={{ background: 'rgba(91,217,128,0.05)', borderColor: 'rgba(91,217,128,0.2)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={11} style={{ color: 'var(--canopy)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--canopy)' }}>AI Rationale</span>
            {appliedFilters?.weight_adjustments && Object.values(appliedFilters.weight_adjustments).some(v => v !== null) && (
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(242,169,59,0.1)', color: 'var(--warm)' }}>Weights adjusted</span>
            )}
          </div>
          <p style={{ color: 'var(--text-dim)' }}>{rationale}</p>
        </motion_div>
      )}
    </div>
  );
}

// Using a simple div to avoid framer-motion import issue in this context
function motion_div({ children, className, style }) {
  return <div className={className} style={style}>{children}</div>;
}