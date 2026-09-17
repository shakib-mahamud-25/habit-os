'use client';
import React from 'react';
import { AppDataProvider } from '@/hooks/useAppData';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeSync } from '@/components/pwa/ThemeSync';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppDataProvider>
      <ToastProvider>
        <ThemeSync />
        <ServiceWorkerRegister />
        {children}
      </ToastProvider>
    </AppDataProvider>
  );
}
