'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Button, Card, Text, TextInput, Alert, Group, Stack, ThemeIcon, FileButton } from '@mantine/core';
import { AlertCircle, CheckCircle, Upload, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { pinataService } from '@/lib/web3/pinata';

// Simple inline spinner component
const Spinner = ({ className }: { className?: string }) => (
  <Loader2 className={`animate-spin ${className || ''}`} />
);

interface UploadResult {
  cid: string;
  gatewayUrl: string;
  timestamp: string;
}

export function PinataUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Check if Pinata is configured
      if (!pinataService.isConfigured()) {
        throw new Error('Pinata is not configured. Please set up your Pinata API keys in the environment variables.');
      }

      // Upload the file to Pinata
      const cid = await pinataService.uploadFile(file);

      // Get the gateway URL
      const gatewayUrl = pinataService.getGatewayUrl(cid);

      setUploadResult({
        cid,
        gatewayUrl,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload size={32} color="var(--mantine-color-gray-5)" />;

    const fileType = file.type.split('/')[0];
    switch (fileType) {
      case 'image':
        return <ImageIcon size={32} color="blue" />;
      default:
        return <FileText size={32} color="blue" />;
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder w="100%" maw={420} mx="auto">
      <Card.Section withBorder inheritPadding py="xs">
        <Text size="lg" fw={600}>Upload to IPFS via Pinata</Text>
        <Text size="sm" c="dimmed">
          Select a file to upload to IPFS using Pinata
        </Text>
      </Card.Section>

      <Card.Section withBorder inheritPadding py="md">
        <Stack gap="md">
          <Card withBorder padding="md" radius="md" bg="gray.0">
            <Stack align="center" gap="xs">
              <ThemeIcon variant="light" size="xl" radius="xl">
                {getFileIcon()}
              </ThemeIcon>
              <Text size="sm" ta="center" c="dimmed">
                {file ? file.name : 'No file selected'}
              </Text>
              {file && (
                <Text size="xs" c="dimmed">
                  {(file.size / 1024).toFixed(2)} KB
                </Text>
              )}
            </Stack>
          </Card>

          <FileButton onChange={handleFileChange} accept="*/*">
            {(props) => (
              <Button
                {...props}
                variant="light"
                leftSection={<Upload size={16} />}
                fullWidth
              >
                Select File
              </Button>
            )}
          </FileButton>

          {error && (
            <Alert color="red" icon={<AlertCircle size={16} />} title="Error">
              {error}
            </Alert>
          )}

          {uploadResult && (
            <Alert color="green" icon={<CheckCircle size={16} />} title="Upload Successful">
              <Stack gap="xs">
                <Text size="sm"><strong>CID:</strong> {uploadResult.cid}</Text>
                <Text size="sm">
                  <strong>Gateway URL:</strong>{' '}
                  <a
                    href={uploadResult.gatewayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--mantine-color-blue-6)', textDecoration: 'underline', wordBreak: 'break-all' }}
                  >
                    {uploadResult.gatewayUrl}
                  </a>
                </Text>
              </Stack>
            </Alert>
          )}
        </Stack>
      </Card.Section>

      <Card.Section withBorder inheritPadding py="md">
        <Group justify="space-between">
          <Button variant="outline" onClick={handleClear} disabled={isUploading}>
            Clear
          </Button>
          <Button onClick={handleUpload} disabled={!file || isUploading} loading={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload to IPFS'}
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
}
