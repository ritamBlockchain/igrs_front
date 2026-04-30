'use client';

import { useRole } from "@/context/RoleContext";
import { useState, useEffect } from "react";
import { Lock, Unlock, AlertTriangle, Shield, CheckCircle, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";

export default function FreezePage() {
  const { role } = useRole();
  const canFreeze = role && ['Admin', 'Legal Authority', 'Auditor', 'Collector', 'Revenue Officer'].includes(role);

  // Freeze state
  const [freezeRecordId, setFreezeRecordId] = useState('');
  const [freezeReason, setFreezeReason] = useState('');
  const [freezeSubmitting, setFreezeSubmitting] = useState(false);
  const [freezeResult, setFreezeResult] = useState<{success: boolean, message: string, txHash?: string} | null>(null);

  // Unfreeze state
  const [unfreezeRecordId, setUnfreezeRecordId] = useState('');
  const [unfreezeReason, setUnfreezeReason] = useState('');
  const [unfreezeSubmitting, setUnfreezeSubmitting] = useState(false);
  const [unfreezeResult, setUnfreezeResult] = useState<{success: boolean, message: string, txHash?: string} | null>(null);

  // Freeze status lookup
  const [statusRecordId, setStatusRecordId] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [freezeStatus, setFreezeStatus] = useState<any>(null);

  const handleFreeze = async () => {
    if (!freezeRecordId) {
      setFreezeResult({ success: false, message: 'Record ID is required' });
      return;
    }
    if (!freezeReason) {
      setFreezeResult({ success: false, message: 'Reason is required' });
      return;
    }
    setFreezeSubmitting(true);
    setFreezeResult(null);
    try {
      const res = await api.freezeEndorse(freezeRecordId, freezeReason);
      console.log('Freeze Response:', res);

      const txId = res.tx_hash || (res as any).tx_id;
      const isExecuted = res.endorsements >= res.min_required || (res as any).executed;
      const msg = isExecuted
        ? `Record frozen on ledger!${txId ? `\nTX: ${txId}` : ''}`
        : `Freeze endorsement ${res.endorsements}/${res.min_required} recorded. Need ${res.min_required - res.endorsements} more endorsement(s) to execute.`;

      setFreezeResult({ success: true, message: msg, txHash: txId });

      if (res.endorsements >= res.min_required) {
        setTimeout(() => { setFreezeRecordId(''); setFreezeReason(''); setFreezeResult(null); }, 3000);
      }
    } catch (err) {
      setFreezeResult({ success: false, message: err instanceof Error ? err.message : 'Failed to freeze' });
    } finally {
      setFreezeSubmitting(false);
    }
  };

  const handleUnfreeze = async () => {
    if (!unfreezeRecordId) {
      setUnfreezeResult({ success: false, message: 'Record ID is required' });
      return;
    }
    setUnfreezeSubmitting(true);
    setUnfreezeResult(null);
    try {
      const res = await api.unfreezeEndorse(unfreezeRecordId, unfreezeReason || 'Unfrozen by officer');
      console.log('Unfreeze Response:', res);

      const txId = res.tx_hash || (res as any).tx_id;
      const isExecuted = res.endorsements >= res.min_required || (res as any).executed;
      const msg = isExecuted
        ? `Record unfrozen on ledger!`
        : `Unfreeze endorsement ${res.endorsements}/${res.min_required} recorded. Need ${res.min_required - res.endorsements} more endorsement(s).`;

      setUnfreezeResult({ success: true, message: msg, txHash: txId });
      if (isExecuted) {
        setTimeout(() => { setUnfreezeRecordId(''); setUnfreezeReason(''); setUnfreezeResult(null); }, 5000);
      }
    } catch (err) {
      setUnfreezeResult({ success: false, message: err instanceof Error ? err.message : 'Failed to unfreeze' });
    } finally {
      setUnfreezeSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!statusRecordId) return;
    setStatusLoading(true);
    setFreezeStatus(null);
    try {
      const res = await api.getFreezeStatus(statusRecordId);
      setFreezeStatus(res);
    } catch (err) {
      setFreezeStatus({ error: err instanceof Error ? err.message : 'Failed to fetch status' });
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🔒 Freeze / Unfreeze Management</h1>
        <p>Multi-signature endorsement required (minimum 2 approvers from Collector, Revenue Officer, Admin)</p>
      </div>

      {!canFreeze ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12 }} />
          <h3>Restricted Access</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: 14 }}>Only Legal Authority, Collector, Revenue Officer, Admin, and Auditor can freeze/unfreeze.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Status Check */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Search size={18} color="var(--blue-600)" />
              <h3 style={{ margin: 0 }}>Check Freeze Status</h3>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label className="label">Record ID</label>
                <input className="input" placeholder="REC-2026-XX" value={statusRecordId} onChange={e => setStatusRecordId(e.target.value)} />
              </div>
              <button className="btn btn-outline" onClick={handleCheckStatus} disabled={statusLoading || !statusRecordId} style={{ minWidth: 120 }}>
                {statusLoading ? <><RefreshCw size={14} className="spin" /> Checking...</> : <><Search size={14} /> Check</>}
              </button>
            </div>
            {freezeStatus && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--slate-50)', borderRadius: 10, fontSize: 13 }}>
                {freezeStatus.error ? (
                  <div style={{ color: 'var(--error)' }}>{freezeStatus.error}</div>
                ) : (
                  <>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Record: {freezeStatus.record_id}</div>
                    <div>Freeze Endorsements: {freezeStatus.freeze_endorsements?.length || 0}</div>
                    <div>Unfreeze Endorsements: {freezeStatus.unfreeze_endorsements?.length || 0}</div>
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Freeze Card */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Lock size={20} color="var(--error)" />
                <h3 style={{ margin: 0 }}>Freeze Record</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>Prevent all mutations on a land record. Requires 2+ multi-sig approvals from different officers.</p>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Record ID *</label>
                <input className="input" placeholder="REC-2026-XX" value={freezeRecordId} onChange={e => setFreezeRecordId(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Reason *</label>
                <input className="input" placeholder="e.g. Pending litigation" value={freezeReason} onChange={e => setFreezeReason(e.target.value)} />
              </div>
              {freezeResult && (
                <div style={{
                  marginBottom: 16, padding: 16, borderRadius: 12,
                  background: freezeResult.success ? 'var(--green-50)' : 'var(--red-50)',
                  border: `1px solid ${freezeResult.success ? 'var(--green-200)' : 'var(--red-200)'}`,
                  color: freezeResult.success ? 'var(--green-700)' : 'var(--red-700)',
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
                    {freezeResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {freezeResult.success ? 'Success' : 'Error'}
                  </div>
                  <div style={{ marginBottom: freezeResult.txHash ? 8 : 0 }}>{freezeResult.message}</div>
                  {freezeResult.txHash && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>Transaction Hash</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
                        {freezeResult.txHash}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                className="btn btn-primary"
                style={{ background: 'var(--error)', boxShadow: '0 4px 12px rgba(239,68,68,0.2)', width: '100%', opacity: freezeSubmitting ? 0.6 : 1 }}
                onClick={handleFreeze}
                disabled={freezeSubmitting}
              >
                {freezeSubmitting ? <><RefreshCw size={16} className="spin" /> Endorsing...</> : <><Lock size={16} /> Endorse Freeze</>}
              </button>
            </div>

            {/* Unfreeze Card */}
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Unlock size={20} color="var(--success)" />
                <h3 style={{ margin: 0 }}>Unfreeze Record</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>Re-enable mutations on a frozen record. Requires 2+ multi-sig approvals from different officers.</p>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Record ID *</label>
                <input className="input" placeholder="REC-2026-XX" value={unfreezeRecordId} onChange={e => setUnfreezeRecordId(e.target.value)} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="label">Reason</label>
                <input className="input" placeholder="e.g. Litigation resolved" value={unfreezeReason} onChange={e => setUnfreezeReason(e.target.value)} />
              </div>
              {unfreezeResult && (
                <div style={{
                  marginBottom: 16, padding: 16, borderRadius: 12,
                  background: unfreezeResult.success ? 'var(--green-50)' : 'var(--red-50)',
                  border: `1px solid ${unfreezeResult.success ? 'var(--green-200)' : 'var(--red-200)'}`,
                  color: unfreezeResult.success ? 'var(--green-700)' : 'var(--red-700)',
                  fontSize: 13
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: 6 }}>
                    {unfreezeResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {unfreezeResult.success ? 'Success' : 'Error'}
                  </div>
                  <div style={{ marginBottom: unfreezeResult.txHash ? 8 : 0 }}>{unfreezeResult.message}</div>
                  {unfreezeResult.txHash && (
                    <div style={{ marginTop: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>Transaction Hash</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.06)', padding: '6px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
                        {unfreezeResult.txHash}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <button
                className="btn btn-primary"
                style={{ background: 'var(--success)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)', width: '100%', opacity: unfreezeSubmitting ? 0.6 : 1 }}
                onClick={handleUnfreeze}
                disabled={unfreezeSubmitting}
              >
                {unfreezeSubmitting ? <><RefreshCw size={16} className="spin" /> Endorsing...</> : <><Unlock size={16} /> Endorse Unfreeze</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
