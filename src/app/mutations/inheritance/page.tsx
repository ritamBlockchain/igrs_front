'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { CheckCircle, ArrowRight, Plus, Trash2, Search, FileCheck } from "lucide-react";

const STEPS = [
  { id: 1, title: 'Create Inheritance', actor: 'Revenue Admin', allowedRoles: ['Revenue Admin', 'Admin'], description: 'Register inheritance with heirs and shares' },
  { id: 2, title: 'Verify (Talati)', actor: 'Talati / Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification and heir validation by Talati' },
  { id: 3, title: 'Approve (Tehsildar)', actor: 'Tehsildar / Collector', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval of inheritance claim' },
  { id: 4, title: 'Finalize Transfer', actor: 'Talati / Revenue', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute transfer to heirs on ledger' },
];

export default function InheritanceMutationPage() {
  const { role } = useRole();
  const [step, setStep] = useState(1);
  const [heirs, setHeirs] = useState([{ name: '', share: '' }]);
  const canAct = role ? STEPS[step - 1].allowedRoles.includes(role) : false;

  const addHeir = () => setHeirs([...heirs, { name: '', share: '' }]);
  const removeHeir = (i: number) => setHeirs(heirs.filter((_, idx) => idx !== i));

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>👨‍👩‍👧‍👦 Inheritance Mutation Workflow</h1>
        <p>CREATED → VERIFIED_BY_TALATI → APPROVED_BY_TEHSILDAR → FINALIZED</p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <button onClick={() => setStep(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ 
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, 
                background: s.id < step ? 'var(--success)' : s.id === step ? 'var(--blue-600)' : 'var(--bg-hover)', 
                color: s.id <= step ? '#fff' : 'var(--text-muted)' 
              }}>
                {s.id < step ? <CheckCircle size={14} /> : s.id}
              </div>
              <span style={{ fontSize: 12, fontWeight: s.id === step ? 700 : 500, color: s.id === step ? 'var(--blue-700)' : 'var(--text-muted)' }}>{s.title}</span>
            </button>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: s.id < step ? 'var(--success)' : 'var(--border)', margin: '0 12px' }} />}
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ color: 'var(--text-heading)' }}>Step {step}: {STEPS[step - 1].title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{STEPS[step - 1].description}</p>
          </div>
          <span className={`badge ${canAct ? 'badge-success' : 'badge-error'}`}>
            {canAct ? '✓ You can act' : '✗ Not your role'}
          </span>
        </div>

        {step === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div><label className="label">Land ID *</label><input className="input" placeholder="e.g. REC-2026-13" /></div>
              <div><label className="label">Previous Owner (Deceased) *</label><input className="input" placeholder="Full name" /></div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 16 }}>Heirs & Shares</h3>
                <button className="btn btn-outline" onClick={addHeir} style={{ padding: '6px 12px', fontSize: 12 }}>
                  <Plus size={14} /> Add Heir
                </button>
              </div>
              {heirs.map((heir, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                  <div style={{ flex: 1 }}><label className="label">Heir Name</label><input className="input" placeholder="Full name" /></div>
                  <div style={{ width: 140 }}><label className="label">Share (%)</label><input className="input" type="number" placeholder="e.g. 50" /></div>
                  {heirs.length > 1 && <button onClick={() => removeHeir(i)} style={{ color: 'var(--error)', padding: 8 }}><Trash2 size={16} /></button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ padding: 16, background: 'var(--info-bg)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--blue-200)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--blue-700)', fontWeight: 600, marginBottom: 4 }}>
                <Search size={18} /> Field Verification Pending
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Talati must verify the deceased person's heirs and confirm the legitimacy of the shares.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="label">Verification ID</label><input className="input" placeholder="Auto-generated" readOnly style={{ background: 'var(--bg-hover)' }} /></div>
              <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" /></div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="label">Verification Notes</label>
              <textarea className="input" rows={3} placeholder="Enter field observation details..."></textarea>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ padding: 16, background: 'var(--warning-bg)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>
                <FileCheck size={18} /> Tehsildar Approval Awaiting
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status: VERIFIED_BY_TALATI. Tehsildar reviews Talati report and heirs list for final administrative approval.</p>
            </div>
            <label className="label">Land ID *</label>
            <input className="input" placeholder="Land ID to approve" />
          </div>
        )}

        {step === 4 && (
          <div>
            <div style={{ padding: 16, background: 'var(--success-bg)', borderRadius: 10, marginBottom: 20, border: '1px solid var(--success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)', fontWeight: 600, marginBottom: 4 }}>
                <CheckCircle size={18} /> Ready to Finalize
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Status: APPROVED_BY_TEHSILDAR. This will commit the ownership transfer to the Fabric ledger.</p>
            </div>
            <label className="label">Land ID *</label>
            <input className="input" placeholder="Land ID to finalize" />
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>← Back</button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ opacity: canAct ? 1 : 0.5, pointerEvents: canAct ? 'auto' : 'none' }}>
              Submit Transaction <ArrowRight size={16} />
            </button>
            {step < 4 && <button className="btn btn-outline" onClick={() => setStep(step + 1)}>Next →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
