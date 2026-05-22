'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, MapPin, User, Clock, Hash, CheckCircle, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import api from "@/lib/api";
import CONFIG from "@/lib/config";
import { LandLineageTree } from "@/components/LandLineageTree";

export default function PublicRecordVerificationPage() {
  const params = useParams();
  const id = params.id as string;
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRecord(id);
        if (data && data.record) {
          setRecord(data.record);
        } else if (data) {
          setRecord(data);
        } else {
          setError("Record not found on the blockchain network.");
        }
      } catch (err) {
        setError("This record ID does not exist in the Hyperledger Fabric ledger.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRecord();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: 20 }}>
        <RefreshCw className="spin" size={48} color="var(--blue-600)" style={{ marginBottom: 20 }} />
        <h2 style={{ color: 'var(--slate-800)' }}>Fetching Secure Ledger Data...</h2>
        <p style={{ color: 'var(--slate-500)' }}>Directly querying Hyperledger Fabric & Polygon PoS</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 20 }}>
        <div style={{ background: 'var(--red-50)', padding: 40, borderRadius: 32, textAlign: 'center', maxWidth: 500, border: '1px solid var(--red-100)' }}>
          <AlertTriangle size={64} color="var(--error)" style={{ marginBottom: 20 }} />
          <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--slate-900)', marginBottom: 12 }}>Record Not Found</h2>
          <p style={{ color: 'var(--slate-600)', lineHeight: 1.6, marginBottom: 32 }}>
            The Record ID <strong>{id}</strong> was not found in the official Land Registry blockchain. Please ensure the QR code is authentic.
          </p>
          <a href="/verify" style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--slate-900)', color: 'white', borderRadius: 12, textDecoration: 'none', fontWeight: 600 }}>
            Back to Verification
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '40px 20px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        {/* Verification Header */}
        <div style={{ background: 'var(--blue-600)', borderRadius: '24px 24px 0 0', padding: '32px 40px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Shield size={24} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Official Blockchain Verification</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>{record.record_id}</h1>
            <p style={{ opacity: 0.9, marginTop: 8, fontSize: 16 }}>Verified Ownership Record · Status: <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{record.status}</span></p>
          </div>
          <Shield size={200} style={{ position: 'absolute', right: -40, top: -40, opacity: 0.1, transform: 'rotate(15deg)' }} />
        </div>

        {/* Status Banner */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 40px', display: 'flex', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600, fontSize: 14 }}>
            <CheckCircle size={18} /> Hyperledger Fabric (Live)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: record.tx_hash ? 'var(--blue-600)' : 'var(--slate-400)', fontWeight: 600, fontSize: 14 }}>
            <CheckCircle size={18} /> Polygon Anchored {record.tx_hash ? '✓' : '(Pending)'}
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ background: '#fff', padding: '40px', borderRadius: '0 0 24px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px 60px' }}>
            
            {/* Ownership Section */}
            <div>
              <SectionTitle icon={<User size={16} />} title="Current Ownership" />
              <div style={{ padding: '20px', background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                <DataField label="Legal Owner" value={record.owner_name} primary />
                <DataField label="Father/Spouse Name" value={record.father_name || 'N/A'} />
              </div>
            </div>

            {/* Property Section */}
            <div>
              <SectionTitle icon={<MapPin size={16} />} title="Property Details" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DataField label="Village" value={record.village_name} />
                <DataField label="Area" value={`${record.area || record.area_sq_m} sqm`} />
                <DataField label="Plot No" value={record.plot_number} />
                <DataField label="Survey No" value={record.survey_number} />
              </div>
            </div>

            {/* Registry Info */}
            <div>
              <SectionTitle icon={<Clock size={16} />} title="Registry Timeline" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DataField label="Registered" value={record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'} />
                <DataField label="Last Mutation" value={record.updated_at ? new Date(record.updated_at).toLocaleDateString() : 'N/A'} />
                <DataField label="Version" value={`v${record.version || 1}`} />
                <DataField label="Doc Type" value={record.doc_type || 'N/A'} />
              </div>
            </div>

            {/* Location Hierarchy */}
            <div>
              <SectionTitle icon={<MapPin size={16} />} title="Jurisdiction" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DataField label="Taluka/Tehsil" value={record.taluka_name || record.block_name} />
                <DataField label="District" value={record.district_name} />
              </div>
            </div>
          </div>

          {/* Verification Proofs */}
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: '2px solid #f1f5f9' }}>
            <SectionTitle icon={<Shield size={16} />} title="Blockchain Proof of Integrity" />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Immutable Document Hash (Keccak-256)</label>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, fontFamily: 'monospace', color: '#334155', wordBreak: 'break-all' }}>
                  {record.document_hash || 'Record pending cryptographic anchoring'}
                </div>
              </div>

              {record.tx_hash && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Polygon Transaction Reference</label>
                  <a 
                    href={`https://amoy.polygonscan.com/tx/${record.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: 'var(--blue-50)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--blue-100)', fontSize: 13, fontFamily: 'monospace', color: 'var(--blue-700)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}
                  >
                    {record.tx_hash}
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: 40, textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>This page is a direct mirror of the Hyperledger Fabric Ledger state.</p>
            <p style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>Time of verification: {new Date().toLocaleString()}</p>
          </div>
        </div>

        {/* Lineage Tree Section */}
        <div style={{ marginTop: 40, background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <SectionTitle icon={<Shield size={16} />} title="Land Lineage & Mutation History" />
          <LandLineageTree 
             apiUrl={CONFIG.API_URL || 'http://localhost:5000'} 
             recordId={record.record_id} 
          />
        </div>

      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#1e293b' }}>
      <div style={{ color: 'var(--blue-600)' }}>{icon}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{title}</h3>
    </div>
  );
}

function DataField({ label, value, primary = false }: { label: string, value: string, primary?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: primary ? 18 : 14, fontWeight: 700, color: primary ? '#0f172a' : '#334155' }}>{value || '—'}</div>
    </div>
  );
}
