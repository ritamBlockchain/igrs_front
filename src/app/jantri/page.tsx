'use client';

import { useEffect, useState } from "react";
import { TrendingUp, Plus, RefreshCw } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { useData } from "@/context/DataContext";
import { api } from "@/lib/api";

export default function JantriPage() {
  const { role } = useRole();
  const { jantriRates, jantriLoading, refreshJantri, jantriCapabilities } = useData();
  const canManage = role && ['Revenue Admin', 'Admin'].includes(role);
  
  const [area, setArea] = useState('');
  const [landType, setLandType] = useState('Agricultural');
  const [calculatedValue, setCalculatedValue] = useState<number | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRate, setNewRate] = useState({ village_id: '', zone_id: 'GEN', land_type: 'Agricultural', rate_per_sqm: '', effective_from: new Date().toISOString().split('T')[0] });
  const [creating, setCreating] = useState(false);

  // Fetch jantri rates on mount
  useEffect(() => {
    refreshJantri();
  }, [refreshJantri]);

  // Calculate value
  const handleCalculate = async () => {
    if (!area || !landType) return;
    setCalculating(true);
    try {
      // Use village_id 1 as default for calculation
      const result = await api.calculateJantri(1, landType, parseFloat(area));
      setCalculatedValue(result.total_value);
    } catch {
      // Fallback: use first matching rate
      const rate = jantriRates.find(r => r.land_type === landType);
      if (rate) {
        setCalculatedValue(rate.rate_per_sqm * parseFloat(area));
      }
    } finally {
      setCalculating(false);
    }
  };

  const handleCreateRate = async () => {
    const rateValue = parseFloat(newRate.rate_per_sqm.toString());
    if (!rateValue || rateValue <= 0) {
      alert('Please enter a valid rate');
      return;
    }
    setCreating(true);
    try {
      await api.createJantriRate({
        village_id: newRate.village_id,
        zone_id: newRate.zone_id,
        land_type: newRate.land_type,
        rate_per_sqm: rateValue,
        effective_from: newRate.effective_from,
        created_by: role || 'Unknown',
      });
      setShowCreate(false);
      refreshJantri();
    } catch (err: any) {
      alert('Failed to create Jantri rate: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>📊 Jantri Rate Index</h1>
          <p>Standardized land valuation framework (on-chain)</p>
          {jantriCapabilities && (
            <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>
              Capabilities: {Object.entries(jantriCapabilities).filter(([_, v]) => v).map(([k]) => k).join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={refreshJantri} 
            disabled={jantriLoading}
            className="btn btn-outline"
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} style={{ animation: jantriLoading ? 'spin 1s linear infinite' : undefined }} />
            Refresh
          </button>
          {canManage && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Update Rates</button>}
        </div>
      </div>

      {showCreate && (
        <div className="modal-backdrop">
          <div className="modal-content animate-in" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16 }}>Create Jantri Rate</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="label">Village</label>
                <input type="text" className="input" value={newRate.village_id} onChange={e => setNewRate(p => ({ ...p, village_id: e.target.value }))} placeholder="e.g. Mandal or VIL-1" />
              </div>
              <div>
                <label className="label">Zone ID</label>
                <input type="text" className="input" value={newRate.zone_id} onChange={e => setNewRate(p => ({ ...p, zone_id: e.target.value }))} placeholder="e.g. GEN, COM" />
              </div>
              <div>
                <label className="label">Land Category</label>
                <select className="input" value={newRate.land_type} onChange={e => setNewRate(p => ({ ...p, land_type: e.target.value }))}>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>
              <div>
                <label className="label">Rate per sqm (₹)</label>
                <input type="number" className="input" value={newRate.rate_per_sqm} onChange={e => setNewRate(p => ({ ...p, rate_per_sqm: e.target.value }))} placeholder="Enter base rate" />
              </div>
              <div>
                <label className="label">Effective From</label>
                <input type="date" className="input" value={newRate.effective_from} onChange={e => setNewRate(p => ({ ...p, effective_from: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <button className="btn btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateRate} disabled={creating}>
                {creating ? 'Submitting...' : 'Submit to Fabric'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden', marginBottom: 24 }}>
        {jantriLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
            Loading Jantri rates...
          </div>
        ) : jantriRates.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--slate-500)' }}>
            No Jantri rates found. {canManage && 'Create rates to enable valuation.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
                {['Village', 'Zone ID', 'Land Category', 'Rate (₹/sqm)', 'Effective From', 'Status', 'Last Updated'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jantriRates.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                  <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: 'var(--slate-700)' }}>{r.village_name}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate-600)' }}>{r.zone_id || 'GEN'}</td>
                  <td style={{ padding: '16px 20px', fontSize: 14 }}>{r.land_type}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--blue-600)', fontSize: 15 }}>₹ {r.rate_per_sqm.toLocaleString()}</td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate-600)' }}>{r.effective_from ? new Date(r.effective_from).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: '16px 20px' }}><span className="badge badge-success">{r.action}</span></td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--slate-500)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: 28 }}>
        <h3 style={{ marginBottom: 16 }}>Valuation Calculator</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'end' }}>
          <div><label className="label">Area (sqm)</label><input className="input" type="number" placeholder="500" value={area} onChange={e => setArea(e.target.value)} /></div>
          <div><label className="label">Category</label>
            <select className="input" value={landType} onChange={e => setLandType(e.target.value)}>
              <option>Agricultural</option>
              <option>Residential</option>
              <option>Commercial</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)', marginBottom: 4 }}>Estimated Value</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--blue-600)' }}>
              {calculating ? 'Calculating...' : calculatedValue !== null ? `₹ ${calculatedValue.toLocaleString()}` : '₹ 0.00'}
            </div>
          </div>
          <button 
            className="btn btn-primary" 
            onClick={handleCalculate}
            disabled={!area || calculating}
          >
            Calculate
          </button>
        </div>
      </div>
    </div>
  );
}
