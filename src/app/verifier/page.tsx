'use client';

import { useState, useEffect } from "react";
import { Shield, Search, CheckCircle, AlertTriangle, User, Phone, LogOut, FileText } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import api from "@/lib/api";
import CONFIG from "@/lib/config";
import Link from "next/link";

export default function VerifierDashboard() {
  const { role, roleInfo, clearRole } = useRole();
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Identity verification state
  const [verifierName, setVerifierName] = useState('');
  const [verifierPhone, setVerifierPhone] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{success: boolean, message: string, data?: any} | null>(null);

  useEffect(() => {
    if (role !== 'Verifier') {
      window.location.href = '/';
    }
  }, [role]);

  const handleSearch = async () => {
    if (!searchId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/land-records/${searchId}`);
      if (!response.ok) {
        throw new Error('Record not found');
      }
      const data = await response.json();
      setSearchResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch record');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIdentity = () => {
    if (verifierName.trim() && verifierPhone.trim()) {
      setIdentityVerified(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Process file and extract text (placeholder for OCR)
      setExtractedText('OCR extracted text would appear here');
    }
  };

  const handleVerify = async () => {
    if (!verifyHash.trim()) return;
    setVerifying(true);
    try {
      // Placeholder for verification logic
      setVerifyResult({
        success: true,
        message: 'Verification successful',
        data: { computed_record_hash: verifyHash }
      });
    } catch (err) {
      setVerifyResult({
        success: false,
        message: 'Verification failed'
      });
    } finally {
      setVerifying(false);
    }
  };

  if (role !== 'Verifier') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--slate-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <Shield size={48} style={{ color: 'var(--slate-300)', margin: '0 auto 16px' }} />
          <h2 style={{ color: 'var(--slate-600)' }}>Access Denied</h2>
          <p style={{ color: 'var(--slate-500)' }}>You need Verifier role to access this page</p>
          <Link href="/" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: 'var(--blue-600)', color: 'white', borderRadius: 8, textDecoration: 'none' }}>
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ minHeight: '100vh', background: 'var(--slate-50)' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'var(--blue-50)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Verifier Dashboard</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-500)' }}>Land Record Verification Portal</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{roleInfo?.label}</div>
            <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{identityVerified ? `${verifierName} (${verifierPhone})` : 'Not verified'}</div>
          </div>
          <button
            onClick={clearRole}
            style={{ padding: '8px 16px', background: 'var(--slate-100)', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Identity Verification Form */}
        {!identityVerified && (
          <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ background: 'var(--blue-50)', width: 80, height: 80, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <User size={40} className="text-blue-600" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Identity Verification</h2>
            <p style={{ fontSize: 15, color: 'var(--slate-500)', marginBottom: 32 }}>
              Please provide your identity information to verify land records
            </p>

            <div style={{ textAlign: 'left', marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 8 }}>
                Full Name *
              </label>
              <input
                type="text"
                value={verifierName}
                onChange={(e) => setVerifierName(e.target.value)}
                placeholder="Enter your full name"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--slate-200)', fontSize: 15, marginBottom: 16 }}
              />
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 8 }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={verifierPhone}
                onChange={(e) => setVerifierPhone(e.target.value)}
                placeholder="Enter your phone number"
                style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--slate-200)', fontSize: 15 }}
              />
            </div>

            <button
              onClick={handleVerifyIdentity}
              disabled={!verifierName.trim() || !verifierPhone.trim()}
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: 16, borderRadius: 12, width: '100%' }}
            >
              Verify Identity
            </button>
          </div>
        )}

        {/* Verification Dashboard - Only shown after identity verification */}
        {identityVerified && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40 }}>
              {/* Search Section */}
              <div className="card" style={{ padding: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={20} className="text-blue-600" /> Search Land Record
                </h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Enter Record ID (e.g., MP-BHO-2026001)"
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: '1px solid var(--slate-200)', fontSize: 14 }}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading || !searchId.trim()}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px', borderRadius: 12 }}
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {error && (
                  <div style={{ background: 'var(--red-50)', color: 'var(--red-700)', padding: '12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}
                {searchResult && (
                  <div style={{ background: 'var(--green-50)', padding: 16, borderRadius: 12, marginTop: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <CheckCircle size={20} className="text-green-600" />
                      <span style={{ fontWeight: 600, color: 'var(--green-700)' }}>Record Found</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--green-800)' }}>
                      <strong>Record ID:</strong> {searchResult.record_id}<br />
                      <strong>Owner:</strong> {searchResult.owner_name}<br />
                      <strong>Status:</strong> {searchResult.status}
                    </div>
                    <Link
                      href={`/land/${searchResult.record_id}`}
                      style={{ display: 'inline-block', marginTop: 12, padding: '8px 16px', background: 'var(--blue-600)', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 14 }}
                    >
                      View Details →
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="card" style={{ padding: 32 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Verification Stats</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'var(--blue-50)', padding: 20, borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue-600)' }}>0</div>
                    <div style={{ fontSize: 13, color: 'var(--slate-600)', marginTop: 4 }}>Verified Today</div>
                  </div>
                  <div style={{ background: 'var(--green-50)', padding: 20, borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green-600)' }}>100%</div>
                    <div style={{ fontSize: 13, color: 'var(--slate-600)', marginTop: 4 }}>Success Rate</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Verifications */}
            <div className="card" style={{ padding: 32 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} className="text-blue-600" /> Recent Verifications
              </h3>
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>
                <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>No recent verifications</p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
