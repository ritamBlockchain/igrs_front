'use client';

import { useRole } from "@/context/RoleContext";
import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Gift } from "lucide-react";
import { api } from "@/lib/api";
import { LandLineageTree } from "@/components/LandLineageTree";
import CONFIG from "@/lib/config";

interface Step {
  id: number;
  title: string;
  actor: string;
  allowedRoles: string[];
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Create Gift Mutation', actor: 'Registrar', allowedRoles: ['Court Registrar', 'Admin'], description: 'Register gift deed with donor/recipient details' },
  { id: 2, title: 'Verify (Talati)', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification and document validation' },
  { id: 3, title: 'Approve (Tehsildar)', actor: 'Collector', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval by Tehsildar' },
  { id: 4, title: 'Finalize Transfer', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute gift transfer on ledger' },
];

export default function GiftMutationPage() {
  const { role } = useRole();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [landId, setLandId] = useState('');
  const [donor, setDonor] = useState('');
  const [recipient, setRecipient] = useState('');
  const [giftDeedHash, setGiftDeedHash] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Auto-generate gift deed hash
  useEffect(() => {
    if (landId && donor && recipient) {
      const computeHash = async (text: string) => {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };
      const payload = `GIFT_DEED|${landId}|${donor}|${recipient}|${new Date().toISOString().split('T')[0]}`;
      computeHash(payload).then(setGiftDeedHash);
    } else {
      setGiftDeedHash('');
    }
  }, [landId, donor, recipient]);

  const handleCreateMutation = async () => {
    if (!landId || !donor || !recipient || !giftDeedHash) {
      setResult({ success: false, message: 'All required fields must be filled' });
      return;
    }
    setShowConfirmationModal(true);
  };

  const handleConfirmCreateMutation = async () => {
    setShowConfirmationModal(false);
    setSubmitting(true);
    setResult(null);
    try {
      await api.createMutation({
        record_id: landId,
        current_owner: donor,
        new_owner: recipient,
        mutation_type: 'Gift',
        supporting_doc: giftDeedHash,
        initiated_by: role || 'Registrar',
        role: role || 'Court Registrar',
      });
      setResult({ success: true, message: 'Gift mutation created successfully! Moving to next step...' });
      setTimeout(() => { setCurrentStep(2); setResult(null); }, 2000);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed to create mutation' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleWorkflowStep = async (action: 'verify' | 'approve' | 'finalize', nextStep?: number) => {
    if (!landId) {
      setResult({ success: false, message: 'Land ID is required' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      let res;
      if (action === 'verify') res = await api.verifyTalati(landId, 'GIFT');
      else if (action === 'approve') res = await api.approveMutation(landId, 'GIFT');
      else if (action === 'finalize') res = await api.finalizeMutation(landId, 'GIFT');

      setResult({ success: true, message: res?.message || `${action} successful!` });
      if (nextStep) {
        setTimeout(() => { setCurrentStep(nextStep); setResult(null); }, 2000);
      } else if (action === 'finalize') {
        setTimeout(() => {
          setLandId(''); setDonor(''); setRecipient('');
          setCurrentStep(1); setResult(null);
        }, 3000);
      }
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : `Failed to ${action}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="animate-in">
      <div className="page-header">
        <h1>🎁 Gift Mutation Workflow</h1>
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
        <StepCard step={STEPS[0]} role={role} onSubmit={handleCreateMutation} loading={submitting} result={result}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label className="label">Land ID *</label><input className="input" placeholder="e.g. REC-2026-14" value={landId} onChange={e => setLandId(e.target.value)} /></div>
            <div>
              <label className="label">Gift Deed Hash *</label>
              <input className="input mono" placeholder="SHA-256 hash (auto-generated)" value={giftDeedHash} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
            </div>
            <div><label className="label">Donor (Current Owner) *</label><input className="input" placeholder="Full name" value={donor} onChange={e => setDonor(e.target.value)} /></div>
            <div><label className="label">Recipient *</label><input className="input" placeholder="Full name" value={recipient} onChange={e => setRecipient(e.target.value)} /></div>
            <div><label className="label">Registrar ID</label><input className="input" value={role || 'Auto-filled from session'} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} /></div>
            <div><label className="label">Mutation Type</label><input className="input" value="GIFT" readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} /></div>
          </div>
        </StepCard>
      )}

      {currentStep === 2 && (
        <StepCard step={STEPS[1]} role={role} onSubmit={() => handleWorkflowStep('verify', 3)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--blue-50)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 4 }}>Pending Verification</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Land ID: {landId || 'Unknown'} · Donor: {donor || 'Current Owner'} → Recipient: {recipient || 'New Owner'}</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>Talati confirms field inspection, donor identity, and gift deed document validity.</p>
        </StepCard>
      )}

      {currentStep === 3 && (
        <StepCard step={STEPS[2]} role={role} onSubmit={() => handleWorkflowStep('approve', 4)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--warning-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Awaiting Tehsildar Approval</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: VERIFIED_BY_TALATI · Ready for administrative sign-off</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to approve" value={landId} onChange={e => setLandId(e.target.value)} /></div>
        </StepCard>
      )}

      {currentStep === 4 && (
        <StepCard step={STEPS[3]} role={role} onSubmit={() => handleWorkflowStep('finalize')} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--success-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Ready to Finalize</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: APPROVED_BY_TEHSILDAR · Ownership will be transferred to recipient</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to finalize" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>This will transfer ownership from donor to recipient, update the owner on the ledger record, increment version, and recompute record hash.</p>
        </StepCard>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
        <button className="btn btn-outline" onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} disabled={currentStep === 1}>← Previous</button>
        <button className="btn btn-outline" onClick={() => setCurrentStep(Math.min(4, currentStep + 1))} disabled={currentStep === 4}>Next →</button>
      </div>

      {/* Lineage Tree Visualization */}
      {landId && (
        <div style={{ marginTop: 40, borderTop: '2px solid var(--slate-100)', paddingTop: 40 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8 }}>Land Lineage Hierarchy</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: 14 }}>Visualize the historical evolution and current subdivision of land parcel {landId}</p>
          </div>
          <LandLineageTree 
            apiUrl={CONFIG.API_BASE_URL} 
            recordId={landId} 
          />
        </div>
      )}
    </div>

    {/* Confirmation Modal */}
    {showConfirmationModal && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'fadeIn 0.3s ease-out'
      }}>
        <div style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          padding: 52,
          borderRadius: 24,
          maxWidth: 540,
          width: '92%',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          border: '1px solid rgba(255, 255, 255, 0.8)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 50%, #fca5a5 100%)',
              width: 80,
              height: 80,
              borderRadius: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 8px 20px -4px rgba(220, 38, 38, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.5)',
              animation: 'pulse 2s infinite'
            }}>
              <AlertTriangle size={40} style={{ color: '#dc2626', filter: 'drop-shadow(0 2px 4px rgba(220, 38, 38, 0.2))' }} />
            </div>
            <h3 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 14px', color: '#0f172a', letterSpacing: '-0.03em', textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Confirm Data Authenticity</h3>
            <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.7, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>
              The data you have provided will be submitted for verification by Talati. Please ensure all information is accurate and authentic before proceeding.
            </p>
          </div>

          <div style={{ 
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
            padding: 24, 
            borderRadius: 16, 
            marginBottom: 36, 
            border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <div style={{ width: 32, height: 2, background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)' }}></div>
              Transaction Details
              <div style={{ width: 32, height: 2, background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)' }}></div>
            </div>
            <div style={{ fontSize: 15, color: '#334155', lineHeight: 2.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(226, 232, 240, 0.5)' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Land ID</span>
                <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{landId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(226, 232, 240, 0.5)' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Donor</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{donor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(226, 232, 240, 0.5)' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Recipient</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{recipient}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', marginTop: 4, background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05))', borderRadius: 8, marginLeft: -16, marginRight: -16, marginBottom: -8 }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Mutation Type</span>
                <span style={{ fontWeight: 900, color: '#ec4899', fontSize: 16 }}>GIFT</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <button
              onClick={() => setShowConfirmationModal(false)}
              style={{
                flex: 1,
                padding: '18px 36px',
                fontSize: 16,
                borderRadius: 14,
                fontWeight: 700,
                background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
                color: '#475569',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(145deg, #e2e8f0, #cbd5e1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(145deg, #f1f5f9, #e2e8f0)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCreateMutation}
              style={{
                flex: 1,
                padding: '18px 36px',
                fontSize: 16,
                borderRadius: 14,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #be185d 100%)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 6px 12px -2px rgba(236, 72, 153, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(236, 72, 153, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 12px -2px rgba(236, 72, 153, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)';
              }}
            >
              Agree & Submit
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function StepCard({ step, role, children, onSubmit, loading, result }: {
  step: Step; role: string | null; children: React.ReactNode;
  onSubmit?: () => void; loading?: boolean; result?: {success: boolean, message: string} | null;
}) {
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
      {result && (
        <div style={{
          marginBottom: 16, padding: 12, borderRadius: 8,
          background: result.success ? 'var(--green-50)' : 'var(--red-50)',
          color: result.success ? 'var(--green-700)' : 'var(--red-700)',
          fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8
        }}>
          {result.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {result.message}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
        <button
          className="btn btn-primary"
          style={{ opacity: canAct && !loading ? 1 : 0.4, pointerEvents: canAct && !loading ? 'auto' : 'none' }}
          onClick={onSubmit}
          disabled={!canAct || loading}
        >
          {loading ? <><RefreshCw size={16} className="spin" /> Submitting...</> : <>Submit Transaction <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}
