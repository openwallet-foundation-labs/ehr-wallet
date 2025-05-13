import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authenticateOffline } from '@/lib/offline-auth';
import { initDatabase } from '@/lib/db';
import { seedOfflineDatabase } from '@/lib/seed-offline-db';

export function OfflineLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  // Initialize the database and seed if needed
  useEffect(() => {
    async function initialize() {
      try {
        await initDatabase();
        await seedOfflineDatabase();
        setIsInitializing(false);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError('Failed to initialize the application. Please reload the page.');
        setIsInitializing(false);
      }
    }
    
    initialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Try offline authentication with Dexie
      const user = await authenticateOffline(email, password);
      
      if (user) {
        // Store auth state for persistent sessions
        localStorage.setItem('currentUser', JSON.stringify(user));
        router.push('/');
      } else {
        setError('Invalid email or password');
      }
    } catch (error) {
      setError('Authentication failed. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-2">Initializing offline database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Offline Login</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="email@example.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="••••••••"
            required
          />
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors disabled:bg-blue-400"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>For demo: use the following credentials</p>
        <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
          <p><strong>Admin:</strong> admin@example.com / password</p>
          <p><strong>Doctor:</strong> doctor@example.com / password</p>
          <p><strong>Staff:</strong> staff@example.com / password</p>
        </div>
      </div>
    </div>
  );
}
