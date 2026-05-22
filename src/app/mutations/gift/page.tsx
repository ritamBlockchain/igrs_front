'use client';

import { useRole } from "@/context/RoleContext";
import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Trash2, Gift } from "lucide-react";
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
  { id: 1, title: 'Create Gift Mutation', actor: 'Registrar', allowedRoles: ['Court Registrar', 'Admin', 'Revenue Admin'], description: 'Register gift deed with donor/recipient details' },
  { id: 2, title: 'Verify (Revenue Officer)', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Admin'], description: 'Field verification and document validation' },
  { id: 3, title: 'Approve (District Magistrate)', actor: 'District Magistrate', allowedRoles: ['District Magistrate', 'Admin'], description: 'Executive approval' },
  { id: 4, title: 'Finalize / Reject Transfer', actor: 'Collector', allowedRoles: ['Collector', 'Admin'], description: 'Execute gift transfer on ledger or reject' },
];

export default function GiftMutationPage() {
  const { role } = useRole();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [landId, setLandId] = useState('');
  const [donor, setDonor] = useState('');

  const [giftDeedHash, setGiftDeedHash] = useState('');
  const [totalArea, setTotalArea] = useState(0);

  // Shares division
  const [heirs, setHeirs] = useState<{name: string, share: string, area: string}[]>([]);
  const totalShares = heirs.reduce((sum, h) => sum + (parseFloat(h.share) || 0), 0);
  const isSharesValid = totalShares > 0 && totalShares <= 100;

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

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Auto-fill donor name when landId is entered
  useEffect(() => {
    const fetchCurrentOwner = async () => {
      if (landId.length >= 4) {
        try {
          const data = await api.getRecord(landId);
          if (data && data.record) {
            if (data.record.owner_name) setDonor(data.record.owner_name);
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

  // Determine effective recipient string
  const validHeirs = heirs.filter(h => h.name.trim() && h.share.trim());
  const effectiveRecipient = validHeirs.map(h => `${h.name}:${h.share}`).join('|');

  // Auto-generate gift deed hash
  useEffect(() => {
    if (landId && donor && validHeirs.length > 0) {
      const computeHash = async (text: string) => {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setGiftDeedHash(hashHex);
      };
      const payload = `GIFT_DEED|${landId}|${donor}|${effectiveRecipient}|${new Date().toISOString().split('T')[0]}`;
      computeHash(payload);
    } else {
      setGiftDeedHash('');
    }
  }, [landId, donor, effectiveRecipient]);

  const handleCreateMutation = async () => {
    const validHeirs = heirs.filter(h => h.name.trim() && h.share.trim());
    const effectiveRecipient = validHeirs.map(h => `${h.name}:${h.share}`).join('|');

    if (!landId || !donor || validHeirs.length === 0 || !giftDeedHash) {
      setResult({ success: false, message: 'All required fields must be filled (including at least one recipient)' });
      return;
    }
    if (totalShares > 100) {
      setResult({ success: false, message: 'Total shares cannot exceed 100%' });
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      await api.createMutation({
        record_id: landId,
        current_owner: donor,
        new_owner: effectiveRecipient,
        mutation_type: 'GIFT',
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

  const handleWorkflowStep = async (action: 'verify' | 'approve' | 'finalize' | 'reject', nextStep?: number) => {
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
      else if (action === 'reject') {
        if (!rejectionReason.trim()) {
          setResult({ success: false, message: 'Rejection reason is required' });
          setSubmitting(false);
          return;
        }
        res = await api.rejectMutation(landId, 'GIFT', rejectionReason);
      }

      setResult({ success: true, message: res?.message || `${action} successful!` });
      if (nextStep) {
        setTimeout(() => { setCurrentStep(nextStep); setResult(null); }, 2000);
      } else if (action === 'finalize') {
        setTimeout(() => {
          setLandId('');
          setDonor('');
          setHeirs([]);
          setRejectionReason('');
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
        <h1>🎁 Gift Mutation Workflow</h1>
        <p>CREATED → VERIFIED_BY_REVENUE_OFFICER → VERIFIED_BY_DISTRICT_MAGISTRATE → FINALIZED/REJECTED</p>
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
          disabled={heirs.length > 0 && totalShares > 100}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>
              <div>
                <label className="label">Land ID *</label>
                <input className="input" placeholder="e.g. REC-2026-14" value={landId} onChange={e => setLandId(e.target.value)} />
              </div>
              <div>
                <label className="label">Total Land Area (sq. m)</label>
                <input className="input" value={totalArea ? `${totalArea} sqm` : (landId ? 'Verifying Record...' : 'Total Area')} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)', fontWeight: 700 }} />
              </div>
            </div>

            <div>
              <label className="label">Gift Deed Hash *</label>
              <input className="input mono" placeholder="SHA-256 hash" value={giftDeedHash} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="label">Donor (Current Owner) *</label>
                <input className="input" placeholder="Full name" value={donor} onChange={e => setDonor(e.target.value)} />
              </div>
            </div>

            {/* Shares Division Section */}
            <div style={{ padding: '24px', background: 'var(--slate-50)', borderRadius: 16, border: '1px dashed var(--slate-300)', marginTop: 8 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ margin: 0 }}>Recipient Shares</h4>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={addHeir}>+ Add Heir</button>
               </div>

               {heirs.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {heirs.map((h, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 40px', gap: 12, alignItems: 'end' }}>
                        <div>
                          <label className="label" style={{ fontSize: 10 }}>Shareholder Name</label>
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
                          <div style={{ fontSize: 18, fontWeight: 800, color: totalShares <= 100 ? 'var(--success)' : 'var(--error)' }}>{totalShares.toFixed(1)}%</div>
                       </div>
                       {totalArea > 0 && (
                         <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-500)' }}>TOTAL AREA</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--slate-700)' }}>{((totalShares / 100) * totalArea).toFixed(2)} / {totalArea} sqm</div>
                         </div>
                       )}
                    </div>
                    {totalShares > 100 && (
                      <div style={{ fontSize: 11, color: 'var(--error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} /> Total cannot exceed 100%
                      </div>
                    )}
                 </div>
               ) : (
                 <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--slate-400)' }}>
                    <Gift size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p style={{ fontSize: 13 }}>Click "+ Add Heir" to divide gift shares among multiple recipients.</p>
                 </div>
               )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="label">Registrar ID</label>
                <input className="input" value={role || 'Admin'} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
              </div>
              <div>
                <label className="label">Mutation Type</label>
                <input className="input" value="GIFT" readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
              </div>
            </div>
          </div>
        </StepCard>
      )}

      {currentStep === 2 && (
        <StepCard step={STEPS[1]} role={role} onSubmit={() => handleWorkflowStep('verify', 3)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--blue-50)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 4 }}>Pending Verification</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Land ID: {landId || 'Unknown'} · Donor: {donor || 'Current Owner'}</div>
            <div style={{ fontSize: 12, color: 'var(--blue-600)', marginTop: 4, fontWeight: 500 }}>Recipient(s): {effectiveRecipient}</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>Revenue Officer confirms field inspection, donor identity, and gift deed document validity.</p>
        </StepCard>
      )}

      {currentStep === 3 && (
        <StepCard step={STEPS[2]} role={role} onSubmit={() => handleWorkflowStep('approve', 4)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--warning-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Awaiting District Magistrate Approval</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: VERIFIED_BY_REVENUE_OFFICER · Ready for executive sign-off</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to approve" value={landId} onChange={e => setLandId(e.target.value)} /></div>
        </StepCard>
      )}

      {currentStep === 4 && (
        <StepCard 
          step={STEPS[3]} 
          role={role} 
          onSubmit={() => handleWorkflowStep('finalize')} 
          loading={submitting} 
          result={result}
          customActions={
            <div style={{ display: 'flex', gap: 12, width: '100%', flexDirection: 'column' }}>
              <div>
                <label className="label">Rejection Reason (if rejecting)</label>
                <input className="input" placeholder="Enter reason for rejection" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button 
                  className="btn btn-outline" 
                  style={{ borderColor: 'var(--red-500)', color: 'var(--red-600)' }}
                  onClick={() => handleWorkflowStep('reject')}
                  disabled={!role || !STEPS[3].allowedRoles.includes(role) || submitting}
                >
                  Reject Mutation
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleWorkflowStep('finalize')}
                  disabled={!role || !STEPS[3].allowedRoles.includes(role) || submitting}
                >
                  Finalize Transfer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          }
        >
          <div style={{ padding: 20, background: 'var(--success-bg)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>Ready to Finalize</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: VERIFIED_BY_DISTRICT_MAGISTRATE · Ownership will be transferred to recipient(s)</div>
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>New Owner: {effectiveRecipient}</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to finalize" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>This will transfer ownership from donor to recipient(s), update the owner on the ledger record, increment version, and recompute record hash.</p>
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

function StepCard({ step, role, children, onSubmit, loading, result, disabled, customActions }: {
  step: Step; role: string | null; children: React.ReactNode;
  onSubmit?: () => void; loading?: boolean; result?: {success: boolean, message: string} | null;
  disabled?: boolean; customActions?: React.ReactNode;
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
      {customActions ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--slate-100)' }}>
          {customActions}
        </div>
      ) : (
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
      )}
    </div>
  );
}
