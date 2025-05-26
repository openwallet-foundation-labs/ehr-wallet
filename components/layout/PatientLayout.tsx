import { ReactNode, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Sidebar } from '@/components/layout/Sidebar';
import { useMetaMask } from '@/components/web3/MetaMaskProvider';

interface PatientLayoutProps {
  children: ReactNode;
}

export default function PatientLayout({ children }: PatientLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isConnected, currentAccount } = useMetaMask();
  const [isLoading, setIsLoading] = useState(true);
  const [patientSession, setPatientSession] = useState<any>(null);
  
  // Check for MetaMask-based patient session in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPatientSession = localStorage.getItem('patientSession');
      if (storedPatientSession) {
        try {
          setPatientSession(JSON.parse(storedPatientSession));
        } catch (error) {
          console.error('Error parsing patient session:', error);
        }
      }
      setIsLoading(false);
    }
  }, []);

  // Check if user is authenticated via next-auth or MetaMask
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if authenticated via next-auth
  const isNextAuthPatient = session?.user?.role === 'PATIENT';
  
  // Check if authenticated via MetaMask
  const isMetaMaskPatient = isConnected && currentAccount && patientSession?.user?.role === 'patient';
  
  // If not authenticated at all, redirect to login
  if (!isNextAuthPatient && !isMetaMaskPatient) {
    router.push('/login');
    return null;
  }
  
  // If authenticated via next-auth but not as a patient, redirect to dashboard
  if (session && !isNextAuthPatient) {
    router.push('/dashboard');
    return null;
  }

  // State for sidebar open/close on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="flex-1 bg-background">
        <div className="p-4 md:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-md bg-primary/10 hover:bg-primary/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
