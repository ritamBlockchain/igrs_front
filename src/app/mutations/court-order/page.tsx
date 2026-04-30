'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { CheckCircle, AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

interface Step {
  id: number;
  title: string;
  actor: string;
  allowedRoles: string[];
  description: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Register Court Order', actor: 'Legal Authority', allowedRoles: ['Court Registrar', 'Collector', 'Admin'], description: 'Register case and court decision' },
  { id: 2, title: 'Verify (Talati)', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification of court order' },
  { id: 3, title: 'Approve (Tehsildar)', actor: 'Tehsildar', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval' },
  { id: 4, title: 'Execute Order', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Transfer per court decision' },
];

export default function CourtOrderPage() {
  const { role } = useRole();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [landId, setLandId] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [courtName, setCourtName] = useState('');
  const [decision, setDecision] = useState('TRANSFER');
  const [newOwner, setNewOwner] = useState('');
  const [orderDate, setOrderDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const handleCreateMutation = async () => {
    if (!landId || !caseNumber || !courtName || !newOwner) {
      setResult({ success: false, message: 'Land ID, Case Number, Court Name, and New Owner are required' });
      return;
    }
    setSubmitting(true);
    setResult(null);
    try {
      await api.createMutation({
        record_id: landId,
        current_owner: '',
        new_owner: newOwner,
        mutation_type: 'Court Order',
        supporting_doc: caseNumber,
        initiated_by: role || 'Court Registrar',
        role: role || 'Court Registrar',
        case_number: caseNumber,
        court: courtName,
        decision: decision,
      });
      setResult({ success: true, message: 'Court order registered on ledger! Moving to verification...' });
      setTimeout(() => { setCurrentStep(2); setResult(null); }, 2000);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed to register court order' });
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
      if (action === 'verify') res = await api.verifyTalati(landId, 'COURT ORDER');
      else if (action === 'approve') res = await api.approveMutation(landId, 'COURT ORDER');
      else if (action === 'finalize') res = await api.finalizeMutation(landId, 'COURT ORDER');

      setResult({ success: true, message: res?.message || `${action} successful!` });
      if (nextStep) {
        setTimeout(() => { setCurrentStep(nextStep); setResult(null); }, 2000);
      } else if (action === 'finalize') {
        setTimeout(() => {
          setLandId(''); setCaseNumber(''); setCourtName(''); setNewOwner(''); setOrderDate('');
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
    <div className="animate-in">
      <div className="page-header">
        <h1>⚖️ Court Order Workflow</h1>
        <p>REGISTERED → VERIFIED → APPROVED → EXECUTED (4 steps)</p>
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
            <div><label className="label">Case Number *</label><input className="input" placeholder="CASE-2026-001" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} /></div>
            <div><label className="label">Court Name *</label><input className="input" placeholder="High Court" value={courtName} onChange={e => setCourtName(e.target.value)} /></div>
            <div><label className="label">Land ID *</label><input className="input" placeholder="REC-2026-12" value={landId} onChange={e => setLandId(e.target.value)} /></div>
            <div>
              <label className="label">Decision *</label>
              <select className="input" value={decision} onChange={e => setDecision(e.target.value)}>
                <option value="TRANSFER">TRANSFER</option>
                <option value="PARTITION">PARTITION</option>
                <option value="RESTORATION">RESTORATION</option>
              </select>
            </div>
            <div><label className="label">New Owner *</label><input className="input" placeholder="Court-assigned owner" value={newOwner} onChange={e => setNewOwner(e.target.value)} /></div>
            <div><label className="label">Order Date</label><input className="input" type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} /></div>
          </div>
        </StepCard>
      )}

      {currentStep === 2 && (
        <StepCard step={STEPS[1]} role={role} onSubmit={() => handleWorkflowStep('verify', 3)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--blue-50)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--blue-200)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 4 }}>Court Order Verification</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Case: {caseNumber || 'N/A'} · Land: {landId || 'Unknown'} · Decision: {decision}</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" value={landId} onChange={e => setLandId(e.target.value)} /></div>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Ready to Execute</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: APPROVED_BY_TEHSILDAR · Ownership will be transferred per court decision</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to execute" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>This will execute the court order on the Fabric ledger, transferring ownership as decreed.</p>
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
