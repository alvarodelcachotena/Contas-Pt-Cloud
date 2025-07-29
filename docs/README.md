# Contas-PT Technical Documentation

Complete technical reference for the Portuguese accounting system with AI-powered document processing and cloud integration.

**Updated January 29, 2025:** Enhanced duplicate detection system implemented with database constraints and intelligent file validation. Fixed critical dashboard metrics to show accurate all-time totals. System now properly prevents duplicate document processing while maintaining comprehensive Portuguese accounting capabilities.

## Overview

Contas-PT is an intelligent Portuguese accounting platform that automates financial document processing while ensuring full compliance with Portuguese tax regulations. The system combines modern web technologies with advanced AI to streamline business accounting operations.

## Quick Start

1. **Environment Setup**: Configure Supabase database and AI API keys
2. **Database Migration**: Run `npm run db:push` to sync schema
3. **Start Development**: Run `npm run dev` for hot reload development

## Documentation Index

- **[Supabase Database Architecture](supabase-database-architecture.md)** - Complete database schema and relationships
- **[AI Processing Pipeline](ai-processing-pipeline.md)** - Multi-model AI processing and Portuguese optimization
- **[Frontend Components](frontend-components.md)** - React components and UI architecture
- **[API Reference](api-reference.md)** - All endpoints with examples
- **[Webhook Integration Summary](WEBHOOK_INTEGRATION_SUMMARY.md)** - Multi-tenant webhook system overview
- **[Webhook Integration Status](WEBHOOK_INTEGRATION_STATUS.md)** - Implementation status and configuration guide
- **[Cloud AI Setup](cloud-ai-setup.md)** - AI service configuration
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions
- **[Duplicate Detection System](DUPLICATE_DETECTION_SYSTEM.md)** - Enhanced duplicate prevention system
- **[Dashboard Metrics System](DASHBOARD_METRICS_SYSTEM.md)** - Financial metrics and reporting

## System Architecture

**Frontend**: Next.js 15.3.4 with App Router, TypeScript, Tailwind CSS, shadcn/ui components  
**Backend**: Next.js API Routes with TypeScript, Supabase PostgreSQL (exclusive), Drizzle ORM  
**AI Processing**: Google Gemini-2.5-Flash-Preview (primary) + OpenAI GPT-4o-Mini (fallback)  
**Real-time**: WebSocket integration, scheduled background processing  
**Cloud Storage**: Google Drive and Dropbox APIs with OAuth2 and automated monitoring  
**Webhook System**: Multi-tenant WhatsApp, Gmail, and Dropbox integration with encrypted credential storage

## Core Features

### Intelligent Document Processing
**AI-Powered Extraction**: Automatically reads Portuguese invoices, receipts, and financial documents
- Google Gemini-2.5-Flash-Preview for primary processing with enhanced vision capabilities
- OpenAI GPT-4o-Mini for fallback processing and validation
- Multi-model consensus combining results for maximum accuracy
- Real confidence scoring with placeholder detection for authentic data only
- Structured outputs with comprehensive validation and quality assurance

**Document Types Supported**:
- PDF invoices and receipts (multi-page support)
- Image files (JPG, PNG) with OCR capabilities  
- Mobile receipt photography with instant processing
- Bank statements and financial documents

### Portuguese Tax Compliance
**Legal Requirements Coverage**: Built specifically for Portuguese business law
- Extracts: Vendor name, NIF, date, amounts, VAT rates, invoice numbers
- Validates 9-digit Portuguese NIF numbers with algorithm verification
- Handles 6%, 13%, 23% VAT rates with automatic classification
- Generates monthly statements with day-by-day organization
- Creates SAF-T export files for Portuguese tax authorities

**Enhanced Compliance Features**:
- Sequential invoice numbering (required by Portuguese law)
- Extended NIF validation with European country prefix support (PT, IT, ES, DE, FR)
- Complete issuer address extraction including country, address, and phone
- Proper VAT calculations and reporting with automatic classification
- Complete audit trails for all financial transactions
- Cascading document management with automatic cleanup of related records
- Portuguese date and currency formatting standards

### Cloud-First Architecture
**Supabase Integration**: Modern cloud database with real-time capabilities
- PostgreSQL database with row-level security and multi-tenancy
- Real-time subscriptions for live data updates
- Built-in authentication and user management
- File storage with automatic processing triggers
- Edge functions for serverless AI processing

**Performance Features**:
- WebSocket connections for real-time status updates
- Optimized database queries with proper indexing
- Caching strategies for frequently accessed data
- Progressive loading and lazy component rendering

## Documentation Index

### User Documentation
- **[Cloud AI Setup](cloud-ai-setup.md)** - Configure AI processing services
- **[API Reference](api-reference.md)** - Complete endpoint documentation with examples
- **[Troubleshooting](troubleshooting.md)** - Common problems and solutions

### Technical Documentation
- **[Project Architecture](../COMPREHENSIVE_PROJECT_DOCUMENTATION.md)** - Detailed technical specifications
- **[Database Schema](#database-schema)** - Complete database structure and relationships

## Database Schema

The system uses Supabase PostgreSQL with complete multi-tenant architecture:

### Business Entities
**Core Tables**: `tenants`, `users`, `clients`, `invoices`, `expenses`, `payments`
- Multi-tenant isolation with row-level security
- Portuguese NIF validation and tax compliance
- Role-based access control (admin, accountant, user)
- Complete financial transaction tracking

**Banking**: `bank_accounts`, `bank_transactions`
- Account management and reconciliation
- Automatic transaction categorization
- Cash flow analysis and reporting

### Document Processing
**AI Processing**: `documents`, `extracted_invoice_data`, `ai_chat_messages`
- File storage with metadata and processing status
- Extracted data with confidence scores and validation
- AI interaction history and learning data

**Workflow Management**: `manager_approvals`, `monthly_statement_entries`
- Approval workflows for AI-extracted data
- Day-by-day accounting organization
- Audit trails and compliance tracking

### Cloud Integration
**Storage Connections**: `cloud_drive_configs`
- Google Drive and Dropbox integration settings with OAuth2 authentication
- Production-ready automated folder monitoring every 5 minutes via node-cron scheduler
- Enhanced delta sync with cursor-based pagination and robust token refresh for optimal performance
- Intelligent automatic token refresh handling ensuring uninterrupted long-term connectivity
- Comprehensive duplicate prevention system to avoid document reprocessing with multiple detection criteria
- Real-time synchronization status with WebSocket integration and graceful error handling with automatic recovery
- Complete end-to-end workflow from file detection to expense creation with Portuguese compliance validation

**Compliance**: `vat_rates`, `saft_exports`
- Portuguese VAT rate definitions and updates
- SAF-T export history for tax authorities
- Legal compliance and reporting requirements

## Configuration

### Required Environment Variables
```bash
# Core Database (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_database_url
SESSION_SECRET=strong_random_session_secret

# AI Processing (Recommended - at least one)
GOOGLE_AI_API_KEY=your_google_ai_key        # Primary processor
OPENAI_API_KEY=your_openai_key              # Fallback processor

# Cloud Storage (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
```

### Development Commands
```bash
npm run dev        # Start development server with hot reload
npm run build      # Build production bundle with optimizations
npm run start      # Start production server
npm run db:push    # Push schema changes to Supabase
npm run db:clean   # Clean all tables (development only)
npm run check      # TypeScript type checking
```

### Production Deployment
The system runs on Supabase-only architecture with the following production features:

**Environment Variables**:
```bash
NODE_ENV=production
PORT=5000
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
DATABASE_URL=your_production_database_url
SESSION_SECRET=strong_random_session_secret
```

**Background Processing**:
- Node-cron scheduler for continuous cloud drive monitoring
- Automatic document processing with AI extraction
- Real-time WebSocket updates for processing status
- Error handling with graceful recovery mechanisms

**Key API Endpoints**:
```bash
# Core functionality
POST /api/upload                    # Upload and process documents
GET  /api/dashboard/metrics         # Financial overview
POST /api/invoices                  # Create invoices
GET  /api/expenses                  # List expenses
DELETE /api/documents/:id/delete    # Delete with cascading cleanup

# Cloud integration
GET  /api/cloud-drives              # Cloud storage configurations
POST /api/dropbox/sync/manual       # Trigger manual sync
GET  /api/dropbox/sync/status       # Check scheduler status

# Authentication
POST /api/auth/login                # User authentication
GET  /api/auth/status               # Session status
```

---

**Documentation Version**: 3.0  
**Last Updated**: January 10, 2025  
**System Architecture**: Next.js 15.3.4 with Multi-Tenant Webhook Integration and Enhanced AI Processing  
**Status**: Production Ready with Complete Multi-Tenant Webhook System and Document Management