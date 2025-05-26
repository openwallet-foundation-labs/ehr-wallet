'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import MetaMaskProvider from '@/components/web3/MetaMaskProvider';

interface SharedLayoutProps {
  children: ReactNode;
}

export default function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <SessionProvider>
      <MetaMaskProvider>
        {children}
      </MetaMaskProvider>
    </SessionProvider>
  );
}
