'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

const STEPS = [
  { id: 1, title: 'Register Govt Order', actor: 'Legal/Admin', allowedRoles: ['Legal Authority', 'Revenue Admin', 'Admin'], description: 'Register acquisition or land use change' },
  { id: 2, title: 'Verify', actor: 'Revenue', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification' },
  { id: 3, title: 'Approve', actor: 'Tehsildar', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval' },
  { id: 4, title: 'Execute Order', actor: 'Revenue', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute on ledger' },
];

export default function GovernmentOrderPage() {
  const { role } = useRole();
  const [step, setStep] = useState(1);
  const canAct = role ? STEPS[step-1].allowedRoles.includes(role) : false;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🏛️ Government Order Workflow</h1>
        <p>LAND_USE_CHANGE or ACQUISITION → 4-step process</p>
      </div>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3>Step {step}: {STEPS[step-1].title}</h3>
          <span className={`badge ${canAct ? 'badge-success' : 'badge-error'}`}>{canAct ? '✓ Can act' : '✗ Not your role'}</span>
        </div>
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="label">Order Type *</label>
              <select className="input"><option>LAND_USE_CHANGE</option><option>ACQUISITION</option></select>
            </div>
            <div><label className="label">Land ID *</label><input className="input" placeholder="REC-2026-XX" /></div>
            <div><label className="label">Collector ID</label><input className="input" placeholder="Collector" /></div>
            <div><label className="label">New Land Type (if use change)</label>
              <select className="input"><option value="">N/A</option><option>Residential</option><option>Commercial</option><option>Industrial</option></select>
            </div>
          </div>
        )}
        {step > 1 && <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID" /></div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
          <button className="btn btn-outline" onClick={() => setStep(Math.max(1, step-1))}>← Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ opacity: canAct ? 1 : 0.4 }}>Submit <ArrowRight size={16} /></button>
            {step < 4 && <button className="btn btn-outline" onClick={() => setStep(step+1)}>Next →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
