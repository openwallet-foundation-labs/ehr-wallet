'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { encryptData } from '@/lib/web3/ipfs';
import { createAccessGrant, generateShareableLink } from '@/lib/web3/contract';
import { uploadToIpfs } from '@/lib/web3/ipfs';

// Define the form schema
const formSchema = z.object({
  dataTypes: z.array(z.string()).min(1, { message: 'Select at least one data type' }),
  duration: z.string().min(1, { message: 'Duration is required' }),
  password: z.string().optional(),
  usePassword: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

// Available data types
const dataTypeOptions = [
  { id: 'medical-history', label: 'Medical History' },
  { id: 'lab-results', label: 'Lab Results' },
  { id: 'imaging', label: 'Imaging & Scans' },
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'visit-notes', label: 'Visit Notes' },
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataTypes: [],
      duration: '86400', // Default to 1 day
      usePassword: false,
      password: '',
    },
  });

  const usePassword = form.watch('usePassword');

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access if not already connected
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // Prepare data to be shared
      const dataToShare = {
        patientId,
        dataTypes: values.dataTypes,
        createdAt: new Date().toISOString(),
        createdBy: address,
      };

      // Encrypt data if password is used
      let ipfsData;
      if (values.usePassword && values.password) {
        ipfsData = await encryptData(dataToShare, values.password);
      } else {
        ipfsData = JSON.stringify(dataToShare);
      }

      // Upload to IPFS
      const ipfsCid = await uploadToIpfs(ipfsData);

      // Create access grant on blockchain
      const durationInSeconds = parseInt(values.duration);
      const accessId = await createAccessGrant(
        ipfsCid,
        durationInSeconds,
        values.usePassword ? values.password : undefined
      );

      // Generate shareable link
      const shareableLink = generateShareableLink(accessId);

      // Call success callback
      onSuccess(shareableLink, accessId);
    } catch (err: any) {
      console.error('Error sharing data:', err);
      setError(err.message || 'Failed to share data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Share Medical Data</CardTitle>
        <CardDescription>
          Select which data you want to share and for how long
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="dataTypes"
              render={() => (
                <FormItem>
                  <FormLabel>Data to Share</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {dataTypeOptions.map((option) => (
                      <FormField
                        key={option.id}
                        control={form.control}
                        name="dataTypes"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== option.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Access Duration</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The recipient will have access for this duration
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="usePassword"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Require password for access
                    </FormLabel>
                    <FormDescription>
                      Add an extra layer of security with a password
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {usePassword && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter a secure password"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share this password with the recipient separately
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {error && (
              <div className="text-sm font-medium text-destructive">{error}</div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Share Data'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Your data will be encrypted and stored on IPFS with access managed by a smart contract
        </p>
      </CardFooter>
    </Card>
  );
};

export default DataSharingForm;
