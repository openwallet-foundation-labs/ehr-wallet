
import { useState, useEffect } from "react";
import { Bell, Search, Menu, X } from "lucide-react";
import { UserAccountNav } from "@/components/UserAccountNav";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "next-auth/react";
import { useMetaMask } from "@/components/web3/MetaMaskProvider";

export const Header = ({ 
  toggleSidebar,
  toggleMobileNav,
  isMobileNavOpen
}: { 
  toggleSidebar: () => void;
  toggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const { data: session } = useSession();
  const { isConnected, currentAccount } = useMetaMask();
  const [patientSession, setPatientSession] = useState<any>(null);
  const [isPatient, setIsPatient] = useState(false);
  
  // Check for MetaMask-based patient session in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedPatientSession = localStorage.getItem('patientSession');
      if (storedPatientSession) {
        try {
          const parsedSession = JSON.parse(storedPatientSession);
          setPatientSession(parsedSession);
        } catch (error) {
          console.error('Error parsing patient session:', error);
        }
      }
    }
  }, []);
  
  // Determine if the user is a patient (either via next-auth or MetaMask)
  useEffect(() => {
    const isNextAuthPatient = session?.user?.role?.toUpperCase() === 'PATIENT';
    const isMetaMaskPatient = isConnected && currentAccount && patientSession?.user?.role === 'patient';
    setIsPatient(isNextAuthPatient || isMetaMaskPatient);
  }, [session, isConnected, currentAccount, patientSession]);
  
  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border flex items-center justify-between p-4 h-16">
      <div className="flex items-center">
        {isMobile ? (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMobileNav} 
              className="mr-2" 
              aria-label="Toggle mobile menu"
            >
              {isMobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
            <div className="text-xl font-semibold text-primary">GlobalRad</div>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <div className="text-xl font-semibold text-primary">GlobalRad</div>
          </>
        )}
      </div>
      
      {!isMobile && !isPatient && (
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search patients..."
              className="pl-10 pr-4 py-2 w-full rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {isMobile && !isPatient && (
          <Button variant="ghost" size="icon" className="relative" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
        </Button>
        
        <UserAccountNav />
      </div>
    </header>
  );
};
