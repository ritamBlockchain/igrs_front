'use client';

import { useState } from "react";
import { Upload, FileText, CheckCircle, FileCheck, Loader2, Copy, Check } from "lucide-react";

export default function DocumentsPage() {
  const [hashing, setHashing] = useState(false);
  const [docHash, setDocHash] = useState('');
  const [fileName, setFileName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setHashing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setDocHash(hashHex);
    } catch (err) {
      console.error("Hashing failed:", err);
    } finally {
      setHashing(false);
    }
  };

  const copyToClipboard = () => {
    if (!docHash) return;
    navigator.clipboard.writeText(docHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📄 Document Management</h1>
        <p>Upload document hashes and anchor to land records</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Upload Document Hash</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Select Document *</label>
              <div 
                style={{ 
                  border: '2px dashed var(--border)', 
                  borderRadius: '16px', 
                  padding: '32px', 
                  textAlign: 'center',
                  background: 'var(--bg-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--blue-500)';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--border)';
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const input = document.getElementById('doc-file') as HTMLInputElement;
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    handleFileChange({ target: { files: dt.files } } as any);
                  }
                }}
                onClick={() => document.getElementById('doc-file')?.click()}
              >
                <input id="doc-file" type="file" hidden onChange={handleFileChange} />
                {hashing ? (
                  <div style={{ animation: 'pulse 1s infinite' }}>
                    <Loader2 size={32} className="animate-spin" color="var(--blue-500)" style={{ margin: '0 auto' }} />
                    <p style={{ fontSize: '13px', color: 'var(--blue-600)', fontWeight: 600, marginTop: '12px' }}>Hashing file...</p>
                  </div>
                ) : fileName ? (
                  <div>
                    <div style={{ 
                      width: 48, height: 48, borderRadius: '12px', background: 'var(--success-bg)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' 
                    }}>
                      <FileCheck size={24} color="var(--success)" />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{fileName}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>SHA-256 hash computed</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ 
                      width: 48, height: 48, borderRadius: '12px', background: 'var(--blue-50)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' 
                    }}>
                      <Upload size={24} color="var(--blue-500)" />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>Click or drag file to upload</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Local hashing ensures privacy</p>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="label">Document ID *</label><input className="input" placeholder="DOC-2026-001" /></div>
              <div><label className="label">Record ID *</label><input className="input" placeholder="REC-2026-XX" /></div>
            </div>

            <div>
              <label className="label">File Hash (SHA-256) *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="input mono" 
                  placeholder="Auto-generated from file" 
                  value={docHash}
                  readOnly
                  style={{ 
                    paddingRight: '40px',
                    background: 'var(--bg-hover)',
                    fontSize: '11px'
                  }}
                />
                {docHash && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(); }}
                    style={{ 
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      padding: '4px', borderRadius: '6px', color: 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }}
                    title="Copy hash"
                  >
                    {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="label">IPFS CID</label><input className="input mono" placeholder="QmXxx..." /></div>
              <div><label className="label">Document Type *</label>
                <select className="input">
                  <option>Sale Deed</option>
                  <option>Gift Deed</option>
                  <option>Court Order</option>
                  <option>Revenue Record</option>
                </select>
              </div>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: 8 }}><Upload size={16} /> Upload Hash to Ledger</button>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h3 style={{ marginBottom: 20 }}>Record Anchor Receipt</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="label">Record ID *</label><input className="input" placeholder="REC-2026-XX" /></div>
              <div><label className="label">Platform</label><input className="input" value="Polygon Amoy" readOnly style={{ background: 'var(--bg-hover)' }} /></div>
            </div>
            <div><label className="label">Tx Hash *</label><input className="input mono" placeholder="0x..." /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label className="label">Block Number</label><input className="input" type="number" placeholder="e.g. 12345678" /></div>
              <div><label className="label">Merkle Root</label><input className="input mono" placeholder="SHA-256 merkle root" /></div>
            </div>
            <button className="btn btn-primary" style={{ marginTop: 8 }}><CheckCircle size={16} /> Record Anchor</button>
          </div>
        </div>
      </div>
    </div>
  );
}
