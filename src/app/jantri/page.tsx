'use client';

import { TrendingUp, Plus } from "lucide-react";
import { useRole } from "@/context/RoleContext";

const RATES = [
  { type: 'Agricultural', rate: 150, village: 'Demo Village' },
  { type: 'Residential', rate: 500, village: 'Demo Village' },
  { type: 'Commercial', rate: 1200, village: 'Demo Village' },
];

export default function JantriPage() {
  const { role } = useRole();
  const canManage = role && ['Revenue Admin', 'Admin'].includes(role);

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><h1>📊 Jantri Rate Index</h1><p>Standardized land valuation framework (on-chain)</p></div>
        {canManage && <button className="btn btn-primary"><Plus size={16} /> Update Rates</button>}
      </div>

      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
              {['Land Category', 'Rate (₹/sqm)', 'Village', 'Status', 'Last Updated'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RATES.map(r => (
              <tr key={r.type} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                <td style={{ padding: '16px 20px', fontWeight: 600, fontSize: 14 }}>{r.type}</td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--blue-600)', fontSize: 15 }}>₹ {r.rate.toLocaleString()}</td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate-500)' }}>{r.village}</td>
                <td style={{ padding: '16px 20px' }}><span className="badge badge-success">Active</span></td>
                <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate-500)' }}>2026-04-28</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ marginBottom: 16 }}>Valuation Calculator</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
          <div><label className="label">Area (sqm)</label><input className="input" type="number" placeholder="500" /></div>
          <div><label className="label">Category</label>
            <select className="input"><option>Agricultural</option><option>Residential</option><option>Commercial</option></select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', marginBottom: 4 }}>Estimated Value</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>₹ 0.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}
