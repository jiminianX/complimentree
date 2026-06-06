import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { scoreColor } from '@/lib/scoring';
import 'leaflet/dist/leaflet.css';

function FitBounds({ trees }) {
  const map = useMap();
  useEffect(() => {
    if (trees.length === 0) return;
    const lats = trees.map(t => parseFloat(t.latitude));
    const lngs = trees.map(t => parseFloat(t.longitude));
    map.fitBounds([
      [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
      [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
    ], { padding: [20, 20] });
  }, []);
  return null;
}

export default function StewardMap({ trees, onSelectTree, selectedTree }) {
  if (trees.length === 0) return (
    <div className="flex items-center justify-center h-full" style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}>
      Loading map…
    </div>
  );

  return (
    <MapContainer
      center={[40.73, -73.94]}
      zoom={12}
      style={{ height: '100%', width: '100%', background: 'var(--bg)', borderRadius: '0.5rem' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <FitBounds trees={trees} />
      {trees.map(tree => {
        const score = tree._liveScore ?? 0;
        const color = scoreColor(score);
        const radius = 4 + (score / 100) * 9;
        const isSelected = selectedTree?.tree_id === tree.tree_id;
        const isUrgent = tree.safety_risk === 'High';

        return (
          <CircleMarker
            key={tree.tree_id}
            center={[parseFloat(tree.latitude), parseFloat(tree.longitude)]}
            radius={isSelected ? radius + 4 : radius}
            pathOptions={{
              color: isUrgent ? '#FF5C3C' : (isSelected ? '#fff' : color),
              fillColor: 'transparent',
              fillOpacity: 0,
              weight: isUrgent ? 3 : isSelected ? 2.5 : 2,
              opacity: 0.95,
              dashArray: isUrgent ? '4 2' : undefined,
            }}
            eventHandlers={{ click: () => onSelectTree(tree) }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, background: 'var(--surface-2)', color: 'var(--text)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600 }}>{tree.address}</div>
                <div style={{ color: 'var(--text-dim)' }}>{tree.species}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color, marginTop: 4 }}>Score: {score.toFixed(1)}</div>
                <div style={{ color: isUrgent ? 'var(--hot)' : 'var(--text-dim)' }}>{tree.condition} · {tree.safety_risk} safety</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}