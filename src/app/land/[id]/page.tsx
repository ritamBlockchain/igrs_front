'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, MapPin, User, Clock, Hash, CheckCircle, FileText, History, AlertTriangle, RefreshCw, Upload, X, FileImage, File } from "lucide-react";
import { api } from "@/lib/api";
import { keccak256 } from "ethers";
import { useRole } from "@/context/RoleContext";
import { LandLineageTree } from "@/components/LandLineageTree";
import CONFIG from "@/lib/config";

export default function LandDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { role } = useRole();
  const [tab, setTab] = useState<'details'|'history'|'lineage'|'verify'|'owner'>('details');
  
  const [record, setRecord] = useState<any>(null);
  const [chainOfTitle, setChainOfTitle] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMutations, setActiveMutations] = useState<any[]>([]);

  // Verification state
  const [verifyHash, setVerifyHash] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{success: boolean, message: string, data?: any} | null>(null);

  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useState<HTMLInputElement | null>(null)[0];

  // Set Owner state
  const [ownerName, setOwnerName] = useState('');
  const [ownerHash, setOwnerHash] = useState('');
  const [settingOwner, setSettingOwner] = useState(false);
  const [setOwnerResult, setSetOwnerResult] = useState<{success: boolean, message: string} | null>(null);

  // Auto-populate owner name and hash
  useEffect(() => {
    if (record?.owner_name) {
      setOwnerName(record.owner_name);
      const computeHash = async (text: string) => {
        const msgUint8 = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };
      computeHash(record.owner_name).then(setOwnerHash);
    }
  }, [record?.owner_name]);

  const handleSetOwner = async () => {
    if (!ownerName || !ownerHash) {
      setSetOwnerResult({ success: false, message: 'Owner name and hash are required' });
      return;
    }
    
    setSettingOwner(true);
    setSetOwnerResult(null);
    try {
      const res = await api.setInitialOwner(id, ownerName, ownerHash);
      setSetOwnerResult({ success: true, message: res.message || 'Successfully set initial owner on ledger.' });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setSetOwnerResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to set owner' 
      });
    } finally {
      setSettingOwner(false);
    }
  };

  const handleVerify = async () => {
    if (!verifyHash) {
      setVerifyResult({ success: false, message: 'Please enter a document hash to verify' });
      return;
    }
    
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyLandRecord(id, verifyHash);
      const data = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
      
      if (data.valid || data.Valid) {
        setVerifyResult({ 
          success: true, 
          message: 'Verification Successful! The document hash matches the immutable ledger record.',
          data 
        });
      } else {
        setVerifyResult({ 
          success: false, 
          message: 'Verification Failed. The document hash does not match the ledger record.',
          data
        });
      }
    } catch (err) {
      setVerifyResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Verification failed to execute on the network' 
      });
    } finally {
      setVerifying(false);
    }
  };

  // Keccak256 hash generation function
  const generateKeccak256Hash = async (text: string): Promise<string> => {
    return keccak256(text);
  };

  // OCR extraction placeholder function
  const extractTextFromOCR = async (file: File): Promise<string> => {
    // This is a placeholder - will be replaced with actual OCR implementation
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Placeholder: return file content as text
        // In production, this would call the OCR API
        resolve(`OCR extracted text from ${file.name} - Implementation pending`);
      };
      reader.readAsText(file);
    });
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setVerifyResult({ success: false, message: 'Please upload a PDF or image file (JPEG, PNG)' });
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setVerifyResult(null);

    try {
      // Extract text from OCR (placeholder)
      const text = await extractTextFromOCR(file);
      setExtractedText(text);

      // Generate keccak256 hash
      const hash = await generateKeccak256Hash(text);
      setVerifyHash(hash);

      setVerifyResult({ 
        success: true, 
        message: `File processed successfully. Hash generated from OCR extracted content.` 
      });
    } catch (err) {
      setVerifyResult({ 
        success: false, 
        message: err instanceof Error ? err.message : 'Failed to process file' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/jpeg,image/png,image/jpg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };
    input.click();
  };

  const clearFile = () => {
    setUploadedFile(null);
    setExtractedText('');
    setVerifyHash('');
    setVerifyResult(null);
  };

  // Fetch record data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recordData, historyData, mutationsData] = await Promise.all([
          api.getRecord(id).catch(() => null),
          api.getRecordHistory(id).catch(() => ({ timeline: [] })),
          api.getMutationsByRecordId(id).catch(() => ({ mutations: [] })),
        ]);
        
        if (recordData) {
          // The API returns { record, chainOfTitle, ownershipGraph, ... }
          setRecord(recordData.record || recordData);
          setChainOfTitle(recordData.chainOfTitle || []);
        }
        
        // Filter mutations for this record
        const recordMutations = (mutationsData.mutations || []).filter(
          (m: any) => m.status !== 'finalized' && m.status !== 'FINALIZED'
        );
        setActiveMutations(recordMutations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch record');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="animate-in" style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--slate-500)' }}>Loading record from Fabric...</div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="animate-in" style={{ padding: 40, textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: 16 }} />
        <h2>Record Not Found</h2>
        <p style={{ color: 'var(--slate-500)', marginTop: 8 }}>{error || `Record ${id} not found on the ledger`}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-primary" 
          style={{ marginTop: 16 }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  const tabs: Array<{ key: 'details' | 'history' | 'lineage' | 'verify' | 'owner'; label: string; icon: React.ElementType }> = [
    { key: 'details', label: 'Record Details', icon: FileText },
    { key: 'history', label: 'History', icon: History },
    { key: 'lineage', label: 'Lineage Tree', icon: Hash },
    { key: 'verify', label: 'Verify', icon: Shield },
    ...(role && ['Admin', 'Revenue Admin', 'Revenue Officer'].includes(role) ? [{ key: 'owner' as const, label: 'Set Owner', icon: User }] : []),
  ];

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>📄 {record.record_id || id}</h1>
          <p>Land record detail view with full history and verification</p>
          {activeMutations.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {activeMutations.map(m => (
                <span key={m.id} className="badge badge-warning">
                  Pending {m.mutation_type} mutation
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            onClick={() => window.location.reload()} 
            className="btn btn-outline" 
            style={{ fontSize: 12 }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <span className={`badge ${record.status === 'verified' ? 'badge-success' : record.is_frozen ? 'badge-error' : 'badge-warning'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            {record.status?.toUpperCase?.() || 'UNKNOWN'}
            {record.is_frozen && ' (FROZEN)'}
          </span>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--slate-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              fontSize: 13, fontWeight: tab === t.key ? 600 : 500,
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? 'var(--blue-700)' : 'var(--slate-500)',
              boxShadow: tab === t.key ? 'var(--shadow-xs)' : 'none',
              transition: 'all 0.15s',
            }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeMutations.length > 0 && (
            <div className="card" style={{ padding: 24, border: '1px solid var(--warning)', background: 'var(--warning-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <AlertTriangle size={20} color="var(--warning)" />
                <h3 style={{ margin: 0, color: 'var(--warning)', fontSize: 16 }}>Active Mutations Pending</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeMutations.map(m => (
                  <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #fde68a' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>Mutation Type</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-800)' }}>{m.mutation_type || 'Transfer'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--warning)' }}>{m.status}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>From (Current Owner)</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--slate-700)' }}>{m.current_owner || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 4 }}>To (New Owner)</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>{m.new_owner || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { label: 'Owner', value: record.owner_name, icon: <User size={14} /> },
              { label: "Father's Name", value: record.father_name || 'N/A', icon: <User size={14} /> },
              { label: 'Village', value: record.village_name, icon: <MapPin size={14} /> },
              { label: 'Taluka', value: record.taluka_name, icon: <MapPin size={14} /> },
              { label: 'District', value: record.district_name, icon: <MapPin size={14} /> },
              { label: 'Plot Number', value: record.plot_number || 'N/A', icon: <Hash size={14} /> },
              { label: 'Survey Number', value: record.survey_number || 'N/A', icon: <Hash size={14} /> },
              { label: 'Area', value: (() => {
                const a = record.area && record.area !== '<nil>' ? record.area : (record.area_sq_m && String(record.area_sq_m) !== '<nil>' ? record.area_sq_m : null);
                return a ? `${a} sqm` : 'N/A';
              })(), icon: <MapPin size={14} /> },
              { label: 'Land Type', value: (record.land_type && record.land_type !== 'LAND') ? record.land_type : (record.land_type || 'N/A') },
              { label: 'Doc Type', value: record.doc_type || 'N/A' },
              { label: 'Version', value: `v${record.version || 1}` },
              { label: 'Created', value: record.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A', icon: <Clock size={14} /> },
              { label: 'Updated', value: record.updated_at ? new Date(record.updated_at).toLocaleDateString() : 'N/A', icon: <Clock size={14} /> },
              { label: 'Anchored', value: (record.anchor_status === 'anchored' || record.is_anchored || record.tx_hash) ? 'Yes ✓' : 'No' },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--slate-800)' }}>{f.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--slate-100)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 6 }}>Record ID</div>
            <div className="mono" style={{ padding: '10px 14px', background: 'var(--slate-50)', borderRadius: 8, color: 'var(--slate-600)', wordBreak: 'break-all' }}>{record.record_id}</div>
            {record.document_hash && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: 6 }}>Document Hash</div>
                <div className="mono" style={{ padding: '10px 14px', background: 'var(--slate-50)', borderRadius: 8, color: 'var(--slate-600)', wordBreak: 'break-all', fontSize: 12 }}>{record.document_hash}</div>
              </div>
            )}
            {record.tx_hash && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 6 }}>✓ Transaction Hash (Fabric Ledger)</div>
                <div className="mono" style={{ padding: '10px 14px', background: 'var(--slate-50)', borderRadius: 8, color: 'var(--slate-600)', wordBreak: 'break-all', fontSize: 12 }}>{record.tx_hash}</div>
              </div>
            )}
            {(record.anchor_status === 'anchored' || record.is_anchored) && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>This record is anchored on the Hyperledger Fabric blockchain</div>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="card" style={{ padding: 28, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <History size={20} color="var(--blue-600)" />
            <h3 style={{ margin: 0 }}>Chain of Title (Fabric Ledger)</h3>
          </div>
          
          {chainOfTitle.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--slate-400)', background: 'var(--slate-50)', borderRadius: 12 }}>
              <Clock size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>No ownership transfer history found on the ledger</p>
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              {/* Vertical Line */}
              <div style={{ position: 'absolute', left: 8, top: 10, bottom: 10, width: 2, background: 'linear-gradient(to bottom, var(--blue-200), var(--slate-100))', borderRadius: 1 }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {chainOfTitle.map((h: any, i: number) => (
                  <div key={i} style={{ position: 'relative', display: 'flex', gap: 20 }}>
                    {/* Dot */}
                    <div style={{ 
                      position: 'absolute', left: -18, top: 6, width: 14, height: 14, borderRadius: '50%', 
                      background: i === 0 ? 'var(--blue-600)' : '#fff', 
                      border: `3px solid ${i === 0 ? 'var(--blue-100)' : 'var(--blue-200)'}`,
                      boxShadow: i === 0 ? '0 0 0 4px var(--blue-50)' : 'none',
                      zIndex: 2 
                    }} />
                    
                    <div style={{ flex: 1, padding: 20, background: i === 0 ? 'var(--blue-50)' : '#fff', borderRadius: 16, border: `1px solid ${i === 0 ? 'var(--blue-100)' : 'var(--slate-200)'}`, boxShadow: i === 0 ? 'var(--shadow-sm)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Mutation Type</div>
                            <span className={`badge ${h.transfer_type?.toLowerCase().includes('sale') ? 'badge-success' : h.transfer_type?.toLowerCase().includes('gift') ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: 11, padding: '4px 12px' }}>
                              {h.transfer_type || 'Original Registration'}
                            </span>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Owner Recorded</div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-800)' }}>{h.owner_name}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--slate-400)', fontWeight: 500, textAlign: 'right' }}>
                          <div style={{ color: 'var(--slate-600)', fontWeight: 600 }}>{h.transfer_date && new Date(h.transfer_date).toLocaleDateString()}</div>
                          <div style={{ fontSize: 10 }}>{h.transfer_date && new Date(h.transfer_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                      
                      {h.tx_hash && (
                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Shield size={12} color="var(--blue-500)" />
                          <div className="mono" style={{ fontSize: 11, color: 'var(--blue-600)', background: 'rgba(59, 130, 246, 0.08)', padding: '4px 10px', borderRadius: 6, wordBreak: 'break-all' }}>
                            {h.tx_hash}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lineage Tab */}
      {tab === 'lineage' && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <Hash size={20} color="var(--blue-600)" />
            <h3 style={{ margin: 0 }}>Land Lineage Hierarchy</h3>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 24, padding: 4 }}>
            <LandLineageTree 
              apiUrl={CONFIG.API_BASE_URL} 
              recordId={record.record_id || id} 
            />
          </div>
        </div>
      )}

      {/* Verify Tab */}
      {tab === 'verify' && (
        <div className="card" style={{ padding: 28, maxWidth: 700 }}>
          <h3 style={{ marginBottom: 20 }}>Verify Land Record</h3>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>
            Upload a PDF or image document to verify against the on-chain record. The system will extract content via OCR and generate a keccak256 hash for verification.
          </p>

          {/* File Upload Zone */}
          {!uploadedFile ? (
            <div
              style={{
                border: `2px dashed ${isDragging ? 'var(--blue-400)' : 'var(--slate-200)'}`,
                background: isDragging ? 'var(--blue-50)' : 'var(--slate-50)',
                padding: '60px 40px',
                textAlign: 'center',
                borderRadius: 16,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                marginBottom: 24
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <div style={{ background: 'white', width: 80, height: 80, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                <Upload size={40} className="text-blue-600" />
              </div>
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {isDragging ? 'Drop file here' : 'Upload Document'}
              </h4>
              <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 16 }}>
                Drag and drop a PDF or image file, or click to browse
              </p>
              <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
                Supported formats: PDF, JPEG, PNG
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <div style={{ background: 'var(--slate-50)', padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ background: 'white', width: 60, height: 60, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploadedFile.type === 'application/pdf' ? <File size={32} className="text-red-500" /> : <FileImage size={32} className="text-blue-500" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {uploadedFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  style={{ padding: 8, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-500)' }}
                >
                  <X size={20} />
                </button>
              </div>

              {extractedText && (
                <div style={{ marginTop: 16, padding: 16, background: 'var(--blue-50)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--blue-700)', marginBottom: 8 }}>OCR Extracted Content:</div>
                  <div style={{ fontSize: 12, color: 'var(--blue-800)', wordBreak: 'break-word' }}>{extractedText}</div>
                </div>
              )}
            </div>
          )}

          {/* Manual Hash Input */}
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--slate-100)' }}>
            <label className="label">Or enter document hash manually (Keccak256)</label>
            <input 
              className="input mono" 
              placeholder="Enter 64-character hex hash to verify..." 
              style={{ marginBottom: 16 }} 
              value={verifyHash}
              onChange={(e) => setVerifyHash(e.target.value)}
            />
          </div>

          <button 
            className="btn btn-primary" 
            onClick={handleVerify}
            disabled={verifying || !verifyHash}
            style={{ width: '100%' }}
          >
            {verifying ? (
              <><RefreshCw size={16} className="spin" /> Verifying...</>
            ) : (
              <><Shield size={16} /> Verify Against Ledger</>
            )}
          </button>

          {verifyResult && (
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              borderRadius: 8, 
              background: verifyResult.success ? 'var(--green-50)' : 'var(--red-50)',
              border: `1px solid ${verifyResult.success ? 'var(--green-200)' : 'var(--red-200)'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: verifyResult.success ? 'var(--green-700)' : 'var(--red-700)', fontWeight: 600, marginBottom: 8 }}>
                {verifyResult.success ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                {verifyResult.success ? 'Valid Record' : 'Invalid Match'}
              </div>
              <p style={{ fontSize: 13, color: verifyResult.success ? 'var(--green-800)' : 'var(--red-800)', margin: 0 }}>
                {verifyResult.message}
              </p>
              {verifyResult.data && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${verifyResult.success ? 'var(--green-200)' : 'var(--red-200)'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: verifyResult.success ? 'var(--green-600)' : 'var(--red-600)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Ledger Version Checked
                  </div>
                  <div style={{ fontSize: 13, color: verifyResult.success ? 'var(--green-800)' : 'var(--red-800)' }}>
                    v{verifyResult.data.version || verifyResult.data.Version}
                  </div>
                  
                  {verifyResult.data.lastTxId && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, color: verifyResult.success ? 'var(--green-600)' : 'var(--red-600)', textTransform: 'uppercase', marginTop: 12, marginBottom: 4 }}>
                        Transaction Hash
                      </div>
                      <div className="mono" style={{ fontSize: 11, wordBreak: 'break-all', color: verifyResult.success ? 'var(--green-800)' : 'var(--red-800)' }}>
                        {verifyResult.data.lastTxId || verifyResult.data.LastTxID}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Set Owner Tab */}
      {tab === 'owner' && (
        <div className="card" style={{ padding: 28, maxWidth: 600 }}>
          <h3 style={{ marginBottom: 8 }}>Set Initial Owner</h3>
          <p style={{ fontSize: 13, color: 'var(--slate-500)', marginBottom: 20 }}>
            Initialize ownership for this land record. Only available if ownership has not been set.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Owner Name *</label>
              <input 
                className="input" 
                placeholder="Full legal name" 
                value={ownerName}
                readOnly // Automated
              />
            </div>
            <div>
              <label className="label">Owner Hash (SHA-256) *</label>
              <input 
                className="input mono" 
                placeholder="64-character hex hash" 
                value={ownerHash}
                readOnly // Automated
              />
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleSetOwner}
              disabled={settingOwner || !ownerName || !ownerHash}
            >
              {settingOwner ? (
                <><RefreshCw size={16} className="spin" /> Setting Owner...</>
              ) : (
                <><User size={16} /> Set Owner on Ledger</>
              )}
            </button>
            {setOwnerResult && (
              <div style={{ 
                marginTop: 8, 
                padding: 12, 
                borderRadius: 8, 
                background: setOwnerResult.success ? 'var(--green-50)' : 'var(--red-50)',
                color: setOwnerResult.success ? 'var(--green-700)' : 'var(--red-700)',
                fontSize: 13,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                {setOwnerResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {setOwnerResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
