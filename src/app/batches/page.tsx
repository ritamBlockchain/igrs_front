'use client';

import { Package, Shield } from "lucide-react";

export default function BatchesPage() {
  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📦 Batch Operations</h1>
        <p>Legacy data ingestion and Merkle proof verification</p>
      </div>

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
    </div>
  );
}
