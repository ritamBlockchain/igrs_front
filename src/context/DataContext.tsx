'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api, { 
  DashboardStats, 
  LandRecord, 
  Mutation, 
  Batch, 
  Anchor, 
  AuditEntry,
  JantriRate 
} from '@/lib/api';
import { useRole } from './RoleContext';
import CONFIG from '@/lib/config';

// System info from API
interface SystemInfo {
  fabricConnected: boolean;
  channel: string;
  chaincode: string;
  version: string;
  network: string;
}

interface DataContextType {
  // Stats
  stats: DashboardStats | null;
  statsLoading: boolean;
  statsError: string | null;
  refreshStats: () => Promise<void>;

  // Records
  records: LandRecord[];
  recordsLoading: boolean;
  recordsError: string | null;
  recordsPage: number;
  recordsTotal: number;
  fetchRecords: (page?: number, limit?: number, filters?: { search?: string, status?: string, block?: string, land_type?: string }) => Promise<void>;

  // Mutations
  mutations: Mutation[];
  mutationsLoading: boolean;
  mutationsError: string | null;
  refreshMutations: () => Promise<void>;

  // Batches
  batches: Batch[];
  batchesLoading: boolean;
  batchesError: string | null;
  refreshBatches: () => Promise<void>;

  // Latest Anchor
  latestAnchor: Anchor | null;
  anchorLoading: boolean;
  refreshAnchor: () => Promise<void>;

  // Audit Trail
  auditEntries: AuditEntry[];
  auditLoading: boolean;
  auditTotal: number;
  fetchAudit: (page?: number, limit?: number) => Promise<void>;

  // Jantri
  jantriRates: JantriRate[];
  jantriLoading: boolean;
  jantriCapabilities: Record<string, boolean> | null;
  refreshJantri: () => Promise<void>;

  // System Info
  systemInfo: SystemInfo | null;
  systemLoading: boolean;

  // Last refresh
  lastRefresh: Date | null;
  isRefreshing: boolean;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage key for caching
const CACHE_KEY = 'jade_data_cache';
const CACHE_TTL = CONFIG.CACHE_TTL;

interface CacheData {
  stats: DashboardStats;
  records: LandRecord[];
  recordsTotal: number;
  mutations: Mutation[];
  batches: Batch[];
  latestAnchor: Anchor;
  auditEntries: AuditEntry[];
  auditTotal: number;
  jantriRates: JantriRate[];
  jantriCapabilities: Record<string, boolean>;
  systemInfo: SystemInfo;
  timestamp: number;
}

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { role } = useRole();

  // Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Records State
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);

  // Mutations State
  const [mutations, setMutations] = useState<Mutation[]>([]);
  const [mutationsLoading, setMutationsLoading] = useState(false);
  const [mutationsError, setMutationsError] = useState<string | null>(null);

  // Batches State
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [batchesError, setBatchesError] = useState<string | null>(null);

  // Anchor State
  const [latestAnchor, setLatestAnchor] = useState<Anchor | null>(null);
  const [anchorLoading, setAnchorLoading] = useState(false);

  // Audit State
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);

  // Jantri State
  const [jantriRates, setJantriRates] = useState<JantriRate[]>([]);
  const [jantriLoading, setJantriLoading] = useState(false);
  const [jantriCapabilities, setJantriCapabilities] = useState<Record<string, boolean> | null>(null);

  // System Info
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);

  // Global refresh state
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load from cache on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const data: CacheData = JSON.parse(cached);
        if (Date.now() - data.timestamp < CACHE_TTL) {
          setStats(data.stats);
          setRecords(data.records);
          setRecordsTotal(data.recordsTotal);
          setMutations(data.mutations);
          setBatches(data.batches);
          setLatestAnchor(data.latestAnchor);
          setAuditEntries(data.auditEntries);
          setAuditTotal(data.auditTotal);
          setJantriRates(data.jantriRates);
          setJantriCapabilities(data.jantriCapabilities);
          setSystemInfo(data.systemInfo);
          setLastRefresh(new Date(data.timestamp));
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, []);

  // Save to cache
  const saveCache = useCallback(() => {
    try {
      if (stats && records.length > 0) {
        const data: CacheData = {
          stats,
          records,
          recordsTotal,
          mutations,
          batches,
          latestAnchor: latestAnchor!,
          auditEntries,
          auditTotal,
          jantriRates,
          jantriCapabilities: jantriCapabilities || {},
          systemInfo: systemInfo || { fabricConnected: false, channel: '', chaincode: '', version: '', network: '' },
          timestamp: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch {
      // Ignore cache errors
    }
  }, [stats, records, recordsTotal, mutations, batches, latestAnchor, auditEntries, auditTotal, jantriRates, jantriCapabilities, systemInfo]);

  // Normalize API values (handle {change, value} objects or plain numbers)
  const norm = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val, 10) || 0;
    if (typeof val === 'object' && val !== null && 'value' in val) {
      return norm((val as {value: unknown}).value);
    }
    return 0;
  };

  // Fetch Dashboard Stats
  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [dashboardData, analyticsData] = await Promise.all([
        api.dashboard(),
        api.analytics(),
      ]);

      const totalRecords = norm(analyticsData.total_records) || norm(dashboardData.stats.total_records);
      const verifiedRecords = norm(dashboardData.stats.verified_records) || 
        norm(analyticsData.by_status.find(s => s.status === 'verified')?.count);
      const pendingRecords = totalRecords - verifiedRecords;

      setStats({
        total_records: totalRecords,
        verified_records: verifiedRecords,
        pending_records: pendingRecords,
        pending_mutations: norm(dashboardData.stats.pending_mutations),
        total_batches: norm(dashboardData.stats.total_batches),
        anchored_batches: norm(dashboardData.stats.anchored_batches),
        digitization_progress: totalRecords > 0 ? Math.round((verifiedRecords / totalRecords) * 100) : 0,
        active_legal_holds: norm(dashboardData.stats.active_legal_holds),
        total_villages: norm(dashboardData.stats.total_villages) || 1,
      });
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : 'Failed to fetch stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Records
  const fetchRecords = useCallback(async (page = 1, limit = 20, filters = {}) => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const data = await api.getRecords(page, limit, filters);
      setRecords(data.records);
      setRecordsPage(data.page);
      setRecordsTotal(data.total);
    } catch (err) {
      setRecordsError(err instanceof Error ? err.message : 'Failed to fetch records');
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  // Fetch Mutations
  const refreshMutations = useCallback(async () => {
    setMutationsLoading(true);
    setMutationsError(null);
    try {
      const data = await api.getMutations();
      setMutations(data.mutations || []);
    } catch (err) {
      setMutationsError(err instanceof Error ? err.message : 'Failed to fetch mutations');
    } finally {
      setMutationsLoading(false);
    }
  }, []);

  // Fetch Batches
  const refreshBatches = useCallback(async () => {
    setBatchesLoading(true);
    setBatchesError(null);
    try {
      const data = await api.getBatches();
      setBatches(data.batches || []);
    } catch (err) {
      setBatchesError(err instanceof Error ? err.message : 'Failed to fetch batches');
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  // Fetch Latest Anchor
  const refreshAnchor = useCallback(async () => {
    setAnchorLoading(true);
    try {
      const data = await api.getLatestAnchor();
      setLatestAnchor(data);
    } catch (err) {
      console.error('Failed to fetch anchor:', err);
    } finally {
      setAnchorLoading(false);
    }
  }, []);

  // Fetch Audit Trail
  const fetchAudit = useCallback(async (page = 1, limit = 20) => {
    setAuditLoading(true);
    try {
      const data = await api.getAuditTrail(page, limit);
      setAuditEntries(data.entries || []);
      setAuditTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit:', err);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Fetch Jantri Data
  const refreshJantri = useCallback(async () => {
    setJantriLoading(true);
    try {
      const [integrationData, historyData] = await Promise.all([
        api.getJantriIntegration(),
        api.getJantriHistory(),
      ]);
      setJantriCapabilities(integrationData.integration?.capabilities || null);
      setJantriRates(historyData.history || []);
    } catch (err) {
      console.error('Failed to fetch jantri:', err);
    } finally {
      setJantriLoading(false);
    }
  }, []);

  // Fetch System Info
  const fetchSystemInfo = useCallback(async () => {
    setSystemLoading(true);
    try {
      const health = await api.health();
      setSystemInfo({
        fabricConnected: health.fabric?.gateway_connected || false,
        channel: 'landrecord-channel',
        chaincode: 'landrecord',
        version: '1.0',
        network: 'Polygon Amoy (L2)',
      });
    } catch (err) {
      setSystemInfo({
        fabricConnected: false,
        channel: 'landrecord-channel',
        chaincode: 'landrecord',
        version: '1.0',
        network: 'Polygon Amoy (L2)',
      });
    } finally {
      setSystemLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshStats(),
      fetchRecords(1, 20),
      refreshMutations(),
      refreshBatches(),
      refreshAnchor(),
      fetchAudit(1, 20),
      refreshJantri(),
      fetchSystemInfo(),
    ]);
    setLastRefresh(new Date());
    setIsRefreshing(false);
  }, [refreshStats, fetchRecords, refreshMutations, refreshBatches, refreshAnchor, fetchAudit, refreshJantri, fetchSystemInfo]);

  // Auto-refresh when role changes or on mount
  useEffect(() => {
    if (role) {
      refreshAll();
    }
  }, [role]);

  // Save cache when data changes
  useEffect(() => {
    saveCache();
  }, [saveCache]);

  const value: DataContextType = {
    stats,
    statsLoading,
    statsError,
    refreshStats,
    records,
    recordsLoading,
    recordsError,
    recordsPage,
    recordsTotal,
    fetchRecords,
    mutations,
    mutationsLoading,
    mutationsError,
    refreshMutations,
    batches,
    batchesLoading,
    batchesError,
    refreshBatches,
    latestAnchor,
    anchorLoading,
    refreshAnchor,
    auditEntries,
    auditLoading,
    auditTotal,
    fetchAudit,
    jantriRates,
    jantriLoading,
    jantriCapabilities,
    refreshJantri,
    systemInfo,
    systemLoading,
    lastRefresh,
    isRefreshing,
    refreshAll,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
};

export default DataProvider;
