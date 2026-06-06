/**
 * CanopyIQ STEWARD — Live Maintenance Priority Score
 * Deterministic, client-side.
 */

export function computeValueNorm(trees) {
  const vals = trees.map(t => parseFloat(t.annual_benefit_at_risk_usd) || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  return (tree) => max === min ? 0.5 : ((parseFloat(tree.annual_benefit_at_risk_usd) || 0) - min) / (max - min);
}

export function computeMaintenanceScore(tree, weights, valueNormFn) {
  const { wMortality = 0.45, wValue = 0.30, wSafety = 0.25, wEquity = 0.0 } = weights;

  const mort_n = Math.min(1, Math.max(0, (parseFloat(tree.mortality_risk_5yr_pct) || 0) / 100));
  const value_n = valueNormFn ? valueNormFn(tree) : 0.5;
  const safety_n = tree.safety_risk === 'High' ? 1.0 : tree.safety_risk === 'Medium' ? 0.6 : 0.25;

  let score = 100 * (wMortality * mort_n + wValue * value_n + wSafety * safety_n);

  // Equity overlay
  if (wEquity > 0) {
    const equity_mult = (parseFloat(tree.heat_vulnerability_index) - 1) / 4;
    score = score * (1 + wEquity * equity_mult);
  }

  return Math.max(0, score);
}

export function computeMaintenanceBreakdown(tree, weights, valueNormFn) {
  const { wMortality = 0.45, wValue = 0.30, wSafety = 0.25, wEquity = 0.0 } = weights;
  const mort_n = Math.min(1, Math.max(0, (parseFloat(tree.mortality_risk_5yr_pct) || 0) / 100));
  const value_n = valueNormFn ? valueNormFn(tree) : 0.5;
  const safety_n = tree.safety_risk === 'High' ? 1.0 : tree.safety_risk === 'Medium' ? 0.6 : 0.25;
  const equity_n = (parseFloat(tree.heat_vulnerability_index) - 1) / 4;

  const baseScore = 100 * (wMortality * mort_n + wValue * value_n + wSafety * safety_n);
  const equityBoost = wEquity > 0 ? baseScore * wEquity * equity_n : 0;

  return {
    mortality: { normalized: mort_n, weight: wMortality, contribution: wMortality * mort_n * 100 },
    value: { normalized: value_n, weight: wValue, contribution: wValue * value_n * 100 },
    safety: { normalized: safety_n, weight: wSafety, contribution: wSafety * safety_n * 100 },
    equity: { normalized: equity_n, weight: wEquity, contribution: equityBoost },
  };
}