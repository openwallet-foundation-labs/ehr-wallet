import { useState, useEffect } from "react";
import { Button, Group, Text, Paper } from "@mantine/core";
import { RefreshCw } from "lucide-react";

export function UpdateNotification() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for new service worker updates
      let refreshing = false;

      // When the service worker finds an update, show the update prompt
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        setShowUpdatePrompt(true);
      });

      // Check for updates every 60 minutes
      const checkInterval = setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update().catch(err => {
            console.error('Error checking for service worker updates:', err);
          });
        });
      }, 60 * 60 * 1000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleUpdate = () => {
    // Reload the page to get the latest version
    window.location.reload();
  };

  if (!showUpdatePrompt) return null;

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
      className="md:bottom-auto md:top-16 md:m-4 md:rounded-lg"
    >
      <Group justify="space-between">
        <div style={{ flex: 1 }}>
          <Text fw={500}>Update Available</Text>
          <Text size="sm" c="dimmed">A new version of the app is available</Text>
        </div>
        <Button onClick={handleUpdate} ml="md">
          <Group gap="xs">
            <RefreshCw size={14} />
            <span>Update Now</span>
          </Group>
        </Button>
      </Group>
    </Paper>
  );
}
