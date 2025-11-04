import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Health check endpoint for Docker/Dokploy monitoring
 * Returns 200 OK if the application is running
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ status: string; timestamp: string }>
) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
