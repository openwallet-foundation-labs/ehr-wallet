'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamically import MetaMaskProvider with no SSR
const MetaMaskProvider = dynamic(
  () => import('@/components/web3/MetaMaskProvider'),
  { ssr: false }
);

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
