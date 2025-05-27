import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { canInstallPWA, showInstallPrompt, isIOS, isInStandaloneMode } from "@/lib/pwa-utils";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    // Don't show if already in standalone mode
    if (isInStandaloneMode()) return;

    // Check if iOS
    if (typeof window !== 'undefined') {
      setIsIOSDevice(isIOS());
    }

    // Check for install prompt availability
    const checkInstallable = () => {
      if (canInstallPWA()) {
        setShowPrompt(true);
      }
    };

    // Check initially
    checkInstallable();

    // Set up event listener
    window.addEventListener('beforeinstallprompt', checkInstallable);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', checkInstallable);
    };
  }, []);

  const handleInstallClick = async () => {
    const result = await showInstallPrompt();
    if (result === 'accepted' || result === 'dismissed') {
      setShowPrompt(false);
    }
  };

  const handleIOSInstructions = () => {
    // Show iOS-specific instructions
    alert("To install this app on your iOS device:\n\n1. Tap the Share button at the bottom of the screen\n2. Scroll down and tap 'Add to Home Screen'\n3. Tap 'Add' in the top right corner");
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="font-medium">Install GlobalRad</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Add to home screen for offline access</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowPrompt(false)}>
          <X className="h-4 w-4 mr-1" />
          Not now
        </Button>
        <Button 
          size="sm" 
          onClick={isIOSDevice ? handleIOSInstructions : handleInstallClick}
        >
          Install
        </Button>
      </div>
    </div>
  );
}
