import { 
  tenants, users, bankAccounts, clients, invoices, expenses, payments, 
  bankTransactions, documents, vatRates, saftExports, cloudDriveConfigs, rawDocuments, 
  aiChatMessages, managerApprovals, extractedInvoiceData, monthlyStatementEntries,
  type Tenant, type InsertTenant, type User, type InsertUser, 
  type BankAccount, type InsertBankAccount, type Client, type InsertClient,
  type Invoice, type InsertInvoice, type Expense, type InsertExpense, type Payment, type InsertPayment,
  type BankTransaction, type InsertBankTransaction, type Document, type InsertDocument,
  type VatRate, type InsertVatRate, type SaftExport, type InsertSaftExport,
  type CloudDriveConfig, type InsertCloudDriveConfig, type RawDocument, type InsertRawDocument,
  type AiChatMessage, type InsertAiChatMessage, type ManagerApproval, type InsertManagerApproval,
  type ExtractedInvoiceData, type InsertExtractedInvoiceData,
  type MonthlyStatementEntry, type InsertMonthlyStatementEntry
} from "@shared/schema";

export interface IStorage {
  // Tenants
  getTenants(): Promise<Tenant[]>;
  getTenantById(id: number): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Users
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // User-Tenant management
  getUserTenantAssignments(): Promise<any[]>;
  assignUserToTenant(assignment: any): Promise<any>;
  updateUserTenantAssignment(id: number, updates: any): Promise<any>;
  
  // User Tenants
  getUserTenants(userId: number): Promise<Array<{
    id: number;
    tenantId: number;
    role: string;
    isActive: boolean;
    tenantName: string;
    tenantSlug: string;
  }>>;
  createUserTenant(assignment: { userId: number; tenantId: number; role: string; isActive?: boolean }): Promise<any>;
  updateUserTenantRole(userId: number, tenantId: number, role: string): Promise<any>;
  getUserTenantByIds(userId: number, tenantId: number): Promise<any>;
  
  // Clients
  getClients(tenantId: number): Promise<Client[]>;
  getClientById(id: number, tenantId: number): Promise<Client | undefined>;
  getClientByTaxId(taxId: string, tenantId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>, tenantId: number): Promise<Client | undefined>;
  deleteClient(id: number, tenantId: number): Promise<void>;
  
  // Bank Accounts
  getBankAccounts(tenantId: number): Promise<BankAccount[]>;
  createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount>;
  
  // Invoices
  getInvoices(tenantId: number): Promise<Invoice[]>;
  getInvoiceById(id: number, tenantId: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>, tenantId: number): Promise<Invoice | undefined>;
  
  // Expenses
  getExpenses(tenantId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  
  // Payments
  getPayments(tenantId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Bank Transactions
  getBankTransactions(tenantId: number): Promise<BankTransaction[]>;
  createBankTransaction(transaction: InsertBankTransaction): Promise<BankTransaction>;
  
  // Documents
  getDocuments(tenantId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>, tenantId: number): Promise<Document | undefined>;
  
  // VAT Rates
  getVatRates(region: string): Promise<VatRate[]>;
  
  // SAF-T Exports
  getSaftExports(tenantId: number): Promise<SaftExport[]>;
  createSaftExport(export_: InsertSaftExport): Promise<SaftExport>;
  
  // Cloud Drive Configs
  getCloudDriveConfigs(tenantId: number): Promise<CloudDriveConfig[]>;
  getCloudDriveConfigsByProvider(provider: string): Promise<CloudDriveConfig[]>;
  getCloudDriveConfigById(id: number, tenantId: number): Promise<CloudDriveConfig | undefined>;
  createCloudDriveConfig(config: InsertCloudDriveConfig): Promise<CloudDriveConfig>;
  updateCloudDriveConfig(id: number, config: any, tenantId: number): Promise<CloudDriveConfig | undefined>;
  deleteCloudDriveConfig(id: number, tenantId: number): Promise<void>;
  
  // Raw Documents
  getRawDocuments(tenantId: number): Promise<RawDocument[]>;
  createRawDocument(document: InsertRawDocument): Promise<RawDocument>;
  
  // AI Chat
  getChatMessages(tenantId: number, userId: number): Promise<AiChatMessage[]>;
  createChatMessage(message: InsertAiChatMessage): Promise<AiChatMessage>;
  
  // Manager Approvals
  getManagerApprovals(tenantId: number): Promise<ManagerApproval[]>;
  getManagerApprovalById(id: number, tenantId: number): Promise<ManagerApproval | undefined>;
  createManagerApproval(approval: InsertManagerApproval): Promise<ManagerApproval>;
  updateManagerApproval(id: number, approval: Partial<InsertManagerApproval>, tenantId: number): Promise<ManagerApproval | undefined>;
  
  // Extracted Invoice Data
  getExtractedInvoiceData(tenantId: number): Promise<ExtractedInvoiceData[]>;
  getExtractedInvoiceDataById(id: number, tenantId: number): Promise<ExtractedInvoiceData | undefined>;
  createExtractedInvoiceData(data: InsertExtractedInvoiceData): Promise<ExtractedInvoiceData>;
  updateExtractedInvoiceData(id: number, data: Partial<InsertExtractedInvoiceData>, tenantId: number): Promise<ExtractedInvoiceData | undefined>;
  
  // Monthly Statement Entries
  getMonthlyStatementEntries(tenantId: number, year?: number, month?: number): Promise<MonthlyStatementEntry[]>;
  getMonthlyStatementEntriesByPeriod(tenantId: number, statementPeriod: string): Promise<MonthlyStatementEntry[]>;
  createMonthlyStatementEntry(entry: InsertMonthlyStatementEntry): Promise<MonthlyStatementEntry>;
  updateMonthlyStatementEntry(id: number, entry: Partial<InsertMonthlyStatementEntry>, tenantId: number): Promise<MonthlyStatementEntry | undefined>;
  
  // Dashboard Metrics
  getDashboardMetrics(tenantId: number): Promise<{
    monthlyRevenue: string;
    monthlyExpenses: string;
    pendingInvoices: number;
    totalClients: number;
  }>;
}

// Export SupabaseStorage instance for Supabase-only integration
import { SupabaseStorage } from "./supabase-storage";
export const storage = new SupabaseStorage();