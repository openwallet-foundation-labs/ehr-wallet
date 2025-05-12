import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
// Models are accessed via prisma.modelName (camelCase)

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
  adapter: PrismaAdapter(prisma),
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
          // First try using prisma client for better error reporting
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
            },
          });

          // Fallback to raw query if needed
          if (!user) {
            console.log('User not found with client, trying raw query');
            const users = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${credentials.email} LIMIT 1`;
            const userRecord = users[0] as { id: string; email: string; name: string | null; password: string; role: string };
            
            if (!userRecord || !userRecord.password) {
              console.error('User not found with raw query');
              return null;
            }
            
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              userRecord.password
            );
            
            if (!isPasswordValid) {
              console.error('Invalid password with raw query');
              return null;
            }
            
            return {
              id: userRecord.id,
              email: userRecord.email,
              name: userRecord.name || null,
              role: userRecord.role,
            };
          }
          
          // Normal flow with user found via client
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
