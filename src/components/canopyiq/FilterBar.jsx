import React from 'react';

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm rounded-md px-2 py-1.5 border outline-none"
        style={{ background: 'var(--surface-2)', color: 'var(--text)', borderColor: 'var(--border)', fontFamily: 'var(--font-body)' }}
      >
        <option value="">All</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function FilterBar({ sites, filters, onFiltersChange }) {
  const boroughs = [...new Set(sites.map(s => s.borough).filter(Boolean))].sort();
  const districts = [...new Set(sites.map(s => s.community_district).filter(Boolean))].sort();
  const species = [...new Set(sites.map(s => s.recommended_species).filter(Boolean))].sort();

  return (
    <div className="flex items-end gap-4 flex-wrap">
      <FilterSelect
        label="Borough"
        value={filters.borough}
        onChange={v => onFiltersChange({ ...filters, borough: v })}
        options={boroughs}
      />
      <FilterSelect
        label="District"
        value={filters.district}
        onChange={v => onFiltersChange({ ...filters, district: v })}
        options={districts}
      />
      <FilterSelect
        label="Status"
        value={filters.status}
        onChange={v => onFiltersChange({ ...filters, status: v })}
        options={['Plantable', 'Needs space creation']}
      />
      <FilterSelect
        label="Species"
        value={filters.species}
        onChange={v => onFiltersChange({ ...filters, species: v })}
        options={species}
      />
    </div>
  );
}
