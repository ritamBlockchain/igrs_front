'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Lock, Shield, ArrowRight, User } from 'lucide-react';
import { useRole, ROLE_REGISTRY } from '@/context/RoleContext';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setRoleAndToken } = useRole();
  const [selectedRole, setSelectedRole] = useState(ROLE_REGISTRY[1].role); // Default to Revenue Admin
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Password is required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.login(selectedRole, password, name);
      if (res.ok) {
        setRoleAndToken(res.role as any, res.token, res.user_name);
        router.push('/');
      } else {
        setError('Login failed, please check your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed, please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--slate-50)' }}>
      {/* Left section - Branding */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #0f172a, #1e293b)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 60, color: 'white' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', filter: 'blur(60px)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto', zIndex: 1 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #38bdf8, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} color="white" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>JADE</div>
        </div>

        <div style={{ zIndex: 1 }}>
          <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em' }}>
            Next-Gen<br/>
            Land Record<br/>
            <span style={{ color: '#38bdf8' }}>Management</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 400, lineHeight: 1.6, marginBottom: 40 }}>
            Powered by Hyperledger Fabric. Immutable, secure, and transparent land registry operations.
          </p>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 14 }}>
              <Shield size={16} color="#10b981" />
              <span>RBAC Secured</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1', fontSize: 14 }}>
              <Lock size={16} color="#8b5cf6" />
              <span>JWT Auth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right section - Login Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, position: 'relative' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: 440, background: 'white', padding: 48, borderRadius: 24, boxShadow: '0 20px 40px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--slate-100)' }}
        >
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: 'var(--slate-900)', marginBottom: 8, letterSpacing: '-0.02em' }}>Welcome Back</h2>
            <p style={{ color: 'var(--slate-500)', fontSize: 15 }}>Sign in to access your permitted workflows</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ background: '#fef2f2', color: '#ef4444', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #fecaca' }}
              >
                <Shield size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 8 }}>Select Role</label>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as any)}
                className="input"
                style={{ width: '100%', padding: '12px 16px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', appearance: 'none', cursor: 'pointer' }}
              >
                {ROLE_REGISTRY.map(r => (
                  <option key={r.role} value={r.role}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 8 }}>Officer Name (Optional)</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--slate-400)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. S.P. Verma"
                  className="input"
                  style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--slate-700)', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--slate-400)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input"
                  required
                  style={{ width: '100%', padding: '12px 16px 12px 42px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ padding: '14px', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
            >
              {loading ? (
                <>Signing In...</>
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 32, textAlign: 'center', fontSize: 13, color: 'var(--slate-500)' }}>
            Note: Default password is <strong>igrs-role-login-2026</strong> for all roles.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
