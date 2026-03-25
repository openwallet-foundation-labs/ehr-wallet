/**
 * Tests for Auth Registration API
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/auth/register';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Mock db-utils
jest.mock('@/lib/db-utils', () => ({
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
}));

// Mock db
jest.mock('@/lib/db', () => ({
  initDatabase: jest.fn().mockResolvedValue(undefined),
}));

import { getUserByEmail, createUser } from '@/lib/db-utils';

describe('Auth Registration API', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: 'POST',
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it('should return 405 for non-POST requests', async () => {
    req.method = 'GET';

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ message: 'Method not allowed' });
  });

  it('should return 400 if email is missing', async () => {
    req.body = { password: 'password123' };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
  });

  it('should return 400 if password is missing', async () => {
    req.body = { email: 'test@example.com' };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Email and password are required' });
  });

  it('should return 409 if user already exists', async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com' });

    req.body = { email: 'test@example.com', password: 'password123' };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'User with this email already exists' });
  });

  it('should create user successfully', async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (createUser as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STAFF',
    });

    req.body = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'DOCTOR',
    };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(createUser).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'DOCTOR',
    });
  });

  it('should use default STAFF role when not provided', async () => {
    (getUserByEmail as jest.Mock).mockResolvedValue(null);
    (createUser as jest.Mock).mockResolvedValue({
      id: 'new-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'STAFF',
    });

    req.body = { email: 'test@example.com', password: 'password123' };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(createUser).toHaveBeenCalledWith({
      name: null,
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'STAFF',
    });
  });
});
