import Link from "next/link";
import { useRouter } from "next/router";
import { X, Home, Users, FileText, Image, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const router = useRouter();
  
  const routes = [
    { href: "/", label: "Home", icon: Home },
    { href: "/patients", label: "Patients", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  
  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(`${path}/`);
  };
  
  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between py-2">
              <div className="font-bold text-lg">GlobalRad</div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <nav className="flex-1 mt-4">
              <ul className="space-y-2">
                {routes.map((route) => {
                  const Icon = route.icon;
                  return (
                    <li key={route.href}>
                      <Link 
                        href={route.href}
                        className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive(route.href)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={onClose}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {route.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t py-4 mt-auto">
              <div className="text-xs text-muted-foreground">
                <p>GlobalRad v0.1.0</p>
                <p className="mt-1">© 2025 RadGlobal</p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
