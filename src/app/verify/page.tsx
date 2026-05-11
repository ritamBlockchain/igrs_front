'use client';

import { useState, useRef } from 'react';
import { Shield, Upload, CheckCircle, XCircle, FileText, Search, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import CONFIG from '@/lib/config';

interface VerificationResult {
  success: boolean;
  status: string;
  filename: string;
  record_id: string;
  extracted_metadata: Record<string, string>;
  computed_record_hash: string;
  verification_details: {
    source: string;
    merkle_root: string;
    polygon_tx: string;
    anchored_at: string;
    anchored_hash: string;
    fabric_record_hash?: string;
    live_onchain_confirmation: boolean;
    fields_match?: boolean;
    merkle_proof: any;
    fabric_status: string;
  };
}

export default function VerifyPage() {
  const [recordId, setRecordId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setResult(null);
      setError(null);
      // Try to extract record_id from filename (matches REC-xxxx or MP-BHO-xxxx formats)
      const match = dropped.name.match(/(REC|MP|IND|BHO|S|K)-\d+/i) || dropped.name.match(/[A-Z]+-[A-Z]+-\d+/i);
      if (match && !recordId) setRecordId(match[0].toUpperCase());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
      const match = f.name.match(/(REC|MP|IND|BHO|S|K)-\d+/i) || f.name.match(/[A-Z]+-[A-Z]+-\d+/i);
      if (match && !recordId) setRecordId(match[0].toUpperCase());
    }
  };

  const handleVerify = async () => {
    if (!recordId.trim()) {
      setError('Please enter a Record ID');
      return;
    }
    if (!file) {
      setError('Please upload a document to verify');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('record_id', recordId.trim());
      formData.append('file', file);

      const res = await fetch(`${CONFIG.API_BASE_URL}/api/land/verify-document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Verification failed (${res.status}): ${text}`);
      }

      const data: VerificationResult = await res.json();
      console.log('[Verification] Response:', data);
      
      // Auto-correct recordId if OCR found a better match and user's was empty or mismatched
      if (data.extracted_metadata?.record_id && data.extracted_metadata.record_id !== recordId) {
        setRecordId(data.extracted_metadata.record_id);
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setFile(null);
    setRecordId('');
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Shield size={22} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>On-Chain Verification</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Verify land record documents against the Polygon blockchain
          </p>
        </div>
      </div>

      {/* Record ID Input */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '1.5rem', marginTop: '1.5rem'
      }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
          Record ID
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              value={recordId}
              onChange={e => setRecordId(e.target.value)}
              placeholder="e.g. REC-2026-2025"
              style={{
                width: '100%', padding: '10px 12px 10px 36px',
                border: '1px solid var(--border)', borderRadius: 10,
                background: 'var(--input-bg)', color: 'var(--text-primary)',
                fontSize: '0.9rem', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* File Upload */}
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            marginTop: 16, padding: '2rem', borderRadius: 12,
            border: `2px dashed ${isDragging ? '#3b82f6' : 'var(--border)'}`,
            background: isDragging ? 'rgba(59,130,246,0.05)' : 'transparent',
            cursor: 'pointer', textAlign: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <FileText size={20} color="#3b82f6" />
              <span style={{ fontWeight: 600 }}>{file.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <>
              <Upload size={28} color="var(--text-secondary)" />
              <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Drag & drop a PDF or image, or click to browse
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={handleVerify}
            disabled={loading || !file || !recordId.trim()}
            style={{
              flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
              background: loading ? '#6b7280' : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff', fontWeight: 600, fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!file || !recordId.trim()) ? 0.5 : 1
            }}
          >
            {loading ? <Loader2 size={18} className="spin" /> : <Shield size={18} />}
            {loading ? 'Verifying on Polygon...' : 'Verify Against Blockchain'}
          </button>
          <button
            onClick={clearAll}
            style={{
              padding: '12px 20px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-secondary)', fontWeight: 500, cursor: 'pointer'
            }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ marginTop: 20 }}>
          {/* Status Banner */}
          <div style={{
            padding: '1.25rem 1.5rem', borderRadius: 14,
            background: result.success
              ? 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))',
            border: `1px solid ${result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            {result.success
              ? <CheckCircle size={28} color="#22c55e" />
              : <XCircle size={28} color="#ef4444" />}
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: result.success ? (result.status === 'VERIFIED_ON_POLYGON' ? '#22c55e' : '#3b82f6') : '#ef4444' }}>
                {result.success 
                  ? (result.status === 'VERIFIED_ON_POLYGON' ? '✓ Verified on Polygon' : '✓ Verified on Fabric Ledger') 
                  : '✗ Verification Failed'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {result.success
                  ? (result.status === 'VERIFIED_ON_POLYGON' 
                      ? 'Document data matches the on-chain anchor. This record is authentic.' 
                      : 'Verified on Fabric ledger. On-chain Polygon anchoring is pending for the next batch.')
                  : 'The uploaded document does not match the blockchain record.'}
              </div>
            </div>
          </div>

          {/* Metadata Extracted */}
          {result.extracted_metadata && (
            <div style={{
              marginTop: 16, padding: '1.25rem 1.5rem', borderRadius: 14,
              background: 'var(--card-bg)', border: '1px solid var(--border)'
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
                OCR Extracted Metadata
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                {[
                  "record_id",
                  "survey_no",
                  "khasra_no",
                  "owner_name",
                  "village_name",
                  "taluka_name",
                  "district_name",
                  "area",
                  "year",
                  "land_type",
                  "village_id",
                  "taluka_id",
                  "district_id",
                  "owner_id",
                  "ownership_type"
                ].filter(key => result.extracted_metadata[key] !== undefined)
                .map(key => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{key}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{result.extracted_metadata[key] || '—'}</span>
                  </div>
                ))}
                
                {/* Render any remaining fields that weren't in the explicit list */}
                {Object.keys(result.extracted_metadata)
                  .filter(key => ![
                    "record_id", "survey_no", "khasra_no", "owner_name", "village_name",
                    "taluka_name", "district_name", "area", "year", "land_type",
                    "village_id", "taluka_id", "district_id", "owner_id", "ownership_type"
                  ].includes(key))
                  .map(key => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{key}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{result.extracted_metadata[key] || '—'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Hashes & Proof */}
          <div style={{
            marginTop: 16, padding: '1.25rem 1.5rem', borderRadius: 14,
            background: 'var(--card-bg)', border: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
              Cryptographic Proof
            </h3>

            <HashRow label="Computed Hash (from uploaded doc)" value={result.computed_record_hash} />
            <HashRow label="Anchored Hash (on Polygon)" value={result.verification_details.anchored_hash} />
            <HashRow label="Merkle Root" value={result.verification_details.merkle_root} />

            {result.verification_details.polygon_tx && (
              <div style={{ marginTop: 12 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Polygon Transaction</span>
                <a
                  href={`https://amoy.polygonscan.com/tx/${result.verification_details.polygon_tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                    fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all'
                  }}
                >
                  {result.verification_details.polygon_tx} <ExternalLink size={12} />
                </a>
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <StatusBadge
                label="On-Chain"
                ok={result.verification_details.live_onchain_confirmation}
              />
              <StatusBadge
                label="Fields Match"
                ok={result.verification_details.fields_match ?? result.success}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <div style={{
        marginTop: 4, padding: '8px 12px', borderRadius: 8,
        background: 'var(--input-bg)', fontFamily: 'monospace',
        fontSize: '0.78rem', wordBreak: 'break-all',
        border: '1px solid var(--border)'
      }}>
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div style={{
      padding: '6px 14px', borderRadius: 8,
      background: ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
      fontSize: '0.8rem', fontWeight: 600,
      color: ok ? '#22c55e' : '#ef4444',
      display: 'flex', alignItems: 'center', gap: 6
    }}>
      {ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
      {label}: {ok ? 'Confirmed' : 'Failed'}
    </div>
  );
}
