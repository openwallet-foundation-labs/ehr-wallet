import { useState, useEffect } from "react";
import { Button, Group, Text, Paper } from "@mantine/core";
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
    <Paper
      shadow="lg"
      p="md"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        borderTop: '1px solid var(--mantine-color-gray-3)',
      }}
    >
      <Group justify="space-between">
        <div style={{ flex: 1 }}>
          <Text fw={500}>Install GlobalRad</Text>
          <Text size="sm" c="dimmed">Add to home screen for offline access</Text>
        </div>
        <Group gap="xs">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setShowPrompt(false)}
            leftSection={<X size={14} />}
          >
            Not now
          </Button>
          <Button
            size="xs"
            onClick={isIOSDevice ? handleIOSInstructions : handleInstallClick}
          >
            Install
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
