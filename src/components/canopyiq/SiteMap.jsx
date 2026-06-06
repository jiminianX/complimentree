import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { scoreColor } from '@/lib/scoring';
import 'leaflet/dist/leaflet.css';

function FitBounds({ sites }) {
  const map = useMap();
  useEffect(() => {
    if (sites.length === 0) return;
    const lats = sites.map(s => parseFloat(s.latitude));
    const lngs = sites.map(s => parseFloat(s.longitude));
    map.fitBounds([
      [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
      [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
    ], { padding: [20, 20] });
  }, []);
  return null;
}

export default function SiteMap({ sites, onSelectSite, selectedSite }) {
  if (sites.length === 0) return (
    <div className="flex items-center justify-center h-full" style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}>
      Loading map…
    </div>
  );

  const center = [40.73, -73.94];

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', background: 'var(--bg)', borderRadius: '0.5rem' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />
      <FitBounds sites={sites} />
      {sites.map(site => {
        const score = site._liveScore ?? 0;
        const color = scoreColor(score);
        const radius = 5 + (score / 100) * 10;
        const isSelected = selectedSite?.site_id === site.site_id;

        return (
          <CircleMarker
            key={site.site_id}
            center={[parseFloat(site.latitude), parseFloat(site.longitude)]}
            radius={isSelected ? radius + 4 : radius}
            pathOptions={{
              color: isSelected ? '#fff' : color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: isSelected ? 2.5 : 1,
              opacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelectSite(site) }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, background: 'var(--surface-2)', color: 'var(--text)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600 }}>{site.address}</div>
                <div style={{ color: 'var(--text-dim)' }}>{site.neighborhood}</div>
                <div style={{ fontFamily: 'var(--font-mono)', color, marginTop: 4 }}>Score: {score.toFixed(1)}</div>
                <div style={{ color: 'var(--text-dim)' }}>{site.site_status}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}