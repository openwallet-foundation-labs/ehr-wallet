'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clipboard, Clock, Share2 } from 'lucide-react';
import QRCode from 'react-qr-code';
import { getAccessGrantDetails } from '@/lib/web3/contract';

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
      } catch (err: any) {
        console.error('Error fetching access details:', err);
        setError(err.message || 'Failed to fetch access details');
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
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Share Your Medical Data</CardTitle>
        <CardDescription>
          Use this link or QR code to share your medical data securely
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-destructive text-center py-4">{error}</div>
        ) : (
          <>
            <div className="flex justify-center py-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCode value={shareableLink} size={200} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Shareable Link</Label>
              <div className="flex space-x-2">
                <Input
                  id="link"
                  value={shareableLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-muted-foreground">Copied to clipboard!</p>
              )}
            </div>

            {expiryTime && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Expires in: <strong>{timeLeft}</strong>
                </span>
              </div>
            )}

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Share2 className="h-4 w-4 mr-2" />
                Sharing Instructions
              </h4>
              <ul className="text-sm space-y-2">
                <li>• Share this link with your healthcare provider</li>
                <li>• They can access your data by visiting the link</li>
                {expiryTime && (
                  <li>• Access will expire automatically after the set duration</li>
                )}
                <li>• You can revoke access at any time from your dashboard</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Your data is securely stored on IPFS and access is managed by an Ethereum smart contract
        </p>
      </CardFooter>
    </Card>
  );
};

export default ShareDisplay;
