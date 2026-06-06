/**
 * CanopyIQ — Live Priority Score
 * Deterministic, client-side. Recomputed whenever weights change.
 */
export function computeScore(site, weights) {
  const { wHeat = 0.25, wGap = 0.25, wEquity = 0.30, wExpose = 0.20 } = weights;

  const heat_n = Math.min(1, Math.max(0, (parseFloat(site.surface_temp_anomaly_f) + 1) / 13.5));
  const gap_n = Math.max(0, (30 - parseFloat(site.area_canopy_pct)) / 30);
  const equity_n = (parseFloat(site.heat_vulnerability_index) - 1) / 4;
  const expose_n = (site.near_sensitive_site && site.near_sensitive_site.toLowerCase() !== 'none') ? 1.0 : 0.4;

  let score = 100 * (wHeat * heat_n + wGap * gap_n + wEquity * equity_n + wExpose * expose_n);
  if (site.site_status !== 'Plantable') score -= 12;
  return Math.max(0, score);
}

export function scoreColor(score) {
  // Interpolate between cool (#22D3C5) → warm (#F2A93B) → hot (#FF5C3C)
  const t = Math.min(1, Math.max(0, score / 100));
  if (t < 0.5) {
    const u = t / 0.5;
    const r = Math.round(0x22 + u * (0xF2 - 0x22));
    const g = Math.round(0xD3 + u * (0xA9 - 0xD3));
    const b = Math.round(0xC5 + u * (0x3B - 0xC5));
    return `rgb(${r},${g},${b})`;
  } else {
    const u = (t - 0.5) / 0.5;
    const r = Math.round(0xF2 + u * (0xFF - 0xF2));
    const g = Math.round(0xA9 + u * (0x5C - 0xA9));
    const b = Math.round(0x3B + u * (0x3C - 0x3B));
    return `rgb(${r},${g},${b})`;
  }
}

export function computeFactorBreakdown(site, weights) {
  const { wHeat = 0.25, wGap = 0.25, wEquity = 0.30, wExpose = 0.20 } = weights;
  const heat_n = Math.min(1, Math.max(0, (parseFloat(site.surface_temp_anomaly_f) + 1) / 13.5));
  const gap_n = Math.max(0, (30 - parseFloat(site.area_canopy_pct)) / 30);
  const equity_n = (parseFloat(site.heat_vulnerability_index) - 1) / 4;
  const expose_n = (site.near_sensitive_site && site.near_sensitive_site.toLowerCase() !== 'none') ? 1.0 : 0.4;
  return {
    heat: { normalized: heat_n, weight: wHeat, contribution: wHeat * heat_n * 100 },
    gap: { normalized: gap_n, weight: wGap, contribution: wGap * gap_n * 100 },
    equity: { normalized: equity_n, weight: wEquity, contribution: wEquity * equity_n * 100 },
    exposure: { normalized: expose_n, weight: wExpose, contribution: wExpose * expose_n * 100 },
  };
}