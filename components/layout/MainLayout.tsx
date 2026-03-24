
import { useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileNav } from "./MobileNav";
import { useIsMobile } from "@/hooks/use-mobile";
import SyncManager from "@/components/SyncManager";
import { Box, Flex, AppShell } from "@mantine/core";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  // Set sidebar default state based on screen size - always open on desktop
  useEffect(() => {
    // Only close on mobile, keep open on desktop
    if (isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Store sidebar state in localStorage to persist across navigation
  useEffect(() => {
    // Only store for desktop view
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen, isMobile]);

  // Restore sidebar state from localStorage on initial load
  useEffect(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      const storedState = localStorage.getItem('sidebarOpen');
      if (storedState !== null) {
        // Parse stored state, but default to true (open) if not found
        setSidebarOpen(storedState ? JSON.parse(storedState) : true);
      } else {
        // If no stored state, default to open
        setSidebarOpen(true);
      }
    }
  }, [isMobile]);

  // Prevent sidebar from collapsing during page transitions
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Don't close sidebar on route change
      // We're intentionally not modifying the state here
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [router]);

  // On mobile, sidebar is closed by default
  const isOpen = isMobile ? false : sidebarOpen;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMobileNav = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  const handleSwipeLeft = () => {
    if (isMobile && mobileNavOpen) {
      setMobileNavOpen(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-body)' }}>
      <Header
        toggleSidebar={toggleSidebar}
        toggleMobileNav={toggleMobileNav}
        isMobileNavOpen={mobileNavOpen}
      />

      {/* Mobile Navigation Drawer - only rendered when open */}
      {isMobile && (
        <MobileNav
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />
      )}

      <Flex
        onTouchStart={(e) => {
          // Simple swipe detection for mobile
          if (isMobile) {
            const touchStartX = e.touches[0].clientX;
            const handleTouchEnd = (e: TouchEvent) => {
              const touchEndX = e.changedTouches[0].clientX;
              if (touchStartX - touchEndX > 50) {
                handleSwipeLeft();
              }
              document.removeEventListener('touchend', handleTouchEnd);
            };
            document.addEventListener('touchend', handleTouchEnd);
          }
        }}
        style={{ minHeight: 'calc(100vh - 64px)', width: '100%' }}
      >
        {/* Desktop Sidebar - hidden on mobile */}
        {!isMobile && (
          <Sidebar isOpen={isOpen} onClose={() => setSidebarOpen(false)} />
        )}

        <Box
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            transition: 'all 300ms',
            paddingBottom: isMobile ? 80 : undefined,
          }}
        >
          {children}
        </Box>
      </Flex>

      {/* Mobile Bottom Navigation - only visible on mobile */}
      {isMobile && <MobileBottomNav />}

      {/* Sync Manager for offline data synchronization */}
      <SyncManager />
    </Box>
  );
};
