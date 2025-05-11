
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Calendar,
  User,
  Users,
  Database,
  Settings,
  Info,
  FileSearch,
  FileCheck,
  Folder
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
  
  const links = [
    { name: "Dashboard", path: "/", icon: <Database className="w-5 h-5" /> },
    { name: "Patient Registration", path: "/patients/register", icon: <User className="w-5 h-5" /> },
    { name: "Patient List", path: "/patients", icon: <Users className="w-5 h-5" /> },
    { name: "Scheduling", path: "/scheduling", icon: <Calendar className="w-5 h-5" /> }
  ];
  
  const adminLinks = [
    { name: "Settings", path: "/settings", icon: <Settings className="w-5 h-5" /> },
    { name: "Help & Support", path: "/support", icon: <Info className="w-5 h-5" /> }
  ];
  
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
              <h1 className="text-xl font-semibold text-primary">RadGlobal RIS</h1>
              {/* Close button removed to avoid duplicate X icons */}
            </div>
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
                    onClick={isMobile ? onClose : undefined}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.name}
                  </Link>
                );
              })}
            </div>
            
            <div className="mt-8 pt-4 border-t border-border">
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </div>
              <div className="space-y-1">
                {adminLinks.map((link) => {
                  const isActive = router.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={cn("flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", {
                        "bg-primary text-primary-foreground": isActive,
                        "text-foreground hover:bg-secondary": !isActive
                      })}
                      onClick={isMobile ? onClose : undefined}
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
              Administration
            </div>
          )}
          <div className="space-y-1">
            {adminLinks.map((link) => {
              const isActive = router.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={cn("flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors", {
                    "bg-primary text-primary-foreground": isActive,
                    "text-foreground hover:bg-secondary": !isActive
                  })}
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
