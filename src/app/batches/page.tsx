'use client';

import { useEffect, useState } from "react";
import { Package, Shield, RefreshCw, ExternalLink } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useRole } from "@/context/RoleContext";

export default function BatchesPage() {
  const { batches, batchesLoading, batchesError, refreshBatches, stats } = useData();
  const { role } = useRole();
  const canCreate = role && ['Admin', 'Revenue Admin'].includes(role);

  // Fetch batches on mount
  useEffect(() => {
    refreshBatches();
  }, [refreshBatches]);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📦 Batch Operations</h1>
          <p>Legacy data ingestion and Merkle proof verification</p>
        </div>
        <button 
          onClick={refreshBatches} 
          disabled={batchesLoading}
          className="btn btn-outline"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} style={{ animation: batchesLoading ? 'spin 1s linear infinite' : undefined }} />
          Refresh
        </button>
      </div>

      {/* Batch Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Batches', val: stats?.total_batches || 0 },
          { label: 'Anchored', val: stats?.anchored_batches || 0 },
          { label: 'Pending', val: (stats?.total_batches || 0) - (stats?.anchored_batches || 0) },
          { label: 'Total Records', val: stats?.total_records || 0 },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue-600)' }}>{batchesLoading ? '-' : s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Batch List */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--slate-100)' }}>
          <h3 style={{ margin: 0 }}>All Batches</h3>
        </div>
        {batchesLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading batches...
          </div>
        ) : batchesError ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)' }}>
            Error: {batchesError}
          </div>
        ) : batches.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
            No batches found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
                {['Batch ID', 'Records', 'Status', 'Merkle Root', 'Transaction', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{b.batch_id}</td>
                  <td style={{ padding: '12px 16px' }}>{b.records_count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${b.status === 'anchored' ? 'badge-success' : b.status === 'processing' ? 'badge-warning' : 'badge-info'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11 }} className="mono">
                    {b.merkle_root?.substring(0, 20)}...
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 11 }}>
                    {b.tx_hash ? (
                      <span style={{ color: 'var(--success)' }}>✓ {b.tx_hash.substring(0, 16)}...</span>
                    ) : (
                      <span style={{ color: 'var(--slate-400)' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {b.tx_hash && (
                      <a 
                        href={`https://amoy.polygonscan.com/tx/${b.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--blue-600)', fontSize: 12 }}
                      >
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Forms - Admin Only */}
      {canCreate && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 20 }}>Register Record Batch</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label className="label">Batch ID *</label><input className="input" placeholder="BATCH-2026-XX" /></div>
                <div><label className="label">Merkle Root (SHA-256) *</label><input className="input mono" placeholder="64-char hex" /></div>
                <div><label className="label">Record Count *</label><input className="input" type="number" placeholder="e.g. 100" /></div>
                <button className="btn btn-primary"><Package size={16} /> Register Batch</button>
              </div>
            </div>

            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ marginBottom: 20 }}>Verify Batch Proof</h3>
              <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 16 }}>Public verification — no role check required.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div><label className="label">Batch ID *</label><input className="input" placeholder="BATCH-2026-XX" /></div>
                <div><label className="label">Document Hash *</label><input className="input mono" placeholder="Hash to verify" /></div>
                <div><label className="label">Merkle Proof (JSON array)</label>
                  <textarea className="input" rows={4} placeholder='["hash1", "hash2", ...]' style={{ resize: 'vertical' }}></textarea>
                </div>
                <button className="btn btn-outline"><Shield size={16} /> Verify Proof</button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28, marginTop: 20 }}>
            <h3 style={{ marginBottom: 20 }}>Register Index Snapshot</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="label">Snapshot ID *</label><input className="input" placeholder="SNAP-2026-XX" /></div>
              <div><label className="label">Index Merkle Root *</label><input className="input mono" placeholder="64-char hex" /></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 16 }}>Register Snapshot</button>
          </div>
        </>
      )}
    </div>
  );
}
