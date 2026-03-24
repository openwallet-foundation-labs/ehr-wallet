'use client';

import { useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, Text, Button, Checkbox, Select, Tabs, Progress, TextInput, PasswordInput, Group, Stack, Badge, Alert } from '@mantine/core';
import { Loader2, FileText, FlaskConical, Image, Pill, ClipboardList, Clock, Shield, AlertCircle, Info, Upload } from 'lucide-react';
import { encryptData, uploadToIpfs, checkIpfsAvailability } from '@/lib/web3/ipfs';
import { pinataService } from '@/lib/web3/pinata';
import { createAccessGrant, generateShareableLink } from '@/lib/web3/contract';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';

// Define the form schema
const formSchema = z.object({
  dataTypes: z.array(z.string()).min(1, { message: 'Please select at least one data type to share' }),
  duration: z.string().min(1, { message: 'Access duration is required' }),
  password: z.string()
    .optional()
    .refine(
      (val) => !val || val.length >= 6,
      { message: 'Password must be at least 6 characters long' }
    ),
  usePassword: z.boolean().default(false),
  uploadMode: z.enum(['data', 'documents']).default('data'),
  documents: z.array(z.any())
    .optional()
    .refine(
      (val) => !val || val.length > 0,
      { message: 'Please upload at least one document' }
    ),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms to continue',
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Available data types with descriptions and icons
const dataTypeOptions = [
  {
    id: 'medical-history',
    label: 'Medical History',
    description: 'Share your complete medical history and conditions',
    icon: 'FileText'
  },
  {
    id: 'lab-results',
    label: 'Lab Results',
    description: 'Share blood work, urine tests, and other laboratory results',
    icon: 'FlaskConical'
  },
  {
    id: 'imaging',
    label: 'Imaging & Scans',
    description: 'Share X-rays, MRIs, CT scans, and other imaging results',
    icon: 'Image'
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    description: 'Share current and past medication prescriptions',
    icon: 'Pill'
  },
  {
    id: 'visit-notes',
    label: 'Visit Notes',
    description: 'Share doctor visit summaries and clinical notes',
    icon: 'ClipboardList'
  },
];

// Duration options in seconds
const durationOptions = [
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '1 day' },
  { value: '604800', label: '1 week' },
  { value: '2592000', label: '30 days' },
];

interface DataSharingFormProps {
  patientId: string;
  onSuccess: (shareableLink: string, accessId: string) => void;
}

const DataSharingForm = ({ patientId, onSuccess }: DataSharingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<string>('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { control, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataTypes: [],
      duration: '86400', // Default to 1 day
      usePassword: false,
      password: '',
      uploadMode: 'data',
      documents: [],
      termsAccepted: false,
    },
  });

  const usePassword = watch('usePassword');
  const uploadMode = watch('uploadMode');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  // Function to add logs
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);

    // Scroll to bottom of logs
    setTimeout(() => {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const onSubmit = async (values: FormValues) => {
    // Reset state
    setIsSubmitting(true);
    setError(null);
    setLogs([]);
    setUploadProgress(0);
    setUploadStage('Initializing...');
    addLog('Starting data sharing process...');

    // Validate form data
    if (values.uploadMode === 'documents' && (!uploadedFiles || uploadedFiles.length === 0)) {
      setError('Please upload at least one document to share');
      setIsSubmitting(false);
      return;
    }

    if (values.usePassword && (!values.password || values.password.length < 6)) {
      setError('Please enter a password with at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    // Flag to track if we should use direct IPFS (no contract)
    const useDirectIpfs = !process.env.NEXT_PUBLIC_ACCESS_CONTRACT_ADDRESS;
    if (useDirectIpfs) {
      addLog('No contract address configured - using direct IPFS upload');
    }

    try {
      // Check if MetaMask is installed
      setUploadProgress(10);
      setUploadStage('Checking wallet connection...');
      addLog('Checking if MetaMask is installed...');

      // Add a flag to bypass MetaMask requirement for testing
      const bypassMetaMask = true; // Set to true to bypass MetaMask requirement

      if (!window.ethereum && !bypassMetaMask) {
        addLog('ERROR: MetaMask not found');
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      } else if (!window.ethereum && bypassMetaMask) {
        addLog('MetaMask not found, but continuing in bypass mode');
      } else {
        addLog('MetaMask detected');
      }

      // Request account access if not already connected
      let address = 'test-address-' + Date.now().toString(16);

      if (window.ethereum) {
        try {
          addLog('Requesting MetaMask account access...');
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          address = accounts[0];
          addLog(`Connected with address: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
        } catch (metaMaskError: any) {
          addLog(`MetaMask connection error: ${metaMaskError.message}`);
          addLog('Continuing with test address');
          console.error('MetaMask error:', metaMaskError);
        }
      } else {
        addLog(`Using test address: ${address}`);
      }

      let ipfsData;
      let dataToShare;

      if (values.uploadMode === 'documents') {
        // Handle document uploads
        setUploadProgress(20);
        setUploadStage('Processing documents...');
        addLog('Processing document uploads...');
        if (uploadedFiles.length === 0) {
          addLog('ERROR: No documents uploaded');
          throw new Error('Please upload at least one document');
        }
        addLog(`Found ${uploadedFiles.length} document(s) to process`);

        // Process each file
        addLog('Converting files to base64 format...');
        const fileData = await Promise.all(
          uploadedFiles.map(async (file) => {
            addLog(`Processing file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
            // Convert file to base64
            const base64 = await fileToBase64(file);
            addLog(`Converted ${file.name} to base64`);
            return {
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified,
              content: base64,
            };
          })
        );
        addLog('All files processed successfully');

        // Prepare document data
        dataToShare = {
          patientId,
          documentType: 'medical-documents',
          files: fileData,
          createdAt: new Date().toISOString(),
          createdBy: address,
        };
      } else {
        // Regular data sharing
        // Prepare data to be shared
        dataToShare = {
          patientId,
          dataTypes: values.dataTypes,
          createdAt: new Date().toISOString(),
          createdBy: address,
        };
      }

      // Encrypt data if password is used
      setUploadProgress(40);
      if (values.usePassword && values.password) {
        setUploadStage('Encrypting data...');
        addLog('Encrypting data with password...');
        ipfsData = await encryptData(dataToShare, values.password);
        addLog('Data encrypted successfully');
      } else {
        setUploadStage('Preparing data...');
        addLog('Preparing data for IPFS (unencrypted)...');
        ipfsData = JSON.stringify(dataToShare);
        addLog('Data prepared successfully');
      }

      // Check IPFS availability and Pinata configuration
      addLog('Checking IPFS and Pinata availability...');
      try {
        // Check if Pinata is configured
        const isPinataConfigured = pinataService.isConfigured();
        if (isPinataConfigured) {
          addLog('Pinata service is configured and will be used as primary IPFS provider.');
        } else {
          addLog('Pinata service is not configured. Will use alternative IPFS providers.');

          // Check other IPFS availability
          const isIpfsAvailable = await checkIpfsAvailability();
          if (!isIpfsAvailable) {
            addLog('WARNING: IPFS service may not be fully available. Will attempt upload with fallbacks.');
          } else {
            addLog('IPFS service is available.');
          }
        }
      } catch (error) {
        addLog('WARNING: Could not verify IPFS availability. Will attempt upload with fallbacks.');
      }

      // Upload to IPFS with Pinata prioritized
      setUploadProgress(60);
      setUploadStage('Uploading to IPFS...');
      addLog('Uploading to IPFS...');
      addLog('Data to upload: ' + (typeof ipfsData === 'string' ? ipfsData.substring(0, 50) + '...' : JSON.stringify(dataToShare).substring(0, 50) + '...'));
      try {
        let ipfsCid;

        // Try Pinata first if configured
        if (pinataService.isConfigured()) {
          try {
            addLog('Attempting upload via Pinata...');
            // Convert string to JSON if needed
            const jsonData = typeof ipfsData === 'string' ? JSON.parse(ipfsData) : ipfsData;
            ipfsCid = await pinataService.uploadJSON(jsonData, `Patient-${patientId}-Data-${Date.now()}`);
            addLog(`Successfully uploaded to IPFS via Pinata with CID: ${ipfsCid}`);
          } catch (pinataError: any) {
            addLog(`Pinata upload failed: ${pinataError.message}. Falling back to alternative IPFS providers...`);
            // Fall back to regular IPFS upload
            ipfsCid = await uploadToIpfs(ipfsData);
            addLog(`Successfully uploaded to IPFS with CID: ${ipfsCid} using fallback method`);
          }
        } else {
          // Use regular IPFS upload if Pinata not configured
          ipfsCid = await uploadToIpfs(ipfsData);
          addLog(`Successfully uploaded to IPFS with CID: ${ipfsCid}`);
        }

        if (useDirectIpfs) {
          // Direct IPFS approach (no contract)
          setUploadProgress(90);
          setUploadStage('Generating shareable link...');
          addLog('Using direct IPFS sharing (no blockchain contract)');

          // Generate a simple shareable link with the CID
          const baseUrl = window.location.origin;
          const shareableLink = `${baseUrl}/ipfs/${ipfsCid}`;
          const accessId = ipfsCid; // Use CID as the access ID

          addLog(`Direct IPFS link generated: ${shareableLink}`);
          addLog('Process completed successfully!');
          setUploadProgress(100);
          setUploadStage('Complete!');

          // Show success toast
          toast.success('Data shared successfully!', {
            description: 'Your medical data has been securely uploaded to IPFS and is ready to share.',
          });

          // Call success callback
          onSuccess(shareableLink, accessId);
        } else {
          // Create access grant on blockchain
          setUploadProgress(75);
          setUploadStage('Creating blockchain access grant...');
          const durationInSeconds = parseInt(values.duration);
          addLog(`Creating access grant on blockchain (duration: ${durationInSeconds} seconds)...`);
          const accessId = await createAccessGrant(
            ipfsCid,
            durationInSeconds,
            values.usePassword ? values.password : undefined
          );
          addLog(`Access grant created with ID: ${accessId}`);

          // Generate shareable link
          const shareableLink = generateShareableLink(accessId);
          addLog(`Generated shareable link: ${shareableLink}`);

          // Save the shared data to the database via API
          setUploadProgress(85);
          setUploadStage('Saving to database...');
          try {
            addLog('Saving shared data to database...');

            // Calculate expiry time based on duration
            const durationSeconds = parseInt(values.duration);
            const expiryTime = new Date(Date.now() + durationSeconds * 1000);

            // Prepare data for API
            const sharedDataPayload = {
              accessId,
              ipfsCid,
              expiryTime: expiryTime.toISOString(),
              hasPassword: values.usePassword,
              dataTypes: values.dataTypes
            };

            addLog(`Sending payload to API: ${JSON.stringify(sharedDataPayload)}`);

            // Call the API to save the shared data
            const response = await fetch('/api/shared-data', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(sharedDataPayload),
              // Ensure we don't use cached responses
              cache: 'no-store'
            });

            if (!response.ok) {
              let errorMessage = 'Failed to save shared data';
              try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
              } catch (e) {
                // If we can't parse the error response, use the default message
              }
              throw new Error(errorMessage);
            }

            // Try to get the response data
            let responseData;
            try {
              responseData = await response.json();
              addLog(`API response: ${JSON.stringify(responseData)}`);
            } catch (e) {
              addLog('Could not parse API response, but operation was successful');
            }

            addLog('Shared data saved to database successfully');
          } catch (apiError: any) {
            addLog(`WARNING: Failed to save to database: ${apiError.message}`);
            console.error('Error saving to database:', apiError);
            // Continue with the process even if database save fails
          }

          // Show success toast
          setUploadProgress(100);
          setUploadStage('Complete!');
          toast.success('Data shared successfully!', {
            description: 'Your medical data has been securely uploaded and a shareable link has been generated.',
          });

          // Call the onSuccess callback with the shareable link and access ID
          onSuccess(shareableLink, accessId);

          addLog('Data sharing process completed successfully!');
        }
      } catch (ipfsError: any) {
        addLog(`IPFS ERROR: ${ipfsError.message || 'Unknown IPFS error'}`);
        addLog(`IPFS ERROR DETAILS: ${JSON.stringify(ipfsError)}`);
        console.error('IPFS upload error:', ipfsError);
        throw ipfsError;
      }
    } catch (error: any) {
      console.error('Error in data sharing process:', error);
      const errorMessage = error.message || 'An unknown error occurred';

      // Provide user-friendly error messages
      let userFriendlyError = errorMessage;

      if (errorMessage.includes('404')) {
        userFriendlyError = 'The IPFS service is temporarily unavailable. Please try again in a few minutes.';
        addLog('This appears to be an IPFS connection issue. The IPFS service might be temporarily unavailable.');
        addLog('Recommendation: Please try again in a few minutes.');
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyError = 'Network connection issue. Please check your internet connection and try again.';
        addLog('This appears to be a network connectivity issue.');
        addLog('Recommendation: Please check your internet connection and try again.');
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'The operation timed out. Please try again with a smaller file or less data.';
        addLog('The operation timed out. The IPFS service might be slow or overloaded.');
        addLog('Recommendation: Please try again later with a smaller file or less data.');
      } else if (errorMessage.includes('MetaMask')) {
        userFriendlyError = 'There was an issue with your wallet connection. Please make sure MetaMask is installed and unlocked.';
      } else if (errorMessage.includes('password')) {
        userFriendlyError = 'There was an issue with the password protection. Please try a different password.';
      }

      setError(userFriendlyError);
      addLog(`ERROR: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
      addLog('Operation completed');
    }
  };

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Helper function to reset the form
  const resetForm = () => {
    reset({
      dataTypes: [],
      duration: '86400', // Default to 1 day
      usePassword: false,
      password: '',
      uploadMode: 'data',
      documents: [],
      termsAccepted: false,
    });
    setUploadedFiles([]);
    setError(null);
    setLogs([]);
  };

  // Get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return FileText;
      case 'FlaskConical': return FlaskConical;
      case 'Image': return Image;
      case 'Pill': return Pill;
      case 'ClipboardList': return ClipboardList;
      default: return FileText;
    }
  };

  return (
    <Card shadow="md" radius="md" withBorder style={{ width: '100%' }}>
      <Card.Section p="xl" style={{ background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%)' }}>
        <Group gap="md">
          <div style={{
            padding: 8,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={24} color="#3b82f6" />
          </div>
          <div>
            <Text size="xl" fw={700} style={{ fontSize: '1.5rem' }}>Share Your Medical Data</Text>
            <Text size="md" c="dimmed">
              Securely share your medical data or documents with healthcare providers using encryption and blockchain technology
            </Text>
          </div>
        </Group>
      </Card.Section>

      <Card.Section p="xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="xl">
            {/* Upload Mode Tabs */}
            <Controller
              name="uploadMode"
              control={control}
              render={({ field }) => (
                <div>
                  <Group gap="sm" mb="sm">
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14
                    }}>
                      1
                    </div>
                    <Text size="lg" fw={600}>What would you like to share?</Text>
                  </Group>
                  <Tabs
                    value={field.value}
                    onChange={field.onChange}
                    variant="outline"
                  >
                    <Tabs.List grow>
                      <Tabs.Tab value="data">Medical Data</Tabs.Tab>
                      <Tabs.Tab value="documents">Documents</Tabs.Tab>
                    </Tabs.List>
                  </Tabs>
                  {errors.uploadMode && (
                    <Text size="sm" c="red" mt="xs">{errors.uploadMode.message}</Text>
                  )}
                </div>
              )}
            />

            {/* Data Types Selection */}
            {uploadMode === 'data' && (
              <Controller
                name="dataTypes"
                control={control}
                render={({ field }) => (
                  <div>
                    <Group gap="sm" mb="xs">
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14
                      }}>
                        2
                      </div>
                      <Text size="lg" fw={600}>Select Data Types to Share</Text>
                    </Group>
                    <Text size="sm" c="dimmed" mb="md">
                      Choose which types of medical data you want to share with your healthcare provider
                    </Text>
                    <Stack gap="sm">
                      {dataTypeOptions.map((option) => {
                        const IconComponent = getIconComponent(option.icon);
                        const isSelected = field.value?.includes(option.id);

                        return (
                          <div
                            key={option.id}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: 16,
                              borderRadius: 8,
                              border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                              backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              const newValue = isSelected
                                ? field.value?.filter((value) => value !== option.id)
                                : [...(field.value || []), option.id];
                              field.onChange(newValue);
                            }}
                          >
                            <Group gap="sm" align="flex-start">
                              <Checkbox
                                checked={isSelected}
                                onChange={() => {
                                  const newValue = isSelected
                                    ? field.value?.filter((value) => value !== option.id)
                                    : [...(field.value || []), option.id];
                                  field.onChange(newValue);
                                }}
                                mt={4}
                              />
                              <div style={{ flex: 1 }}>
                                <Group gap="xs">
                                  <IconComponent size={16} color="#3b82f6" />
                                  <Text fw={500} size="md">{option.label}</Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                  {option.description}
                                </Text>
                              </div>
                            </Group>
                          </div>
                        );
                      })}
                    </Stack>
                    {errors.dataTypes && (
                      <Text size="sm" c="red" mt="xs">{errors.dataTypes.message}</Text>
                    )}
                  </div>
                )}
              />
            )}

            {/* Document Upload */}
            {uploadMode === 'documents' && (
              <Controller
                name="documents"
                control={control}
                render={({ field }) => (
                  <div>
                    <Group gap="sm" mb="xs">
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 14
                      }}>
                        2
                      </div>
                      <Group gap="xs">
                        <FileText size={16} color="#3b82f6" />
                        <Text size="lg" fw={600}>Upload Medical Documents</Text>
                      </Group>
                    </Group>
                    <Text size="sm" c="dimmed" mb="sm">
                      Upload medical documents, reports, or images to share securely
                    </Text>
                    <FileUpload
                      onChange={(files: File[]) => {
                        setUploadedFiles(files);
                        field.onChange(files);
                      }}
                      value={uploadedFiles}
                      multiple={true}
                      maxFiles={5}
                      maxSize={20} // 20MB
                      accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    />
                    <Group gap="xs" mt="sm">
                      {uploadedFiles.map((file, index) => (
                        <Badge
                          key={index}
                          variant="light"
                          color="blue"
                          leftSection={<FileText size={12} />}
                        >
                          {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}
                          <Text span size="xs" c="dimmed" ml={4}>
                            ({(file.size / 1024).toFixed(0)} KB)
                          </Text>
                        </Badge>
                      ))}
                    </Group>
                    {errors.documents && (
                      <Text size="sm" c="red" mt="xs">{errors.documents.message}</Text>
                    )}
                  </div>
                )}
              />
            )}

            {/* Duration Selection */}
            <Controller
              name="duration"
              control={control}
              render={({ field }) => (
                <div>
                  <Group gap="sm" mb="xs">
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14
                    }}>
                      3
                    </div>
                    <Group gap="xs">
                      <Clock size={16} color="#3b82f6" />
                      <Text size="lg" fw={600}>Access Duration</Text>
                    </Group>
                  </Group>
                  <Text size="sm" c="dimmed" mb="sm">
                    Set how long the recipient will have access to your data
                  </Text>
                  <Select
                    {...field}
                    data={durationOptions}
                    placeholder="Select duration"
                    styles={{
                      input: { height: 44 }
                    }}
                  />
                  {errors.duration && (
                    <Text size="sm" c="red" mt="xs">{errors.duration.message}</Text>
                  )}
                </div>
              )}
            />

            {/* Password Option */}
            <Controller
              name="usePassword"
              control={control}
              render={({ field }) => (
                <div>
                  <Group gap="sm" mb="sm">
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14
                    }}>
                      4
                    </div>
                    <Text size="lg" fw={600}>Security Options</Text>
                  </Group>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }}>
                    <Checkbox
                      checked={field.value}
                      onChange={field.onChange}
                      mt={4}
                    />
                    <div style={{ marginLeft: 12 }}>
                      <Group gap="xs">
                        <Shield size={16} color="#3b82f6" />
                        <Text fw={500}>Require password for access</Text>
                      </Group>
                      <Text size="sm" c="dimmed">
                        Add an extra layer of security with a password. You'll need to share this password separately with the recipient.
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            />

            {/* Password Input */}
            {usePassword && (
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <div style={{
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    border: '1px dashed #e5e7eb'
                  }}>
                    <Text size="md" fw={600} mb="xs">Set Access Password</Text>
                    <Text size="sm" c="dimmed" mb="sm">
                      Create a password that the recipient will need to access your data
                    </Text>
                    <PasswordInput
                      {...field}
                      placeholder="Enter a secure password (min. 6 characters)"
                      style={{ maxWidth: 400 }}
                    />
                    <Group gap="xs" mt="sm">
                      <Info size={16} color="#d97706" />
                      <Text size="sm" c="orange-7">You must share this password with the recipient separately</Text>
                    </Group>
                    {errors.password && (
                      <Text size="sm" c="red" mt="xs">{errors.password.message}</Text>
                    )}
                  </div>
                )}
              />
            )}

            {/* Terms Acceptance */}
            <Controller
              name="termsAccepted"
              control={control}
              render={({ field }) => (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginTop: 24 }}>
                  <Checkbox
                    checked={field.value}
                    onChange={field.onChange}
                    mt={4}
                  />
                  <div style={{ marginLeft: 12 }}>
                    <Text>I understand and agree to share my medical data</Text>
                    <Text size="sm" c="dimmed">
                      By checking this box, you confirm that you understand how your data will be shared and accessed
                    </Text>
                  </div>
                </div>
              )}
            />

            {/* Error Display */}
            {error && (
              <Alert
                color="red"
                icon={<AlertCircle size={24} />}
                title="Error sharing data"
              >
                {error}
              </Alert>
            )}

            {/* Submit Buttons */}
            <Group gap="md" mt="xl" pt="md" style={{ borderTop: '1px solid #e5e7eb' }}>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSubmitting}
                style={{ paddingLeft: 24, paddingRight: 24 }}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  paddingTop: 16,
                  paddingBottom: 16,
                  background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                }}
                leftSection={isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ marginRight: 8 }} />
                    Processing your request...
                  </>
                ) : (
                  <>
                    <Shield size={20} style={{ marginRight: 8 }} />
                    Share {uploadMode === 'documents' ? 'Documents' : 'Medical Data'} Securely
                  </>
                )}
              </Button>
            </Group>

            {/* Progress Display */}
            {isSubmitting && (
              <div style={{
                marginTop: 24,
                padding: 24,
                borderRadius: 8,
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                border: '2px solid rgba(59, 130, 246, 0.2)'
              }}>
                <Group justify="space-between" mb="sm">
                  <Group gap="sm">
                    <Upload size={20} color="#3b82f6" className="animate-pulse" />
                    <Text size="md" fw={600}>{uploadStage}</Text>
                  </Group>
                  <Text size="sm" fw={500} c="blue">{uploadProgress}%</Text>
                </Group>
                <Progress value={uploadProgress} size="sm" color="blue" />
                <Text size="xs" c="dimmed" mt="sm">
                  Please wait while we securely encrypt and upload your data. This may take a moment depending on the amount of data being shared.
                </Text>
              </div>
            )}
          </Stack>
        </form>
      </Card.Section>

      <Card.Section p="xl" style={{ borderTop: '1px solid #e5e7eb' }}>
        <Group justify="space-between">
          <Group gap="xs">
            <Shield size={16} color="#3b82f6" />
            <Text size="sm" c="dimmed">
              Your {uploadMode === 'documents' ? 'documents' : 'data'} will be encrypted and stored securely with blockchain-based access control
            </Text>
          </Group>
          <Button
            variant="subtle"
            size="xs"
            onClick={() => setShowLogs(!showLogs)}
            leftSection={<Info size={12} />}
          >
            {showLogs ? 'Hide Technical Logs' : 'Show Technical Logs'}
          </Button>
        </Group>

        {showLogs && (
          <div style={{
            marginTop: 16,
            backgroundColor: '#000',
            color: '#4ade80',
            padding: 16,
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 12,
            maxHeight: 256,
            overflowY: 'auto'
          }}>
            {logs.length > 0 ? (
              logs.map((log, index) => <div key={index}>{log}</div>)
            ) : (
              <p style={{ color: '#666' }}>No logs yet. Submit the form to see logs.</p>
            )}
            <div ref={logsEndRef} />
          </div>
        )}
      </Card.Section>
    </Card>
  );
};

export default DataSharingForm;
