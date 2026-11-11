'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Users,
  Calendar,
  ShieldCheck,
  Building2,
  Lock,
  LogOut,
  Stethoscope,
  PlusCircle,
} from 'lucide-react';
import { useTenantAuth } from '../../hooks/useTenantAuth';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const clinicalNav: NavItem[] = [
  { name: 'Dashboard & Consola', href: '/dashboard', icon: Activity, badge: 'En Vivo' },
  { name: 'Pacientes (HL7 FHIR)', href: '/dashboard/patients', icon: Users, badge: '2,845' },
  { name: 'Agenda (GoHighLevel)', href: '/dashboard/schedule', icon: Calendar, badge: '6 hoy' },
  { name: 'Compliance & 21 CFR 11', href: '/dashboard/audit', icon: ShieldCheck, badge: '100%' },
];

interface SidebarProps {
  tenantName?: string;
  tenantSlug?: string;
  isDictating?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tenantName: customTenantName,
  tenantSlug: customTenantSlug,
  isDictating = false,
}) => {
  const pathname = usePathname();
  const { profile, signOut } = useTenantAuth();

  const activeTenantName = customTenantName || profile?.tenantName || 'Hospital Metropolitano';
  const activeTenantSlug = customTenantSlug || profile?.tenantSlug || 'cmm-01';

  return (
    <aside className="w-68 h-screen flex flex-col shrink-0 select-none border-r border-slate-800/80 text-slate-300 bg-[#0F172A] z-20">
      
      {/* 1. Logo & Hospital Header */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-sky-500/25">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="text-base font-extrabold tracking-tight text-white font-sans">Nura</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">CLINIC OS</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">{activeTenantName}</span>
          </div>
        </div>
      </div>

      {/* 2. Scoping Multitenant & Certificación */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-[11px]">
        <div className="flex items-center space-x-2 text-slate-400 font-mono">
          <Lock className="w-3.5 h-3.5 text-sky-400" />
          <span>TENANT: {activeTenantSlug}</span>
        </div>
        <span className="text-[10px] font-mono text-sky-300 font-semibold px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800">RLS ACTIVO</span>
      </div>

      {/* 3. Navegación Principal Nura */}
      <div className="flex-1 overflow-y-auto py-5 px-4 space-y-6">
        <div>
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Espacio Clínico</span>
          <nav className="mt-2 space-y-1">
            {clinicalNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs rounded-xl transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 font-semibold border border-sky-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isActive
                          ? 'bg-sky-500/20 text-sky-300 font-bold'
                          : 'text-slate-400 bg-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Integraciones B2B2C</span>
          <div className="mt-2 space-y-2 px-3">
            <div className="flex items-center justify-between text-xs py-1.5 text-slate-400 border-b border-slate-800/60">
              <span>GoHighLevel API v2</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">CONECTADO</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 text-slate-400 border-b border-slate-800/60">
              <span>HL7 FHIR Document</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">R4.0.1</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1.5 text-slate-400">
              <span>Cadena Criptográfica</span>
              <span className="text-[10px] font-mono text-sky-400 font-bold">SHA-256 HMAC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Perfil Médico Titular */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-white text-xs">
              DM
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-white truncate">Dr. David Morales</span>
              <span className="text-[10px] font-mono text-slate-400 truncate">MN-145892 • Cardiología</span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Cerrar Sesión"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
