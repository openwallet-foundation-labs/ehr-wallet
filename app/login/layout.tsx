'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Dynamically import MetaMaskProvider with no SSR
const MetaMaskProvider = dynamic(
  () => import('@/components/web3/MetaMaskProvider'),
  { ssr: false }
);

interface LoginLayoutProps {
  children: ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
