import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/lib/db-utils';
import { initDatabase } from '@/lib/db';

type RegistrationRequest = {
  name?: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'DOCTOR' | 'STAFF';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Ensure the database is initialized
    await initDatabase();
    
    const { name, email, password, role } = req.body as RegistrationRequest;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with Dexie.js
    const user = await createUser({
      name: name || null,
      email,
      password: hashedPassword,
      role: role || 'STAFF',
    });

    // User without password is already returned by createUser
    return res.status(201).json(user);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
