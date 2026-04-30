'use client';

import { useRole } from "@/context/RoleContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  LayoutDashboard, Map, FileText, Lock, ShieldCheck, TrendingUp, 
  Layers, Settings, Gavel, Landmark, PenTool, Snowflake,
  FileBox, BookOpen, Package, LogOut, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from './Sidebar.module.css';

interface NavItem {
  name: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['*'] },
  { name: 'Register Land', icon: PenTool, path: '/land/register', roles: ['Admin', 'Revenue Admin'] },
  { name: 'Bulk Operations', icon: Package, path: '/land/bulk', roles: ['Admin', 'Revenue Admin'] },
  { name: 'Land Records', icon: Map, path: '/land/records', roles: ['*'] },
  { name: 'Sale Mutation', icon: FileText, path: '/mutations/sale', roles: ['Admin', 'Revenue Admin', 'Court Registrar', 'Collector'] },
  { name: 'Gift Mutation', icon: FileText, path: '/mutations/gift', roles: ['Admin', 'Revenue Admin', 'Court Registrar', 'Collector'] },
  { name: 'Inheritance', icon: FileText, path: '/mutations/inheritance', roles: ['Admin', 'Revenue Admin', 'Revenue Officer', 'Collector'] },
  { name: 'Court Order', icon: Gavel, path: '/mutations/court-order', roles: ['Admin', 'Legal Authority', 'Collector'] },
  { name: 'Govt. Order', icon: Landmark, path: '/mutations/government', roles: ['Admin', 'Legal Authority', 'Revenue Admin', 'Collector'] },
  { name: 'Freeze / Unfreeze', icon: Snowflake, path: '/freeze', roles: ['Admin', 'Legal Authority', 'Auditor'] },
  { name: 'Owner Data', icon: Lock, path: '/private/owner', roles: ['Admin', 'Revenue Officer', 'Auditor'] },
  { name: 'Legal Data', icon: BookOpen, path: '/private/legal', roles: ['Admin', 'Legal Authority', 'Court Registrar', 'Auditor', 'IGR'] },
  { name: 'Financial Data', icon: Landmark, path: '/private/financial', roles: ['Admin', 'Bank', 'Auditor', 'IGR'] },
  { name: 'Jantri Rates', icon: TrendingUp, path: '/jantri', roles: ['Admin', 'Revenue Admin', 'IGR'] },
  { name: 'Documents', icon: FileBox, path: '/documents', roles: ['Admin', 'Revenue Admin'] },
  { name: 'Audit Trail', icon: ShieldCheck, path: '/audit', roles: ['Admin', 'Auditor', 'IGR'] },
  { name: 'Anchors', icon: Layers, path: '/anchors', roles: ['Admin', 'Auditor', 'IGR'] },
  { name: 'Batches', icon: Package, path: '/batches', roles: ['Admin', 'Revenue Admin'] },
  { name: 'Settings', icon: Settings, path: '/settings', roles: ['Admin'] },
];

export default function Sidebar() {
  const { role, roleInfo, clearRole } = useRole();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  if (!role) return null;

  const filtered = NAV_ITEMS.filter(item => 
    item.roles.includes('*') || item.roles.includes(role)
  );

  const mainNav = filtered.filter(i => ['/', '/land/register', '/land/bulk', '/land/records'].includes(i.path));
  const mutations = filtered.filter(i => i.path.startsWith('/mutations') || i.path === '/freeze');
  const privateData = filtered.filter(i => i.path.startsWith('/private'));
  const system = filtered.filter(i => ['/jantri', '/documents', '/audit', '/anchors', '/batches', '/settings'].includes(i.path));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoBox}>
        <div className={styles.logoIcon}>
          <Layers size={20} color="#fff" />
        </div>
        <div>
          <div className={styles.brand}>JADE</div>
          <div className={styles.sub}>Land Registry</div>
        </div>
      </div>

      <nav className={styles.nav}>
        <NavGroup items={mainNav} pathname={pathname} />
        {mutations.length > 0 && (
          <>
            <div className={styles.groupLabel}>Mutations</div>
            <NavGroup items={mutations} pathname={pathname} />
          </>
        )}
        {privateData.length > 0 && (
          <>
            <div className={styles.groupLabel}>Private Data</div>
            <NavGroup items={privateData} pathname={pathname} />
          </>
        )}
        {system.length > 0 && (
          <>
            <div className={styles.groupLabel}>System</div>
            <NavGroup items={system} pathname={pathname} />
          </>
        )}
      </nav>

      <div className={styles.footer}>
        <div className={styles.roleCard}>
          <div className={styles.roleAvatar} style={{ background: roleInfo?.color || 'var(--blue-600)' }}>
            {roleInfo?.icon}
          </div>
          <div className={styles.roleInfo}>
            <div className={styles.roleName}>{roleInfo?.label}</div>
            <div className={styles.roleStatus}>● Connected</div>
          </div>
        </div>
        <div className={styles.footerActions}>
          <button className={styles.switchBtn} onClick={clearRole}>
            <LogOut size={14} /> Switch Role
          </button>
          <button className={styles.themeBtn} onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ items, pathname }: { items: NavItem[], pathname: string }) {
  return (
    <>
      {items.map(item => {
        const active = pathname === item.path;
        return (
          <Link key={item.path} href={item.path} className={`${styles.navItem} ${active ? styles.active : ''}`}>
            <item.icon size={18} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}
