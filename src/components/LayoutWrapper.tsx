'use client';

import Sidebar from "@/components/Sidebar";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useRole } from "@/context/RoleContext";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useRole();

  // Prevent flash while hydrating from localStorage
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--slate-50)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #3b82f6)', margin: '0 auto 12px', animation: 'pulse 1.5s infinite' }}></div>
          <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // No role selected → full-width landing (no sidebar)
  if (!role) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <RoleSwitcher />
        {children}
      </main>
    </div>
  );
}
