'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, X, Phone, ArrowRight, User, Lock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VerificationModalProps {
  onClose: () => void;
}

export default function VerificationModal({ onClose }: VerificationModalProps) {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
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
    
    // Transfer to the existing verification page with parameters
    const params = new URLSearchParams({
      name: fullName.trim(),
      phone: phoneNumber.trim()
    });
    
    onClose();
    router.push(`/verify?${params.toString()}`);
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
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px' }}>Identity Verification</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Provide your details to continue to the portal</p>
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
              Enter Portal <ArrowRight size={20} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: 0.5 }}>
              <Lock size={12} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>SECURE ACCESS CONTROL</span>
            </div>
          </form>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
