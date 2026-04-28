'use client';

import { ExternalLink, Layers, Shield, Database } from "lucide-react";

const BATCHES = [
  { id: '4', root: '0be0c3103d9de1993973ccc13f5635cc8df6cdb323e06211ab82f669024ad578', tx: '0x446636758c24c715fff31373df14e64995370d7657f140afd96557b60a564dca', status: 'Anchored' },
  { id: '3', root: 'f2e3d4c5b6a7898776655443322110ff', tx: '0x123456abcdef...', status: 'Anchored' },
  { id: '2', root: 'd7345bea488440ef775a2d06e6022466fefe4431b4fc19fabb841ab055330c4c', tx: '0x789abcdef012...', status: 'Anchored' },
  { id: '1', root: 'b33ca072789cf7d5ebd0ab3a391d94be900efa101ad564740c99dbf7276cf0b3', tx: '0x36310b1371407b882201a0162e3ff5bb124f4947785dbc10e4f2234b528be411', status: 'Anchored' },
];

export default function AnchorsPage() {
  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><h1>⛓️ Blockchain Anchors</h1><p>L2 public verification via Polygon Amoy Testnet</p></div>
        <span className="badge badge-info" style={{ fontSize: 12, padding: '6px 14px' }}>● Polygon Amoy</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: <Layers size={20} />, label: 'Total Batches', val: '4' },
          { icon: <Shield size={20} />, label: 'Verification', val: '100%' },
          { icon: <Database size={20} />, label: 'Anchored Records', val: '36 / 37' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-600)' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--slate-800)' }}>{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {BATCHES.map(b => (
          <div key={b.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>{b.id}</div>
                <div><div style={{ fontWeight: 700, fontSize: 15 }}>Batch #{b.id}</div><div style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>ANCHORED</div></div>
              </div>
              <a href={`https://amoy.polygonscan.com/tx/${b.tx}`} target="_blank" className="btn btn-outline" style={{ fontSize: 12 }}>
                Polygonscan <ExternalLink size={12} />
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16, background: 'var(--slate-50)', borderRadius: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>Merkle Root</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--slate-600)', wordBreak: 'break-all' }}>{b.root}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>Tx Hash</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--slate-600)', wordBreak: 'break-all' }}>{b.tx}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
