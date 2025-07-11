/**
 * Admin Controllers for User and Tenant Management
 */

import { Request, Response } from 'express';
import { storage } from '../storage.js';
import bcrypt from 'bcrypt';

// Get all users (admin only)
export async function getUsers(req: Request, res: Response) {
  try {
    console.log('🔍 Fetching all users...');
    const users = await storage.getUsers();
    console.log(`✅ Found ${users.length} user(s)`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get all tenants (admin only)
export async function getTenants(req: Request, res: Response) {
  try {
    console.log('🔍 Fetching all tenants...');
    const tenants = await storage.getTenants();
    console.log(`✅ Found ${tenants.length} tenant(s)`);
    res.json(tenants);
  } catch (error) {
    console.error('❌ Error fetching tenants:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tenants',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get user-tenant assignments (admin only)
export async function getUserTenants(req: Request, res: Response) {
  try {
    console.log('🔍 Fetching user-tenant assignments...');
    const assignments = await storage.getUserTenantAssignments();
    console.log(`✅ Found ${assignments.length} assignment(s)`);
    res.json(assignments);
  } catch (error) {
    console.error('❌ Error fetching user-tenant assignments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Create new user (admin only)
export async function createUser(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await storage.createUser({
      name,
      email,
      password: hashedPassword,
      isActive: true
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      user: userResponse,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Assign user to tenant (admin only)
export async function assignUserToTenant(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { userId } = req.params;
    const { tenantId, role } = req.body;

    if (!userId || !tenantId || !role) {
      return res.status(400).json({
        success: false,
        message: 'userId, tenantId, and role are required'
      });
    }

    const validRoles = ['admin', 'accountant', 'assistant', 'viewer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: admin, accountant, assistant, viewer'
      });
    }

    const assignment = await storage.assignUserToTenant({
      userId: parseInt(userId),
      tenantId: parseInt(tenantId),
      role,
      isActive: true
    });

    res.json({
      success: true,
      assignment,
      message: 'User assigned to tenant successfully'
    });
  } catch (error) {
    console.error('❌ Error assigning user to tenant:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to assign user to tenant',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Update user-tenant assignment (admin only)
export async function updateUserTenantAssignment(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { assignmentId } = req.params;
    const { role, isActive } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Assignment ID is required'
      });
    }

    const validRoles = ['admin', 'accountant', 'assistant', 'viewer'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: admin, accountant, assistant, viewer'
      });
    }

    const assignment = await storage.updateUserTenantAssignment(parseInt(assignmentId), {
      role,
      isActive
    });

    res.json({
      success: true,
      assignment,
      message: 'Assignment updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating assignment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update assignment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Deactivate user (admin only)
export async function deactivateUser(req: Request, res: Response) {
  try {
    const sessionData = req.session as any;
    
    if (!sessionData?.userId || sessionData?.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Don't allow admin to deactivate themselves
    if (parseInt(userId) === sessionData.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await storage.updateUser(parseInt(userId), { isActive: false });

    res.json({
      success: true,
      user,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('❌ Error deactivating user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to deactivate user',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}