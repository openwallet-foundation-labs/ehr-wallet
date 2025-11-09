
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "next-auth/react";
import { useMetaMask } from "@/components/web3/MetaMaskProvider";
import { 
  Calendar,
  User,
  Users,
  Database,
  Settings,
  Info,
  FileSearch,
  FileCheck,
  Folder,
  Share,
  ClipboardList,
  Wallet
} from "lucide-react";
// Utility function to conditionally join classNames
const cn = (...inputs: any[]) => {
  return inputs
    .flatMap(input => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object') {
        return Object.entries(input)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return false;
    })
    .filter(Boolean)
    .join(' ');
};
import { Button } from "@/components/ui/button";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const router = useRouter();
  // Use the proper hook for mobile detection
  const isMobile = useIsMobile();
  // Get user session to determine role
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
  
  // Determine if the user is a patient (either via next-auth, MetaMask, or current route)
  useEffect(() => {
    const isNextAuthPatient = session?.user?.role?.toUpperCase() === 'PATIENT';
    const isMetaMaskPatient = isConnected && currentAccount && patientSession?.user?.role === 'patient';
    const isOnPatientRoute = router.pathname.startsWith('/patient/');
    setIsPatient(isNextAuthPatient || isMetaMaskPatient || isOnPatientRoute);
  }, [session, isConnected, currentAccount, patientSession, router.pathname]);
  
  // Use the determined role
  const userRole = isPatient ? "PATIENT" : (session?.user?.role || "");
  
  // Patient links - application is now patient-only
  const patientLinks = [
    { name: "Dashboard", path: "/", icon: <Database className="w-5 h-5" /> },
    { name: "Share Data", path: "/patient/share-data", icon: <Share className="w-5 h-5" /> },
    { name: "Access Logs", path: "/patient/access-logs", icon: <ClipboardList className="w-5 h-5" /> },
    { name: "Connect Wallet", path: "/patient/wallet", icon: <Wallet className="w-5 h-5" /> }
  ];

  // Settings links
  const settingsLinks = [
    { name: "Settings", path: "/patient/settings", icon: <Settings className="w-5 h-5" /> }
  ];

  // Use patient links for all users
  const links = patientLinks;
  
  // Mobile overlay that closes when clicked outside
  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={onClose}
          />
        )}
        <aside 
          className={cn(
            "fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-30 transition-transform duration-300 ease-in-out transform",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 border-b border-border">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold text-primary">
                EHR Wallet
              </h1>
              {/* Close button removed to avoid duplicate X icons */}
            </div>
            {session?.user?.name && (
              <p className="text-sm text-muted-foreground mt-1">
                {session.user.name}
              </p>
            )}
          </div>
          
          <nav className="p-2">
            <div className="space-y-1">
              {links.map((link) => {
                const isActive = router.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={cn("flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", {
                      "bg-primary text-primary-foreground": isActive,
                      "text-foreground hover:bg-secondary": !isActive
                    })}
                    onClick={(e) => {
                      // Prevent default behavior to handle navigation manually
                      if (isMobile) {
                        onClose();
                      }
                    }}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="mt-8 pt-4 border-t border-border">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Settings
              </div>
              <div className="space-y-1">
                {settingsLinks.map((link) => {
                  const isActive = router.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={cn("flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", {
                        "bg-primary text-primary-foreground": isActive,
                        "text-foreground hover:bg-secondary": !isActive
                      })}
                      onClick={(e) => {
                        // Prevent default behavior to handle navigation manually
                        if (isMobile) {
                          onClose();
                        }
                      }}
                    >
                      <span className="mr-3">{link.icon}</span>
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </aside>
      </>
    );
  }
  
  // Desktop sidebar
  return (
    <aside 
      className={cn(
        "h-[calc(100vh-4rem)] bg-background border-r border-border overflow-y-auto transition-all duration-300 flex-shrink-0",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <nav className="p-2">
        <div className="space-y-1">
          {links.map((link) => {
            const isActive = router.pathname === link.path;
            return (
              <Link
                key={link.path}
                href={link.path}
                className={cn("flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", {
                  "bg-primary text-primary-foreground": isActive,
                  "text-foreground hover:bg-secondary": !isActive
                })}
                prefetch={true}
              >
                <span className={cn("mr-3", !isOpen && "mr-0")}>
                  {link.icon}
                </span>
                {isOpen && link.name}
              </Link>
            );
          })}
        </div>
        
        <div className="mt-8 pt-4 border-t border-border">
          {isOpen && (
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Settings
            </div>
          )}
          <div className="space-y-1">
            {settingsLinks.map((link) => {
              const isActive = router.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn("flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", {
                    "bg-primary text-primary-foreground": isActive,
                    "text-foreground hover:bg-secondary": !isActive
                  })}
                  prefetch={true}
                >
                  <span className={cn("mr-3", !isOpen && "mr-0")}>
                    {link.icon}
                  </span>
                  {isOpen && link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </aside>
  );
};
