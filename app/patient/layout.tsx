'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import MetaMaskProvider from '@/components/web3/MetaMaskProvider';

interface PatientLayoutProps {
  children: ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  return (
    <SessionProvider>
      <MetaMaskProvider>
        {children}
      </MetaMaskProvider>
    </SessionProvider>
  );
}
