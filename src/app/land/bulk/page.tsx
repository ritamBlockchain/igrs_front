'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  Search, 
  Filter, 
  Database,
  Trash2,
  Copy,
  Download,
  Boxes
} from "lucide-react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import api, { LandRecord } from "@/lib/api";

type IngestionStatus = 'idle' | 'parsing' | 'ready' | 'uploading' | 'completed' | 'error';

interface ParsedRecord {
  record_id: string;
  owner_name: string;
  owner_id: string;
  survey_no: string;
  area_sq_m: number;
  land_type: string;
  village_name: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function BulkOperationsPage() {
  const { records, recordsLoading, recordsTotal, fetchRecords } = useData();
  const [activeTab, setActiveTab] = useState<'ingestion' | 'selection'>('ingestion');
  
  // Ingestion State
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>('idle');
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch records for selection tab
  useEffect(() => {
    if (activeTab === 'selection') {
      fetchRecords(1, 50);
    }
  }, [activeTab, fetchRecords]);

  // --- CSV Ingestion Logic ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIngestionStatus('parsing');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
          throw new Error('CSV file is empty or missing headers');
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = lines.slice(1);

        const data: ParsedRecord[] = rows.map(row => {
          const values = row.split(',').map(v => v.trim());
          const record: any = {};
          headers.forEach((header, i) => {
            record[header] = values[i];
          });

          return {
            record_id: record.record_id || `REC-${Math.floor(Math.random() * 1000000)}`,
            owner_name: record.owner_name || 'Unknown',
            owner_id: record.owner_id || 'N/A',
            survey_no: record.survey_no || 'N/A',
            area_sq_m: parseFloat(record.area_sq_m) || 0,
            land_type: record.land_type || 'Agricultural',
            village_name: record.village_name || 'Default',
            status: 'pending'
          };
        });

        setParsedData(data);
        setIngestionStatus('ready');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to parse CSV');
        setIngestionStatus('error');
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file');
      setIngestionStatus('error');
    };
    reader.readAsText(file);
  };

  const startIngestion = async () => {
    if (parsedData.length === 0) return;
    
    setIngestionStatus('uploading');
    setProgress(0);
    
    let successCount = 0;
    const newData = [...parsedData];

    for (let i = 0; i < newData.length; i++) {
      try {
        const item = newData[i];
        await api.createRecord({
          record_id: item.record_id,
          owner_name: item.owner_name,
          owner_id: item.owner_id,
          survey_no: item.survey_no,
          area_sq_m: item.area_sq_m,
          land_type: item.land_type,
          village_name: item.village_name,
          doc_type: 'Bulk Ingestion',
          ownership_type: 'Full Ownership'
        });
        
        newData[i] = { ...item, status: 'success' };
        successCount++;
      } catch (err) {
        newData[i] = { ...item, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' };
      }
      
      setParsedData([...newData]);
      setProgress(Math.round(((i + 1) / newData.length) * 100));
    }

    setIngestionStatus('completed');
  };

  const resetIngestion = () => {
    setIngestionStatus('idle');
    setParsedData([]);
    setProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Selection Logic ---

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map(r => r.record_id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = (action: string) => {
    alert(`Bulk action "${action}" on ${selectedIds.size} records`);
    // Implementation would go here (e.g. batching for anchoring)
  };

  const downloadSampleCSV = () => {
    const headers = "record_id,owner_name,owner_id,survey_no,area_sq_m,land_type,village_name";
    const sample = "\nREC-1001,Rajesh Kumar,UID-9988,S-45,1200,Agricultural,Amrol\nREC-1002,Sunita Devi,UID-7766,S-46,850,Residential,Bhopal";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'land_records_sample.csv';
    a.click();
  };

  return (
    <div className="animate-in" style={{ paddingBottom: 100 }}>
      <div className="page-header" style={{ marginBottom: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div className="icon-box" style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--indigo-600))', color: 'white', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Boxes size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Bulk Operations</h1>
            <p style={{ color: 'var(--slate-500)', margin: 0 }}>Ingest records via CSV or manage existing records in bulk</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--slate-100)', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('ingestion')}
          className={activeTab === 'ingestion' ? 'tab-active' : 'tab-inactive'}
          style={tabButtonStyle(activeTab === 'ingestion')}
        >
          <Upload size={16} />
          CSV Ingestion
        </button>
        <button 
          onClick={() => setActiveTab('selection')}
          className={activeTab === 'selection' ? 'tab-active' : 'tab-inactive'}
          style={tabButtonStyle(activeTab === 'selection')}
        >
          <Database size={16} />
          Record Selection
        </button>
      </div>

      {activeTab === 'ingestion' ? (
        <section className="animate-in">
          {ingestionStatus === 'idle' || ingestionStatus === 'error' ? (
            <div 
              className="card" 
              style={{ 
                border: '2px dashed var(--slate-200)', 
                background: 'var(--slate-50)', 
                padding: '60px 40px', 
                textAlign: 'center',
                borderRadius: 20,
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--blue-500)'; e.currentTarget.style.background = 'var(--blue-50)'; }}
              onDragLeave={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.background = 'var(--slate-50)'; }}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.background = 'var(--slate-50)'; /* Handle drop */ }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ background: 'white', width: 64, height: 64, borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}>
                <Upload size={32} className="text-blue-600" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Upload CSV File</h3>
              <p style={{ color: 'var(--slate-500)', maxWidth: 400, margin: '0 auto 24px' }}>
                Drag and drop your CSV file here, or click to browse. Ensure your CSV follows the required schema.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="btn btn-primary">Choose File</button>
                <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); downloadSampleCSV(); }}>
                  <Download size={16} /> Download Template
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".csv" 
                style={{ display: 'none' }} 
              />
              {errorMessage && (
                <div style={{ marginTop: 24, color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <AlertCircle size={16} /> {errorMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 24, borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--slate-50)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                    {ingestionStatus === 'uploading' ? 'Ingesting Records...' : 'Data Preview'}
                  </h3>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--slate-500)' }}>
                    {parsedData.length} records found in file
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {ingestionStatus === 'ready' && (
                    <>
                      <button className="btn btn-outline" onClick={resetIngestion} disabled={ingestionStatus === 'uploading'}>Cancel</button>
                      <button className="btn btn-primary" onClick={startIngestion}>
                        <CheckCircle2 size={16} /> Start Ingestion
                      </button>
                    </>
                  )}
                  {ingestionStatus === 'completed' && (
                    <button className="btn btn-primary" onClick={resetIngestion}>Done</button>
                  )}
                </div>
              </div>

              {ingestionStatus === 'uploading' && (
                <div style={{ padding: '24px 32px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Progress</span>
                    <span style={{ color: 'var(--blue-600)', fontWeight: 700 }}>{progress}%</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--slate-100)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--blue-600)', transition: 'width 0.3s ease' }}></div>
                  </div>
                </div>
              )}

              <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--slate-50)', zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid var(--slate-100)' }}>
                      {['Status', 'Record ID', 'Owner', 'Survey No', 'Area', 'Type', 'Village'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          {row.status === 'success' ? (
                            <CheckCircle2 size={18} className="text-green-600" />
                          ) : row.status === 'error' ? (
                            <AlertCircle size={18} className="text-red-600" title={row.error} />
                          ) : (
                            <div style={{ width: 18, height: 18, borderRadius: 9, border: '2px solid var(--slate-200)' }}></div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }} className="mono">{row.record_id}</td>
                        <td style={{ padding: '12px 16px' }}>{row.owner_name}</td>
                        <td style={{ padding: '12px 16px' }}>{row.survey_no}</td>
                        <td style={{ padding: '12px 16px' }}>{row.area_sq_m} sqm</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="badge badge-info">{row.land_type}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{row.village_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="animate-in">
          {/* Records Selection Section */}
          <div className="card" style={{ padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, padding: '0 8px', color: 'var(--slate-400)' }}>
              <Search size={16} />
              <input 
                className="input" 
                placeholder="Filter existing records to select..." 
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', padding: '8px 0', boxShadow: 'none' }}
              />
            </div>
            <button className="btn btn-outline" style={{ fontSize: 13, padding: '6px 12px' }}>
              <Filter size={14} /> More Filters
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--slate-100)', background: 'var(--slate-50)' }}>
                  <th style={{ width: 50, padding: '12px 16px' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === records.length && records.length > 0} 
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {['Record ID', 'Owner', 'Village', 'Area', 'Type', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                      <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--blue-600)' }} />
                      Loading records...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>No records found</td></tr>
                ) : (
                  records.map(r => (
                    <tr 
                      key={r.record_id} 
                      style={{ 
                        borderBottom: '1px solid var(--slate-50)', 
                        background: selectedIds.has(r.record_id) ? 'var(--blue-50)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                      onClick={() => toggleSelect(r.record_id)}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.has(r.record_id)} 
                          onChange={() => {}} // Handled by tr onClick
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }} className="mono">{r.record_id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 500 }}>{r.owner_name}</td>
                      <td style={{ padding: '14px 16px' }}>{r.village_name}</td>
                      <td style={{ padding: '14px 16px' }}>{r.area_sq_m} sqm</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={`badge ${r.land_type === 'Agricultural' ? 'badge-success' : 'badge-info'}`}>{r.land_type}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className="badge">{r.status}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link href={`/land/${r.record_id}`} style={{ color: 'var(--blue-600)' }} onClick={e => e.stopPropagation()}>
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Floating Action Bar for Selections */}
      {selectedIds.size > 0 && (
        <div 
          className="animate-slide-up"
          style={{ 
            position: 'fixed', 
            bottom: 30, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            background: 'rgba(30, 41, 59, 0.9)', 
            backdropFilter: 'blur(12px)',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            zIndex: 100,
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--blue-600)', width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {selectedIds.size}
            </div>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Records Selected</span>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }}></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => handleBulkAction('batch')} className="bulk-btn" style={bulkBtnStyle('var(--blue-600)')}>
              <Boxes size={16} /> Batch & Anchor
            </button>
            <button onClick={() => handleBulkAction('export')} className="bulk-btn" style={bulkBtnStyle('transparent', 'rgba(255,255,255,0.2)')}>
              <Download size={16} /> Export JSON
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="bulk-btn" style={bulkBtnStyle('transparent', 'transparent')}>
              <Trash2 size={16} /> Clear
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .tab-active {
          background: white;
          color: var(--blue-700);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .tab-inactive {
          color: var(--slate-500);
        }
        .tab-inactive:hover {
          color: var(--slate-700);
        }
        .bulk-btn {
          display: flex;
          align-items: center;
          gap: 8;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          border: 1px solid transparent;
          cursor: pointer;
        }
        .bulk-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

function tabButtonStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };
}

function bulkBtnStyle(bg: string, border: string = 'transparent'): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${border}`,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 50,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer'
  };
}
