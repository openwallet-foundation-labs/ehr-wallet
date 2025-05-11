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
          return null;
        }

        // With Prisma v6, we need to use the model name directly
        const users = await prisma.$queryRaw`SELECT * FROM User WHERE email = ${credentials.email} LIMIT 1`;
        
        // Convert the raw result to the expected format
        const userRecord = users[0] as { id: string; email: string; name: string | null; password: string; role: string };

        if (!userRecord || !userRecord.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          userRecord.password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name || null,
          role: userRecord.role,
        };
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
};
