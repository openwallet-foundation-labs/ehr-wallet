'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import ConnectWalletButton from './ConnectWalletButton';

// Import your existing login form component or create one
import LoginForm from '@/components/auth/LoginForm'; // Adjust path as needed

const LoginWithWallet = () => {
  const [activeTab, setActiveTab] = useState('credentials');

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in to your account using your credentials or connect with your Ethereum wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="credentials" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credentials">Email & Password</TabsTrigger>
            <TabsTrigger value="wallet">Ethereum Wallet</TabsTrigger>
          </TabsList>
          <TabsContent value="credentials" className="mt-4">
            <LoginForm />
          </TabsContent>
          <TabsContent value="wallet" className="mt-4">
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-sm text-muted-foreground mb-6 text-center">
                Connect your MetaMask wallet to sign in securely without a password
              </p>
              <ConnectWalletButton />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Separator className="my-4" />
        <p className="text-xs text-muted-foreground text-center">
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardFooter>
    </Card>
  );
};

export default LoginWithWallet;
