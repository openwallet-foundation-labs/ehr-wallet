import { db, UserType } from './db';
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
      // Ensure role is typed correctly as a valid UserType role
      const role = userData.role as 'ADMIN' | 'DOCTOR' | 'STAFF';
      
      // Create a properly typed update object
      const updateData: Partial<UserType> = {
        name: userData.name,
        role: role
      };
      
      // Add password only if provided
      if (userData.password) {
        updateData.password = userData.password;
      }
      
      // Add updatedAt
      updateData.updatedAt = new Date();
      
      // Perform the update with properly typed data
      await db.users.update(existingUser.id, updateData);
      
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
        role: userData.role as 'ADMIN' | 'DOCTOR' | 'STAFF',
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
      role: userData.role as 'ADMIN' | 'DOCTOR' | 'STAFF',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Return success with user data (excluding password)
    const userDataWithPassword = {
      id,
      name: userData.name,
      email: userData.email,
      role: userData.role as 'ADMIN' | 'DOCTOR' | 'STAFF',
      password: hashedPassword, // Include password so we can exclude it
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Destructure to remove password
    const { password, ...userWithoutPassword } = userDataWithPassword;
    
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
