// API Configuration and Service Layer
import CONFIG from './config';

const API_BASE_URL = CONFIG.API_BASE_URL;

// Types matching backend API responses
export interface LandRecord {
  id: number;
  record_id: string;
  owner_name: string;
  father_name?: string;
  village_name: string;
  taluka_name: string;
  district_name: string;
  block_name?: string;
  area_sq_m: number;
  area?: string;
  land_type: string;
  doc_type?: string;
  status: string;
  version: number;
  is_anchored: boolean;
  is_frozen: boolean;
  is_active?: boolean;
  plot_number?: string;
  survey_number?: string;
  document_hash?: string;
  tx_hash?: string;
  anchor_status?: string;
  created_at: string;
  updated_at: string;
}

export interface RecordDetailResponse {
  record: LandRecord;
  chainOfTitle: Array<{
    id: number;
    owner_name: string;
    transfer_date: string;
    transfer_type: string;
    tx_hash: string;
  }>;
  ownershipGraph: {
    nodes: any[];
    edges: any[];
  };
  legalHolds: any[] | null;
  legalHoldsHistory: any[] | null;
  mutations: any[] | null;
}

export interface DashboardStats {
  total_records: number;
  verified_records: number;
  pending_records: number;
  pending_mutations: number;
  total_batches: number;
  anchored_batches: number;
  digitization_progress: number;
  active_legal_holds: number;
  total_villages: number;
}

export interface Mutation {
  id: number;
  record_id: string;
  mutation_type: string;
  status: string;
  current_owner: string;
  new_owner: string;
  supporting_doc: string;
  initiated_by: string;
  created_at: string;
  approved_at: string | null;
  tx_hash: string | null;
  approvals: Array<{
    role: string;
    officer_name: string;
    status: string;
    approved_at: string | null;
  }>;
}

export interface Batch {
  id: number;
  batch_id: string;
  records_count: number;
  merkle_root: string;
  status: string;
  tx_hash: string | null;
  timestamp: string;
  block_name: string;
}

export interface Anchor {
  batch_id: number;
  root: string;
  tx_hash: string;
  anchored_at: string;
  explorer_url: string;
}

export interface AuditEntry {
  id: number;
  record_id: string;
  action: string;
  detail: string;
  user_name: string;
  user_role: string;
  timestamp: string;
  tx_hash: string | null;
}

export interface JantriRate {
  id: number;
  jantri_id: string;
  village_name: string;
  zone_id?: string;
  land_type: string;
  rate_per_sqm: number;
  effective_from?: string;
  action: string;
  created_by: string;
  created_at: string;
}

export interface PrivateDataOwner {
  ownerId: string;
  name: string;
  aadhaarHash: string;
  address: string;
  mobile: string;
  email: string;
  kycHash: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PrivateDataLegal {
  caseReference: string;
  courtOrderRef: string;
  freezeReason: string;
  encumbranceNotes: string;
  effectiveFrom: string;
  effectiveTo: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PrivateDataFinancial {
  lenderId: string;
  loanAccountRef: string;
  mortgageStatus: string;
  encumbranceAmount: string;
  lienNotes: string;
  effectiveFrom: string;
  effectiveTo: string;
  updatedAt: string;
  updatedBy: string;
}

// Generic fetch helper
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Inject the active user role from localStorage so the backend RBAC works
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('jade_role') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(storedRole ? { 'X-User-Role': storedRole } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  return response.json() as Promise<T>;
}

// API Service Methods
export const api = {
  // Health
  health: () => apiFetch<{ status: string; fabric: { gateway_connected: boolean } }>('/api/health'),

  // Dashboard
  dashboard: () => apiFetch<{
    stats: DashboardStats;
    by_status: Array<{ status: string; count: number }>;
  }>('/api/dashboard'),

  analytics: () => apiFetch<{ by_status: Array<{ status: string; count: number }>; total_records: number }>('/api/analytics'),

  // Land Records
  getRecords: (page = 1, limit = 20, filters: { search?: string, status?: string, block?: string, land_type?: string } = {}) => {
    let url = `/api/records?page=${page}&limit=${limit}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;
    if (filters.block) url += `&block=${encodeURIComponent(filters.block)}`;
    if (filters.land_type) url += `&land_type=${encodeURIComponent(filters.land_type)}`;
    return apiFetch<{ records: LandRecord[]; page: number; total: number; pages: number }>(url);
  },
  
  getRecord: (id: string) => 
    apiFetch<RecordDetailResponse>(`/api/records/${id}`),
  
  getRecordHistory: (id: string) => 
    apiFetch<{ timeline: Array<{ action: string; timestamp: string; details?: string }> | null }>(`/api/records/history/${id}`),

  verifyLandRecord: (recordId: string, inputDocumentHash: string) => 
    apiFetch<{ ok: boolean; result: string }>('/api/land/verify', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, input_document_hash: inputDocumentHash }),
    }),

  setInitialOwner: (recordId: string, ownerName: string, ownerHash: string) => 
    apiFetch<{ ok: boolean; message?: string }>('/api/land/set-initial-owner', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, owner_name: ownerName, owner_hash: ownerHash }),
    }),

  createRecord: (data: {
    record_id: string;
    owner_name: string;
    owner_id: string;
    survey_no: string;
    khasra_no?: string;
    village_name?: string;
    taluka_name?: string;
    district_name?: string;
    village_id?: number;
    district_id?: number;
    block_id?: number;
    taluka_id?: number;
    area_sq_m: number;
    land_type: string;
    doc_type: string;
    ownership_type: string;
    document_hash?: string;
    index_hash?: string;
  }) => 
    apiFetch<{ record_id: string; ingest_id: number; status: string; message?: string }>('/api/records', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Mutations
  getMutations: () => 
    apiFetch<{ mutations: Mutation[] }>('/api/mutations'),

  getMutationsByRecordId: (recordId: string) => 
    apiFetch<{ mutations: Mutation[] }>(`/api/mutations?record_id=${recordId}`),
  
  createMutation: (data: {
    record_id: string;
    current_owner: string;
    new_owner: string;
    mutation_type: string;
    supporting_doc: string;
    initiated_by: string;
    role: string;
    sub_divisions?: Array<{ owner_name: string; area: string }>;
    // Court Order extensions
    case_number?: string;
    court?: string;
    decision?: string;
    // Government Order / Acquisition extensions
    order_type?: string;
    new_land_type?: string;
    collector_id?: string;
    project?: string;
    compensation?: string;
    // Partial transfer
    transfer_area?: number;
  }) => 
    apiFetch<{ mutation: { id: number; record_id: string; status: string } }>('/api/mutations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyTalati: (landId: string, mutationType: string) => 
    apiFetch<{ ok: boolean; message: string }>('/api/mutations/verify-talati', {
      method: 'POST',
      body: JSON.stringify({ land_id: landId, mutation_type: mutationType }),
    }),

  approveMutation: (landId: string, mutationType: string) => 
    apiFetch<{ ok: boolean; message: string }>('/api/mutations/approve', {
      method: 'POST',
      body: JSON.stringify({ land_id: landId, mutation_type: mutationType }),
    }),

  finalizeMutation: (landId: string, mutationType: string) => 
    apiFetch<{ ok: boolean; message: string }>('/api/mutations/finalize', {
      method: 'POST',
      body: JSON.stringify({ land_id: landId, mutation_type: mutationType }),
    }),

  // Batches
  getBatches: () => 
    apiFetch<{ batches: Batch[]; stats: { total: number; anchored: number; pending: number; processing: number; total_records: number } }>('/api/batches'),

  // Anchors
  getLatestAnchor: () => 
    apiFetch<Anchor>('/api/anchors/latest'),

  // Audit
  getAuditTrail: (page = 1, limit = 20) => 
    apiFetch<{ entries: AuditEntry[]; page: number; total: number }>(`/api/audit?page=${page}&limit=${limit}`),

  // Jantri
  getJantriIntegration: () => 
    apiFetch<{ integration: { online: boolean; mode: string; fabric: boolean; capabilities: Record<string, boolean>; warnings?: string[] } }>('/api/jantri/integration-status'),
  
  getJantriRates: () => 
    apiFetch<{ rates: JantriRate[] }>('/api/jantri/rates'),
  
  createJantriRate: (data: { village_id: string; zone_id: string; land_type: string; rate_per_sqm: number; effective_from: string; created_by: string }) => 
    apiFetch<{ ok: boolean; jantri_id: string }>('/api/jantri/rates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  calculateJantri: (villageId: number, landType: string, area: number) => 
    apiFetch<{ rate_per_sqm: number; total_value: number; formula: string }>(`/api/jantri/calculate?village_id=${villageId}&land_type=${encodeURIComponent(landType)}&area=${area}`),

  getJantriHistory: () => 
    apiFetch<{ history: JantriRate[] | null }>('/api/jantri/rates/history'),

  // Private Data
  getOwnerPrivateData: (recordId: string) => 
    apiFetch<PrivateDataOwner>(`/api/private/owner?record_id=${recordId}`),
  
  storeOwnerPrivateData: (data: {
    record_id: string;
    owner_id: string;
    name: string;
    aadhaar_hash: string;
    address: string;
    phone: string;
    email: string;
    kyc_hash: string;
  }) => 
    apiFetch<{ ok: boolean; message: string }>('/api/private/owner', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  extractAadhaarData: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return fetch(`${API_BASE_URL}/api/ocr/aadhaar`, {
      method: 'POST',
      body: formData,
      // Do not set Content-Type, browser will set it automatically with boundary
    }).then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OCR failed: ${text}`);
      }
      return res.json() as Promise<{ name: string; address: string; gender: string; dob: string; aadhaar_number: string; phone?: string; raw_text?: string[] }>;
    });
  },

  getLegalPrivateData: (recordId: string) => 
    apiFetch<PrivateDataLegal>(`/api/private/legal?record_id=${recordId}`),
  
  storeLegalPrivateData: (data: {
    record_id: string;
    case_id: string;
    order_id: string;
    order_type: string;
    order_details: string;
    status: string;
    order_date: string;
    remarks: string;
  }) => 
    apiFetch<{ ok: boolean; message: string }>('/api/private/legal', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFinancialPrivateData: (recordId: string) => 
    apiFetch<PrivateDataFinancial>(`/api/private/financial?record_id=${recordId}`),
  
  storeFinancialPrivateData: (data: {
    record_id: string;
    bank_id: string;
    loan_id: string;
    loan_status: string;
    loan_amount: string;
    loan_details: string;
    loan_date: string;
    remarks: string;
  }) => 
    apiFetch<{ ok: boolean; message: string }>('/api/private/financial', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Freeze / Unfreeze
  getFreezeStatus: (recordId: string) => 
    apiFetch<{ record_id: string; freeze_endorsements: Array<Record<string, unknown>> | null; unfreeze_endorsements: Array<Record<string, unknown>> | null }>(`/api/freeze-status?record_id=${recordId}`),

  freezeEndorse: (recordId: string, reason: string) =>
    apiFetch<{ ok: boolean; endorsement_id: number; endorsements: number; min_required: number; message: string; tx_hash?: string }>('/api/freeze-endorse', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, reason }),
    }),

  unfreezeEndorse: (recordId: string, reason: string) =>
    apiFetch<{ ok: boolean; endorsement_id: number; endorsements: number; min_required: number; message: string; tx_hash?: string }>('/api/unfreeze-endorse', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, reason }),
    }),

  legalHoldsUnfreeze: (recordId: string, reason: string) =>
    apiFetch<{ ok: boolean; tx_hash?: string }>('/api/legal-holds/unfreeze', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, reason }),
    }),

  // Hierarchy
  getDistricts: () => 
    apiFetch<{ districts: Array<{ id: number; name: string; code: string; created_at: string }> }>('/api/districts'),
  
  getTalukas: (districtId: number) => 
    apiFetch<{ talukas: Array<{ id: number; name: string; code: string; district_id: number; district_name: string }> }>(`/api/talukas?district_id=${districtId}`),
  
  getVillages: (districtId?: number) => 
    apiFetch<{ villages: Array<{ id: number; name: string; village_code: string; district_id: number; district_name: string; taluka_id: number; taluka_name: string }> }>(`/api/villages${districtId ? `?district_id=${districtId}` : ''}`),

  extractPdfData: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('jade_role') : null;
    return fetch(`${API_BASE_URL}/api/ingest/pdf-ingest`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(storedRole ? { 'X-User-Role': storedRole } : {}),
      }
    }).then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OCR failed: ${text}`);
      }
      return res.json() as Promise<{ session_id: string; extraction: any; filename: string }>;
    });
  },

  commitOcr: (data: {
    session_id: string;
    confirm: boolean;
    fields?: any;
    village_id: number;
    district_id: number;
    block_id: number;
    taluka_id: number;
    owner_name: string;
    survey_no: string;
    area: string;
    doc_type: string;
    uploaded_by: string;
    role: string;
  }) => 
    apiFetch<{ record_id: string; status: string; message?: string }>('/api/ingest/ocr-commit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default api;
