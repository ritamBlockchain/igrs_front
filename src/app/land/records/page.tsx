'use client';

import { useState } from "react";
import { Search, ChevronRight, CheckCircle, Clock, MapPin, User } from "lucide-react";
import Link from "next/link";

const MOCK_RECORDS = Array.from({ length: 20 }).map((_, i) => ({
  id: `REC-2026-${i + 1}`,
  owner: i === 0 ? 'John Doe' : `Owner ${i + 1}`,
  village: 'Demo Village',
  tehsil: 'Demo Taluka',
  district: 'Demo District',
  area: `${(Math.random() * 5 + 1).toFixed(2)}`,
  landType: ['Agricultural', 'Residential', 'Commercial'][i % 3],
  status: i === 19 ? 'PENDING' : 'ACTIVE',
  version: i === 19 ? 1 : Math.floor(Math.random() * 3) + 1,
  anchored: i !== 19,
}));

export default function LandRecordsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = MOCK_RECORDS.filter(r => {
    const matchSearch = !search || r.id.toLowerCase().includes(search.toLowerCase()) || r.owner.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || r.landType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🗺️ Land Records</h1>
        <p>Browse and search all records on the distributed ledger</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '0 8px', color: 'var(--slate-400)' }}>
          <Search size={16} />
          <input 
            className="input" 
            placeholder="Search by Record ID or Owner name..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ border: 'none', padding: '8px 0', boxShadow: 'none' }}
          />
        </div>
        <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Types</option>
          <option>Agricultural</option>
          <option>Residential</option>
          <option>Commercial</option>
        </select>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 12 }}>
        Showing {filtered.length} of {MOCK_RECORDS.length} records
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
              {['Record ID', 'Owner', 'Village', 'Area (sqm)', 'Type', 'Status', 'Ver.', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--slate-50)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-50)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '14px 16px' }}>
                  <span className="mono" style={{ fontWeight: 600, color: 'var(--blue-700)' }}>{r.id}</span>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 14 }}>{r.owner}</td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--slate-600)' }}>{r.village}</td>
                <td style={{ padding: '14px 16px', fontSize: 13 }}>{r.area}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${r.landType === 'Agricultural' ? 'badge-success' : r.landType === 'Residential' ? 'badge-info' : 'badge-warning'}`}>
                    {r.landType}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                    {r.status === 'ACTIVE' ? '● ' : '◌ '}{r.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--slate-500)' }}>v{r.version}</td>
                <td style={{ padding: '14px 16px' }}>
                  <Link href={`/land/${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue-600)', fontSize: 13, fontWeight: 600 }}>
                    View <ChevronRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
