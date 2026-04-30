'use client';

import { useRole } from "@/context/RoleContext";
import { useData } from "@/context/DataContext";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Upload, FileCheck, Copy, Check, Loader2 } from "lucide-react";

export default function RegisterLandPage() {
  const { role } = useRole();
  const { refreshAll } = useData();
  const [submitted, setSubmitted] = useState(false);
  const [hashing, setHashing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

  // Extract data from document (simulated - in production this would use OCR/API)
  const extractDataFromDocument = async (file: File): Promise<Partial<typeof formData>> => {
    // In production: Call backend OCR API to extract data from PDF/Image
    // For demo: Simulate extracted data based on filename
    const filename = file.name.toLowerCase();
    
    // Simulate data extraction with demo values
    const extracted: Partial<typeof formData> = {};
    
    // Try to extract survey number from filename (e.g., "survey-123-A.pdf")
    const surveyMatch = filename.match(/survey-?(\d+[-\/]?[a-z]?)/i);
    if (surveyMatch) extracted.surveyNo = surveyMatch[1];
    
    // Try to extract khasra number
    const khasraMatch = filename.match(/khasra-?(\d+)/i);
    if (khasraMatch) extracted.khasraNo = khasraMatch[1];
    
    // Default values for demo
    extracted.village = extracted.village || 'Demo Village';
    extracted.tehsil = extracted.tehsil || 'Demo Taluka';
    extracted.district = extracted.district || 'Demo District';
    extracted.landType = extracted.landType || 'Agricultural';
    extracted.docType = extracted.docType || 'Sale Deed';
    extracted.ownerId = extracted.ownerId || 'OWNER-' + Math.floor(Math.random() * 1000);
    extracted.ownershipType = extracted.ownershipType || 'Individual';
    extracted.area = extracted.area || (Math.floor(Math.random() * 1000) + 100).toString();
    
    return extracted;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setHashing(true);

    try {
      // Generate SHA-256 hash
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Extract data from document
      const extractedData = await extractDataFromDocument(file);
      
      // Update form with hash and extracted data
      setFormData(prev => ({
        ...prev,
        docHash: hashHex,
        ...extractedData
      }));
    } catch (err) {
      console.error("Processing failed:", err);
    } finally {
      setHashing(false);
    }
  };

  // Automatically generate Index Hash when all fields are filled
  useEffect(() => {
    const generateIndexHash = async () => {
      // Document hash is optional - only required fields for index hash generation
      const requiredFields = [
        'recordId', 'surveyNo', 'village', 
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
    formData.recordId, formData.surveyNo, 
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
               <label className="label">Upload Document<span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>(Optional)</span></label>
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

            {/* Document Hash is auto-generated from uploaded file - hidden field */}
            <input type="hidden" value={formData.docHash} />
            
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
              <label className="label">Survey Number *</label>
              <input 
                className="input" 
                placeholder="e.g. 123/A (auto-extracted from doc)" 
                value={formData.surveyNo}
                onChange={(e) => updateField('surveyNo', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Khasra Number</label>
              <input 
                className="input" 
                placeholder="e.g. 456 (auto-extracted from doc)" 
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
            {submitError && (
              <div style={{ color: 'var(--error)', fontSize: 13, marginRight: 'auto' }}>
                Error: {submitError}
              </div>
            )}
            <button 
              className="btn btn-primary" 
              onClick={async () => {
                if (!formData.indexHash) return;
                setSubmitting(true);
                setSubmitError(null);
                try {
                  await api.createRecord({
                    record_id: formData.recordId,
                    owner_name: formData.ownerId,
                    owner_id: formData.ownerId,
                    survey_no: formData.surveyNo,
                    khasra_no: formData.khasraNo,
                    village_name: formData.village,
                    taluka_name: formData.tehsil,
                    district_name: formData.district,
                    // Required numeric IDs for backend - using demo values
                    // In production, these would come from a village/district selector
                    village_id: 1,
                    district_id: 1,
                    block_id: 1,
                    taluka_id: 1,
                    area_sq_m: parseFloat(formData.area) || 0,
                    land_type: formData.landType,
                    doc_type: formData.docType,
                    ownership_type: formData.ownershipType,
                    // Document hash is required by chaincode - use placeholder if not uploaded
                    document_hash: formData.docHash || '0000000000000000000000000000000000000000000000000000000000000000',
                    index_hash: formData.indexHash,
                  });
                  setSubmitted(true);
                  // Refresh records in DataContext so new record appears in list
                  await refreshAll();
                } catch (err) {
                  setSubmitError(err instanceof Error ? err.message : 'Failed to submit record');
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={!formData.indexHash || submitting}
              style={{ opacity: formData.indexHash && !submitting ? 1 : 0.6 }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', marginRight: 8 }} />
                  Submitting...
                </>
              ) : (
                'Submit to Blockchain'
              )}
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
