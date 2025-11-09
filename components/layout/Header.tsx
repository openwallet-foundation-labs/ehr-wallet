
import { Menu, X } from "lucide-react";
import { UserAccountNav } from "@/components/UserAccountNav";
import { Button } from "@/components/ui/button";
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
            <div className="text-xl font-semibold text-primary">EHR Wallet</div>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle sidebar</span>
            </Button>
            <div className="text-xl font-semibold text-primary">EHR Wallet</div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <UserAccountNav />
      </div>
    </header>
  );
};
