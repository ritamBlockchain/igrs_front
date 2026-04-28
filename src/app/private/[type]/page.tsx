'use client';

import { useRole } from "@/context/RoleContext";
import { useParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, AlertTriangle, Shield, User, Gavel, Landmark } from "lucide-react";

const RBAC: Record<string, string[]> = {
  owner: ['Admin', 'Revenue Officer', 'Auditor'],
  legal: ['Admin', 'Legal Authority', 'Court Registrar', 'Auditor', 'IGR'],
  financial: ['Admin', 'Bank', 'Auditor', 'IGR'],
};

const META: Record<string, { title: string; emoji: string; color: string }> = {
  owner: { title: 'Owner Private Data (SideDB)', emoji: '👤', color: 'var(--blue-600)' },
  legal: { title: 'Legal Private Data (SideDB)', emoji: '📋', color: 'var(--warning)' },
  financial: { title: 'Financial Private Data (SideDB)', emoji: '🏦', color: 'var(--success)' },
};

const DATA: Record<string, Record<string, string>> = {
  owner: { ownerId: 'OWNER-001', name: 'John Doe', aadhaarHash: '123456789012', address: '123 Main St', mobile: '9876543210', email: 'john@example.com', kycHash: 'kyc123456', updatedAt: '2026-04-28T09:49:09Z' },
  legal: { caseReference: 'CASE-2026-001', courtOrderRef: 'ORDER-001', freezeReason: 'Injunction', encumbranceNotes: 'Stay on transfer', effectiveFrom: 'ACTIVE', updatedAt: '2026-04-28T09:52:01Z' },
  financial: { lenderId: 'BANK-001', loanAccountRef: 'LOAN-2026-001', encumbranceAmount: '500000', mortgageStatus: 'Active', lienNotes: 'Agricultural loan', updatedAt: '2026-04-28T09:52:09Z' },
};

const SENSITIVE = ['aadhaarHash', 'kycHash', 'mobile', 'email', 'encumbranceAmount'];

export default function PrivateDataPage() {
  const { role } = useRole();
  const params = useParams();
  const type = params.type as string;
  const [show, setShow] = useState(false);

  const hasAccess = role ? RBAC[type]?.includes(role) : false;
  const meta = META[type];
  const data = DATA[type];

  if (!hasAccess) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: 16 }} />
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--slate-500)', marginTop: 8 }}>Your role ({role}) cannot access {type} private data.</p>
        <p style={{ color: 'var(--slate-400)', fontSize: 13, marginTop: 8 }}>Required: {RBAC[type]?.join(', ')}</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div><h1>{meta?.emoji} {meta?.title}</h1><p>Encrypted SideDB collection — all access is audit-logged</p></div>
        <button className={`btn ${show ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShow(!show)}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? 'Hide Sensitive' : 'Decrypt View'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Lookup</h3>
          <label className="label">Record ID</label>
          <input className="input" placeholder="REC-2026-1" defaultValue="REC-2026-1" style={{ marginBottom: 16 }} />
          <button className="btn btn-primary" style={{ width: '100%' }}>Retrieve from SideDB</button>
          <div style={{ marginTop: 20, padding: 12, background: 'var(--blue-50)', borderRadius: 8, fontSize: 11, color: 'var(--slate-600)' }}>
            <Shield size={14} style={{ display: 'inline', marginRight: 6 }} /> All access is logged to the Fabric audit trail.
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {data && Object.entries(data).map(([key, val]) => (
              <div key={key}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: SENSITIVE.includes(key) && !show ? 'var(--slate-300)' : 'var(--slate-800)' }}>
                  {SENSITIVE.includes(key) && !show ? '•••••••••' : val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
