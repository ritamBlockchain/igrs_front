'use client';

import { useRole, UserRole } from "@/context/RoleContext";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, UserCircle } from "lucide-react";
import styles from './RoleSwitcher.module.css';

export default function RoleSwitcher() {
  const { role, roleInfo, clearRole } = useRole();
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

  const handleSignOut = () => {
    clearRole();
    window.location.href = '/login';
  };

  return (
    <div className={styles.container} ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.trigger}>
        <span className={styles.emoji}>{roleInfo?.icon}</span>
        <span className={styles.name}>{roleInfo?.label}</span>
        <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.open : ''}`} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <button
            className={styles.option}
            onClick={handleSignOut}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            <div>
              <div className={styles.optLabel}>Sign Out</div>
              <div className={styles.optDesc}>End your session and return to login</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
