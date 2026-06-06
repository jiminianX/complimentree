import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import AppHeader from '@/components/canopyiq/AppHeader';
import StewardMetricsStrip from '@/components/canopyiq/StewardMetricsStrip';
import StewardWeightSliders from '@/components/canopyiq/StewardWeightSliders';
import StewardMap from '@/components/canopyiq/StewardMap';
import StewardList from '@/components/canopyiq/StewardList';
import TreeDetailModal from '@/components/canopyiq/TreeDetailModal';
import StewardQueryBar from '@/components/canopyiq/StewardQueryBar';
import { computeMaintenanceScore, computeValueNorm } from '@/lib/stewardScoring';
import { Link } from 'react-router-dom';
import { MapPin, BarChart2 } from 'lucide-react';

const DEFAULT_WEIGHTS = { wMortality: 0.45, wValue: 0.30, wSafety: 0.25, wEquity: 0.0 };

const conditionOptions = ['Good', 'Fair', 'Poor', 'Critical'];

export default function StewardDashboard() {
  const [allTrees, setAllTrees] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [filters, setFilters] = useState({ borough: '', condition: '', unpruned5: false });
  const [selectedTree, setSelectedTree] = useState(null);
  const [queryFilteredIds, setQueryFilteredIds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ExistingTrees.list('-maintenance_priority_score', 200)
      .then(data => { setAllTrees(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const valueNormFn = useMemo(() => computeValueNorm(allTrees), [allTrees]);

  const scoredTrees = useMemo(() => {
    return allTrees.map(t => ({ ...t, _liveScore: computeMaintenanceScore(t, weights, valueNormFn) }));
  }, [allTrees, weights, valueNormFn]);

  const filteredAndSorted = useMemo(() => {
    let trees = scoredTrees;
    if (queryFilteredIds) {
      const idSet = new Set(queryFilteredIds);
      trees = trees.filter(t => idSet.has(t.tree_id));
    }
    if (filters.borough) trees = trees.filter(t => t.borough === filters.borough);
    if (filters.condition) trees = trees.filter(t => t.condition === filters.condition);
    if (filters.unpruned5) trees = trees.filter(t => !t.last_pruned_year || (2026 - t.last_pruned_year) >= 5);

    // Safety hazards always at top, then sort by score
    const hazards = trees.filter(t => t.safety_risk === 'High').sort((a, b) => b._liveScore - a._liveScore);
    const rest = trees.filter(t => t.safety_risk !== 'High').sort((a, b) => b._liveScore - a._liveScore);
    return [...hazards, ...rest];
  }, [scoredTrees, filters, queryFilteredIds]);

  const selectedWithScore = useMemo(() => {
    if (!selectedTree) return null;
    return scoredTrees.find(t => t.tree_id === selectedTree.tree_id) || selectedTree;
  }, [selectedTree, scoredTrees]);

  const boroughs = [...new Set(allTrees.map(t => t.borough).filter(Boolean))].sort();

  const handleQueryResult = (filtered, newWeights) => {
    setWeights(newWeights);
    setQueryFilteredIds(filtered.map(t => t.tree_id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--hot)' }} />
          <span className="text-sm" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Loading existing trees…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      <AppHeader mode="steward" />

      {/* Nav */}
      <div className="flex items-center gap-1 px-6 pt-3 pb-0">
        <Link to="/steward" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,92,60,0.1)', color: 'var(--hot)', fontFamily: 'var(--font-body)' }}>
          <MapPin size={13} /> Maintenance Dashboard
        </Link>
        <Link to="/neighborhoods" className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
          <BarChart2 size={13} /> Neighborhood Goal Tracker
        </Link>
      </div>

      <StewardMetricsStrip trees={scoredTrees} />

      {/* Query bar */}
      <div className="px-6 pb-3">
        <StewardQueryBar allTrees={scoredTrees} weights={weights} onQueryResult={handleQueryResult} onClear={() => setQueryFilteredIds(null)} />
      </div>

      {/* Filters */}
      <div className="px-6 pb-3 flex items-end gap-4 flex-wrap">
        {[
          { label: 'Borough', val: filters.borough, key: 'borough', opts: boroughs },
          { label: 'Condition', val: filters.condition, key: 'condition', opts: conditionOptions },
        ].map(f => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{f.label}</label>
            <select value={f.val} onChange={e => setFilters({ ...filters, [f.key]: e.target.value })}
              className="text-sm rounded-md px-2 py-1.5 border outline-none"
              style={{ background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--border)', fontFamily: 'var(--font-body)' }}>
              <option value="">All</option>
              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>Quick filter</label>
          <button
            onClick={() => setFilters(f => ({ ...f, unpruned5: !f.unpruned5 }))}
            className="text-sm px-3 py-1.5 rounded-md border transition-all"
            style={{
              background: filters.unpruned5 ? 'rgba(242,169,59,0.15)' : 'var(--surface-2)',
              color: filters.unpruned5 ? 'var(--warm)' : 'var(--text-dim)',
              borderColor: filters.unpruned5 ? 'rgba(242,169,59,0.3)' : 'var(--border)',
              fontFamily: 'var(--font-body)',
            }}>
            Not pruned in 5+ years
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex px-6 pb-6 gap-4 min-h-0" style={{ height: 'calc(100vh - 340px)' }}>
        <div className="flex-1 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)', minHeight: 500 }}>
          <StewardMap trees={filteredAndSorted} onSelectTree={setSelectedTree} selectedTree={selectedWithScore} />
        </div>
        <div className="flex flex-col gap-3 w-80 flex-shrink-0" style={{ minWidth: 300 }}>
          <StewardWeightSliders weights={weights} onChange={setWeights} />
          <div className="flex-1 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface)', minHeight: 0 }}>
            <StewardList trees={filteredAndSorted} onSelectTree={setSelectedTree} selectedTree={selectedWithScore} />
          </div>
        </div>
      </div>

      {selectedWithScore && (
        <TreeDetailModal tree={selectedWithScore} weights={weights} valueNormFn={valueNormFn} onClose={() => setSelectedTree(null)} />
      )}
    </div>
  );
}