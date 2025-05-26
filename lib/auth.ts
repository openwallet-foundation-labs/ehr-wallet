import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db-utils';
import { initDatabase } from '@/lib/db';
import { ethers } from 'ethers';
import { prisma } from '@/lib/prisma';

// Extend the default session type to include our custom properties
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      role: string;
      ethereumAddress?: string | null;
    };
  }
  
  interface User {
    id: string;
    role: string;
    ethereumAddress?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login?error=true', // Add custom error page
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, ...message) {
      console.error('[AUTH ERROR]', code, message);
    },
    warn(code, ...message) {
      console.warn('[AUTH WARNING]', code, message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[AUTH DEBUG]', code, message);
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV !== 'development',
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: 'ethereum',
      name: 'Ethereum',
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        address: { label: "Ethereum Address", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature || !credentials?.address) {
          console.error('Missing Ethereum credentials');
          return null;
        }

        try {
          // Verify the signature matches the Ethereum address
          const recoveredAddress = ethers.verifyMessage(credentials.message, credentials.signature);
          
          if (recoveredAddress.toLowerCase() !== credentials.address.toLowerCase()) {
            console.error('Invalid signature');
            return null;
          }
          
          // Find or create a user with this Ethereum address
          let user = await prisma.user.findUnique({
            where: { ethereumAddress: credentials.address.toLowerCase() }
          });
          
          if (!user) {
            // Create a new user with the Ethereum address
            user = await prisma.user.create({
              data: {
                email: `${credentials.address.toLowerCase()}@ethereum.user`,
                name: `Wallet ${credentials.address.substring(0, 6)}`,
                password: '', // No password for Ethereum users
                role: 'PATIENT',
                ethereumAddress: credentials.address.toLowerCase()
              }
            });
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name || null,
            role: user.role,
          };
        } catch (error) {
          console.error('Ethereum auth error:', error);
          return null;
        }
      },
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Missing credentials');
          return null;
        }

        try {
          // Ensure the database is initialized
          await initDatabase();
          
          // Find the user by email
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            console.error('User not found');
            return null;
          }
          
          if (!user.password) {
            console.error('User found but no password');
            return null;
          }
          
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          if (!isPasswordValid) {
            console.error('Invalid password');
            return null;
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name || null,
            role: user.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.ethereumAddress = user.ethereumAddress;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.role = token.role as string;
        session.user.ethereumAddress = token.ethereumAddress as string | null;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  useSecureCookies: process.env.NODE_ENV !== 'development',
};
