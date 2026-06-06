import React from 'react';
import { TreePine, Shield } from 'lucide-react';
import ModeToggle from './ModeToggle';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AppHeader({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const currentMode = mode || (location.pathname.startsWith('/steward') ? 'steward' : 'plant');

  const handleModeChange = (m) => {
    if (m === 'plant') navigate('/');
    else navigate('/steward');
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'rgba(91,217,128,0.15)' }}>
            <TreePine size={16} style={{ color: 'var(--canopy)' }} />
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text)' }}>
            Complimentree
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full font-mono border" style={{ background: 'rgba(242,169,59,0.1)', color: 'var(--warm)', borderColor: 'rgba(242,169,59,0.3)', fontFamily: 'var(--font-mono)' }}>
          Demo data
        </span>
        <ModeToggle mode={currentMode} onChange={handleModeChange} />
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,211,197,0.08)', color: 'var(--cool)', border: '1px solid rgba(34,211,197,0.2)' }}>
          <Shield size={11} />
          <span style={{ fontFamily: 'var(--font-body)' }}>AI recommends — planner decides</span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
          NYC Urban Forestry · Local Law 148
        </span>
      </div>
    </header>
  );
}