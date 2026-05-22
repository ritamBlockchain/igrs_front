'use client';

import { useEffect, useState } from "react";
import { Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function AuditPage() {
  const { auditEntries, auditTotal, auditLoading, fetchAudit } = useData();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch all audit entries on mount (large limit for local pagination)
  useEffect(() => {
    fetchAudit(page, limit, search);
  }, [fetchAudit, page, search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Count failures (actions with error indicators)
  const failureCount = auditEntries.filter(e => 
    e.detail?.toLowerCase().includes('error') || 
    e.detail?.toLowerCase().includes('failed')
  ).length;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>🔍 Audit Trail</h1><p>Immutable log of all ledger operations — {auditTotal} total events</p></div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue-600)' }}>{auditTotal}</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>EVENTS</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 800, color: failureCount > 0 ? 'var(--error)' : 'var(--success)' }}>{failureCount}</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>FAILURES</div></div>
        </div>
      </div>

      {/* Results count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
          {auditLoading ? 'Loading...' : `Showing ${auditTotal > 0 ? (page - 1) * limit + 1 : 0} to ${Math.min(page * limit, auditTotal)} of ${auditTotal} entries`}
        </div>
        <button 
          onClick={() => fetchAudit(page, limit, search)} 
          disabled={auditLoading}
          className="btn btn-outline"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} style={{ animation: auditLoading ? 'spin 1s linear infinite' : undefined }} />
          Refresh
        </button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <Search size={16} color="var(--slate-400)" />
            <input 
              className="input" 
              placeholder="Search audit events..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', boxShadow: 'none', padding: '6px 0' }} 
            />
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
              {['SL. No.', 'Timestamp', 'Action', 'Resource', 'Actor', 'Status'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {auditLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
                  Loading audit trail from Fabric...
                </td>
              </tr>
            ) : auditEntries.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
                  No audit entries found
                </td>
              </tr>
            ) : (
              auditEntries.map((e, i) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--slate-50)', transition: 'background 0.15s' }} onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--blue-50)')} onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', color: 'var(--slate-500)', fontSize: 13, fontWeight: 500 }}>
                    {(page - 1) * limit + i + 1}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-500)' }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{e.action}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-600)' }}>{e.record_id}</td>
                  <td style={{ padding: '12px 16px' }}><span className="badge badge-info">{e.user_role}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${e.tx_hash ? 'badge-success' : 'badge-warning'}`}>
                      {e.tx_hash ? 'On-Chain' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {auditTotal > limit && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
            Page {page} of {Math.max(1, Math.ceil(auditTotal / limit))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || auditLoading}
              style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setPage(p => Math.min(Math.ceil(auditTotal / limit), p + 1))}
              disabled={page >= Math.ceil(auditTotal / limit) || auditLoading}
              style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
