'use client';

import { useRole } from "@/context/RoleContext";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Upload, FileCheck, Copy, Check } from "lucide-react";

export default function RegisterLandPage() {
  const { role } = useRole();
  const [submitted, setSubmitted] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [copied, setCopied] = useState(false);
  const [indexCopied, setIndexCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    recordId: '',
    docHash: '',
    surveyNo: '',
    khasraNo: '',
    village: '',
    tehsil: '',
    district: '',
    area: '',
    landType: '',
    docType: '',
    ownerId: '',
    ownershipType: '',
    indexHash: ''
  });

  const canRegister = role === 'Admin' || role === 'Revenue Admin';

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
      setFormData(prev => ({ ...prev, docHash: hashHex }));
    } catch (err) {
      console.error("Hashing failed:", err);
    } finally {
      setHashing(false);
    }
  };

  // Automatically generate Index Hash when all fields are filled
  useEffect(() => {
    const generateIndexHash = async () => {
      const requiredFields = [
        'recordId', 'docHash', 'surveyNo', 'village', 
        'tehsil', 'district', 'area', 'landType', 
        'docType', 'ownerId', 'ownershipType'
      ];
      
      const allFilled = requiredFields.every(field => !!(formData as any)[field]);

      if (allFilled) {
        // Concatenate all field values to create a unique record string
        const recordString = requiredFields
          .map(field => (formData as any)[field])
          .join('|');
        
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(recordString);
          const hashBuffer = await crypto.subtle.digest('SHA-256', data);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          setFormData(prev => ({ ...prev, indexHash: hashHex }));
        } catch (err) {
          console.error("Index hashing failed:", err);
        }
      } else {
        setFormData(prev => ({ ...prev, indexHash: '' }));
      }
    };

    generateIndexHash();
  }, [
    formData.recordId, formData.docHash, formData.surveyNo, 
    formData.village, formData.tehsil, formData.district, 
    formData.area, formData.landType, formData.docType, 
    formData.ownerId, formData.ownershipType
  ]);

  const copyToClipboard = (text: string, isIndex: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isIndex) {
      setIndexCopied(true);
      setTimeout(() => setIndexCopied(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!canRegister) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Only Admin and Revenue Admin can register land records.</p>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1>📝 Register New Land Record</h1>
        <p>Create a new land record on the Hyperledger Fabric ledger</p>
      </div>

      {submitted ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
          <CheckCircle size={48} color="var(--success)" style={{ marginBottom: 16 }} />
          <h2>Record Submitted</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 24px' }}>Transaction committed to Fabric ledger successfully.</p>
          <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Register Another</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 32, maxWidth: 800 }}>
          <h3 style={{ marginBottom: 24, color: 'var(--text-heading)' }}>Land Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: 'span 2' }}>
               <label className="label">Upload Document (for Auto-Hashing) *</label>
               <div style={{ 
                 border: '2px dashed var(--border)', 
                 borderRadius: '16px', 
                 padding: '32px', 
                 textAlign: 'center',
                 background: 'var(--bg-hover)',
                 cursor: 'pointer',
                 transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                 position: 'relative',
                 overflow: 'hidden'
               }}
               onDragOver={(e) => {
                 e.preventDefault();
                 e.currentTarget.style.borderColor = 'var(--blue-500)';
                 e.currentTarget.style.background = 'var(--blue-50)';
               }}
               onDragLeave={(e) => {
                 e.preventDefault();
                 e.currentTarget.style.borderColor = 'var(--border)';
                 e.currentTarget.style.background = 'var(--bg-hover)';
               }}
               onDrop={async (e) => {
                 e.preventDefault();
                 e.currentTarget.style.borderColor = 'var(--border)';
                 e.currentTarget.style.background = 'var(--bg-hover)';
                 const file = e.dataTransfer.files[0];
                 if (file) {
                   const input = document.getElementById('file-upload') as HTMLInputElement;
                   const dataTransfer = new DataTransfer();
                   dataTransfer.items.add(file);
                   input.files = dataTransfer.files;
                   handleFileChange({ target: { files: dataTransfer.files } } as any);
                 }
               }}
               onClick={() => document.getElementById('file-upload')?.click()}
               >
                 <input 
                   id="file-upload" 
                   type="file" 
                   hidden 
                   onChange={handleFileChange}
                 />
                 {hashing ? (
                   <div style={{ animation: 'pulse 1s infinite' }}>
                     <div className="loader-spin" style={{ margin: '0 auto' }} />
                     <p style={{ fontSize: '14px', color: 'var(--blue-600)', fontWeight: 600, marginTop: '12px' }}>Computing SHA-256 Hash...</p>
                   </div>
                 ) : fileName ? (
                   <div>
                     <div style={{ 
                       width: 48, height: 48, borderRadius: '12px', background: 'var(--success-bg)', 
                       display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' 
                     }}>
                       <FileCheck size={24} color="var(--success)" />
                     </div>
                     <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>{fileName}</p>
                     <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>File verified & hashed locally</p>
                   </div>
                 ) : (
                   <div>
                     <div style={{ 
                       width: 48, height: 48, borderRadius: '12px', background: 'var(--blue-50)', 
                       display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' 
                     }}>
                       <Upload size={24} color="var(--blue-500)" />
                     </div>
                     <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>Click or drag file to upload</p>
                     <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PDF, PNG, JPG supported · 256-bit secure hashing</p>
                   </div>
                 )}
               </div>
            </div>

            <div>
              <label className="label">Record ID *</label>
              <input 
                className="input" 
                placeholder="e.g. REC-2026-38" 
                value={formData.recordId}
                onChange={(e) => updateField('recordId', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Document Hash (SHA-256) *</label>
              <div style={{ position: 'relative' }}>
                <input 
                  className="input mono" 
                  placeholder="Auto-generated from file" 
                  value={formData.docHash}
                  readOnly
                  style={{ 
                    paddingRight: '40px',
                    background: formData.docHash ? 'var(--bg-hover)' : 'var(--bg-input)',
                    fontSize: '11px'
                  }}
                />
                {formData.docHash && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(formData.docHash, false); }}
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
            <div>
              <label className="label">Survey Number *</label>
              <input 
                className="input" 
                placeholder="e.g. 123/A" 
                value={formData.surveyNo}
                onChange={(e) => updateField('surveyNo', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Khasra Number</label>
              <input 
                className="input" 
                placeholder="e.g. 456" 
                value={formData.khasraNo}
                onChange={(e) => updateField('khasraNo', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Village *</label>
              <input 
                className="input" 
                placeholder="e.g. Demo Village" 
                value={formData.village}
                onChange={(e) => updateField('village', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Tehsil *</label>
              <input 
                className="input" 
                placeholder="e.g. Demo Taluka" 
                value={formData.tehsil}
                onChange={(e) => updateField('tehsil', e.target.value)}
              />
            </div>
            <div>
              <label className="label">District *</label>
              <input 
                className="input" 
                placeholder="e.g. Demo District" 
                value={formData.district}
                onChange={(e) => updateField('district', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Area (sqm) *</label>
              <input 
                className="input" 
                type="number" 
                placeholder="e.g. 500" 
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Land Type *</label>
              <select 
                className="input"
                value={formData.landType}
                onChange={(e) => updateField('landType', e.target.value)}
              >
                <option value="">Select type...</option>
                <option>Agricultural</option>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Industrial</option>
              </select>
            </div>
            <div>
              <label className="label">Document Type *</label>
              <select 
                className="input"
                value={formData.docType}
                onChange={(e) => updateField('docType', e.target.value)}
              >
                <option value="">Select type...</option>
                <option>Sale Deed</option>
                <option>Gift Deed</option>
                <option>Revenue Record</option>
                <option>Court Order</option>
              </select>
            </div>
            <div>
              <label className="label">Owner ID *</label>
              <input 
                className="input" 
                placeholder="e.g. OWNER-001" 
                value={formData.ownerId}
                onChange={(e) => updateField('ownerId', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Ownership Type *</label>
              <select 
                className="input"
                value={formData.ownershipType}
                onChange={(e) => updateField('ownershipType', e.target.value)}
              >
                <option value="">Select type...</option>
                <option>Individual</option>
                <option>Joint</option>
                <option>Government</option>
                <option>Trust</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <label className="label">Index Hash (SHA-256)</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="input mono" 
                placeholder="64-character hex hash" 
                value={formData.indexHash}
                readOnly
                style={{ 
                  marginBottom: 24,
                  paddingRight: '40px',
                  background: formData.indexHash ? 'var(--bg-hover)' : 'var(--bg-input)',
                  fontSize: '11px'
                }} 
              />
              {formData.indexHash && (
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(formData.indexHash, true); }}
                  style={{ 
                    position: 'absolute', right: '8px', top: '16px', // Adjusted for label height
                    padding: '4px', borderRadius: '6px', color: 'var(--text-muted)',
                    transition: 'all 0.2s'
                  }}
                  title="Copy index hash"
                >
                  {indexCopied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => {
              setFileName('');
              setFormData({
                recordId: '',
                docHash: '',
                surveyNo: '',
                khasraNo: '',
                village: '',
                tehsil: '',
                district: '',
                area: '',
                landType: '',
                docType: '',
                ownerId: '',
                ownershipType: '',
                indexHash: ''
              });
            }}>Reset Form</button>
            <button 
              className="btn btn-primary" 
              onClick={() => setSubmitted(true)}
              disabled={!formData.indexHash}
              style={{ opacity: formData.indexHash ? 1 : 0.6 }}
            >
              Submit to Blockchain
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .loader-spin {
          width: 32px;
          height: 32px;
          border: 3px solid var(--blue-100);
          border-top: 3px solid var(--blue-500);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
