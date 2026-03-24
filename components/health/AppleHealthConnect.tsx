'use client';

import { useState } from 'react';
import { Button, Card, Text, Badge, Alert, Group, Stack, ThemeIcon } from '@mantine/core';
import { AppleIcon } from '@/components/icons/AppleIcon';

interface AppleHealthConnectProps {
  onConnect?: (success: boolean) => void;
}

export default function AppleHealthConnect({ onConnect }: AppleHealthConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    // Reset states
    setIsConnecting(true);
    setError(null);

    try {
      // In a real implementation, this would use the Apple HealthKit API
      // This is a mock implementation for demonstration purposes

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful connection
      setIsConnected(true);
      if (onConnect) onConnect(true);
    } catch (err) {
      console.error('Error connecting to Apple Health:', err);
      setError('Failed to connect to Apple Health. Please try again.');
      if (onConnect) onConnect(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConnected(false);
    } catch (err) {
      console.error('Error disconnecting from Apple Health:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Card.Section withBorder inheritPadding py="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon variant="light" color="red" size="lg">
              <AppleIcon size={20} />
            </ThemeIcon>
            <Text size="lg" fw={600}>Apple Health</Text>
          </Group>
          {isConnected && (
            <Badge variant="outline" color="green">
              Connected
            </Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed" mt="xs">
          Connect your Apple Health data to share health metrics with your healthcare provider
        </Text>
      </Card.Section>

      <Card.Section withBorder inheritPadding py="md">
        {error && (
          <Alert color="red" title="Error" mb="md">
            {error}
          </Alert>
        )}

        <Stack gap="md">
          {!isConnected ? (
            <div>
              <Text size="sm" c="dimmed" mb="md">
                Connect to Apple Health to share your health data securely with your healthcare providers.
                This allows them to monitor your health metrics and provide better care.
              </Text>
              <Button
                onClick={handleConnect}
                loading={isConnecting}
                variant="filled"
                color="red"
              >
                <AppleIcon size={16} style={{ marginRight: 8 }} />
                {isConnecting ? 'Connecting...' : 'Connect to Apple Health'}
              </Button>
            </div>
          ) : (
            <div>
              <Group grow mb="md">
                <Card withBorder padding="sm" radius="md">
                  <Text size="xs" c="dimmed">Steps</Text>
                  <Text size="xl" fw={700}>8,742</Text>
                </Card>
                <Card withBorder padding="sm" radius="md">
                  <Text size="xs" c="dimmed">Heart Rate</Text>
                  <Text size="xl" fw={700}>72 bpm</Text>
                </Card>
              </Group>
              <Group grow mb="md">
                <Card withBorder padding="sm" radius="md">
                  <Text size="xs" c="dimmed">Sleep</Text>
                  <Text size="xl" fw={700}>7.5 hrs</Text>
                </Card>
                <Card withBorder padding="sm" radius="md">
                  <Text size="xs" c="dimmed">Blood Pressure</Text>
                  <Text size="xl" fw={700}>120/80</Text>
                </Card>
              </Group>
              <Button
                variant="outline"
                color="red"
                onClick={handleDisconnect}
                loading={isConnecting}
              >
                {isConnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          )}
        </Stack>
      </Card.Section>
    </Card>
  );
}
