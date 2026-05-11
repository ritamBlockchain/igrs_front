'use client';

import { useRole } from "@/context/RoleContext";
import { useState, useEffect } from "react";
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
  const [totalArea, setTotalArea] = useState(0);
  const [heirs, setHeirs] = useState([{ name: '', share: '', area: '' }]);

  // Auto-fill previous owner name when landId is entered
  useEffect(() => {
    const fetchCurrentOwner = async () => {
      if (landId.length >= 4) {
        try {
          const data = await api.getRecord(landId);
          if (data && data.record) {
            if (data.record.owner_name) setPreviousOwner(data.record.owner_name);
            if (data.record.area) setTotalArea(Number(data.record.area));
            else if (data.record.area_sq_m) setTotalArea(Number(data.record.area_sq_m));
          }
        } catch (err) {
          console.debug("Auto-fetch owner failed for ID:", landId);
        }
      }
    };
    const timer = setTimeout(fetchCurrentOwner, 600);
    return () => clearTimeout(timer);
  }, [landId]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);

  const addHeir = () => setHeirs([...heirs, { name: '', share: '', area: '' }]);
  const removeHeir = (i: number) => setHeirs(heirs.filter((_, idx) => idx !== i));
  
  const updateHeir = (i: number, field: 'name' | 'share' | 'area', value: string) => {
    const updated = [...heirs];
    updated[i][field] = value;

    if (field === 'area' && totalArea > 0) {
      const areaVal = parseFloat(value);
      if (!isNaN(areaVal)) {
        updated[i].share = ((areaVal / totalArea) * 100).toFixed(2);
      } else {
        updated[i].share = '';
      }
    } else if (field === 'share' && totalArea > 0) {
      const shareVal = parseFloat(value);
      if (!isNaN(shareVal)) {
        updated[i].area = ((shareVal / 100) * totalArea).toFixed(2);
      } else {
        updated[i].area = '';
      }
    }
    setHeirs(updated);
  };

  // Sync areas if totalArea changes
  useEffect(() => {
    if (totalArea > 0) {
      setHeirs(prev => prev.map(h => {
        const shareVal = parseFloat(h.share);
        if (!isNaN(shareVal)) {
          return { ...h, area: ((shareVal / 100) * totalArea).toFixed(2) };
        }
        return h;
      }));
    }
  }, [totalArea]);

  const totalShares = heirs.reduce((sum, h) => sum + (parseFloat(h.share) || 0), 0);
  const isSharesValid = Math.abs(totalShares - 100) < 0.01;

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
    if (!isSharesValid) {
      setResult({ success: false, message: `Heir shares must total exactly 100%. Current total: ${totalShares.toFixed(1)}%` });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      // Format: Name:Share%|Name2:Share%
      const formattedOwners = validHeirs.map(h => `${h.name}:${h.share}`).join('|');
      
      await api.createMutation({
        record_id: landId,
        current_owner: previousOwner,
        new_owner: formattedOwners,
        mutation_type: 'Inheritance',
        supporting_doc: `INHERITANCE|${landId}|${previousOwner}|${new Date().toISOString()}`,
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
        <StepCard 
          step={STEPS[0]} 
          role={role} 
          onSubmit={handleCreateMutation} 
          loading={submitting} 
          result={result}
          disabled={!isSharesValid}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>
              <div>
                <label className="label">Land ID *</label>
                <input className="input" placeholder="e.g. REC-2026-13" value={landId} onChange={e => setLandId(e.target.value)} />
              </div>
              <div>
                <label className="label">Total Land Area (sq. m)</label>
                <input className="input" value={totalArea ? `${totalArea} sqm` : (landId ? 'Verifying Record...' : 'Total Area')} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)', fontWeight: 700 }} />
              </div>
            </div>

            <div>
              <label className="label">Previous Owner (Deceased) *</label>
              <input className="input" placeholder="Full name" value={previousOwner} onChange={e => setPreviousOwner(e.target.value)} />
            </div>

            {/* Heirs Section */}
            <div style={{ padding: '24px', background: 'var(--slate-50)', borderRadius: 16, border: '1px dashed var(--slate-300)', marginTop: 8 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Heirs & Shares</h4>
                    <p style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 2 }}>Division can be by % or sq. m</p>
                  </div>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={addHeir}>+ Add Heir</button>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {heirs.map((h, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 40px', gap: 12, alignItems: 'end' }}>
                      <div>
                        <label className="label" style={{ fontSize: 10 }}>Heir Name</label>
                        <input className="input" placeholder="Full name" value={h.name} onChange={e => updateHeir(i, 'name', e.target.value)} />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: 10 }}>Area (sqm) *</label>
                        <input className="input" type="number" step="0.01" placeholder="e.g. 500" value={h.area} onChange={e => updateHeir(i, 'area', e.target.value)} />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: 10 }}>Share (%)</label>
                        <input className="input" type="number" step="0.01" placeholder="Calculated" value={h.share} onChange={e => updateHeir(i, 'share', e.target.value)} />
                      </div>
                      <button onClick={() => removeHeir(i)} style={{ padding: 10, background: 'none', border: 'none', color: 'var(--red-500)', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)' }}>TOTAL SHARES</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: isSharesValid ? 'var(--success)' : 'var(--error)' }}>{totalShares.toFixed(1)}%</div>
                     </div>
                     {totalArea > 0 && (
                       <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)' }}>TOTAL AREA</div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--slate-700)' }}>{((totalShares / 100) * totalArea).toFixed(2)} / {totalArea} sqm</div>
                       </div>
                     )}
                  </div>
                  {!isSharesValid && heirs.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={12} /> Total must equal exactly 100%
                    </div>
                  )}
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="label">Registrar ID</label>
                <input className="input" value={role || 'Admin'} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
              </div>
              <div>
                <label className="label">Mutation Type</label>
                <input className="input" value="INHERITANCE" readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
              </div>
            </div>
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

function StepCard({ step, role, children, onSubmit, loading, result, disabled }: {
  step: Step; role: string | null; children: React.ReactNode;
  onSubmit?: () => void; loading?: boolean; result?: {success: boolean, message: string} | null;
  disabled?: boolean;
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
          style={{ opacity: (canAct && !loading && !disabled) ? 1 : 0.4, pointerEvents: (canAct && !loading && !disabled) ? 'auto' : 'none' }}
          onClick={onSubmit}
          disabled={!canAct || loading || disabled}
        >
          {loading ? <><RefreshCw size={16} className="spin" /> Submitting...</> : <>Submit Transaction <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}
