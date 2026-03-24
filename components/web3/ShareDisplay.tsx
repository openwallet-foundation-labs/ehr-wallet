'use client';

import { useState, useEffect } from 'react';
import { Card, Text, Button, TextInput, Group, Stack, Alert } from '@mantine/core';
import { Clipboard, Clock, Share2, FileText, Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getAccessGrantDetails } from '@/lib/web3/contract';
import { toast } from 'sonner';

interface ShareDisplayProps {
  shareableLink: string;
  accessId: string;
}

const ShareDisplay = ({ shareableLink, accessId }: ShareDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const [expiryTime, setExpiryTime] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccessDetails = async () => {
      try {
        const details = await getAccessGrantDetails(accessId);
        setExpiryTime(details.expiryTime);
        // Clear any previous errors since we have data now
        setError(null);
      } catch (err: any) {
        console.error('Error fetching access details:', err);
        setError(err.message || 'Failed to fetch access details');
        // Set a default expiry time (24 hours from now) as fallback
        setExpiryTime(new Date(Date.now() + 86400000));
      } finally {
        setLoading(false);
      }
    };

    fetchAccessDetails();
  }, [accessId]);

  useEffect(() => {
    if (!expiryTime) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = expiryTime.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiryTime]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Show success toast
    toast.success('Link copied!', {
      description: 'The shareable link has been copied to your clipboard.',
    });
  };

  return (
    <Card shadow="md" radius="md" withBorder style={{ width: '100%' }}>
      <Card.Section p="xl">
        <Text size="xl" fw={700} style={{ fontSize: '1.5rem' }}>Share Your Medical Data</Text>
        <Text size="sm" c="dimmed">
          Use this link or QR code to share your medical data securely
        </Text>
      </Card.Section>

      <Card.Section p="xl">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
          </div>
        ) : error ? (
          <Alert color="red" title="Error">{error}</Alert>
        ) : (
          <Stack gap="lg">
            {/* QR Code */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
              <div style={{ padding: 16, backgroundColor: 'white', borderRadius: 8 }}>
                <QRCode value={shareableLink} size={200} />
              </div>
            </div>

            {/* Shareable Link */}
            <div>
              <Text size="sm" fw={500} mb="xs">Shareable Link</Text>
              <Group gap="xs">
                <TextInput
                  value={shareableLink}
                  readOnly
                  style={{ flex: 1, fontFamily: 'monospace', fontSize: 14 }}
                />
                <Button
                  variant="outline"
                  onClick={copyToClipboard}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                  leftSection={<Clipboard size={16} />}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </Group>
              {copied && (
                <Text size="xs" c="dimmed" mt="xs">Copied to clipboard!</Text>
              )}
            </div>

            {/* Expiry Time */}
            {expiryTime && (
              <Group gap="xs" c="dimmed">
                <Clock size={16} />
                <Text size="sm">
                  Expires in: <Text span fw={600}>{timeLeft}</Text>
                </Text>
              </Group>
            )}

            {/* Sharing Instructions */}
            <div style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: 'rgba(0, 0, 0, 0.02)'
            }}>
              <Group gap="xs" mb="sm">
                <Share2 size={16} />
                <Text fw={500}>Sharing Instructions</Text>
              </Group>
              <Stack gap="xs">
                <Text size="sm">- Share this link with your healthcare provider</Text>
                <Text size="sm">- They can access your {shareableLink.includes('document') ? 'documents' : 'data'} by visiting the link</Text>
                {expiryTime && (
                  <Text size="sm">- Access will expire automatically after the set duration</Text>
                )}
                <Text size="sm">- You can revoke access at any time from your dashboard</Text>
              </Stack>
            </div>
          </Stack>
        )}
      </Card.Section>

      <Card.Section p="xl" style={{ borderTop: '1px solid #e5e7eb' }}>
        <Text size="xs" c="dimmed">
          Your {shareableLink.includes('document') ? 'documents are' : 'data is'} securely stored on IPFS and access is managed by a blockchain smart contract
        </Text>
      </Card.Section>
    </Card>
  );
};

export default ShareDisplay;
