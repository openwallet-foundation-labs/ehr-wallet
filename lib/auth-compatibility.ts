/**
 * Auth Compatibility Layer
 * 
 * This file provides a bridge between the legacy offline authentication system
 * and the new NextAuth implementation during the Vite to Next.js migration.
 * Also handles MetaMask wallet authentication for web3 features.
 */

import { authenticateOffline, getCurrentUser, logoutUser } from './offline-auth';
import { Session } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';
import { ethers } from 'ethers';

/**
 * Attempts sign-in using NextAuth with fallback to offline auth
 */
export async function hybridSignIn(
  email: string, 
  password: string, 
  options?: { redirect?: boolean; callbackUrl?: string; role?: string }
) {
  // First try NextAuth
  const nextAuthResult = await signIn('credentials', {
    redirect: false,
    email,
    password,
  });

  // If NextAuth fails but we have an offline DB, try that
  if (nextAuthResult?.error) {
    
    const offlineUser = await authenticateOffline(email, password, options?.role);
    
    if (offlineUser) {
      // Store in localStorage for compatibility
      localStorage.setItem('currentUser', JSON.stringify(offlineUser));
      
      // If redirect requested and we have a callback URL
      if (options?.redirect && options.callbackUrl) {
        window.location.href = options.callbackUrl;
        return { success: true, offline: true };
      }
      
      return { success: true, offline: true, user: offlineUser };
    }
    
    return { success: false, error: 'Authentication failed' };
  }
  
  // NextAuth succeeded
  if (nextAuthResult?.url && options?.redirect) {
    window.location.href = nextAuthResult.url;
  }
  
  return { success: !nextAuthResult?.error, nextAuth: true };
}

/**
 * Handles MetaMask wallet authentication with compatibility for both systems
 */
export async function hybridWalletLogin(
  account: string, 
  options?: { redirect?: boolean; callbackUrl?: string; }
) {
  try {
    // Store wallet address and create a patient session in localStorage for compatibility
    const displayName = `Patient (${account.substring(0, 6)}...${account.substring(account.length - 4)})`;
    
    // Create the patient session object for localStorage
    const patientSession = {
      user: {
        name: displayName,
        ethereumAddress: account,
        role: 'PATIENT'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
    
    // Store session data in localStorage for legacy code compatibility
    localStorage.setItem('patientWalletAddress', account);
    localStorage.setItem('patientSession', JSON.stringify(patientSession));
    localStorage.setItem('currentUser', JSON.stringify({
      id: `eth-${account}`,
      name: displayName,
      email: null,
      role: 'PATIENT',
      ethereumAddress: account,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Try to also authenticate with NextAuth
    try {
      // Create signature for authentication
      const message = `Login to RadiantFlow with address: ${account}`;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      // Call NextAuth ethereum provider
      const result = await signIn('ethereum', {
        redirect: false,
        message,
        signature,
        address: account,
        callbackUrl: options?.callbackUrl || '/patient/dashboard'
      });
      
      // Handle NextAuth response
      if (!result?.error) {
        // If NextAuth succeeds and redirect is requested
        if (options?.redirect) {
          window.location.href = options.callbackUrl || '/patient/dashboard';
        }
        return { success: true, nextAuth: true, offline: true };
      }
    } catch (e) {
    }
    
    // Fallback to localStorage authentication
    if (options?.redirect) {
      window.location.href = options.callbackUrl || '/patient/dashboard';
    }
    
    return { success: true, offline: true };
    
  } catch (error) {
    console.error('MetaMask login error:', error);
    return { success: false, error: 'MetaMask authentication failed' };
  }
}

/**
 * Signs out of both auth systems
 */
export async function hybridSignOut(callbackUrl?: string) {
  // Clear offline auth
  logoutUser();
  
  // Clear NextAuth session
  await signOut({ redirect: !!callbackUrl, callbackUrl });
  
  return true;
}

/**
 * Ensures session data is synced between systems
 */
export function syncOfflineToNextAuth(session: Session | null) {
  if (!session) {
    // If no NextAuth session but we have localStorage user, we're in offline mode
    const offlineUser = getCurrentUser();
    return offlineUser ? {
      user: {
        id: offlineUser.id,
        name: offlineUser.name,
        email: offlineUser.email || '',
        role: offlineUser.role, 
        ethereumAddress: offlineUser.ethereumAddress
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } : null;
  }
  
  return session;
}
