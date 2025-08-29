import { createClient } from '@supabase/supabase-js';
import { IStorage } from './storage';
import { loadEnvStrict, getSupabaseUrl, getSupabaseAnonKey } from '../lib/env-loader.js';
import type {
  Tenant, InsertTenant,
  User, InsertUser,
  BankAccount, InsertBankAccount,
  Invoice, InsertInvoice,
  Expense, InsertExpense,
  Payment, InsertPayment,
  BankTransaction, InsertBankTransaction,
  Document, InsertDocument,
  VatRate, InsertVatRate,
  SaftExport, InsertSaftExport,
  CloudDriveConfig, InsertCloudDriveConfig,
  RawDocument, InsertRawDocument,
  AiChatMessage, InsertAiChatMessage,
  Client, InsertClient,
  ManagerApproval, InsertManagerApproval,
  ExtractedInvoiceData, InsertExtractedInvoiceData,
  MonthlyStatementEntry, InsertMonthlyStatementEntry
} from '../shared/schema';



export class SupabaseStorage implements IStorage {
  private supabase;

  constructor() {
    console.log('🔧 Initializing SupabaseStorage...');
    
    // Force loading from .env file only
    loadEnvStrict();

    const supabaseUrl = getSupabaseUrl();
    const supabaseAnonKey = getSupabaseAnonKey();
    
    console.log('🔍 Environment check:');
    console.log('- SUPABASE_URL:', supabaseUrl ? `Set (${supabaseUrl.length} chars)` : 'Missing');
    console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? `Set (${supabaseAnonKey.length} chars)` : 'Missing');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase client initialized successfully');
  }

  // Tenants
  async getTenants(): Promise<Tenant[]> {
    try {
      console.log('🔍 Fetching tenants via admin service...');
      
      const { data: adminData, error } = await this.supabase.rpc('get_admin_data');

      if (error) {
        console.error('Admin data service failed:', error);
        
        // Fallback to direct table query if RPC function doesn't exist
        console.log('🔄 Falling back to direct tenants table query...');
        const { data: directData, error: directError } = await this.supabase
          .from('tenants')
          .select('*')
          .eq('is_active', true);
        
        if (directError) {
          console.error('Direct tenants query also failed:', directError);
          return [];
        }
        
        console.log(`📊 Found ${directData?.length || 0} tenant(s) via direct query`);
        return directData || [];
      }

      const tenants = adminData?.tenants_data || [];
      console.log(`📊 Found ${tenants.length} tenant(s) via service`);
      return tenants;
    } catch (error) {
      console.error('Error in getTenants:', error);
      // Return empty array instead of throwing to prevent scheduler crashes
      return [];
    }
  }

  async getTenantById(id: number): Promise<Tenant | undefined> {
    const { data, error } = await this.supabase.from('tenants').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const { data, error } = await this.supabase.from('tenants').insert(tenant).select().single();
    if (error) throw error;
    return data;
  }

  // Users
  async getUserById(id: number): Promise<User | undefined> {
    const { data, error } = await this.supabase.from('users').select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    console.log(`🔍 Attempting to find user with email: ${email}`);
    
    try {
      // Use RPC function to bypass potential RLS issues
      const { data: rpcData, error: rpcError } = await this.supabase
        .rpc('get_user_by_email', { user_email: email });
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        const user = rpcData[0];
        console.log(`✅ Found user via RPC: ${user.email} (ID: ${user.id})`);
        return user;
      }
    } catch (rpcErr) {
      console.log('RPC function not available, using direct query');
    }
    
    // Fallback to direct query
    const { data: directData, error: directError } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email);
    
    console.log(`🔍 Direct query result:`, { count: directData?.length || 0, error: directError });
    
    if (directData && directData.length > 0) {
      const user = directData[0];
      console.log(`✅ Found user via direct query: ${user.email} (ID: ${user.id})`);
      
      // Convert database fields to interface format
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.password_hash,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at
      };
    }
    
    console.log(`❌ No user found with email: ${email}`);
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const { data, error } = await this.supabase.from('users').insert({
        name: user.name,
        email: user.email,
        password_hash: user.passwordHash,
        is_active: user.isActive ?? true
      }).select().single();
      
      if (error) {
        console.error('Error creating user in Supabase:', error);
        throw error;
      }
      
      console.log('✅ User created successfully in Supabase:', data.email);
      return data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUsers(tenantId: number): Promise<User[]> {
    try {
      console.log(`🔍 Getting users for tenant ${tenantId}...`);

      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) {
        throw error;
      }

      const mappedUsers: User[] = users.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
        createdAt: user.created_at ? new Date(user.created_at) : null,
        passwordHash: user.password_hash || '',
        isActive: user.is_active
      }));

      console.log(`📊 Found ${mappedUsers.length} user(s) for tenant ${tenantId}`);
      return mappedUsers;
    } catch (error) {
      console.error(`Error getting users for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async getUsersByTenant(tenantId: number): Promise<User[]> {
    try {
      console.log(`🔍 Querying users for tenant ${tenantId}...`);
      
      // Get user IDs for this tenant first
      const { data: userTenants, error: userTenantsError } = await this.supabase
        .from('user_tenants')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      
      if (userTenantsError) {
        console.error('Supabase tenant users query error:', userTenantsError);
        throw userTenantsError;
      }
      
      if (!userTenants || userTenants.length === 0) {
        console.log(`📊 No users found for tenant ${tenantId}`);
        return [];
      }
      
      // Get user details separately
      const userIds = userTenants.map(ut => ut.user_id);
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id, email, name, role, is_active, created_at, password_hash')
        .in('id', userIds)
        .eq('is_active', true);
      
      if (usersError) {
        console.error('Error fetching user details:', usersError);
        throw usersError;
      }
      
      // Map the data to match User type
      const mappedUsers: User[] = (users || []).map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
        createdAt: user.created_at ? new Date(user.created_at) : null,
        passwordHash: user.password_hash || '',
        isActive: user.is_active
      }));
      
      console.log(`📊 Found ${mappedUsers.length} user(s) for tenant ${tenantId}`);
      return mappedUsers;
    } catch (error) {
      console.error(`Error getting users for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.passwordHash !== undefined) updateData.password_hash = updates.passwordHash;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async getUserTenantAssignments(): Promise<any[]> {
    try {
      console.log('🔍 Fetching admin data via service function...');
      
      const { data: adminData, error } = await this.supabase.rpc('get_admin_data');

      if (error) {
        console.error('Admin data service failed:', error);
        
        // Fallback to direct query with joins
        console.log('🔄 Falling back to direct user_tenants query...');
        const { data: directData, error: directError } = await this.supabase
          .from('user_tenants')
          .select('*');
        
        if (directError) {
          console.error('Direct user_tenants query also failed:', directError);
          return [];
        }
        
        return directData || [];
      }

      console.log(`📊 Retrieved admin data successfully`);
      return adminData?.user_tenants_data || [];
    } catch (error) {
      console.error('Critical error in getUserTenantAssignments:', error);
      return [];
    }
  }

  async assignUserToTenant(assignment: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .insert({
        user_id: assignment.userId,
        tenant_id: assignment.tenantId,
        role: assignment.role,
        is_active: assignment.isActive
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateUserTenantAssignment(id: number, updates: any): Promise<any> {
    const updateData: any = {};
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    
    const { data, error } = await this.supabase
      .from('user_tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // User Tenants
  async getUserTenants(userId: number): Promise<Array<{
    id: number;
    tenantId: number;
    role: string;
    isActive: boolean;
    tenantName: string;
    tenantSlug: string;
  }>> {
    console.log(`🔍 Getting tenants for user ID: ${userId}`);
    
    // First get user_tenants data without joins to avoid recursion
    const { data: userTenants, error: userTenantsError } = await this.supabase
      .from('user_tenants')
      .select('id, tenant_id, role, is_active')
      .eq('user_id', userId.toString())
      .eq('is_active', true);
    
    if (userTenantsError) {
      console.error(`❌ Error getting user tenants for user ${userId}:`, userTenantsError);
      throw userTenantsError;
    }
    
    if (!userTenants || userTenants.length === 0) {
      console.log(`📊 No tenant assignments found for user ${userId}`);
      return [];
    }
    
    // Get tenant names separately
    const tenantIds = userTenants.map(ut => ut.tenant_id);
    const { data: tenants, error: tenantsError } = await this.supabase
      .from('tenants')
      .select('id, name, slug')
      .in('id', tenantIds);
    
    if (tenantsError) {
      console.error(`❌ Error getting tenant details:`, tenantsError);
      // Continue with unknown names if tenant lookup fails
    }
    
    console.log(`📊 Found ${userTenants.length} tenant assignments for user ${userId}`);
    
    return userTenants.map((item: any) => {
      const tenant = tenants?.find(t => t.id === item.tenant_id);
      return {
        id: item.id,
        tenantId: item.tenant_id,
        role: item.role,
        isActive: item.is_active,
        tenantName: tenant?.name || 'Unknown',
        tenantSlug: tenant?.slug || 'unknown'
      };
    });
  }

  async createUserTenant(assignment: { userId: number; tenantId: number; role: string; isActive?: boolean }): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .insert({
        user_id: assignment.userId,
        tenant_id: assignment.tenantId,
        role: assignment.role,
        is_active: assignment.isActive ?? true
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUserTenantRole(userId: number, tenantId: number, role: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .update({ role })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserTenantByIds(userId: number, tenantId: number): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    return data;
  }

  // Bank Accounts
  async getBankAccounts(tenantId: number): Promise<BankAccount[]> {
    const { data, error } = await this.supabase.from('bank_accounts').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
    const { data, error } = await this.supabase.from('bank_accounts').insert(bankAccount).select().single();
    if (error) throw error;
    return data;
  }

  // Invoices
  async getInvoices(tenantId: number): Promise<Invoice[]> {
    const { data, error } = await this.supabase.from('invoices').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async getInvoiceById(id: number, tenantId: number): Promise<Invoice | undefined> {
    const { data, error } = await this.supabase.from('invoices')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return undefined;
    return data;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const { data, error } = await this.supabase.from('invoices').insert(invoice).select().single();
    if (error) throw error;
    return data;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>, tenantId: number): Promise<Invoice | undefined> {
    const { data, error } = await this.supabase.from('invoices')
      .update(invoice)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) return undefined;
    return data;
  }

  // Expenses
  async getExpenses(tenantId: number): Promise<Expense[]> {
    console.log('🔍 Supabase getExpenses called with tenantId:', tenantId);
    const { data, error } = await this.supabase.from('expenses').select('*').eq('tenant_id', tenantId);
    console.log('📋 Supabase expenses query results:', { data: data?.length || 0, error });
    if (error) {
      console.error('❌ Supabase expenses error:', error);
      return [];
    }
    
    // Convert snake_case to camelCase for frontend
    const convertedData = data?.map(expense => ({
      id: expense.id,
      tenantId: expense.tenant_id,
      vendor: expense.vendor,
      amount: expense.amount?.toString() || '0',
      vatAmount: expense.vat_amount?.toString() || null,
      vatRate: expense.vat_rate?.toString() || null,
      category: expense.category,
      description: expense.description,
      receiptNumber: expense.receipt_number,
      expenseDate: expense.expense_date,
      isDeductible: expense.is_deductible,
      sourceDocumentId: expense.source_document_id,
      createdAt: expense.created_at,
      processingMethod: expense.processing_method || null
    })) || [];
    
    console.log('📋 Returning converted expenses data:', convertedData.length, 'items');
    console.log('📋 Sample expense data:', convertedData[0]);
    return convertedData;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    console.log('💰 Creating expense with data:', expense);
    
    // Convert camelCase to snake_case for Supabase
    const supabaseExpense = {
      tenant_id: expense.tenantId,
      vendor: expense.vendor,
      amount: parseFloat(expense.amount), // Ensure numeric type
      vat_amount: expense.vatAmount ? parseFloat(expense.vatAmount) : null,
      vat_rate: expense.vatRate ? parseFloat(expense.vatRate) : null,
      category: expense.category,
      description: expense.description,
      receipt_number: expense.receiptNumber,
      expense_date: expense.expenseDate,
      is_deductible: expense.isDeductible
    };
    
    console.log('💰 Supabase expense data:', supabaseExpense);
    
    try {
      const { data, error } = await this.supabase
        .from('expenses')
        .insert(supabaseExpense)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to create expense in Supabase:', error);
        console.error('❌ Supabase error details:', JSON.stringify(error, null, 2));
        console.error('❌ Data being inserted:', JSON.stringify(supabaseExpense, null, 2));
        
        // Try a verification query to see if data was actually inserted
        const { data: verifyData, error: verifyError } = await this.supabase
          .from('expenses')
          .select('*')
          .eq('tenant_id', expense.tenantId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        console.log('🔍 Verification query result:', { verifyData, verifyError });
        throw error;
      }
      
      console.log('✅ Expense created successfully in Supabase with ID:', data?.id);
      console.log('✅ Full Supabase response:', JSON.stringify(data, null, 2));
      
      // Convert snake_case to camelCase for return value
      const convertedExpense = {
        id: data.id,
        tenantId: data.tenant_id,
        vendor: data.vendor,
        amount: data.amount?.toString() || '0',
        vatAmount: data.vat_amount?.toString() || null,
        vatRate: data.vat_rate?.toString() || null,
        category: data.category,
        description: data.description,
        receiptNumber: data.receipt_number,
        expenseDate: data.expense_date,
        isDeductible: data.is_deductible,
        sourceDocumentId: data.source_document_id,
        createdAt: data.created_at,
        processingMethod: data.processing_method || null
      };
      
      return convertedExpense;
    } catch (createError) {
      console.error('❌ Exception during expense creation:', createError);
      throw createError;
    }
  }

  async deleteAllExpenses(tenantId: number): Promise<any> {
    console.log(`🧹 Starting force cleanup of all expenses for tenant ${tenantId}`);
    
    // Get all existing expenses first
    const { data: existingExpenses, error: fetchError } = await this.supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', tenantId);
    
    if (fetchError) {
      console.error('Failed to fetch existing expenses:', fetchError);
      throw fetchError;
    }
    
    if (!existingExpenses || existingExpenses.length === 0) {
      console.log('✅ No expenses found to delete');
      return [];
    }
    
    console.log(`🔍 Found ${existingExpenses.length} expenses to delete:`, existingExpenses.map(e => `${e.id}: ${e.vendor} - €${e.amount}`));
    
    // Delete each expense individually
    let totalDeleted = 0;
    for (const expense of existingExpenses) {
      const { error: deleteError } = await this.supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);
      
      if (deleteError) {
        console.error(`❌ Failed to delete expense ${expense.id}:`, deleteError);
      } else {
        console.log(`✅ Deleted expense ${expense.id}: ${expense.vendor} - €${expense.amount}`);
        totalDeleted++;
      }
    }
    
    console.log(`✅ Force deleted ${totalDeleted} expense records for tenant ${tenantId}`);
    return existingExpenses;
  }

  // Payments
  async getPayments(tenantId: number): Promise<Payment[]> {
    const { data, error } = await this.supabase.from('payments').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const { data, error } = await this.supabase.from('payments').insert(payment).select().single();
    if (error) throw error;
    return data;
  }

  // Bank Transactions
  async getBankTransactions(tenantId: number): Promise<BankTransaction[]> {
    const { data, error } = await this.supabase.from('bank_transactions').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction> {
    const { data, error } = await this.supabase.from('bank_transactions').insert(transaction).select().single();
    if (error) throw error;
    return data;
  }

  // Documents
  async getDocuments(tenantId: number): Promise<Document[]> {
    const { data, error } = await this.supabase.from('documents').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    // Convert camelCase to snake_case matching actual database schema
    const insertData = {
      tenant_id: document.tenantId,
      filename: document.filename,
      original_filename: document.originalFilename || document.filename,
      file_path: document.filePath,
      file_size: document.fileSize,
      mime_type: document.mimeType,
      processing_status: document.processingStatus || 'pending',
      extracted_data: document.extractedData ? JSON.stringify(document.extractedData) : null,
      processing_method: document.processingMethod,
      ai_model_used: document.aiModelUsed,
      uploaded_by: document.uploadedBy || 1
    };
    
    // Use direct SQL insertion without confidence_score to bypass schema cache issues
    const { data, error } = await this.supabase
      .from('documents')
      .insert(insertData)
      .select('*')
      .single();
    
    if (error) {
      console.error('Document insertion failed:', error);
      throw error;
    }
    
    return data;
  }

  async updateDocument(id: number, document: Partial<InsertDocument>, tenantId: number): Promise<Document | undefined> {
    // Convert camelCase to snake_case for database update - match actual schema
    const updateData: any = {};
    
    if (document.extractedData !== undefined) {
      updateData.extracted_data = document.extractedData;
    }
    if (document.processingStatus !== undefined) {
      updateData.processing_status = document.processingStatus;
    }
    if (document.confidenceScore !== undefined) {
      updateData.confidence_score = document.confidenceScore;
    }
    if (document.processingMethod !== undefined) {
      updateData.processing_method = document.processingMethod;
    }
    if (document.aiModelUsed !== undefined) {
      updateData.ai_model_used = document.aiModelUsed;
    }
    
    const { data, error } = await this.supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*')
      .single();
    
    if (error) {
      console.error('Document update failed:', error);
      return undefined;
    }
    
    return data;
  }

  async deleteDocument(id: number, tenantId: number): Promise<void> {
    console.log(`🗑️ Deleting document ${id} and related records for tenant ${tenantId}`);
    
    // First, get the document to find related expense records
    const { data: document, error: fetchError } = await this.supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (fetchError || !document) {
      console.warn(`⚠️ No document found with id ${id} for tenant ${tenantId}`);
      throw new Error('Document not found');
    }
    
    // Delete related expense records using the document ID pattern in description
    const { data: relatedExpenses, error: expenseDeleteError } = await this.supabase
      .from('expenses')
      .delete()
      .eq('tenant_id', tenantId)
      .ilike('description', `%[DOC:${id}]%`)
      .select();
    
    if (expenseDeleteError) {
      console.error('Error deleting related expenses:', expenseDeleteError);
    } else if (relatedExpenses && relatedExpenses.length > 0) {
      console.log(`✅ Deleted ${relatedExpenses.length} related expense records for document ${id}`);
      console.log('Deleted expenses:', relatedExpenses.map(exp => `ID ${exp.id}: ${exp.vendor} - €${exp.amount}`));
    }
    
    // Delete the document
    const { error, data, count } = await this.supabase.from('documents')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select();
    
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    
    console.log(`✅ Document deleted successfully, deleted records:`, data);
    console.log(`✅ Rows affected: ${count}`);
  }

  // VAT Rates
  async getVatRates(region: string): Promise<VatRate[]> {
    const { data, error } = await this.supabase.from('vat_rates').select('*').eq('region', region);
    if (error) throw error;
    return data || [];
  }

  // SAF-T Exports
  async getSaftExports(tenantId: number): Promise<SaftExport[]> {
    const { data, error } = await this.supabase.from('saft_exports').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async createSaftExport(saftExport: InsertSaftExport): Promise<SaftExport> {
    const { data, error } = await this.supabase.from('saft_exports').insert(saftExport).select().single();
    if (error) throw error;
    return data;
  }

  // Cloud Drive Configs
  async getCloudDriveConfigs(tenantId: number): Promise<CloudDriveConfig[]> {
    const { data, error } = await this.supabase.from('cloud_drive_configs').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    
    // Map snake_case database fields to camelCase TypeScript interface
    return (data || []).map(config => ({
      id: config.id,
      tenantId: config.tenant_id,
      provider: config.provider,
      folderPath: config.folder_path,
      accessToken: config.access_token,
      refreshToken: config.refresh_token,
      isActive: config.is_active,
      lastSyncAt: config.last_sync_at,
      createdAt: config.created_at,
      syncCursor: config.sync_cursor || null
    }));
  }

  async getCloudDriveConfigById(id: number, tenantId: number): Promise<CloudDriveConfig | undefined> {
    const { data, error } = await this.supabase.from('cloud_drive_configs')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return undefined;
    
    // Map snake_case database fields to camelCase TypeScript interface
    if (!data) return undefined;
    return {
      id: data.id,
      tenantId: data.tenant_id,
      provider: data.provider,
      folderPath: data.folder_path,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
      syncCursor: data.sync_cursor || null
    };
  }

  async getCloudDriveConfigsByProvider(provider: string): Promise<CloudDriveConfig[]> {
    const { data, error } = await this.supabase.from('cloud_drive_configs')
      .select('*')
      .eq('provider', provider)
      .eq('is_active', true);
    if (error) throw error;
    
    // Map snake_case database fields to camelCase TypeScript interface
    return (data || []).map(config => ({
      id: config.id,
      tenantId: config.tenant_id,
      provider: config.provider,
      folderPath: config.folder_path,
      accessToken: config.access_token,
      refreshToken: config.refresh_token,
      isActive: config.is_active,
      lastSyncAt: config.last_sync_at,
      createdAt: config.created_at,
      syncCursor: config.sync_cursor || null
    }));
  }

  async createCloudDriveConfig(config: InsertCloudDriveConfig): Promise<CloudDriveConfig> {
    console.log('🔍 Creating cloud drive config with data:', {
      tenantId: config.tenantId,
      provider: config.provider,
      folderPath: config.folderPath,
      isActive: config.isActive ?? true
    });
    
    // Map camelCase to snake_case for database insertion
    const dbConfig = {
      tenant_id: config.tenantId,
      provider: config.provider,
      folder_path: config.folderPath,
      access_token: config.accessToken,
      refresh_token: config.refreshToken,
      is_active: config.isActive ?? true
    };
    
    console.log('📤 Sending to Supabase:', dbConfig);
    
    const { data, error } = await this.supabase.from('cloud_drive_configs').insert(dbConfig).select().single();
    
    console.log('📥 Supabase response:', { data, error });
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }
    
    if (!data) {
      console.error('❌ No data returned from Supabase insert');
      throw new Error('No data returned from database insert');
    }
    
    console.log('✅ Successfully created cloud drive config with ID:', data.id);
    
    // Map snake_case database response to camelCase TypeScript interface
    return {
      id: data.id,
      tenantId: data.tenant_id,
      provider: data.provider,
      folderPath: data.folder_path,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
      syncCursor: data.sync_cursor || null
    };
  }

  async updateCloudDriveConfig(id: number, config: any, tenantId: number): Promise<CloudDriveConfig | undefined> {
    // Map camelCase to snake_case for database update
    const dbUpdate: any = {};
    if (config.lastSyncAt) dbUpdate.last_sync_at = config.lastSyncAt;
    if (config.accessToken) dbUpdate.access_token = config.accessToken;
    if (config.refreshToken) dbUpdate.refresh_token = config.refreshToken;
    if (config.isActive !== undefined) dbUpdate.is_active = config.isActive;
    if (config.folderPath) dbUpdate.folder_path = config.folderPath;
    
    const { data, error } = await this.supabase.from('cloud_drive_configs')
      .update(dbUpdate)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) return undefined;
    
    // Map snake_case database response to camelCase TypeScript interface
    if (!data) return undefined;
    return {
      id: data.id,
      tenantId: data.tenant_id,
      provider: data.provider,
      folderPath: data.folder_path,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isActive: data.is_active,
      lastSyncAt: data.last_sync_at,
      createdAt: data.created_at,
      syncCursor: data.sync_cursor || null
    };
  }

  async deleteCloudDriveConfig(id: number, tenantId: number): Promise<void> {
    const { error } = await this.supabase.from('cloud_drive_configs')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  }

  // Raw Documents
  async getRawDocuments(tenantId: number): Promise<RawDocument[]> {
    const { data, error } = await this.supabase.from('raw_documents').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async createRawDocument(document: InsertRawDocument): Promise<RawDocument> {
    const { data, error } = await this.supabase.from('raw_documents').insert(document).select().single();
    if (error) throw error;
    return data;
  }

  // AI Chat
  async getChatMessages(tenantId: number, userId: number): Promise<AiChatMessage[]> {
    const { data, error } = await this.supabase.from('ai_chat_messages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage> {
    const { data, error } = await this.supabase.from('ai_chat_messages').insert(message).select().single();
    if (error) throw error;
    return data;
  }

  // Clients
  async getClients(tenantId: number): Promise<Client[]> {
    const { data, error } = await this.supabase.from('clients').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async getClientById(id: number, tenantId: number): Promise<Client | undefined> {
    const { data, error } = await this.supabase.from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return undefined;
    return data;
  }

  async getClientByTaxId(taxId: string, tenantId: number): Promise<Client | undefined> {
    const { data, error } = await this.supabase.from('clients')
      .select('*')
      .eq('tax_id', taxId)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return undefined;
    return data;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const { data, error } = await this.supabase.from('clients').insert(client).select().single();
    if (error) throw error;
    return data;
  }

  async updateClient(id: number, client: Partial<InsertClient>, tenantId: number): Promise<Client | undefined> {
    const { data, error } = await this.supabase.from('clients')
      .update(client)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) return undefined;
    return data;
  }

  async deleteClient(id: number, tenantId: number): Promise<void> {
    const { error } = await this.supabase.from('clients')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);
    if (error) throw error;
  }



  // Extracted Invoice Data
  async getExtractedInvoiceData(tenantId: number): Promise<ExtractedInvoiceData[]> {
    const { data, error } = await this.supabase.from('extracted_invoice_data').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async getExtractedInvoiceDataById(id: number, tenantId: number): Promise<ExtractedInvoiceData | undefined> {
    const { data, error } = await this.supabase.from('extracted_invoice_data')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return undefined;
    return data;
  }

  async createExtractedInvoiceData(data: InsertExtractedInvoiceData): Promise<ExtractedInvoiceData> {
    const { data: result, error } = await this.supabase.from('extracted_invoice_data').insert(data).select().single();
    if (error) throw error;
    return result;
  }

  async updateExtractedInvoiceData(id: number, data: Partial<InsertExtractedInvoiceData>, tenantId: number): Promise<ExtractedInvoiceData | undefined> {
    const { data: result, error } = await this.supabase.from('extracted_invoice_data')
      .update(data)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) return undefined;
    return result;
  }

  // Monthly Statement Entries
  async getMonthlyStatementEntries(tenantId: number, year?: number, month?: number): Promise<MonthlyStatementEntry[]> {
    let query = this.supabase.from('monthly_statement_entries').select('*').eq('tenant_id', tenantId);
    
    if (year !== undefined) {
      query = query.eq('year', year);
    }
    if (month !== undefined) {
      query = query.eq('month', month);
    }
    
    const { data, error } = await query.order('entry_date', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getMonthlyStatementEntriesByPeriod(tenantId: number, statementPeriod: string): Promise<MonthlyStatementEntry[]> {
    const { data, error } = await this.supabase.from('monthly_statement_entries')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('statement_period', statementPeriod)
      .order('entry_date', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async createMonthlyStatementEntry(entry: InsertMonthlyStatementEntry): Promise<MonthlyStatementEntry> {
    const { data, error } = await this.supabase.from('monthly_statement_entries').insert(entry).select().single();
    if (error) throw error;
    return data;
  }

  async updateMonthlyStatementEntry(id: number, entry: Partial<InsertMonthlyStatementEntry>, tenantId: number): Promise<MonthlyStatementEntry | undefined> {
    const { data, error } = await this.supabase.from('monthly_statement_entries')
      .update(entry)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) return undefined;
    return data;
  }

  // Dashboard Metrics
  async getDashboardMetrics(tenantId: number): Promise<{
    monthlyRevenue: string;
    monthlyExpenses: string;
    pendingInvoices: number;
    totalClients: number;
    processedDocuments: number;
  }> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Get monthly revenue from invoices
    const { data: invoices } = await this.supabase.from('invoices')
      .select('total_amount')
      .eq('tenant_id', tenantId)
      .gte('issue_date', `${currentMonth}-01`)
      .lt('issue_date', `${currentMonth}-32`);
    
    // Get monthly expenses
    const { data: expenses } = await this.supabase.from('expenses')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('expense_date', `${currentMonth}-01`)
      .lt('expense_date', `${currentMonth}-32`);
    
    // Get pending invoices count
    const { count: pendingCount } = await this.supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', ['draft', 'sent', 'awaiting_payment']);
    
    // Get total clients count
    const { count: totalClientsCount } = await this.supabase.from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    
    // Get processed documents count (documents with extracted data)
    const { count: processedDocsCount } = await this.supabase.from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('processing_status', 'completed')
      .not('extracted_data', 'is', null);
    
    const monthlyRevenue = (invoices || []).reduce((sum, inv) => sum + parseFloat(inv.total_amount || '0'), 0);
    const monthlyExpenses = (expenses || []).reduce((sum, exp) => sum + parseFloat(exp.amount || '0'), 0);
    
    return {
      monthlyRevenue: monthlyRevenue.toFixed(2),
      monthlyExpenses: monthlyExpenses.toFixed(2),
      pendingInvoices: pendingCount || 0,
      totalClients: totalClientsCount || 0,
      processedDocuments: processedDocsCount || 0
    };
  }

  // Manager Approvals
  async getManagerApprovals(tenantId: number): Promise<ManagerApproval[]> {
    const { data, error } = await this.supabase.from('manager_approvals').select('*').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }

  async getManagerApprovalById(id: number, tenantId: number): Promise<ManagerApproval | undefined> {
    const { data, error } = await this.supabase.from('manager_approvals')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
    if (error) return undefined;
    return data;
  }

  async createManagerApproval(approval: InsertManagerApproval): Promise<ManagerApproval> {
    const { data, error } = await this.supabase.from('manager_approvals').insert(approval).select().single();
    if (error) throw error;
    return data;
  }

  async updateManagerApproval(id: number, approval: Partial<InsertManagerApproval>, tenantId: number): Promise<ManagerApproval | undefined> {
    const { data, error } = await this.supabase.from('manager_approvals')
      .update(approval)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();
    if (error) return undefined;
    return data;
  }


}