'use client';

import { useParams } from "next/navigation";
import { useState } from "react";
import { Shield, MapPin, User, Clock, Hash, CheckCircle, FileText, History, AlertTriangle } from "lucide-react";

export default function LandDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<'details'|'history'|'verify'|'owner'>('details');

  const record = {
    id, owner: 'John Doe', ownerID: 'OWNER-001', village: 'Demo Village',
    tehsil: 'Demo Taluka', district: 'Demo District', surveyNo: '123/A',
    khasraNo: '456', area: '2.50', landType: 'Agricultural', status: 'ACTIVE',
    version: 3, docHash: 'a1b2c3d4e5f6...', indexHash: 'f6e5d4c3b2a1...',
    createdAt: '2026-04-20', updatedAt: '2026-04-28', frozen: false,
  };

  const historyEntries = [
    { version: 3, action: 'Sale Mutation Finalized', actor: 'Talati', date: '2026-04-28', owner: 'John Doe' },
    { version: 2, action: 'Ownership Initialized', actor: 'Revenue Admin', date: '2026-04-22', owner: 'Prev Owner' },
    { version: 1, action: 'Land Registered', actor: 'Admin', date: '2026-04-20', owner: 'Initial Owner' },
  ];

  const tabs = [
    { key: 'details', label: 'Record Details', icon: FileText },
    { key: 'history', label: 'History', icon: History },
    { key: 'verify', label: 'Verify', icon: Shield },
    { key: 'owner', label: 'Set Owner', icon: User },
  ] as const;

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>📄 {id}</h1>
          <p>Land record detail view with full history and verification</p>
        </div>
        <span className={`badge ${record.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
          {record.status}
        </span>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--slate-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              fontSize: 13, fontWeight: tab === t.key ? 600 : 500,
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? 'var(--blue-700)' : 'var(--slate-500)',
              boxShadow: tab === t.key ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s',
            }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { label: 'Owner', value: record.owner, icon: <User size={14} /> },
              { label: 'Village', value: record.village, icon: <MapPin size={14} /> },
              { label: 'Tehsil', value: record.tehsil, icon: <MapPin size={14} /> },
              { label: 'District', value: record.district, icon: <MapPin size={14} /> },
              { label: 'Survey No.', value: record.surveyNo, icon: <Hash size={14} /> },
              { label: 'Khasra No.', value: record.khasraNo, icon: <Hash size={14} /> },
              { label: 'Area', value: `${record.area} sqm`, icon: <MapPin size={14} /> },
              { label: 'Land Type', value: record.landType },
              { label: 'Version', value: `v${record.version}` },
              { label: 'Created', value: record.createdAt, icon: <Clock size={14} /> },
              { label: 'Last Updated', value: record.updatedAt, icon: <Clock size={14} /> },
              { label: 'Frozen', value: record.frozen ? 'Yes' : 'No' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--slate-800)' }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--slate-100)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 6 }}>Document Hash</div>
            <div className="mono" style={{ padding: '10px 14px', background: 'var(--slate-50)', borderRadius: 8, color: 'var(--slate-600)', wordBreak: 'break-all' }}>{record.docHash}</div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Ownership & State History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {historyEntries.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < historyEntries.length - 1 ? '1px solid var(--slate-100)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-600)', flexShrink: 0 }}>
                  v{h.version}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{h.action}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    By <strong>{h.actor}</strong> · Owner: {h.owner} · {h.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verify Tab */}
      {tab === 'verify' && (
        <div className="card" style={{ padding: 28, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 20 }}>Verify Land Record</h3>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>
            Enter the document hash to verify against the on-chain record. This is a public verification function.
          </p>
          <label className="label">Input Document Hash (SHA-256)</label>
          <input className="input mono" placeholder="Enter 64-character hex hash to verify..." style={{ marginBottom: 16 }} />
          <button className="btn btn-primary">Verify Against Ledger</button>
        </div>
      )}

      {/* Set Owner Tab */}
      {tab === 'owner' && (
        <div className="card" style={{ padding: 28, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 8 }}>Set Initial Owner</h3>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>
            Initialize ownership for this land record. Only available if ownership has not been set.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Owner Name *</label>
              <input className="input" placeholder="Full legal name" />
            </div>
            <div>
              <label className="label">Owner Hash (SHA-256) *</label>
              <input className="input mono" placeholder="64-character hex hash" />
            </div>
            <button className="btn btn-primary">Set Owner on Ledger</button>
          </div>
        </div>
      )}
    </div>
  );
}
