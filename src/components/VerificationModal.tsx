'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Shield, X, Phone, FileText, Upload, CheckCircle, 
  XCircle, Loader2, ArrowRight, ExternalLink,
  AlertTriangle, User, Lock
} from 'lucide-react';
import CONFIG from '@/lib/config';

interface VerificationModalProps {
  onClose: () => void;
}

export default function VerificationModal({ onClose }: VerificationModalProps) {
  const [step, setStep] = useState<'info' | 'upload' | 'result'>('info');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number');
      return;
    }
    setError(null);
    setStep('upload');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      setFile(dropped);
      setError(null);
    }
  };

  const handleVerify = async () => {
    if (!file) {
      setError('Please upload a document');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('record_id', fullName.trim());
      formData.append('file', file);
      formData.append('phone', phoneNumber.trim());

      const res = await fetch(`${CONFIG.API_BASE_URL}/api/land/verify-document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Verification failed: ${text}`);
      }

      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px 14px 50px',
    borderRadius: '16px',
    border: '1.5px solid var(--border)',
    background: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
    transition: 'all 0.2s',
    fontWeight: 500
  };

  const iconStyle = {
    position: 'absolute' as const,
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(10px)',
      zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        width: '100%', maxWidth: '460px',
        borderRadius: '28px', border: '1px solid var(--border)',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)',
        overflow: 'hidden', position: 'relative',
        animation: 'modalFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '10px', 
              background: 'var(--gradient-brand)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Shield size={18} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>JADE PROOF</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '0 32px 40px' }}>
          {step === 'info' && (
            <form onSubmit={handleInfoSubmit}>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px' }}>Identity Verification</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Provide your name and contact details</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={20} style={iconStyle} />
                  <input 
                    style={inputStyle} 
                    placeholder="Enter name" 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={20} style={iconStyle} />
                  <input 
                    style={inputStyle} 
                    type="tel"
                    placeholder="+91 98765 43210" 
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div style={{ padding: '12px', borderRadius: '12px', background: 'var(--error-bg)', color: 'var(--error)', fontSize: '0.875rem', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <button type="submit" style={{ 
                width: '100%', padding: '16px', borderRadius: '16px', 
                background: 'var(--gradient-brand)', color: '#fff', 
                fontWeight: 800, cursor: 'pointer', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}>
                Next: Upload Document <ArrowRight size={20} />
              </button>
            </form>
          )}

          {step === 'upload' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px' }}>Upload Document</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Document copy for {fullName}</p>
              </div>

              <div 
                style={{
                  padding: '50px 20px', borderRadius: '20px',
                  border: `2.5px dashed ${isDragging ? 'var(--blue-500)' : 'var(--border)'}`,
                  textAlign: 'center', cursor: 'pointer',
                  background: isDragging ? 'rgba(59, 130, 246, 0.05)' : 'rgba(0,0,0,0.02)',
                  marginBottom: '28px'
                }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: 'none' }} />
                <div style={{ marginBottom: 16 }}>
                  {file ? <FileText size={48} color="var(--blue-600)" /> : <Upload size={48} color="var(--text-muted)" />}
                </div>
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700 }}>{file.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 700 }}>Drag or click to upload</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PDF, JPG, PNG</div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => setStep('info')} style={{ flex: 1, padding: '16px', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'pointer' }}>Back</button>
                <button onClick={handleVerify} disabled={loading || !file} style={{ 
                  flex: 2, padding: '16px', borderRadius: '16px', background: 'var(--gradient-brand)', color: '#fff', 
                  fontWeight: 800, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}>
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
                  {loading ? 'Verifying...' : 'Verify On-Chain'}
                </button>
              </div>
            </div>
          )}

          {step === 'result' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 24 }}>
                {result.success ? <CheckCircle size={64} color="var(--success)" /> : <XCircle size={64} color="var(--error)" />}
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: result.success ? 'var(--success)' : 'var(--error)' }}>
                {result.success ? 'Verified Authentic' : 'Verification Failed'}
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 32 }}>
                {result.success ? 'Blockchain hash matches the document.' : 'The document does not match the ledger.'}
              </p>
              <button onClick={onClose} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--gradient-brand)', color: '#fff', fontWeight: 800, border: 'none', cursor: 'pointer' }}>Close Portal</button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
