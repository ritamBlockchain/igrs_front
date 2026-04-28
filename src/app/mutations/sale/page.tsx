'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { CheckCircle, Circle, ArrowRight } from "lucide-react";

interface Step {
  id: number;
  title: string;
  actor: string;
  allowedRoles: string[];
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Create Sale Mutation', actor: 'Registrar', allowedRoles: ['Court Registrar', 'Admin'], description: 'Register sale deed with seller/buyer details' },
  { id: 2, title: 'Verify (Talati)', actor: 'Talati / Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification by Talati' },
  { id: 3, title: 'Approve (Tehsildar)', actor: 'Tehsildar / Collector', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval by Tehsildar' },
  { id: 4, title: 'Finalize Transfer', actor: 'Talati / Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute ownership transfer on ledger' },
];

export default function SaleMutationPage() {
  const { role } = useRole();
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>💰 Sale Mutation Workflow</h1>
        <p>CREATED → VERIFIED_BY_TALATI → APPROVED_BY_TEHSILDAR → FINALIZED</p>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, padding: '20px 24px', background: '#fff', borderRadius: 16, border: '1px solid var(--slate-200)' }}>
        {STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setCurrentStep(step.id)}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                background: step.id < currentStep ? 'var(--success)' : step.id === currentStep ? 'var(--blue-600)' : 'var(--slate-100)',
                color: step.id <= currentStep ? '#fff' : 'var(--slate-400)',
                transition: 'all 0.2s',
              }}>
                {step.id < currentStep ? <CheckCircle size={16} /> : step.id}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: step.id === currentStep ? 700 : 500, color: step.id === currentStep ? 'var(--blue-700)' : 'var(--slate-500)' }}>{step.title}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{step.actor}</div>
              </div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: step.id < currentStep ? 'var(--success)' : 'var(--slate-100)', margin: '0 16px', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <StepCard step={STEPS[0]} role={role}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="label">Land ID *</label><input className="input" placeholder="e.g. REC-2026-15" /></div>
            <div><label className="label">Sale Deed Hash *</label><input className="input mono" placeholder="SHA-256 hash" /></div>
            <div><label className="label">Seller (Current Owner) *</label><input className="input" placeholder="Full name" /></div>
            <div><label className="label">Buyer (New Owner) *</label><input className="input" placeholder="Full name" /></div>
            <div><label className="label">Registrar ID</label><input className="input" placeholder="Auto-filled from session" /></div>
            <div><label className="label">Mutation Type</label><input className="input" value="SALE" readOnly style={{ background: 'var(--slate-50)' }} /></div>
          </div>
        </StepCard>
      )}

      {currentStep === 2 && (
        <StepCard step={STEPS[1]} role={role}>
          <div style={{ padding: 20, background: 'var(--blue-50)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 4 }}>Pending Verification</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Land ID: ANCHOR-TEST-LAND-15 · Seller: Current Owner → Buyer: Alice Smith</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>Talati confirms field inspection and document validity.</p>
        </StepCard>
      )}

      {currentStep === 3 && (
        <StepCard step={STEPS[2]} role={role}>
          <div style={{ padding: 20, background: 'var(--warning-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Awaiting Tehsildar Approval</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: VERIFIED_BY_TALATI · Ready for administrative sign-off</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to approve" /></div>
        </StepCard>
      )}

      {currentStep === 4 && (
        <StepCard step={STEPS[3]} role={role}>
          <div style={{ padding: 20, background: 'var(--success-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Ready to Finalize</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: APPROVED_BY_TEHSILDAR · Ownership will be transferred to buyer</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to finalize" /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>This will close previous ownership, create new ownership entry, update owner on record, increment version, and recompute record hash.</p>
        </StepCard>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button className="btn btn-outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>← Previous</button>
        <button className="btn btn-outline" onClick={() => setCurrentStep(Math.min(4, currentStep + 1))} disabled={currentStep === 4}>Next →</button>
      </div>
    </div>
  );
}

function StepCard({ step, role, children }: { step: Step; role: string | null; children: React.ReactNode }) {
  const canAct = role ? step.allowedRoles.includes(role) : false;
  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3>{step.title}</h3>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginTop: 4 }}>{step.description}</p>
        </div>
        <span className={`badge ${canAct ? 'badge-success' : 'badge-error'}`}>
          {canAct ? '✓ You can act' : '✗ Not your role'}
        </span>
      </div>
      <div style={{ marginBottom: 20 }}>{children}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
        <button className="btn btn-primary" style={{ opacity: canAct ? 1 : 0.4, pointerEvents: canAct ? 'auto' : 'none' }}>
          Submit Transaction <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
