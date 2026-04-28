'use client';

import { useRole } from "@/context/RoleContext";
import { useState } from "react";
import { Lock, Unlock, AlertTriangle, Shield } from "lucide-react";

export default function FreezePage() {
  const { role } = useRole();
  const canFreeze = role && ['Admin', 'Legal Authority', 'Auditor'].includes(role);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>🔒 Freeze / Unfreeze Management</h1>
        <p>Multi-signature endorsement required (minimum 2 approvers from Legal Authority, Admin, Auditor)</p>
      </div>

      {!canFreeze ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={40} color="var(--error)" style={{ marginBottom: 12 }} />
          <h3>Restricted Access</h3>
          <p style={{ color: 'var(--slate-500)', fontSize: 14 }}>Only Legal Authority, Admin, and Auditor can freeze/unfreeze.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Lock size={20} color="var(--error)" />
              <h3>Freeze Record</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>Prevent all mutations on a land record. Requires 2+ multi-sig approvals.</p>
            <div style={{ marginBottom: 16 }}><label className="label">Record ID *</label><input className="input" placeholder="REC-2026-XX" /></div>
            <div style={{ marginBottom: 16 }}><label className="label">Reason *</label><input className="input" placeholder="e.g. Pending litigation" /></div>
            <div style={{ marginBottom: 16 }}><label className="label">Approver 1 Role *</label>
              <select className="input"><option>Legal Authority</option><option>Admin</option><option>Auditor</option></select>
            </div>
            <div style={{ marginBottom: 20 }}><label className="label">Approver 2 Role *</label>
              <select className="input"><option>Admin</option><option>Legal Authority</option><option>Auditor</option></select>
            </div>
            <button className="btn btn-primary" style={{ background: 'var(--error)', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}>
              <Lock size={16} /> Freeze Record
            </button>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Unlock size={20} color="var(--success)" />
              <h3>Unfreeze Record</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>Re-enable mutations on a frozen record. Requires 2+ multi-sig approvals.</p>
            <div style={{ marginBottom: 16 }}><label className="label">Record ID *</label><input className="input" placeholder="REC-2026-XX" /></div>
            <div style={{ marginBottom: 16 }}><label className="label">Approver 1 Role *</label>
              <select className="input"><option>Legal Authority</option><option>Admin</option><option>Auditor</option></select>
            </div>
            <div style={{ marginBottom: 20 }}><label className="label">Approver 2 Role *</label>
              <select className="input"><option>Admin</option><option>Legal Authority</option><option>Auditor</option></select>
            </div>
            <button className="btn btn-primary" style={{ background: 'var(--success)', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
              <Unlock size={16} /> Unfreeze Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
