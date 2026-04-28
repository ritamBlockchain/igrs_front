'use client';

import { useRole } from "@/context/RoleContext";
import { Settings, Shield, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const { role } = useRole();

  if (role !== 'Admin') {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: 16 }} />
        <h2>Admin Only</h2>
        <p style={{ color: 'var(--slate-500)' }}>System settings are restricted to the Admin role.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>⚙️ System Settings</h1>
        <p>Governance configuration for the Hyperledger Fabric network</p>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 20 }}>Multi-Signature Policy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label className="label">Min Freeze Endorsements</label>
            <input className="input" type="number" defaultValue={2} />
            <p style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 4 }}>Minimum approvals required to freeze a record</p>
          </div>
          <div>
            <label className="label">Min Unfreeze Endorsements</label>
            <input className="input" type="number" defaultValue={2} />
            <p style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 4 }}>Minimum approvals required to unfreeze a record</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 20 }}>Channel Endorsement Policy</h3>
        <div style={{ padding: 16, background: 'var(--slate-50)', borderRadius: 10, marginBottom: 16 }}>
          <code className="mono" style={{ fontSize: 13, color: 'var(--slate-700)' }}>AND(&apos;Org1MSP.peer&apos;, &apos;Org2MSP.peer&apos;)</code>
        </div>
        <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>Both organizations must endorse all transactions. This policy is enforced at the Fabric protocol level.</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ marginBottom: 20 }}>Network Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { label: 'Fabric Gateway', value: 'Connected', status: 'success' },
            { label: 'PostgreSQL', value: '37 records', status: 'success' },
            { label: 'CCaaS Org1', value: 'Running', status: 'success' },
            { label: 'CCaaS Org2', value: 'Running', status: 'success' },
            { label: 'Polygon Anchoring', value: 'Amoy Testnet', status: 'success' },
            { label: 'Event Listener', value: 'Active', status: 'success' },
          ].map(s => (
            <div key={s.label} style={{ padding: 16, background: 'var(--slate-50)', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>● {s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
