import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Function to sync a new user to the offline database
export async function syncUserToOfflineDB(userData: {
  id: string;
  name?: string | null;
  email: string;
  password?: string;
  role: string;
}) {
  try {
    // Check if user already exists in offline DB
    const existingUser = await db.users.where('email').equals(userData.email).first();
    
    if (existingUser) {
      // Update existing user
      await db.users.update(existingUser.id, {
        name: userData.name,
        role: userData.role,
        // Don't update password if not provided
        ...(userData.password && { password: userData.password }),
        updatedAt: new Date()
      });
      
      return { success: true, message: 'User updated in offline database' };
    } else {
      // Create new user
      // Only add user if we have a password
      if (!userData.password) {
        return { success: false, message: 'Password required for new users' };
      }
      
      await db.users.add({
        id: userData.id || uuidv4(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return { success: true, message: 'User added to offline database' };
    }
  } catch (error) {
    console.error('Error syncing user to offline DB:', error);
    return { success: false, message: 'Failed to sync user to offline database' };
  }
}

// Function to register a new user in the offline database
export async function registerOfflineUser(userData: {
  name?: string | null;
  email: string;
  password: string;
  role: string;
}) {
  try {
    // Check if user already exists
    const existingUser = await db.users.where('email').equals(userData.email).first();
    
    if (existingUser) {
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Generate a new ID
    const id = uuidv4();
    
    // Add user to offline database
    await db.users.add({
      id,
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Return success with user data (excluding password)
    const { password, ...userWithoutPassword } = {
      id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return { 
      success: true, 
      message: 'User registered successfully in offline mode',
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error registering offline user:', error);
    return { success: false, message: 'Failed to register user in offline mode' };
  }
}
