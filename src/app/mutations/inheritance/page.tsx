'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { CheckCircle, ArrowRight, Plus, Trash2 } from "lucide-react";

const STEPS = [
  { id: 1, title: 'Create Inheritance', actor: 'Revenue', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Register inheritance with heirs' },
  { id: 2, title: 'Approve', actor: 'Tehsildar', allowedRoles: ['Revenue Officer', 'Collector', 'Admin'], description: 'Revenue approval' },
  { id: 3, title: 'Finalize', actor: 'Revenue', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute transfer to heirs' },
];

export default function InheritancePage() {
  const { role } = useRole();
  const [step, setStep] = useState(1);
  const [heirs, setHeirs] = useState([{ name: '', share: '' }]);
  const canAct = role ? STEPS[step - 1].allowedRoles.includes(role) : false;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>👨‍👩‍👧‍👦 Inheritance Workflow</h1>
        <p>CREATED → APPROVED → FINALIZED (3 steps)</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3>Step {step}: {STEPS[step-1].title}</h3>
          <span className={`badge ${canAct ? 'badge-success' : 'badge-error'}`}>{canAct ? '✓ Can act' : '✗ Not your role'}</span>
        </div>

        {step === 1 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><label className="label">Land ID *</label><input className="input" placeholder="REC-2026-13" /></div>
              <div><label className="label">Previous Owner *</label><input className="input" placeholder="Deceased owner" /></div>
            </div>
            <h3 style={{ marginBottom: 12 }}>Heirs</h3>
            {heirs.map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <input className="input" placeholder="Heir name" style={{ flex: 1 }} />
                <input className="input" placeholder="Share %" type="number" style={{ width: 120 }} />
                {heirs.length > 1 && <button onClick={() => setHeirs(heirs.filter((_, j) => j !== i))} style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>}
              </div>
            ))}
            <button className="btn btn-outline" onClick={() => setHeirs([...heirs, { name: '', share: '' }])} style={{ marginTop: 8, fontSize: 12 }}><Plus size={14} /> Add Heir</button>
          </>
        )}
        {step === 2 && <div><label className="label">Land ID *</label><input className="input" placeholder="Approve this land ID" /></div>}
        {step === 3 && <div><label className="label">Land ID *</label><input className="input" placeholder="Finalize this land ID" /></div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
          <button className="btn btn-outline" onClick={() => setStep(Math.max(1, step - 1))}>← Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ opacity: canAct ? 1 : 0.4 }}>Submit <ArrowRight size={16} /></button>
            {step < 3 && <button className="btn btn-outline" onClick={() => setStep(step + 1)}>Next →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
