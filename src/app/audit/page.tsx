'use client';

import { Search, Clock, User, ChevronRight } from "lucide-react";

const ENTRIES = [
  { id: '65', action: 'PutOwnerPrivateRecord', actor: 'Auditor', resource: 'REC-2026-1', time: '2026-04-28 09:49', status: 'Success' },
  { id: '64', action: 'CreateSaleMutation', actor: 'Court Registrar', resource: 'REC-2026-15', time: '2026-04-28 09:30', status: 'Success' },
  { id: '63', action: 'AnchorBatch', actor: 'Admin', resource: 'Batch #4', time: '2026-04-27 18:22', status: 'Success' },
  { id: '62', action: 'PutLegalPrivateData', actor: 'Legal Authority', resource: 'REC-2026-12', time: '2026-04-27 16:15', status: 'Success' },
  { id: '61', action: 'UpdateJantriRate', actor: 'Revenue Admin', resource: 'Commercial-Zone', time: '2026-04-27 14:05', status: 'Success' },
  { id: '60', action: 'FinalizeSaleMutation', actor: 'Revenue Officer', resource: 'REC-2026-10', time: '2026-04-27 12:00', status: 'Success' },
  { id: '59', action: 'FreezeLandRecord', actor: 'Legal Authority', resource: 'REC-2026-8', time: '2026-04-27 10:30', status: 'Success' },
];

export default function AuditPage() {
  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div><h1>🔍 Audit Trail</h1><p>Immutable log of all ledger operations — 65 total events</p></div>
        <div style={{ display: 'flex', gap: 32 }}>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue-600)' }}>65</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>EVENTS</div></div>
          <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>0</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>FAILURES</div></div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--slate-100)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={16} color="var(--slate-400)" />
          <input className="input" placeholder="Search audit events..." style={{ border: 'none', boxShadow: 'none', padding: '6px 0' }} />
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
            {ENTRIES.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-400)' }}>#{e.id}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-500)' }}>{e.time}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{e.action}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--slate-600)' }}>{e.resource}</td>
                <td style={{ padding: '12px 16px' }}><span className="badge badge-info">{e.actor}</span></td>
                <td style={{ padding: '12px 16px' }}><span className="badge badge-success">{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
