'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { CheckCircle, ArrowRight } from "lucide-react";

const STEPS = [
  { id: 1, title: 'Create Gift Mutation', actor: 'Registrar', allowedRoles: ['Court Registrar', 'Admin'], description: 'Register gift deed with donor/recipient details' },
  { id: 2, title: 'Verify (Talati)', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification and document validation' },
  { id: 3, title: 'Approve (Tehsildar)', actor: 'Collector', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval by Tehsildar' },
  { id: 4, title: 'Finalize Transfer', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute gift transfer on ledger' },
];

export default function GiftMutationPage() {
  const { role } = useRole();
  const [step, setStep] = useState(1);
  const canAct = role ? STEPS[step - 1].allowedRoles.includes(role) : false;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🎁 Gift Mutation Workflow</h1>
        <p>CREATED → VERIFIED_BY_TALATI → APPROVED_BY_TEHSILDAR → FINALIZED</p>
      </div>

      <Stepper steps={STEPS} current={step} onStepClick={setStep} />

      <div className="card" style={{ padding: 28, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div><h3>{STEPS[step - 1].title}</h3><p style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 4 }}>{STEPS[step - 1].description}</p></div>
          <span className={`badge ${canAct ? 'badge-success' : 'badge-error'}`}>{canAct ? '✓ You can act' : '✗ Not your role'}</span>
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="label">Land ID *</label><input className="input" placeholder="e.g. REC-2026-14" /></div>
            <div><label className="label">Gift Deed Hash *</label><input className="input mono" placeholder="SHA-256 hash" /></div>
            <div><label className="label">Donor (Current Owner) *</label><input className="input" placeholder="Full name" /></div>
            <div><label className="label">Recipient *</label><input className="input" placeholder="Full name" /></div>
            <div><label className="label">Registrar ID</label><input className="input" placeholder="Auto-filled" /></div>
            <div><label className="label">Type</label><input className="input" value="GIFT" readOnly style={{ background: 'var(--slate-50)' }} /></div>
          </div>
        )}
        {step === 2 && (<div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" /></div>)}
        {step === 3 && (<div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to approve" /></div>)}
        {step === 4 && (
          <div>
            <div style={{ padding: 16, background: 'var(--success-bg)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--success)', fontWeight: 600 }}>Ready to finalize gift transfer</div>
            <label className="label">Land ID *</label><input className="input" placeholder="Land ID to finalize" />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
          <button className="btn btn-outline" onClick={() => setStep(Math.max(1, step - 1))}>← Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ opacity: canAct ? 1 : 0.4 }}>Submit Tx <ArrowRight size={16} /></button>
            {step < 4 && <button className="btn btn-outline" onClick={() => setStep(step + 1)}>Next →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ steps, current, onStepClick }: { steps: typeof STEPS; current: number; onStepClick: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: '#fff', borderRadius: 14, border: '1px solid var(--slate-200)' }}>
      {steps.map((s, i) => (
        <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <button onClick={() => onStepClick(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: s.id < current ? 'var(--success)' : s.id === current ? 'var(--blue-600)' : 'var(--slate-100)', color: s.id <= current ? '#fff' : 'var(--slate-400)' }}>
              {s.id < current ? <CheckCircle size={14} /> : s.id}
            </div>
            <span style={{ fontSize: 12, fontWeight: s.id === current ? 700 : 500, color: s.id === current ? 'var(--blue-700)' : 'var(--slate-400)' }}>{s.title}</span>
          </button>
          {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: s.id < current ? 'var(--success)' : 'var(--slate-100)', margin: '0 12px' }} />}
        </div>
      ))}
    </div>
  );
}
