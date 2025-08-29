import { pgTable, text, serial, integer, boolean, timestamp, date, numeric, jsonb, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants (Multi-tenant support)
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nif: text("nif"), // Portuguese NIF
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow()
});

// Users 
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// User-Tenant Mapping (Many-to-Many with roles)
export const userTenants = pgTable("user_tenants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tenantId: integer("tenant_id").notNull(),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow()
});

// Bank Accounts
export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  bankName: text("bank_name"),
  iban: text("iban"),
  accountNumber: text("account_number"),
  swiftCode: text("swift_code"),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  nif: text("nif"), // Portuguese NIF
  address: text("address"),
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Invoices
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  clientId: integer("client_id"),
  number: text("number").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  clientTaxId: text("client_tax_id"),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }).default("0"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).default("23"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"),
  description: text("description"),
  paymentTerms: text("payment_terms"),
  createdAt: timestamp("created_at").defaultNow()
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  vendor: text("vendor").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
  category: text("category").notNull(),
  description: text("description"),
  receiptNumber: text("receipt_number"),
  expenseDate: date("expense_date").notNull(),
  isDeductible: boolean("is_deductible").default(true),
  processingMethod: text("processing_method"),
  createdAt: timestamp("created_at").defaultNow()
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  bankAccountId: integer("bank_account_id"),
  invoiceId: integer("invoice_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  description: text("description"),
  reference: text("reference"),
  type: text("type").default("income"),
  status: text("status").default("completed"),
  createdAt: timestamp("created_at").defaultNow()
});

// Bank Transactions
export const bankTransactions = pgTable("bank_transactions", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  bankAccountId: integer("bank_account_id").notNull(),
  externalId: text("external_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  transactionDate: date("transaction_date").notNull(),
  valueDate: date("value_date"),
  reference: text("reference"),
  counterparty: text("counterparty"),
  counterpartyAccount: text("counterparty_account"),
  type: text("type").notNull(), // debit, credit
  category: text("category"),
  isReconciled: boolean("is_reconciled").default(false),
  reconciledWith: text("reconciled_with"),
  reconciledAt: timestamp("reconciled_at"),
  createdAt: timestamp("created_at").defaultNow()
});

// Documents
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  processingStatus: text("processing_status").default("pending"),
  confidenceScore: numeric("confidence_score", { precision: 3, scale: 2 }),
  extractedData: jsonb("extracted_data"),
  processingMethod: text("processing_method"),
  aiModelUsed: text("ai_model_used"),
  createdAt: timestamp("created_at").defaultNow(),
  uploadedBy: integer("uploaded_by"),
  contentHash: text("content_hash")
});

// VAT Rates
export const vatRates = pgTable("vat_rates", {
  id: serial("id").primaryKey(),
  region: text("region").notNull(), // mainland, azores, madeira
  category: text("category").notNull(), // normal, intermediate, reduced
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(),
  effectiveDate: date("effective_date").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true)
});

// SAF-T Exports
export const saftExports = pgTable("saft_exports", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  filename: text("filename").notNull(),
  fileSize: integer("file_size"),
  status: text("status").notNull().default("generating"), // generating, completed, failed
  downloadUrl: text("download_url"),
  generatedBy: integer("generated_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at")
});

// Cloud Drive Configurations
export const cloudDriveConfigs = pgTable("cloud_drive_configs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  provider: text("provider").notNull(), // 'dropbox', 'google_drive'
  folderPath: text("folder_path").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncCursor: text("sync_cursor"),
  createdAt: timestamp("created_at").defaultNow()
});

// Raw Documents (from cloud sync)
export const rawDocuments = pgTable("raw_documents", {
  id: text("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  extractedData: jsonb("extracted_data").default("{}"),
  processingStatus: text("processing_status"),
  processingError: text("processing_error"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  cloudConfigId: integer("cloud_config_id"),
  s3Url: text("s3_url").notNull(),
  ocrText: text("ocr_text"),
  createdAt: timestamp("created_at").defaultNow()
});

// AI Chat Messages
export const aiChatMessages = pgTable("ai_chat_messages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  response: text("response"),
  isFromUser: boolean("is_from_user").notNull(),
  context: jsonb("context"),
  createdAt: timestamp("created_at").defaultNow()
});

// Webhook Credentials
export const webhookCredentials = pgTable("webhook_credentials", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  serviceType: text("service_type").notNull(), // 'whatsapp', 'gmail', 'dropbox', 'custom'
  credentialName: text("credential_name").notNull(),
  encryptedValue: text("encrypted_value").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by"),
  isActive: boolean("is_active").default(true)
});

// Multi-Agent Processing Results
export const multiAgentResults = pgTable("multi_agent_results", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: text("document_id").notNull().unique(),
  ocrText: text("ocr_text").notNull(),
  extractedData: jsonb("extracted_data").notNull(),
  agentResults: jsonb("agent_results").notNull(), // Results from each agent
  confidenceScore: numeric("confidence_score", { precision: 5, scale: 2 }).notNull(),
  issues: jsonb("issues").default("[]"), // Array of processing issues
  processingTimeMs: integer("processing_time_ms"),
  ragSimilarDocuments: jsonb("rag_similar_documents").default("[]"),
  createdInvoiceId: integer("created_invoice_id"),
  createdExpenseId: integer("created_expense_id"),
  createdAt: timestamp("created_at").defaultNow()
});

// Field-Level Provenance Metadata
export const fieldProvenance = pgTable("field_provenance", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: text("document_id").notNull(),
  fieldName: text("field_name").notNull(),
  fieldValue: text("field_value"),
  model: text("model").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(),
  method: text("method").notNull(),
  modelVersion: text("model_version"),
  processingTime: integer("processing_time_ms"),
  rawValue: text("raw_value"),
  extractionContext: jsonb("extraction_context").default("{}"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Line Item Provenance Metadata
export const lineItemProvenance = pgTable("line_item_provenance", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: text("document_id").notNull(),
  rowIndex: integer("row_index").notNull(),
  fieldName: text("field_name").notNull(),
  fieldValue: text("field_value"),
  model: text("model").notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).notNull(),
  method: text("method").notNull(),
  modelVersion: text("model_version"),
  processingTime: integer("processing_time_ms"),
  rawValue: text("raw_value"),
  extractionContext: jsonb("extraction_context").default("{}"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

// Consensus Metadata
export const consensusMetadata = pgTable("consensus_metadata", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: text("document_id").notNull().unique(),
  totalModels: integer("total_models").notNull(),
  agreementLevel: numeric("agreement_level", { precision: 5, scale: 2 }).notNull(),
  conflictResolution: text("conflict_resolution").notNull(),
  finalConfidence: numeric("final_confidence", { precision: 5, scale: 2 }).notNull(),
  modelContributions: jsonb("model_contributions").notNull(), // Which model contributed each field
  processingTimeMs: integer("processing_time_ms"),
  createdAt: timestamp("created_at").defaultNow()
});

// RAG Document Vectors (for similarity search)
export const ragVectors = pgTable("rag_vectors", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: text("document_id").notNull(),
  ocrText: text("ocr_text").notNull(),
  extractedData: jsonb("extracted_data").notNull(),
  embedding: jsonb("embedding").notNull(), // Vector representation
  similarity: numeric("similarity", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow()
});

// Documents Embedding Table with Vector Column
export const documentsEmbedding = pgTable("documents_embedding", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: integer("document_id").notNull(),
  filename: text("filename").notNull(),
  documentType: text("document_type"),
  ocrText: text("ocr_text"),
  metadata: jsonb("metadata").default("{}"),
  embedding: text("embedding"), // Vector column for pgvector
  createdAt: timestamp("created_at").defaultNow()
});

// RAG Query Log Table for Audit Logging
export const ragQueryLog = pgTable("rag_query_log", {
  id: text("id").primaryKey(), // UUID
  tenantId: integer("tenant_id").notNull(),
  userId: integer("user_id"),
  sessionId: text("session_id"),

  // Query information
  queryText: text("query_text").notNull(),
  queryType: text("query_type").default("semantic_search"),
  queryParameters: jsonb("query_parameters").default("{}"),

  // Results information
  totalResults: integer("total_results").default(0),
  vectorHitIds: text("vector_hit_ids").array(), // Array of document IDs
  similarityScores: numeric("similarity_scores").array(), // Array of similarity scores
  processingTimeMs: integer("processing_time_ms"),

  // Model and cache information
  embeddingModel: text("embedding_model"),
  cacheHit: boolean("cache_hit").default(false),
  cacheKey: text("cache_key"),

  // Performance metrics
  responseTimeMs: integer("response_time_ms"),
  tokensUsed: integer("tokens_used"),
  costEstimate: numeric("cost_estimate", { precision: 10, scale: 6 }),

  // Metadata
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  requestHeaders: jsonb("request_headers").default("{}"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  queryTimestamp: timestamp("query_timestamp").defaultNow()
});

// Manager Approvals
export const managerApprovals = pgTable("manager_approvals", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  clientId: integer("client_id").notNull(),
  requestType: text("request_type").notNull(), // payment_terms, expedition_override, special_conditions
  requestedBy: integer("requested_by").notNull(),
  approvedBy: integer("approved_by"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestDetails: jsonb("request_details").notNull(),
  approvalNotes: text("approval_notes"),
  isOneTime: boolean("is_one_time").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  decidedAt: timestamp("decided_at")
});

// Extracted Invoice Data
export const extractedInvoiceData = pgTable("extracted_invoice_data", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  documentId: integer("document_id").notNull(),
  issuer: text("issuer"),
  issuerTaxId: text("issuer_tax_id"),
  issuerCountry: text("issuer_country"),
  issuerAddress: text("issuer_address"),
  issuerPhone: text("issuer_phone"),
  invoiceNumber: text("invoice_number"),
  invoiceDate: date("invoice_date"),
  dueDate: date("due_date"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
  currency: text("currency").default("EUR"),
  category: text("category"),
  description: text("description"),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  processingMethod: text("processing_method"), // gemini, openai, hybrid
  extractedAt: timestamp("extracted_at").defaultNow()
});

// Monthly Statement Entries
export const monthlyStatementEntries = pgTable("monthly_statement_entries", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").notNull(),
  statementPeriod: text("statement_period").notNull(), // YYYY-MM format
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  entryDate: date("entry_date").notNull(),
  entryType: text("entry_type").notNull(), // invoice, expense, payment
  referenceId: integer("reference_id"), // Links to invoice/expense/payment ID
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  vatAmount: numeric("vat_amount", { precision: 10, scale: 2 }),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }),
  category: text("category"),
  clientSupplier: text("client_supplier"),
  documentNumber: text("document_number"),
  isDeductible: boolean("is_deductible").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertUserTenantSchema = createInsertSchema(userTenants).omit({ id: true, createdAt: true });
export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({ id: true, createdAt: true, reconciledAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertVatRateSchema = createInsertSchema(vatRates).omit({ id: true });
export const insertSaftExportSchema = createInsertSchema(saftExports).omit({ id: true, createdAt: true, completedAt: true });
export const insertCloudDriveConfigSchema = createInsertSchema(cloudDriveConfigs).omit({ id: true, createdAt: true, lastSyncAt: true });
export const updateCloudDriveConfigSchema = createInsertSchema(cloudDriveConfigs).omit({ id: true, createdAt: true, lastSyncAt: true }).partial().extend({
  lastSyncAt: z.date().optional()
});
export const insertRawDocumentSchema = createInsertSchema(rawDocuments).omit({ createdAt: true });
export const insertAiChatMessageSchema = createInsertSchema(aiChatMessages).omit({ id: true, createdAt: true });
export const insertWebhookCredentialSchema = createInsertSchema(webhookCredentials).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMultiAgentResultSchema = createInsertSchema(multiAgentResults).omit({ id: true, createdAt: true });
export const insertFieldProvenanceSchema = createInsertSchema(fieldProvenance).omit({ id: true, createdAt: true });
export const insertLineItemProvenanceSchema = createInsertSchema(lineItemProvenance).omit({ id: true, createdAt: true });
export const insertConsensusMetadataSchema = createInsertSchema(consensusMetadata).omit({ id: true, createdAt: true });
export const insertRagVectorSchema = createInsertSchema(ragVectors).omit({ id: true, createdAt: true });
export const insertDocumentsEmbeddingSchema = createInsertSchema(documentsEmbedding).omit({ id: true, createdAt: true });
export const insertRagQueryLogSchema = createInsertSchema(ragQueryLog).omit({ id: true, createdAt: true, queryTimestamp: true });
export const insertManagerApprovalSchema = createInsertSchema(managerApprovals).omit({ id: true, createdAt: true, decidedAt: true });
export const insertExtractedInvoiceDataSchema = createInsertSchema(extractedInvoiceData).omit({
  id: true,
  extractedAt: true
});
export const insertMonthlyStatementEntrySchema = createInsertSchema(monthlyStatementEntries).omit({
  id: true,
  createdAt: true
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserTenant = typeof userTenants.$inferSelect;
export type InsertUserTenant = z.infer<typeof insertUserTenantSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;
export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type VatRate = typeof vatRates.$inferSelect;
export type InsertVatRate = z.infer<typeof insertVatRateSchema>;
export type SaftExport = typeof saftExports.$inferSelect;
export type InsertSaftExport = z.infer<typeof insertSaftExportSchema>;
export type CloudDriveConfig = typeof cloudDriveConfigs.$inferSelect;
export type InsertCloudDriveConfig = z.infer<typeof insertCloudDriveConfigSchema>;
export type RawDocument = typeof rawDocuments.$inferSelect;
export type InsertRawDocument = z.infer<typeof insertRawDocumentSchema>;
export type AiChatMessage = typeof aiChatMessages.$inferSelect;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;
export type WebhookCredential = typeof webhookCredentials.$inferSelect;
export type InsertWebhookCredential = z.infer<typeof insertWebhookCredentialSchema>;
export type ManagerApproval = typeof managerApprovals.$inferSelect;
export type InsertManagerApproval = z.infer<typeof insertManagerApprovalSchema>;
export type ExtractedInvoiceData = typeof extractedInvoiceData.$inferSelect;
export type InsertExtractedInvoiceData = z.infer<typeof insertExtractedInvoiceDataSchema>;
export type MonthlyStatementEntry = typeof monthlyStatementEntries.$inferSelect;
export type InsertMonthlyStatementEntry = z.infer<typeof insertMonthlyStatementEntrySchema>;
export type MultiAgentResult = typeof multiAgentResults.$inferSelect;
export type InsertMultiAgentResult = z.infer<typeof insertMultiAgentResultSchema>;
export type FieldProvenance = typeof fieldProvenance.$inferSelect;
export type InsertFieldProvenance = z.infer<typeof insertFieldProvenanceSchema>;
export type LineItemProvenance = typeof lineItemProvenance.$inferSelect;
export type InsertLineItemProvenance = z.infer<typeof insertLineItemProvenanceSchema>;
export type ConsensusMetadata = typeof consensusMetadata.$inferSelect;
export type InsertConsensusMetadata = z.infer<typeof insertConsensusMetadataSchema>;
export type DocumentsEmbedding = typeof documentsEmbedding.$inferSelect;
export type InsertDocumentsEmbedding = z.infer<typeof insertDocumentsEmbeddingSchema>;
export type RagQueryLog = typeof ragQueryLog.$inferSelect;
export type InsertRagQueryLog = z.infer<typeof insertRagQueryLogSchema>;