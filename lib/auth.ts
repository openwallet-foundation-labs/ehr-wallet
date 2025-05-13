import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail } from '@/lib/db-utils';
import { initDatabase } from '@/lib/db';

// Extend the default session type to include our custom properties
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      role: string;
    };
  }
  
  interface User {
    id: string;
    role: string;
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
  useSecureCookies: process.env.NODE_ENV !== 'development',
};
