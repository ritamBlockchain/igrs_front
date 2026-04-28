'use client';

import { useRole, ROLE_REGISTRY, UserRole } from "@/context/RoleContext";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Layers, Shield, Sun, Moon, Zap, Database, GitBranch, Lock } from "lucide-react";
import Link from "next/link";
import styles from './landing.module.css';

export default function HomePage() {
  const { role, isLoading } = useRole();

  if (isLoading) {
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
          <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>Initializing Fabric Gateway...</div>
        </motion.div>
      </div>
    );
  }

  if (role) return <Dashboard />;
  return <LandingPage />;
}

/* ================================================================
   LANDING PAGE — Role Selection
   ================================================================ */
function LandingPage() {
  const { setRole } = useRole();
  const { theme, toggleTheme } = useTheme();

  const features = [
    { icon: <Database size={18} />, label: '37 Records On-Chain' },
    { icon: <GitBranch size={18} />, label: 'Multi-Org Fabric' },
    { icon: <Lock size={18} />, label: '4-Layer Security' },
    { icon: <Zap size={18} />, label: 'Polygon L2 Anchored' },
  ];

  return (
    <div className={styles.landing}>
      <div className={styles.blob1} />
      <div className={styles.blob2} />
      <div className={styles.blob3} />
      <div className={styles.gridLines} />

      {/* Header */}
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.logoRow}>
          <motion.div
            className={styles.logoIcon}
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <Layers size={24} color="#fff" />
          </motion.div>
          <div>
            <div className={styles.brand}>JADE Registry</div>
            <div className={styles.tagline}>Hyperledger Fabric Land Record System</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <motion.button
            className={styles.themeToggle}
            onClick={toggleTheme}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          <div className={styles.headerBadge}>
            <Shield size={14} />
            <span>Blockchain Verified</span>
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <h2 className={styles.heroTitle}>
          Select Your Role to Continue
        </h2>
        <p className={styles.heroSub}>
          Access is governed by on-chain RBAC policy. Choose your role to view permitted operations and workflows.
        </p>
        <div className={styles.featureRow}>
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              className={styles.featureChip}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {f.icon}
              <span>{f.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Role Grid */}
      <div className={styles.grid}>
        {ROLE_REGISTRY.map((r, i) => (
          <motion.button
            key={r.role}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            whileHover={{ y: -8, transition: { duration: 0.25 } }}
            whileTap={{ scale: 0.97 }}
            className={styles.roleCard}
            onClick={() => setRole(r.role)}
          >
            <div className={styles.cardTop}>
              <span className={styles.roleEmoji}>{r.icon}</span>
              <ArrowRight size={16} className={styles.arrow} />
            </div>
            <h3 className={styles.roleName}>{r.label}</h3>
            <p className={styles.roleDesc}>{r.description}</p>
            <div className={styles.cardAccent} style={{ background: r.color }} />
          </motion.button>
        ))}
      </div>

      <motion.footer
        className={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <p>Fabric Channel: <strong>landrecord-channel</strong> · Chaincode: <strong>landrecord v1.0</strong> · Network: <strong>Polygon Amoy (L2)</strong></p>
      </motion.footer>
    </div>
  );
}

/* ================================================================
   DASHBOARD — After Role Selection
   ================================================================ */
function Dashboard() {
  const { role, roleInfo } = useRole();
  const sections = getSectionsForRole(role!);

  const stats = [
    { label: 'Total Records', value: 37, suffix: '', sub: '36 verified', color: 'var(--blue-500)', icon: <Database size={20} /> },
    { label: 'Pending Mutations', value: 5, suffix: '', sub: '4 workflows active', color: 'var(--warning)', icon: <GitBranch size={20} /> },
    { label: 'Batches Anchored', value: 4, suffix: '', sub: '100% verified', color: 'var(--success)', icon: <Layers size={20} /> },
    { label: 'Digitization', value: 97, suffix: '%', sub: '1 record pending', color: 'var(--info)', icon: <Zap size={20} /> },
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
        {stats.map((s, i) => (
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
                  {s.value}{s.suffix}
                </motion.div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{s.sub}</div>
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
