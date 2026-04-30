'use client';

import { useState, useEffect } from "react";
import { Search, ChevronRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useData } from "@/context/DataContext";

export default function LandRecordsPage() {
  const { records, recordsLoading, recordsError, recordsTotal, fetchRecords } = useData();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch records on mount or when filters change
  useEffect(() => {
    fetchRecords(1, 50, { search, land_type: typeFilter });
  }, [fetchRecords, search, typeFilter]);

  const displayRecords = records;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
          {recordsLoading ? 'Loading...' : `Showing ${displayRecords.length} of ${recordsTotal} records`}
        </div>
        <button 
          onClick={() => fetchRecords(1, 50, { search, land_type: typeFilter })} 
          disabled={recordsLoading}
          className="btn btn-outline"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} style={{ animation: recordsLoading ? 'spin 1s linear infinite' : undefined }} />
          Refresh
        </button>
      </div>
      
      {recordsError && (
        <div className="card" style={{ padding: 16, marginBottom: 16, background: 'var(--error-bg)', color: 'var(--error)', border: '1px solid var(--error)' }}>
          Error: {recordsError}
        </div>
      )}

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
            {recordsLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
                  Loading records from Fabric...
                </td>
              </tr>
            ) : displayRecords.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
                  No records found
                </td>
              </tr>
            ) : (
              displayRecords.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--slate-50)', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--blue-50)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--blue-700)' }}>{r.record_id}</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 500, fontSize: 14 }}>{r.owner_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--slate-600)' }}>{r.village_name}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13 }}>
                    {(r.area && r.area !== '<nil>') ? r.area : (r.area_sq_m && String(r.area_sq_m) !== '<nil>' ? r.area_sq_m : '—')}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${r.land_type === 'Agricultural' ? 'badge-success' : r.land_type === 'Residential' ? 'badge-info' : 'badge-warning'}`}>
                      {r.land_type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${r.status === 'verified' ? 'badge-success' : r.is_frozen ? 'badge-error' : 'badge-warning'}`}>
                      {r.status === 'verified' ? '● ' : '◌ '}{r.status.toUpperCase()}
                      {r.is_frozen && ' (FROZEN)'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--slate-500)' }}>v{r.version}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link href={`/land/${r.record_id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--blue-600)', fontSize: 13, fontWeight: 600 }}>
                      View <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
