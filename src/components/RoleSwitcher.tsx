'use client';

import { useRole, UserRole } from "@/context/RoleContext";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, UserCircle } from "lucide-react";
import styles from './RoleSwitcher.module.css';

export default function RoleSwitcher() {
  const { role, roleInfo, setRole, availableRoles } = useRole();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!role) return null;

  return (
    <div className={styles.container} ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.trigger}>
        <span className={styles.emoji}>{roleInfo?.icon}</span>
        <span className={styles.name}>{roleInfo?.label}</span>
        <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>Switch Role (Dev Mode)</div>
          {availableRoles.map((r) => (
            <button
              key={r.role}
              className={`${styles.option} ${role === r.role ? styles.active : ''}`}
              onClick={() => { setRole(r.role); setIsOpen(false); }}
            >
              <span style={{ fontSize: '16px' }}>{r.icon}</span>
              <div>
                <div className={styles.optLabel}>{r.label}</div>
                <div className={styles.optDesc}>{r.description.slice(0, 50)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
