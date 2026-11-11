import type { Metadata } from 'next';
import './globals.css';
import { TRPCProvider } from '@/lib/trpc/Provider';

export const metadata: Metadata = {
  title: 'Clinic-OS | CRM Médico IA-Native SaaS Multi-tenant',
  description: 'Operating System for Medical Clinics - Multi-tenant, ARCA AFIP, Google Calendar, WhatsApp Cloud API',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-[#F3F4F6] text-[#0B0F19]">
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
