
import { useState } from "react";
import { Bell, Search, User, Menu, X } from "lucide-react";
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
            <div className="text-xl font-semibold text-primary">RadGlobal RIS</div>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <div className="text-xl font-semibold text-primary">RadGlobal RIS</div>
          </>
        )}
      </div>
      
      {!isMobile && (
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
        {isMobile && (
          <Button variant="ghost" size="icon" className="relative" aria-label="Search">
            <Search className="h-5 w-5" />
          </Button>
        )}
        
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="User menu">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
