// Centralized exports for shared modules
export * from './types';
export * from './nif-validator';

// Re-export commonly used types for convenience
export type {
    RawDocumentMeta,
    LineItem,
    ExtractionResult,
    SimilarDocument,
    ValidationResult,
    ClassificationResult,
    RecalculationResult,
    AuditResult
} from './types';

// Export schema types with explicit naming to avoid conflicts
export type {
    Tenant,
    InsertTenant,
    User,
    InsertUser,
    UserTenant,
    InsertUserTenant,
    BankAccount,
    InsertBankAccount,
    Client,
    InsertClient,
    Invoice,
    InsertInvoice,
    Expense,
    InsertExpense,
    Payment,
    InsertPayment,
    BankTransaction,
    InsertBankTransaction,
    Document,
    InsertDocument,
    VatRate,
    InsertVatRate,
    SaftExport,
    InsertSaftExport,
    CloudDriveConfig,
    InsertCloudDriveConfig,
    RawDocument,
    InsertRawDocument,
    AiChatMessage,
    InsertAiChatMessage,
    WebhookCredential,
    InsertWebhookCredential,
    ManagerApproval,
    InsertManagerApproval,
    ExtractedInvoiceData,
    InsertExtractedInvoiceData,
    MonthlyStatementEntry,
    InsertMonthlyStatementEntry,
    MultiAgentResult,
    InsertMultiAgentResult,
    FieldProvenance as DBFieldProvenance,
    InsertFieldProvenance as DBInsertFieldProvenance,
    LineItemProvenance as DBLineItemProvenance,
    InsertLineItemProvenance as DBInsertLineItemProvenance,
    ConsensusMetadata as DBConsensusMetadata,
    InsertConsensusMetadata as DBInsertConsensusMetadata,
    DocumentsEmbedding,
    InsertDocumentsEmbedding,
    RagQueryLog,
    InsertRagQueryLog
} from './schema';
