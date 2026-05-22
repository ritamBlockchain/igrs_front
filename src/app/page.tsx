'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole, ROLE_REGISTRY } from "@/context/RoleContext";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Layers, Shield, Sun, Moon, Zap, Database, GitBranch, Lock, RefreshCw } from "lucide-react";
import Link from "next/link";
import styles from './landing.module.css';

export default function HomePage() {
  const { role, token, isLoading } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!role || !token)) {
      router.push('/login');
    }
  }, [role, token, isLoading, router]);

  if (isLoading || !role || !token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ textAlign: 'center' }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--gradient-brand)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Layers size={24} color="#fff" />
          </motion.div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Initializing...</div>
        </motion.div>
      </div>
    );
  }

  return <Dashboard />;
}

/* ================================================================
   DASHBOARD — After Role Selection
   ================================================================ */
function Dashboard() {
  const { role, roleInfo } = useRole();
  const { stats, statsLoading, lastRefresh, refreshAll, isRefreshing, systemInfo } = useData();
  const sections = getSectionsForRole(role!);

  // Ensure values are always numbers (handle API returning objects)
  const num = (val: unknown): number => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val, 10) || 0;
    if (val && typeof val === 'object' && 'value' in val) return num((val as {value: unknown}).value);
    return 0;
  };

  const displayStats = [
    { label: 'Total Records', value: num(stats?.total_records), suffix: '', sub: `${num(stats?.verified_records)} verified`, color: 'var(--blue-500)', icon: <Database size={20} /> },
    { label: 'Pending Mutations', value: num(stats?.pending_mutations), suffix: '', sub: `${num(stats?.pending_mutations)} workflows active`, color: 'var(--warning)', icon: <GitBranch size={20} /> },
    { label: 'Batches Anchored', value: num(stats?.anchored_batches), suffix: '', sub: systemInfo?.fabricConnected ? 'Fabric Connected' : 'Connecting...', color: 'var(--success)', icon: <Layers size={20} /> },
    { label: 'Digitization', value: num(stats?.digitization_progress), suffix: '%', sub: `${num(stats?.pending_records)} record${num(stats?.pending_records) !== 1 ? 's' : ''} pending`, color: 'var(--info)', icon: <Zap size={20} /> },
  ];

  return (
    <div>
      <motion.div
        className="page-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Welcome, {roleInfo?.label}</h1>
        <p>{roleInfo?.description}</p>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {statsLoading ? 'Loading...' : lastRefresh ? `Last updated: ${lastRefresh.toLocaleTimeString()}` : 'Not synced'}
        </div>
        <button 
          onClick={refreshAll} 
          disabled={isRefreshing}
          className="btn btn-outline"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, opacity: isRefreshing ? 0.6 : 1 }}
        >
          <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : undefined }} />
          {isRefreshing ? 'Syncing...' : 'Refresh'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {displayStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="card"
            style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>{s.label}</div>
                <motion.div
                  style={{ fontSize: 32, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1, type: 'spring', stiffness: 200 }}
                >
                  {statsLoading ? '-' : s.value}{s.suffix}
                </motion.div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{statsLoading ? 'Loading...' : s.sub}</div>
              </div>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                {s.icon}
              </div>
            </div>
            {/* Decorative gradient bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)`, opacity: 0.5 }} />
          </motion.div>
        ))}
      </div>

      {/* Operations */}
      <motion.h3
        style={{ marginBottom: 16, color: 'var(--text-heading)', fontSize: 18, fontWeight: 700 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Available Operations
      </motion.h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {sections.map((s, i) => (
          <motion.div
            key={s.path}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.04, duration: 0.4 }}
          >
            <Link href={s.path} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {s.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', marginBottom: 2 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.desc}</div>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getSectionsForRole(role: string) {
  const all = [
    { name: 'Register Land', path: '/land/register', emoji: '📝', desc: 'Create new land record on-chain', roles: ['Admin', 'Revenue Admin'] },
    { name: 'Land Records', path: '/land/records', emoji: '🗺️', desc: 'Browse & search all records', roles: ['*'] },
    { name: 'Sale Mutation', path: '/mutations/sale', emoji: '💰', desc: '4-step sale transfer workflow', roles: ['Admin', 'Revenue Admin', 'Court Registrar', 'Collector'] },
    { name: 'Gift Mutation', path: '/mutations/gift', emoji: '🎁', desc: '4-step gift transfer workflow', roles: ['Admin', 'Revenue Admin', 'Court Registrar', 'Collector'] },
    { name: 'Inheritance', path: '/mutations/inheritance', emoji: '👨‍👩‍👧‍👦', desc: '3-step inheritance workflow', roles: ['Admin', 'Revenue Admin', 'Revenue Officer', 'Collector'] },
    { name: 'Court Order', path: '/mutations/court-order', emoji: '⚖️', desc: 'Court-ordered ownership transfer', roles: ['Admin', 'Legal Authority', 'Collector'] },
    { name: 'Government Order', path: '/mutations/government', emoji: '🏛️', desc: 'Land use change / acquisition', roles: ['Admin', 'Legal Authority', 'Revenue Admin', 'Collector'] },
    { name: 'Freeze / Unfreeze', path: '/freeze', emoji: '🔒', desc: 'Multi-sig freeze management', roles: ['Admin', 'Legal Authority', 'Auditor'] },
    { name: 'Owner Data', path: '/private/owner', emoji: '👤', desc: 'Encrypted owner information', roles: ['Admin', 'Revenue Officer', 'Auditor'] },
    { name: 'Legal Data', path: '/private/legal', emoji: '📋', desc: 'Legal holds & court data', roles: ['Admin', 'Legal Authority', 'Court Registrar', 'Auditor', 'IGR'] },
    { name: 'Financial Data', path: '/private/financial', emoji: '🏦', desc: 'Mortgage & loan records', roles: ['Admin', 'Bank', 'Auditor', 'IGR'] },
    { name: 'Jantri Rates', path: '/jantri', emoji: '📊', desc: 'Land valuation framework', roles: ['Admin', 'Revenue Admin', 'IGR'] },
    { name: 'Documents', path: '/documents', emoji: '📄', desc: 'Hash upload & anchoring', roles: ['Admin', 'Revenue Admin'] },
    { name: 'Audit Trail', path: '/audit', emoji: '🔍', desc: 'Immutable event log', roles: ['Admin', 'Auditor', 'IGR'] },
    { name: 'Blockchain Anchors', path: '/anchors', emoji: '⛓️', desc: 'Polygon L2 verification', roles: ['Admin', 'Auditor', 'IGR'] },
    { name: 'Batch Operations', path: '/batches', emoji: '📦', desc: 'Legacy data ingestion', roles: ['Admin', 'Revenue Admin'] },
    { name: 'System Settings', path: '/settings', emoji: '⚙️', desc: 'Governance configuration', roles: ['Admin'] },
  ];
  return all.filter(s => s.roles.includes('*') || s.roles.includes(role));
}
