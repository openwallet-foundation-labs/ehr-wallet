import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import Link from 'next/link';

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
import { toast } from 'sonner';

// Define the form schema
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      // Get the callback URL from the query parameters or default to '/'
      const callbackUrl = Array.isArray(router.query.callbackUrl)
        ? router.query.callbackUrl[0]
        : router.query.callbackUrl || '/';
      
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: true,
        callbackUrl,
      });
      
      // The following won't execute if redirect is true
      // but we'll keep it as a fallback
      if (result?.error) {
        toast.error('Invalid email or password');
      }
    } catch (error) {
      toast.error('An error occurred during login');
      console.error('Login error:', error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image 
              src="/default-monochrome.svg" 
              alt="GlobalRad Logo" 
              width={32} 
              height={32} 
              className="h-6 w-auto" 
            />
          </div>
          {/* <CardTitle className="text-2xl font-semibold">Login</CardTitle> */}
        </CardHeader>
        <CardContent>
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
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account? Contact your administrator.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
