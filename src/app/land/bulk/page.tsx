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
  Boxes,
  Zip,
  FileJson,
  FileCode
} from "lucide-react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import api, { LandRecord } from "@/lib/api";
import CONFIG from "@/lib/config";

type IngestionStatus = 'idle' | 'parsing' | 'ready' | 'uploading' | 'completed' | 'error';

interface ParsedRecord {
  record_id: string;
  owner_name: string;
  owner_id: string;
  survey_no: string;
  khasra_no: string;
  area_sq_m: number;
  land_type: string;
  village_name: string;
  tehsil_name: string;
  district_name: string;
  ownership_type: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export default function BulkOperationsPage() {
  const { records, recordsLoading, fetchRecords } = useData();
  const [activeTab, setActiveTab] = useState<'csv' | 'json' | 'pdf' | 'db'>('csv');
  
  // Ingestion State
  const [ingestionStatus, setIngestionStatus] = useState<IngestionStatus>('idle');
  const [parsedData, setParsedData] = useState<ParsedRecord[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Refs for different file types
  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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
        if (lines.length < 2) throw new Error('CSV file is empty or missing headers');

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = lines.slice(1);

        const data: ParsedRecord[] = rows.map(row => {
          const values = row.split(',').map(v => v.trim());
          const record: any = {};
          headers.forEach((header, i) => {
            const cleanHeader = header.replace(/\([^)]*\)/g, '').trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').toLowerCase();
            record[cleanHeader] = values[i];
            const minimalHeader = header.replace(/[^a-z0-9]/gi, '').toLowerCase();
            record[minimalHeader] = values[i];
          });

          return {
            record_id: record.record_id || record.recordid || `REC-${Math.floor(Math.random() * 1000000)}`,
            owner_name: record.owner_name || record.ownername || record.owner || record.owner_id || record.ownerid || 'Unknown',
            owner_id: record.owner_id || record.ownerid || 'N/A',
            survey_no: record.survey_no || record.surveyno || record.survey_number || record.surveynumber || 'N/A',
            khasra_no: record.khasra_no || record.khasrano || record.khasra_number || record.khasranumber || 'N/A',
            area_sq_m: parseFloat(record.area) || parseFloat(record.areasqm) || parseFloat(record.area_sq_m) || 0,
            land_type: record.land_type || record.landtype || 'Agricultural',
            village_name: record.village_name || record.villagename || record.village || 'Default',
            tehsil_name: record.tehsil_name || record.tehsilname || record.tehsil || record.taluka || 'Default',
            district_name: record.district_name || record.districtname || record.district || 'Default',
            ownership_type: record.ownership_type || record.ownershiptype || record.ownership || record['ownership type'] || 'Full Ownership',
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
    reader.readAsText(file);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngestionStatus('parsing');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const records = Array.isArray(json) ? json : [json];
        const data: ParsedRecord[] = records.map((r: any) => ({
          record_id: r.record_id || `JSON-${Math.floor(Math.random() * 1000)}`,
          owner_name: r.owner_name || 'N/A',
          owner_id: r.owner_id || 'N/A',
          survey_no: r.survey_no || '-',
          khasra_no: r.khasra_no || '-',
          area_sq_m: r.area || 0,
          land_type: r.land_type || 'JSON Record',
          village_name: r.village_name || '-',
          tehsil_name: r.tehsil_name || '-',
          district_name: r.district_name || '-',
          ownership_type: r.ownership_type || 'N/A',
          status: 'pending'
        }));
        setParsedData(data);
        setIngestionStatus('ready');
      } catch (err) {
        setErrorMessage("Invalid JSON format");
        setIngestionStatus('error');
      }
    };
    reader.readAsText(file);
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIngestionStatus('ready');
    setParsedData([{ 
      record_id: 'PDF-READY', 
      owner_name: file.name, 
      owner_id: file.type === 'application/zip' ? 'ZIP Archive' : 'PDF Document',
      survey_no: '-', khasra_no: '-', area_sq_m: 0, land_type: 'OCR Pending',
      village_name: '-', tehsil_name: '-', district_name: '-', ownership_type: '-', status: 'pending' 
    }]);
  };

  const startIngestion = async () => {
    if (parsedData.length === 0) return;
    
    setIngestionStatus('uploading');
    setProgress(0);
    setErrorMessage(null);
    
    try {
      let file: File | null = null;
      let endpoint = '';
      
      if (activeTab === 'csv') {
        file = csvInputRef.current?.files?.[0] || null;
        endpoint = '/api/ingest/csv-ingest';
      } else if (activeTab === 'json') {
        file = jsonInputRef.current?.files?.[0] || null;
        endpoint = '/api/ingest/json-ingest';
      } else if (activeTab === 'pdf') {
        file = pdfInputRef.current?.files?.[0] || null;
        endpoint = '/api/ingest/pdf-ingest';
      }

      if (!file) throw new Error("No file selected");

      const formData = new FormData();
      formData.append('file', file);
      formData.append('batch_id', `BATCH-${Date.now()}`);

      const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
        headers: { 'X-User-Role': localStorage.getItem('jade_role') || 'Admin' }
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);
      const result = await response.json();
      
      const newData = [...parsedData];
      if (result && result.rows && Array.isArray(result.rows)) {
        result.rows.forEach((rowResult: any) => {
          const idx = rowResult.row_index - 1;
          if (idx >= 0 && idx < newData.length) {
            newData[idx] = {
              ...newData[idx],
              status: rowResult.ok ? 'success' : 'error',
              record_id: rowResult.record_id || newData[idx].record_id,
              error: rowResult.errors?.join(', ') || rowResult.reason
            };
          }
        });
      }

      setParsedData(newData);
      if (result.summary?.failed > 0) {
        setErrorMessage(`Ingestion completed with ${result.summary.failed} errors.`);
      }
      setIngestionStatus('completed');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed');
      setIngestionStatus('error');
    }
  };

  const resetIngestion = () => {
    setIngestionStatus('idle');
    setParsedData([]);
    setProgress(0);
    setErrorMessage(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (jsonInputRef.current) jsonInputRef.current.value = '';
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const downloadSampleCSV = () => {
    const headers = "record_id,owner_name,owner_id,survey_no,khasra_no,area,land_type,village_name,tehsil_name,district_name,ownership_type";
    const sample = "\nMP-BHO-2026001,Rajesh Kumar,UID-9988,S-45,288/8,1200,Agricultural,Maksi,Berasia,Bhopal,Full Ownership";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'land_records_sample.csv'; a.click();
  };

  const tabButtonStyle = (isActive: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: isActive ? 'white' : 'transparent', color: isActive ? 'var(--blue-600)' : 'var(--slate-500)', boxShadow: isActive ? '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer'
  });

  return (
    <div className="animate-in" style={{ paddingBottom: 100 }}>
      <div className="page-header" style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <div className="icon-box" style={{ background: 'linear-gradient(135deg, var(--blue-600), var(--indigo-600))', color: 'white', width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)' }}>
            <Boxes size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>Bulk Operations</h1>
            <p style={{ color: 'var(--slate-500)', margin: 0, fontSize: 16 }}>Unified ingestion hub for CSV, JSON, PDF and Database sync</p>
          </div>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32, background: 'var(--slate-100)', padding: 6, borderRadius: 18, width: 'fit-content' }}>
        <button onClick={() => { setActiveTab('csv'); resetIngestion(); }} style={tabButtonStyle(activeTab === 'csv')}>
          <Upload size={18} /> CSV
        </button>
        <button onClick={() => { setActiveTab('json'); resetIngestion(); }} style={tabButtonStyle(activeTab === 'json')}>
          <FileCode size={18} /> JSON
        </button>
        <button onClick={() => { setActiveTab('pdf'); resetIngestion(); }} style={tabButtonStyle(activeTab === 'pdf')}>
          <Copy size={18} /> PDF / ZIP
        </button>
        <button onClick={() => { setActiveTab('db'); resetIngestion(); }} style={tabButtonStyle(activeTab === 'db')}>
          <Database size={18} /> DB Sync
        </button>
      </div>

      <input type="file" ref={csvInputRef} onChange={handleFileUpload} accept=".csv" style={{ display: 'none' }} />
      <input type="file" ref={jsonInputRef} onChange={handleJsonUpload} accept=".json" style={{ display: 'none' }} />
      <input type="file" ref={pdfInputRef} onChange={handlePdfUpload} accept=".pdf,.zip" style={{ display: 'none' }} />

      {activeTab !== 'db' ? (
        <section className="animate-in">
          {ingestionStatus === 'idle' || ingestionStatus === 'error' ? (
            <div 
              className="card upload-zone" 
              style={{ border: '2px dashed var(--slate-200)', background: 'var(--slate-50)', padding: '80px 40px', textAlign: 'center', borderRadius: 24, cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => {
                if(activeTab === 'csv') csvInputRef.current?.click();
                if(activeTab === 'json') jsonInputRef.current?.click();
                if(activeTab === 'pdf') pdfInputRef.current?.click();
              }}
            >
              <div style={{ background: 'white', width: 80, height: 80, borderRadius: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
                {activeTab === 'csv' && <Upload size={40} className="text-blue-600" />}
                {activeTab === 'json' && <FileJson size={40} className="text-blue-600" />}
                {activeTab === 'pdf' && <Copy size={40} className="text-blue-600" />}
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
                {activeTab === 'csv' ? 'Upload Land CSV' : activeTab === 'json' ? 'Upload Records JSON' : 'Upload PDF or ZIP'}
              </h3>
              <p style={{ color: 'var(--slate-500)', maxWidth: 450, margin: '0 auto 32px', fontSize: 16, lineHeight: 1.6 }}>
                {activeTab === 'csv' && 'Import multiple land records using a structured CSV file. Download the template for the correct format.'}
                {activeTab === 'json' && 'Directly ingest JSON arrays. Perfect for system-to-system data migrations.'}
                {activeTab === 'pdf' && 'Upload a single land certificate or a ZIP containing multiple files. AI-powered OCR will extract the data.'}
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 16 }}>Browse Files</button>
                {activeTab === 'csv' && (
                  <button className="btn btn-outline" onClick={(e) => { e.stopPropagation(); downloadSampleCSV(); }} style={{ padding: '12px 24px' }}>
                    <Download size={18} /> Template
                  </button>
                )}
              </div>
              {errorMessage && (
                <div style={{ marginTop: 32, color: 'var(--error)', background: 'var(--red-50)', padding: '12px 24px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={18} /> {errorMessage}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
              <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--slate-50)' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Data Preview</h3>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--slate-500)' }}>{parsedData.length} records detected</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn btn-outline" onClick={resetIngestion} disabled={ingestionStatus === 'uploading'}>Reset</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={startIngestion} 
                    disabled={ingestionStatus === 'uploading' || ingestionStatus === 'completed'}
                    style={{ minWidth: 160 }}
                  >
                    {ingestionStatus === 'uploading' ? (
                      <><Loader2 size={18} className="animate-spin" /> Ingesting...</>
                    ) : ingestionStatus === 'completed' ? (
                      <><CheckCircle2 size={18} /> Completed</>
                    ) : (
                      'Start Ingestion'
                    )}
                  </button>
                </div>
              </div>

              {errorMessage && ingestionStatus === 'completed' && (
                <div style={{ padding: '16px 32px', background: 'var(--red-50)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--red-100)' }}>
                  <AlertCircle size={20} />
                  <strong>Partial Success:</strong> {errorMessage}
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--slate-50)', borderBottom: '1px solid var(--slate-100)' }}>
                      <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                      <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Owner</th>
                      <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Survey / Khasra</th>
                      <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Village</th>
                      <th style={{ padding: '16px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--slate-50)', transition: 'background 0.2s' }}>
                        <td style={{ padding: '16px 32px' }}>
                          <span className={`badge badge-${row.status === 'success' ? 'success' : row.status === 'error' ? 'error' : 'warning'}`} style={{ padding: '4px 12px', borderRadius: 8 }}>
                            {row.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 16px', fontWeight: 600 }}>{row.owner_name}</td>
                        <td style={{ padding: '16px 16px' }}>{row.survey_no} / {row.khasra_no}</td>
                        <td style={{ padding: '16px 16px' }}>{row.village_name}</td>
                        <td style={{ padding: '16px 16px' }}>{row.area_sq_m} sqm</td>
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
          <div className="card" style={{ padding: 60, textAlign: 'center', borderRadius: 28, background: 'linear-gradient(to bottom, white, var(--slate-50))' }}>
            <div style={{ background: 'var(--blue-50)', width: 100, height: 100, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <Database size={50} className="text-blue-600" />
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>Database Direct Sync</h3>
            <p style={{ color: 'var(--slate-500)', maxWidth: 500, margin: '0 auto 40px', fontSize: 18, lineHeight: 1.6 }}>
              Connect directly to your legacy SQL database to automate the migration of land records to the blockchain.
            </p>
            
            <div style={{ maxWidth: 450, margin: '0 auto', textAlign: 'left', background: 'white', padding: 32, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid var(--slate-100)' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--slate-700)' }}>Connection URL</label>
                <input type="text" className="input" placeholder="postgres://user:pass@host:5432/dbname" style={{ width: '100%', padding: '12px 16px', borderRadius: 12 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--slate-700)' }}>Source Table</label>
                <input type="text" className="input" placeholder="e.g. land_records_master" style={{ width: '100%', padding: '12px 16px', borderRadius: 12 }} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, borderRadius: 12 }}>
                <Search size={20} /> Test Connection & Map Fields
              </button>
            </div>
          </div>
        </section>
      )}

      <style jsx>{`
        .upload-zone:hover {
          border-color: var(--blue-400) !important;
          background: white !important;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.04);
        }
        .badge-info {
          background: var(--blue-50);
          color: var(--blue-700);
        }
      `}</style>
    </div>
  );
}
