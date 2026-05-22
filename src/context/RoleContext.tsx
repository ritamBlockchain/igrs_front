'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 
  | 'Revenue Admin'
  | 'Revenue Officer'
  | 'Collector'
  | 'District Magistrate'
  | 'Court Registrar'
  | 'Auditor'
  | 'Bank'
  | 'Legal Authority'
  | 'IGR'
  | 'Admin';

export interface RoleInfo {
  role: UserRole;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const ROLE_REGISTRY: RoleInfo[] = [
  { role: 'Admin', label: 'System Admin', description: 'Full system access, governance config, batch operations', icon: '⚙️', color: '#6366f1' },
  { role: 'Revenue Admin', label: 'Revenue Admin', description: 'Land registration, mutations, Jantri rates, document management', icon: '🏛️', color: '#0ea5e9' },
  { role: 'Revenue Officer', label: 'Revenue Officer', description: 'Record queries, inheritance approval, owner private data', icon: '📋', color: '#14b8a6' },
  { role: 'Collector', label: 'Collector', description: 'Approve mutations, verify workflows, field operations', icon: '✅', color: '#f59e0b' },
  { role: 'District Magistrate', label: 'District Magistrate', description: 'Verify workflows, dispute resolution, executive approval', icon: '⚖️', color: '#d97706' },
  { role: 'Court Registrar', label: 'Court Registrar', description: 'Court order mutations, legal data access', icon: '⚖️', color: '#8b5cf6' },
  { role: 'Auditor', label: 'Auditor', description: 'Full read access, audit trails, private data verification', icon: '🔍', color: '#ec4899' },
  { role: 'Bank', label: 'Bank Officer', description: 'Financial private data, mortgage records, lien management', icon: '🏦', color: '#10b981' },
  { role: 'Legal Authority', label: 'Legal Authority', description: 'Court orders, freeze/unfreeze, legal private data', icon: '🔒', color: '#ef4444' },
  { role: 'IGR', label: 'IGR Officer', description: 'Registration oversight, legal & financial data, audit access', icon: '📜', color: '#f97316' },
];

interface RoleContextType {
  role: UserRole | null;
  roleInfo: RoleInfo | null;
  token: string | null;
  userName: string | null;
  setRoleAndToken: (role: UserRole, token: string, userName: string) => void;
  clearRole: () => void;
  availableRoles: RoleInfo[];
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const savedRole = localStorage.getItem('jade_role');
    const savedToken = localStorage.getItem('jade_token');
    const savedUserName = localStorage.getItem('jade_user_name');
    
    if (savedRole && savedToken && ROLE_REGISTRY.some(r => r.role === savedRole)) {
      setRoleState(savedRole as UserRole);
      setTokenState(savedToken);
      setUserNameState(savedUserName);
    }
    setIsLoading(false);
  }, []);

  const setRoleAndToken = (r: UserRole, t: string, name: string) => {
    setRoleState(r);
    setTokenState(t);
    setUserNameState(name);
    localStorage.setItem('jade_role', r);
    localStorage.setItem('jade_token', t);
    localStorage.setItem('jade_user_name', name);
  };

  const clearRole = () => {
    setRoleState(null);
    setTokenState(null);
    setUserNameState(null);
    localStorage.removeItem('jade_role');
    localStorage.removeItem('jade_token');
    localStorage.removeItem('jade_user_name');
  };

  const roleInfo = role ? ROLE_REGISTRY.find(r => r.role === role) || null : null;

  return (
    <RoleContext.Provider value={{ role, roleInfo, token, userName, setRoleAndToken, clearRole, availableRoles: ROLE_REGISTRY, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) throw new Error('useRole must be used within a RoleProvider');
  return context;
};
