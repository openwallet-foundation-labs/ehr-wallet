'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { authenticateOffline } from '@/lib/offline-auth';
import { initDatabase } from '@/lib/db';
import { seedOfflineDatabase } from '@/lib/seed-offline-db';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import dynamic from 'next/dynamic';

// Dynamically import components that use browser APIs
const ConnectWalletButton = dynamic(
  () => import('@/components/web3/ConnectWalletButton'),
  { ssr: false }
);

const MetaMaskProvider = dynamic(
  () => import('@/components/web3/MetaMaskProvider'),
  { ssr: false }
);

// Define the form schema
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [dbInitializing, setDbInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('credentials');
  
  // Get error from URL if present
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  // Initialize the database and seed if needed
  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        await seedOfflineDatabase();
        setDbInitializing(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setInitError('Failed to initialize the offline database. Please reload the page.');
        setDbInitializing(false);
      }
    }
    
    initialize();
  }, []);

  // Initialize the form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    
    try {
      // Try NextAuth first
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
        callbackUrl,
      });
      
      if (result?.ok) {
        // Successful login with NextAuth
        router.push(callbackUrl);
        return;
      }
      
      // Fall back to offline authentication
      const user = await authenticateOffline(data.email, data.password);
      
      if (user) {
        // Store auth state for persistent sessions
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Add a small delay before redirecting to ensure state is properly set
        setTimeout(() => {
          // Force a hard navigation instead of client-side routing
          window.location.href = callbackUrl as string;
        }, 100);
        
        return; // Early return to prevent setting isLoading to false
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred during login');
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading state while database is initializing
  if (dbInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-4"></div>
          <p>Initializing database...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/default-monochrome.svg" 
              alt="Radiant Flow Logo" 
              width={32} 
              height={32} 
              className="h-6 w-auto" 
            />
          </div>
          <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
          <CardDescription>
            Choose your preferred sign in method
          </CardDescription>
          {initError && <p className="text-red-500 text-sm">{initError}</p>}
          {error && <p className="text-red-500 text-sm">Authentication failed. Please try again.</p>}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="credentials">Email & Password</TabsTrigger>
              <TabsTrigger value="wallet">Ethereum Wallet</TabsTrigger>
            </TabsList>
            
            <TabsContent value="credentials" className="mt-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="wallet" className="mt-0">
              <div className="flex flex-col items-center justify-center py-6">
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  Connect your MetaMask wallet to sign in securely without a password
                </p>
                {typeof window !== 'undefined' && (
                  <MetaMaskProvider>
                    <ConnectWalletButton />
                  </MetaMaskProvider>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Separator className="my-2" />
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account? Contact your administrator.
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground bg-muted p-2 rounded">
            <p>For demo: use the following credentials</p>
            <div className="mt-1">
              <p><strong>Admin:</strong> admin@example.com / password</p>
              <p><strong>Doctor:</strong> doctor@example.com / password</p>
              <p><strong>Staff:</strong> staff@example.com / password</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
