'use client';

import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function AuditPage() {
  const { auditEntries, auditTotal, auditLoading, fetchAudit } = useData();
  const [search, setSearch] = useState('');

  // Fetch audit on mount
  useEffect(() => {
    fetchAudit(1, 20);
  }, [fetchAudit]);

  const filtered = auditEntries.filter(e => {
    const matchSearch = !search || 
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.record_id.toLowerCase().includes(search.toLowerCase()) ||
      e.user_name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

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
          <button 
            onClick={() => fetchAudit(1, 20)} 
            disabled={auditLoading}
            className="btn btn-outline"
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} style={{ animation: auditLoading ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
              {['#', 'Timestamp', 'Action', 'Resource', 'Actor', 'Status'].map(h => (
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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
                  No audit entries found
                </td>
              </tr>
            ) : (
              filtered.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-400)' }}>#{e.id}</td>
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
    </div>
  );
}
