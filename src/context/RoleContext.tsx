'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 
  | 'Revenue Admin'
  | 'Revenue Officer'
  | 'Collector'
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
  { role: 'Collector', label: 'Collector (Tehsildar)', description: 'Approve mutations, verify workflows, field operations', icon: '✅', color: '#f59e0b' },
  { role: 'Court Registrar', label: 'Court Registrar', description: 'Sale/gift mutations, legal data access', icon: '⚖️', color: '#8b5cf6' },
  { role: 'Auditor', label: 'Auditor', description: 'Full read access, audit trails, private data verification', icon: '🔍', color: '#ec4899' },
  { role: 'Bank', label: 'Bank Officer', description: 'Financial private data, mortgage records, lien management', icon: '🏦', color: '#10b981' },
  { role: 'Legal Authority', label: 'Legal Authority', description: 'Court orders, freeze/unfreeze, legal private data', icon: '🔒', color: '#ef4444' },
  { role: 'IGR', label: 'IGR Officer', description: 'Registration oversight, legal & financial data, audit access', icon: '📜', color: '#f97316' },
];

interface RoleContextType {
  role: UserRole | null;
  roleInfo: RoleInfo | null;
  setRole: (role: UserRole) => void;
  clearRole: () => void;
  availableRoles: RoleInfo[];
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('jade_role');
    if (saved && ROLE_REGISTRY.some(r => r.role === saved)) {
      setRoleState(saved as UserRole);
    }
    setIsLoading(false);
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    localStorage.setItem('jade_role', r);
  };

  const clearRole = () => {
    setRoleState(null);
    localStorage.removeItem('jade_role');
  };

  const roleInfo = role ? ROLE_REGISTRY.find(r => r.role === role) || null : null;

  return (
    <RoleContext.Provider value={{ role, roleInfo, setRole, clearRole, availableRoles: ROLE_REGISTRY, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) throw new Error('useRole must be used within a RoleProvider');
  return context;
};
