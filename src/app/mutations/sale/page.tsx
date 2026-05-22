'use client';

import { useRole } from "@/context/RoleContext";
import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, ArrowRight, RefreshCw, Trash2 } from "lucide-react";
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
  { id: 1, title: 'Create Sale Mutation', actor: 'Registrar', allowedRoles: ['Court Registrar', 'Admin', 'Revenue Admin'], description: 'Register sale deed with seller/buyer details' },
  { id: 2, title: 'Verify (Revenue Officer)', actor: 'Revenue Officer', allowedRoles: ['Revenue Officer', 'Admin'], description: 'Field verification by Revenue Officer' },
  { id: 3, title: 'Approve (District Magistrate)', actor: 'District Magistrate', allowedRoles: ['District Magistrate', 'Admin'], description: 'Executive approval' },
  { id: 4, title: 'Finalize / Reject Transfer', actor: 'Collector', allowedRoles: ['Collector', 'Admin'], description: 'Execute ownership transfer on ledger or reject' },
];

export default function SaleMutationPage() {
  const { role } = useRole();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [landId, setLandId] = useState('');
  const [seller, setSeller] = useState('');

  const [saleDeedHash, setSaleDeedHash] = useState('');
  const [totalArea, setTotalArea] = useState(0);

  // Shares division
  const [buyers, setBuyers] = useState<{name: string, share: string, area: string, unit: string}[]>([]);
  const totalShares = buyers.reduce((sum, b) => sum + (parseFloat(b.share) || 0), 0);
  const isSharesValid = totalShares > 0 && totalShares <= 100;

  const addBuyer = () => setBuyers([...buyers, { name: '', share: '', area: '', unit: 'sqm' }]);
  const removeBuyer = (i: number) => setBuyers(buyers.filter((_, idx) => idx !== i));
  const updateBuyer = (i: number, field: 'name' | 'share' | 'area' | 'unit', value: string) => {
    const updated = [...buyers];
    (updated[i] as any)[field] = value;

    const multipliers: Record<string, number> = { sqm: 1, hectare: 10000, acre: 4046.86, bigha: 2529.28, sqft: 0.092903, sqyard: 0.836127 };

    if ((field === 'area' || field === 'unit') && totalArea > 0) {
      const areaVal = parseFloat(updated[i].area);
      const unit = updated[i].unit || 'sqm';
      if (!isNaN(areaVal)) {
        const areaInSqm = areaVal * multipliers[unit];
        updated[i].share = ((areaInSqm / totalArea) * 100).toFixed(2);
      } else {
        updated[i].share = '';
      }
    } else if (field === 'share' && totalArea > 0) {
      const shareVal = parseFloat(updated[i].share);
      if (!isNaN(shareVal)) {
        const areaInSqm = (shareVal / 100) * totalArea;
        const unit = updated[i].unit || 'sqm';
        updated[i].area = (areaInSqm / multipliers[unit]).toFixed(4);
      } else {
        updated[i].area = '';
      }
    }
    setBuyers(updated);
  };

  // Sync areas if totalArea changes
  useEffect(() => {
    if (totalArea > 0) {
      setBuyers(prev => prev.map(b => {
        const shareVal = parseFloat(b.share);
        if (!isNaN(shareVal)) {
          const areaInSqm = (shareVal / 100) * totalArea;
          const multipliers: Record<string, number> = { sqm: 1, hectare: 10000, acre: 4046.86, bigha: 2529.28, sqft: 0.092903, sqyard: 0.836127 };
          const unit = b.unit || 'sqm';
          return { ...b, area: (areaInSqm / multipliers[unit]).toFixed(4) };
        }
        return b;
      }));
    }
  }, [totalArea]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{success: boolean, message: string} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Auto-fill seller name when landId is entered
  useEffect(() => {
    const fetchCurrentOwner = async () => {
      if (landId.length >= 4) {
        try {
          const data = await api.getRecord(landId);
          if (data && data.record) {
            if (data.record.owner_name) setSeller(data.record.owner_name);
            const parseAreaString = (areaStr: any) => {
              if (typeof areaStr === 'number') return areaStr;
              if (!areaStr) return 0;
              const s = areaStr.toString().toLowerCase().trim();
              const val = parseFloat(s) || 0;
              if (s.includes('ha') || s.includes('hectare')) return val * 10000;
              if (s.includes('acre')) return val * 4046.86;
              if (s.includes('bigha')) return val * 2529.28;
              if (s.includes('sqft') || s.includes('sq.ft')) return val * 0.092903;
              if (s.includes('sqyd') || s.includes('sq.yd') || s.includes('sq yard')) return val * 0.836127;
              return val;
            };
            
            if (data.record.area) setTotalArea(parseAreaString(data.record.area));
            else if (data.record.area_sq_m) setTotalArea(parseAreaString(data.record.area_sq_m));
          }
        } catch (err) {
          console.debug("Auto-fetch owner failed for ID:", landId);
        }
      }
    };

    const timer = setTimeout(fetchCurrentOwner, 600); // 600ms debounce
    return () => clearTimeout(timer);
  }, [landId]);

  // Determine effective buyer string
  const validBuyers = buyers.filter(b => b.name.trim() && b.share.trim());
  let effectiveBuyer = validBuyers.map(b => `${b.name}:${b.share}`).join('|');
  
  if (totalShares < 100 && totalShares > 0 && seller.trim() !== '') {
    const remainingShare = (100 - totalShares).toFixed(1);
    effectiveBuyer += `|${seller.trim()}:${remainingShare}`;
  }

  // Auto-generate sale deed hash
  useEffect(() => {
    if (landId && seller && validBuyers.length > 0) {
      const computeHash = async (text: string) => {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setSaleDeedHash(hashHex);
      };
      
      const payload = `SALE_DEED|${landId}|${seller}|${effectiveBuyer}|${new Date().toISOString().split('T')[0]}`;
      computeHash(payload);
    } else {
      setSaleDeedHash('');
    }
  }, [landId, seller, effectiveBuyer]);

  const handleCreateMutation = async () => {
    if (!landId || !seller || validBuyers.length === 0 || !saleDeedHash) {
      setResult({ success: false, message: 'All required fields must be filled (including at least one buyer)' });
      return;
    }
    if (totalShares > 100) {
      setResult({ success: false, message: 'Total shares cannot exceed 100%' });
      return;
    }
    
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.createMutation({
        record_id: landId,
        current_owner: seller,
        new_owner: effectiveBuyer,
        mutation_type: 'SALE',
        supporting_doc: saleDeedHash,
        initiated_by: role || 'Registrar',
        role: role || 'Court Registrar',
      });
      setResult({ success: true, message: 'Mutation created successfully! Moving to next step...' });
      setTimeout(() => {
        setCurrentStep(2);
        setResult(null);
      }, 2000);
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
      if (action === 'verify') res = await api.verifyTalati(landId, 'SALE');
      else if (action === 'approve') res = await api.approveMutation(landId, 'SALE');
      else if (action === 'finalize') res = await api.finalizeMutation(landId, 'SALE');
      else if (action === 'reject') {
        if (!rejectionReason.trim()) {
          setResult({ success: false, message: 'Rejection reason is required' });
          setSubmitting(false);
          return;
        }
        res = await api.rejectMutation(landId, 'SALE', rejectionReason);
      }
      
      setResult({ success: true, message: res?.message || `${action} successful!` });
      if (nextStep) {
        setTimeout(() => {
          setCurrentStep(nextStep);
          setResult(null);
        }, 2000);
      } else if (action === 'finalize') {
        setTimeout(() => {
          setLandId('');
          setSeller('');
          setBuyers([]);
          setRejectionReason('');
          setCurrentStep(1);
          setResult(null);
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
        <h1>💰 Sale Mutation Workflow</h1>
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
          disabled={buyers.length > 0 && totalShares > 100}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 20 }}>
              <div>
                <label className="label">Land ID *</label>
                <input className="input" placeholder="e.g. REC-2026-15" value={landId} onChange={e => setLandId(e.target.value)} />
              </div>
              <div>
                <label className="label">Total Land Area (sq. m)</label>
                <input className="input" value={totalArea ? `${totalArea} sqm` : (landId ? 'Verifying Record...' : 'Total Area')} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)', fontWeight: 700 }} />
              </div>
            </div>
            
            <div>
              <label className="label">Sale Deed Hash *</label>
              <input className="input mono" placeholder="SHA-256 hash" value={saleDeedHash} readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label className="label">Seller (Current Owner) *</label>
                <input className="input" placeholder="Full name" value={seller} onChange={e => setSeller(e.target.value)} />
              </div>
            </div>

            {/* Shares Division Section */}
            <div style={{ padding: '24px', background: 'var(--slate-50)', borderRadius: 16, border: '1px dashed var(--slate-300)', marginTop: 8 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ margin: 0 }}>Buyer Shares</h4>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={addBuyer}>+ Add Buyer</button>
               </div>

               {buyers.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {buyers.map((b, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 75px 90px 40px', gap: 10, alignItems: 'end' }}>
                        <div>
                          <label className="label" style={{ fontSize: 10 }}>Buyer Name</label>
                          <input className="input" placeholder="Full name" value={b.name} onChange={e => updateBuyer(i, 'name', e.target.value)} />
                        </div>
                      <div>
                        <label className="label" style={{ fontSize: 10 }}>Area *</label>
                        <input className="input" type="number" step="0.01" placeholder="e.g. 500" value={b.area} onChange={e => updateBuyer(i, 'area', e.target.value)} />
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: 10 }}>Unit</label>
                        <select className="input" style={{ padding: '8px 4px' }} value={b.unit || 'sqm'} onChange={e => updateBuyer(i, 'unit', e.target.value)}>
                           <option value="sqm">sq.m</option>
                           <option value="hectare">Ha</option>
                           <option value="acre">Acre</option>
                           <option value="bigha">Bigha</option>
                           <option value="sqft">sq.ft</option>
                           <option value="sqyard">sq.yd</option>
                        </select>
                      </div>
                      <div>
                        <label className="label" style={{ fontSize: 10 }}>Share (%)</label>
                        <input className="input" type="number" step="0.01" placeholder="Calculated" value={b.share} onChange={e => updateBuyer(i, 'share', e.target.value)} />
                      </div>
                        <button onClick={() => removeBuyer(i)} style={{ padding: 10, background: 'none', border: 'none', color: 'var(--red-500)', cursor: 'pointer' }}>
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
                    <p style={{ fontSize: 13 }}>Click "+ Add Buyer" to record shared ownership between multiple buyers.</p>
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
                <input className="input" value="SALE" readOnly style={{ background: 'var(--slate-50)', color: 'var(--slate-600)' }} />
              </div>
            </div>
          </div>
        </StepCard>
      )}

      {currentStep === 2 && (
        <StepCard step={STEPS[1]} role={role} onSubmit={() => handleWorkflowStep('verify', 3)} loading={submitting} result={result}>
          <div style={{ padding: 20, background: 'var(--blue-50)', borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 4 }}>Pending Verification</div>
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Land ID: {landId || 'Unknown'} · Seller: {seller || 'Current Owner'}</div>
            <div style={{ fontSize: 12, color: 'var(--blue-600)', marginTop: 4, fontWeight: 500 }}>Buyer(s): {effectiveBuyer}</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to verify" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>Revenue Officer confirms field inspection and document validity.</p>
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
            <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Status: VERIFIED_BY_DISTRICT_MAGISTRATE · Ownership will be transferred to buyer(s)</div>
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>New Owner: {effectiveBuyer}</div>
          </div>
          <div><label className="label">Land ID *</label><input className="input" placeholder="Land ID to finalize" value={landId} onChange={e => setLandId(e.target.value)} /></div>
          <p style={{ fontSize: 12, color: 'var(--slate-500)', margin: '12px 0' }}>This will close previous ownership, create new ownership entry, update owner on record, increment version, and recompute record hash.</p>
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
  step: Step; 
  role: string | null; 
  children: React.ReactNode;
  onSubmit?: () => void;
  loading?: boolean;
  result?: {success: boolean, message: string} | null;
  disabled?: boolean;
  customActions?: React.ReactNode;
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
          marginBottom: 16, 
          padding: 12, 
          borderRadius: 8, 
          background: result.success ? 'var(--green-50)' : 'var(--red-50)',
          color: result.success ? 'var(--green-700)' : 'var(--red-700)',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 8
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
            {loading ? 'Submitting...' : 'Submit Transaction'} {!loading && <ArrowRight size={16} />}
          </button>
        </div>
      )}
    </div>
  );
}
