'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Plus, Trash2 } from "lucide-react";
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
  { id: 1, title: 'Create Inheritance', actor: 'Revenue Admin', allowedRoles: ['Revenue Admin', 'Admin'], description: 'Register inheritance with heirs and shares' },
  { id: 2, title: 'Verify (Talati)', actor: 'Talati / Revenue Officer', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Field verification and heir validation by Talati' },
  { id: 3, title: 'Approve (Tehsildar)', actor: 'Tehsildar / Collector', allowedRoles: ['Collector', 'Admin'], description: 'Administrative approval of inheritance claim' },
  { id: 4, title: 'Finalize Transfer', actor: 'Talati / Revenue', allowedRoles: ['Revenue Officer', 'Revenue Admin', 'Admin'], description: 'Execute transfer to heirs on ledger' },
];

export default function InheritanceMutationPage() {
  const { role } = useRole();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [landId, setLandId] = useState('');
  const [previousOwner, setPreviousOwner] = useState('');
  const [heirs, setHeirs] = useState([{ name: '', share: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const addHeir = () => setHeirs([...heirs, { name: '', share: '' }]);
  const removeHeir = (i: number) => setHeirs(heirs.filter((_, idx) => idx !== i));
  const updateHeir = (i: number, field: 'name' | 'share', value: string) => {
    const updated = [...heirs];
    updated[i][field] = value;
    setHeirs(updated);
  };

  const totalShares = heirs.reduce((sum, h) => sum + (parseFloat(h.share) || 0), 0);

  const handleCreateMutation = async () => {
    if (!landId || !previousOwner) {
      setResult({ success: false, message: 'Land ID and Previous Owner are required' });
      return;
    }
    const validHeirs = heirs.filter(h => h.name.trim() && h.share.trim());
    if (validHeirs.length === 0) {
      setResult({ success: false, message: 'At least one heir with name and share is required' });
      return;
    }
    if (Math.abs(totalShares - 100) > 0.01) {
      setResult({ success: false, message: `Heir shares must total 100%. Current total: ${totalShares.toFixed(1)}%` });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      await api.createMutation({
        record_id: landId,
        current_owner: previousOwner,
        new_owner: validHeirs.map(h => h.name).join(', '),
        mutation_type: 'Inheritance',
        supporting_doc: `INHERITANCE|${landId}|${previousOwner}`,
        initiated_by: role || 'Revenue Admin',
        role: role || 'Revenue Admin',
        sub_divisions: validHeirs.map(h => ({ owner_name: h.name, area: h.share })),
      });
      setResult({ success: true, message: 'Inheritance mutation created! Moving to verification...' });
      setTimeout(() => { setCurrentStep(2); setResult(null); }, 2000);
    } catch (err) {
      setResult({ success: false, message: err instanceof Error ? err.message : 'Failed to create inheritance mutation' });
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
      if (action === 'verify') res = await api.verifyTalati(landId, 'INHERITANCE');
      else if (action === 'approve') res = await api.approveMutation(landId, 'INHERITANCE');
      else if (action === 'finalize') res = await api.finalizeMutation(landId, 'INHERITANCE');

      setResult({ success: true, message: res?.message || `${action} successful!` });
      if (nextStep) {
        setTimeout(() => { setCurrentStep(nextStep); setResult(null); }, 2000);
      } else if (action === 'finalize') {
        setTimeout(() => {
          setLandId(''); setPreviousOwner(''); setHeirs([{ name: '', share: '' }]);
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
        <h1>👨‍👩‍👧‍👦 Inheritance Mutation Workflow</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div><label className="label">Land ID *</label><input className="input" placeholder="e.g. REC-2026-13" value={landId} onChange={e => setLandId(e.target.value)} /></div>
            <div><label className="label">Previous Owner (Deceased) *</label><input className="input" placeholder="Full name" value={previousOwner} onChange={e => setPreviousOwner(e.target.value)} /></div>
          </div>

          <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, margin: 0 }}>Heirs & Shares</h3>
                <p style={{ fontSize: 12, color: totalShares === 100 ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
                  Total: {totalShares.toFixed(1)}% {totalShares === 100 ? '✓' : `(must equal 100%)`}
                </p>
              </div>
              <button className="btn btn-outline" onClick={addHeir} style={{ padding: '6px 12px', fontSize: 12 }}>
                <Plus size={14} /> Add Heir
              </button>
            </div>
            {heirs.map((heir, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Heir Name</label>
                  <input className="input" placeholder="Full name" value={heir.name} onChange={e => updateHeir(i, 'name', e.target.value)} />
                </div>
                <div style={{ width: 140 }}>
                  <label className="label">Share (%)</label>
                  <input className="input" type="number" placeholder="e.g. 50" value={heir.share} onChange={e => updateHeir(i, 'share', e.target.value)} />
                </div>
                {heirs.length > 1 && (
                  <button onClick={() => removeHeir(i)} style={{ color: 'var(--error)', padding: 8, cursor: 'pointer', background: 'none', border: 'none' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </StepCard>
      )}

      {currentStep === 2 && (
        <StepCard step={STEPS[1]} role={role} onSubmit={() => handleWorkflowStep('verify', 3)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--blue-50)', borderRadius: 12, marginBottom: 16, border: '1px solid var(--blue-200)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 4 }}>Field Verification Pending</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Talati must verify the deceased person&apos;s heirs and confirm the legitimacy of the shares.</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" value={landId} onChange={e => setLandId(e.target.value)} /></div>
        </StepCard>
      )}

      {currentStep === 3 && (
        <StepCard step={STEPS[2]} role={role} onSubmit={() => handleWorkflowStep('approve', 4)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--warning-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Awaiting Tehsildar Approval</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: VERIFIED_BY_TALATI · Tehsildar reviews Talati report and heirs list for final administrative approval.</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to approve" value={landId} onChange={e => setLandId(e.target.value)} /></div>
        </StepCard>
      )}

      {currentStep === 4 && (
        <StepCard step={STEPS[3]} role={role} onSubmit={() => handleWorkflowStep('finalize')} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--success-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Ready to Finalize</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: APPROVED_BY_TEHSILDAR · This will commit the ownership transfer to the Fabric ledger.</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to finalize" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>This will transfer ownership to heirs per their shares, update the owner on the ledger, increment version, and recompute record hash.</p>
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
