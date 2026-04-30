'use client';

import { useRole } from "@/context/RoleContext";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertTriangle, Shield, CheckCircle, RefreshCw, Database, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";

// RBAC: who can READ each collection from Fabric CouchDB
const READ_RBAC: Record<string, string[]> = {
  owner:     ['Admin', 'System Admin', 'Revenue Officer', 'Collector', 'Auditor', 'Patwari'],
  legal:     ['Admin', 'System Admin', 'Legal Authority', 'Court Registrar', 'Auditor', 'IGR', 'Collector'],
  financial: ['Admin', 'System Admin', 'Bank', 'Auditor', 'IGR', 'Collector', 'Revenue Officer'],
};

// RBAC: who can WRITE each collection to Fabric CouchDB
const WRITE_RBAC: Record<string, string[]> = {
  owner:     ['Admin', 'System Admin', 'Revenue Officer', 'Collector'],
  legal:     ['Admin', 'System Admin', 'Legal Authority', 'Court Registrar', 'Collector'],
  financial: ['Admin', 'System Admin', 'Bank', 'Collector'],
};

const META: Record<string, { title: string; emoji: string; color: string; desc: string }> = {
  owner:     { title: 'Owner Private Data',     emoji: '👤', color: 'var(--blue-600)',    desc: 'KYC, Aadhaar, contact info — stored in Fabric CouchDB (never on public ledger)' },
  legal:     { title: 'Legal Private Data',     emoji: '📋', color: 'var(--warning)',     desc: 'Court orders, case IDs, legal holds — stored in Fabric CouchDB' },
  financial: { title: 'Financial Private Data', emoji: '🏦', color: 'var(--success)',     desc: 'Bank loans, encumbrance details — stored in Fabric CouchDB' },
};

const SENSITIVE = ['aadhaarHash', 'kycHash', 'aadhaar_hash', 'kyc_hash', 'mobile', 'phone', 'email', 'loanAmount', 'loan_amount', 'encumbranceAmount'];

function FieldGrid({ data, show, type }: { data: Record<string, any>; show: boolean; type?: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
      {Object.entries(data).filter(([k]) => k !== 'objectType' && k !== 'docType').map(([key, val]) => {
        const isSensitive = SENSITIVE.includes(key);
        let label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase());
        if (key === 'updatedBy' || key === 'updated_by') {
          label = 'Transaction Hash';
        } else if (key === 'effectiveFrom' || key === 'effective_from') {
          label = type === 'financial' ? 'Effective To' : 'Status';
        } else if (key === 'effectiveTo' || key === 'effective_to') {
          label = type === 'financial' ? 'Status' : 'Effective To';
        } else if (key === 'freezeReason' || key === 'freeze_reason') {
          label = 'Reason';
        } else if (key === 'lenderId' || key === 'lender_id') {
          label = 'Bank ID';
        }
        return (
          <div key={key} style={{ padding: '12px 16px', background: 'var(--slate-50)', borderRadius: 10, border: '1px solid var(--slate-100)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: isSensitive && !show ? 'var(--slate-300)' : 'var(--slate-800)',
              fontFamily: isSensitive ? 'monospace' : 'inherit',
              wordBreak: 'break-all'
            }}>
              {isSensitive && !show ? '••••••••••••' : (String(val || 'N/A'))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PrivateDataPage() {
  const { role } = useRole();
  const params = useParams();
  const type = params.type as string;

  const [show, setShow] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [recordId, setRecordId] = useState('');
  const [data, setData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeResult, setStoreResult] = useState<{ success: boolean; message: string } | null>(null);
  const [storing, setStoring] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  // Store form fields
  const [form, setForm] = useState<Record<string, string>>({});
  const setField = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (type === 'owner') {
      const { owner_id, name, aadhaar_hash, address, phone, email } = form;
      // When all required fields are filled, auto-generate the KYC Hash
      if (owner_id && name && aadhaar_hash && address && phone && email) {
        const kycString = `${owner_id}|${name}|${aadhaar_hash}|${address}|${phone}|${email}`;
        crypto.subtle.digest('SHA-256', new TextEncoder().encode(kycString))
          .then(hashBuffer => {
             const hashArray = Array.from(new Uint8Array(hashBuffer));
             const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
             if (form.kyc_hash !== hashHex) {
               setForm(prev => ({ ...prev, kyc_hash: hashHex }));
             }
          })
          .catch(err => console.error("Error generating KYC hash", err));
      } else if (form.kyc_hash) {
         setForm(prev => ({ ...prev, kyc_hash: '' }));
      }
    }
  }, [form.owner_id, form.name, form.aadhaar_hash, form.address, form.phone, form.email, type]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setField(fieldName, hashHex);
      
      // Auto-extract and fill fields using OCR
      if (fieldName === 'aadhaar_hash') {
        setOcrLoading(true);
        try {
          const extracted = await api.extractAadhaarData(file);

          console.log("=== OCR Extraction Complete ===");
          if (extracted.raw_text && extracted.raw_text.length > 0) {
             console.log("Raw Scanned Text Lines:\n" + extracted.raw_text.join("\n"));
          } else {
             console.log("No raw text returned.");
          }
          console.log("Parsed JSON:", extracted);

          setForm(prev => ({
            ...prev,
            name: extracted.name || prev.name,
            address: extracted.address || prev.address,
            phone: extracted.phone || prev.phone,
          }));
        } catch (ocrErr) {
          console.error("OCR extraction failed", ocrErr);
        } finally {
          setOcrLoading(false);
        }
      }
    } catch (err) {
      console.error('Error generating hash:', err);
      alert('Failed to generate hash from file');
    }
  };

  const canRead  = role ? READ_RBAC[type]?.includes(role)  : false;
  const canWrite = role ? WRITE_RBAC[type]?.includes(role) : false;
  const meta = META[type];

  const fetchData = async () => {
    if (!recordId.trim()) { setError('Enter a Record ID first'); return; }
    if (!canRead) return;
    setLoading(true); setError(null);
    try {
      let result: any;
      if (type === 'owner')     result = await api.getOwnerPrivateData(recordId.trim());
      else if (type === 'legal')     result = await api.getLegalPrivateData(recordId.trim());
      else if (type === 'financial') result = await api.getFinancialPrivateData(recordId.trim());
      else throw new Error('Unknown type');
      setData(result);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch';
      if (errMsg.includes('state not found')) {
        setError('No private data found for this record yet.');
      } else {
        setError(errMsg);
      }
      setData(null);
    } finally { setLoading(false); }
  };

  const handleStore = async () => {
    if (!recordId.trim()) { setStoreResult({ success: false, message: 'Record ID is required' }); return; }
    setStoring(true); setStoreResult(null);
    try {
      if (type === 'owner') {
        await api.storeOwnerPrivateData({
          record_id: recordId.trim(),
          owner_id:   form.owner_id   || '',
          name:       form.name       || '',
          aadhaar_hash: form.aadhaar_hash || '',
          address:    form.address    || '',
          phone:      form.phone      || '',
          email:      form.email      || '',
          kyc_hash:   form.kyc_hash   || '',
        });
      } else if (type === 'legal') {
        await api.storeLegalPrivateData({
          record_id:    recordId.trim(),
          case_id:      form.case_id      || '',
          order_id:     form.order_id     || '',
          order_type:   form.order_type   || '',
          order_details: form.order_details || '',
          status:       form.status       || '',
          order_date:   form.order_date   || '',
          remarks:      form.remarks      || '',
        });
      } else if (type === 'financial') {
        await api.storeFinancialPrivateData({
          record_id:    recordId.trim(),
          bank_id:      form.bank_id      || '',
          loan_id:      form.loan_id      || '',
          loan_status:  form.loan_status  || '',
          loan_amount:  form.loan_amount  || '',
          loan_details: form.loan_details || '',
          loan_date:    form.loan_date    || '',
          remarks:      form.remarks      || '',
        });
      }
      setStoreResult({ success: true, message: 'Data stored in Fabric CouchDB successfully!' });
      setForm({});
      // Refresh read view
      if (data) fetchData();
    } catch (err) {
      setStoreResult({ success: false, message: err instanceof Error ? err.message : 'Failed to store' });
    } finally { setStoring(false); }
  };

  if (!canRead) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertTriangle size={48} color="var(--error)" style={{ marginBottom: 16 }} />
        <h2>Access Restricted</h2>
        <p style={{ color: 'var(--slate-500)', marginTop: 8 }}>Your role <strong>{role || 'Unknown'}</strong> cannot read {type} private data.</p>
        <p style={{ color: 'var(--slate-400)', fontSize: 13, marginTop: 8 }}>Required roles: {READ_RBAC[type]?.join(', ')}</p>
      </div>
    );
  }

  const renderStoreFields = () => {
    if (type === 'owner') return <>
      {[['owner_id','Owner ID *'],['name','Full Name'],['aadhaar_hash','Upload Aadhaar Card (Generates SHA-256)'],['address','Address'],['phone','Phone'],['email','Email'],['kyc_hash','KYC Hash']].map(([k, l]) => (
        <div key={k}>
          <label className="label">{l}</label>
          {k === 'aadhaar_hash' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--slate-50)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '13px', margin: 0 }}>
                  Choose File
                  <input type="file" style={{ display: 'none' }} accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, k)} />
                </label>
                <span style={{ fontSize: '13px', color: 'var(--slate-600)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName || 'No file chosen'}
                </span>
              </div>
              {ocrLoading && <div style={{ fontSize: '12px', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} className="spin" /> Extracting details with OCR...</div>}
              {form[k] && <div style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', background: 'var(--slate-50)', padding: '6px 8px', borderRadius: '4px', border: '1px solid var(--slate-200)' }}>Hash: {form[k]}</div>}
            </div>
          ) : k === 'kyc_hash' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {form[k] ? (
                 <div style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', background: 'var(--green-50)', color: 'var(--green-700)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--green-200)' }}>
                    <CheckCircle size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                    Auto-Generated: {form[k]}
                 </div>
              ) : (
                 <div style={{ fontSize: '11px', background: 'var(--slate-50)', color: 'var(--slate-400)', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--slate-200)' }}>
                    Fill all above fields to generate KYC hash
                 </div>
              )}
            </div>
          ) : (
            <input className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)} placeholder={l} />
          )}
        </div>
      ))}
    </>;
    if (type === 'legal') return <>
      {[['case_id','Case ID'],['order_id','Order ID'],['order_type','Freeze Reason'],['order_details','Encumbrance Notes'],['status','Status'],['order_date','Effective To'],['remarks','Remarks']].map(([k, l]) => (
        <div key={k}>
          <label className="label">{l}</label>
          {k === 'status' ? (
            <select className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)}>
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          ) : k === 'order_date' ? (
            <input type="date" className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)} />
          ) : (
            <input className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)} placeholder={l} />
          )}
        </div>
      ))}
    </>;
    if (type === 'financial') return <>
      {[['bank_id','Bank ID'],['loan_id','Loan ID'],['loan_status','Loan Status'],['loan_amount','Loan Amount (₹)'],['loan_details','Loan Details'],['loan_date','Loan Date'],['remarks','Remarks']].map(([k, l]) => (
        <div key={k}>
          <label className="label">{l}</label>
          {k === 'loan_status' ? (
            <select className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)}>
              <option value="">Select Status</option>
              <option value="Active">Active</option>
              <option value="Closed">Closed</option>
              <option value="Defaulted">Defaulted</option>
            </select>
          ) : k === 'loan_date' ? (
            <input type="date" className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)} />
          ) : (
            <input className="input" value={form[k]||''} onChange={e=>setField(k,e.target.value)} placeholder={l} />
          )}
        </div>
      ))}
    </>;
    return null;
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>{meta?.emoji} {meta?.title}</h1>
          <p>{meta?.desc}</p>
        </div>
        <button className={`btn ${show ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShow(!show)}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />} {show ? 'Hide Sensitive' : 'Decrypt View'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Lookup card */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Database size={16} color="var(--blue-600)" />
              <h3 style={{ margin: 0 }}>Retrieve from CouchDB</h3>
            </div>
            <label className="label">Record ID</label>
            <input
              className="input" placeholder="REC-2026-XX"
              value={recordId} onChange={e => setRecordId(e.target.value)}
              style={{ marginBottom: 12 }}
              onKeyDown={e => e.key === 'Enter' && fetchData()}
            />
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={fetchData} disabled={loading}>
              {loading ? <><RefreshCw size={14} className="spin" /> Loading Fabric CouchDB...</> : 'Retrieve Private Data'}
            </button>
            <div style={{ marginTop: 16, padding: 10, background: 'var(--blue-50)', borderRadius: 8, fontSize: 11, color: 'var(--slate-600)', display: 'flex', gap: 6 }}>
              <Shield size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              All access is logged to the Fabric audit trail (immutable).
            </div>
          </div>

          {/* Store card — only for authorized writers */}
          {canWrite && (
            <div className="card" style={{ padding: 24 }}>
              <button
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showStore ? 16 : 0 }}
                onClick={() => setShowStore(!showStore)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={16} color="var(--success)" />
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Store to CouchDB</span>
                </div>
                {showStore ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showStore && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {renderStoreFields()}
                  </div>
                  {storeResult && (
                    <div style={{
                      marginTop: 12, padding: 12, borderRadius: 8, fontSize: 13,
                      background: storeResult.success ? 'var(--green-50)' : 'var(--red-50)',
                      color: storeResult.success ? 'var(--green-700)' : 'var(--red-700)',
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      {storeResult.success ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                      {storeResult.message}
                    </div>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 16, width: '100%', background: 'var(--success)', opacity: storing ? 0.6 : 1 }}
                    onClick={handleStore} disabled={storing}
                  >
                    {storing ? <><RefreshCw size={14} className="spin" /> Storing on Fabric...</> : <><Upload size={14} /> Store on Fabric CouchDB</>}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Main data panel */}
        <div className="card" style={{ padding: 28 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--slate-500)' }}>
              <RefreshCw size={28} className="spin" style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 500 }}>Querying Hyperledger Fabric CouchDB...</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Private data is fetched directly from the peer's CouchDB database</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--error)' }}>
              <AlertTriangle size={28} style={{ marginBottom: 12 }} />
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Error fetching from Fabric CouchDB</div>
              <div style={{ fontSize: 13, color: 'var(--slate-500)', maxWidth: 480, margin: '0 auto' }}>{error}</div>
              <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 12 }}>
                Check: record exists on ledger, you have collection access, and data was stored using the Store form.
              </div>
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--slate-400)' }}>
              <Database size={36} style={{ marginBottom: 16, opacity: 0.4 }} />
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>No data loaded</div>
              <div style={{ fontSize: 13 }}>Enter a Record ID and click <strong>Retrieve Private Data</strong> to fetch from Hyperledger Fabric CouchDB</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{meta?.emoji} {meta?.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 2 }}>Record: <strong>{recordId}</strong> — retrieved from Fabric CouchDB</div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={fetchData}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              <FieldGrid data={data} show={show} type={type as string} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
