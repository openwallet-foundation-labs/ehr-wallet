'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

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
