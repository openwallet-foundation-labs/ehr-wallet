import { db, UserType } from './db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Initial setup - can be run during app installation or first load
export async function setupOfflineAuth(initialUsers: Array<{email: string, password: string, name?: string, role: 'ADMIN' | 'DOCTOR' | 'STAFF'}>) {
  try {
    for (const user of initialUsers) {
      // Check if user already exists
      const existingUser = await db.users.where('email').equals(user.email).first();
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        await db.users.add({
          id: uuidv4(),
          email: user.email,
          password: hashedPassword,
          name: user.name,
          role: user.role,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created offline user: ${user.email}`);
      }
    }
    return true;
  } catch (error) {
    console.error('Error setting up offline authentication:', error);
    return false;
  }
}

// Function to authenticate a user offline
export async function authenticateOffline(email: string, password: string): Promise<Omit<UserType, 'password'> | null> {
  try {
    const user = await db.users.where('email').equals(email).first();
    
    if (!user || !user.password) {
      console.log('User not found or password not set');
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('Invalid password');
      return null;
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error) {
    console.error('Offline authentication error:', error);
    return null;
  }
}

// Function to get the current user from local storage or MetaMask session
export function getCurrentUser(): Omit<UserType, 'password'> | null {
  if (typeof window === 'undefined') return null;
  
  // First check for regular user in localStorage
  const userStr = localStorage.getItem('currentUser');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing currentUser:', error);
    }
  }
  
  // If no regular user, check for MetaMask patient session
  const patientSessionStr = localStorage.getItem('patientSession');
  if (patientSessionStr) {
    try {
      const patientSession = JSON.parse(patientSessionStr);
      if (patientSession?.user) {
        // Convert the MetaMask patient session to a user object
        return {
          id: `eth-${patientSession.user.ethereumAddress}`,
          email: null,
          name: patientSession.user.name || 'Patient',
          role: 'PATIENT',
          ethereumAddress: patientSession.user.ethereumAddress,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    } catch (error) {
      console.error('Error parsing patientSession:', error);
    }
  }
  
  // No user found
  return null;
}

// Function to log out the current user
export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  
  // Remove regular user authentication
  localStorage.removeItem('currentUser');
  
  // Also remove MetaMask-related session data
  localStorage.removeItem('patientWalletAddress');
  localStorage.removeItem('patientSession');
}

// Function to check if user is authenticated
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

// Function to check if user has a specific role
export function hasRole(role: 'ADMIN' | 'DOCTOR' | 'STAFF' | 'PATIENT'): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  return user.role === role;
}
