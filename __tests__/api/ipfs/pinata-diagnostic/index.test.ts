 
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../../pages/api/ipfs/pinata-diagnostic/index';

// Mock fetch
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Mock AbortController
global.AbortController = jest.fn().mockImplementation(() => ({
  signal: {},
  abort: jest.fn(),
}));

// Create a MockResponse class to simulate fetch responses in Node.js environment
class MockResponse {
  body: any;
  status: number;
  statusText: string;
  ok: boolean;
  headers: any;
  
  constructor(body: any, options: { status?: number, statusText?: string, headers?: Record<string, string> } = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = {
      get: (name: string) => {
        const headerName = name.toLowerCase();
        const headers = options.headers || {};
        return headers[headerName] || null;
      }
    };
  }
  
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  
  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
  
  clone() {
    return this;
  }
}

// Mock environment variables
const originalEnv = process.env;

describe('IPFS Pinata Diagnostic API Handler', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset and create fresh mocks for each test
    req = {
      method: 'GET',
      query: {},
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Reset the fetch mock
    mockFetch.mockReset();
    
    // Setup environment variables for tests
    // Use GitHub Actions secrets if available, otherwise use test values
    process.env = { 
      ...originalEnv,
      NEXT_PUBLIC_PINATA_JWT: process.env.NEXT_PUBLIC_PINATA_JWT || 'test-jwt-token',
      NEXT_PUBLIC_PINATA_API_KEY: process.env.NEXT_PUBLIC_PINATA_API_KEY || 'test-api-key',
      NEXT_PUBLIC_PINATA_SECRET_API_KEY: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || 'test-secret-key'
    };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it('should return 405 for non-GET requests', async () => {
    req.method = 'POST';
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
  });

  it('should return 400 if no CID is provided', async () => {
    req.query = {};
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing IPFS CID parameter' });
  });

  // Add a simple test for successful response with mocked data
  it('should return a successful response when given a valid CID', async () => {
    // Mock all fetch responses with our MockResponse class
    mockFetch.mockImplementation(() => new MockResponse({}, { status: 200 }));
    
    req.query = { cid: 'QmTest123' };
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Just verify that the handler returns a 200 status
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
  
  it('should handle network errors gracefully', async () => {
    // Mock fetch to throw a network error
    mockFetch.mockRejectedValue(new Error('Network error'));
    
    req.query = { cid: 'QmTest123' };
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Should still return a 200 status with error information
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: expect.any(String),
        cid: 'QmTest123'
      })
    );
  });
  
  it('should handle invalid CID format', async () => {
    req.query = { cid: 'invalid-cid-format' };
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Should still return a response (even for invalid CIDs)
    expect(res.status).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });
  
  it('should work when environment variables are missing', async () => {
    // Remove environment variables
    const originalEnv = process.env;
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_PINATA_JWT;
    delete process.env.NEXT_PUBLIC_PINATA_API_KEY;
    delete process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY;
    
    mockFetch.mockImplementation(() => new MockResponse({}, { status: 200 }));
    
    req.query = { cid: 'QmTest123' };
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Should handle missing credentials gracefully
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
    
    // Restore env
    process.env = originalEnv;
  });
});
