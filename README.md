# Contas-PT: Portuguese AI-Powered Accounting Platform

Contas-PT is a sophisticated Portuguese accounting platform that revolutionizes financial document management through intelligent processing and comprehensive enterprise solutions. The system delivers advanced multi-tenant support with robust webhook integrations and intelligent document processing capabilities, focusing on seamless document ingestion and automated financial analysis.

Built specifically for Portuguese businesses, it provides complete tax compliance (IVA/VAT), automated document processing with dual AI models, real-time financial analytics, and comprehensive multi-tenant architecture with role-based access control.

## Core Features

### 🤖 Advanced AI Document Processing
- **Dual AI Architecture**: Google Gemini-2.5-Flash-Preview + OpenAI GPT-4o-Mini
- **Multi-Model Consensus**: Enhanced accuracy through AI model validation
- **Portuguese Optimization**: Specifically trained for Portuguese business documents
- **Real-Time Processing**: WebSocket-based live processing updates
- **Confidence Scoring**: Intelligent accuracy assessment and validation
- **Document Types**: Invoices, receipts, expenses, bank statements, and contracts

### 🏛️ Complete Portuguese Tax Compliance
- **IVA/VAT Management**: Full support for 6%, 13%, 23% Portuguese VAT rates
- **NIF Validation**: Advanced Portuguese tax ID validation with country prefixes
- **SAF-T Export**: Generate Portuguese tax authority compliant XML files
- **Legal Framework**: Built to meet Portuguese accounting and fiscal requirements
- **Automatic Calculations**: VAT calculations, deductions, and tax reporting

### 🏢 Enterprise Multi-Tenant Architecture
- **Tenant Isolation**: Complete data separation with Row Level Security (RLS)
- **Role-Based Access Control**: Super Admin, Admin, Accountant, and User roles
- **Company Management**: Multiple companies per user with separate accounting
- **User Management**: Comprehensive user administration and permissions
- **Secure Sessions**: Advanced authentication with encrypted session management

### 🔗 Comprehensive Integration Ecosystem
- **Cloud Storage**: Google Drive and Dropbox with OAuth2 authentication
- **Webhook System**: Multi-tenant webhook configurations with encrypted credentials
- **Real-Time Sync**: Automated document monitoring and processing
- **API Integration**: RESTful APIs for third-party system integration
- **Background Services**: Continuous passive processing for all active tenants

### 📊 Advanced Financial Analytics
- **Real-Time Dashboard**: Live financial metrics and KPI tracking
- **Revenue Analytics**: Comprehensive income tracking and analysis
- **Expense Management**: Detailed expense categorization and reporting
- **Profit & Loss**: Automated P&L calculations with trend analysis
- **Document Insights**: Processing status and confidence metrics
- **Portuguese Localization**: Currency, dates, and number formatting

### 🛡️ Security & Compliance
- **AES-256 Encryption**: All sensitive data encrypted at rest
- **Row Level Security**: Database-level tenant isolation
- **Audit Logging**: Comprehensive activity and security logging
- **Backup Management**: Automated backup scheduling and recovery
- **Session Security**: Advanced session management and timeout controls

## Technology Stack

### Frontend Architecture
- **Next.js 15.3.4**: Modern React framework with App Router and TypeScript
- **Tailwind CSS**: Utility-first CSS framework with custom theming
- **shadcn/ui**: Comprehensive React component library with accessibility
- **TanStack Query**: Advanced server state management and caching
- **Framer Motion**: Smooth animations and micro-interactions
- **WebSocket Client**: Real-time updates and live notifications

### Backend Infrastructure
- **Next.js API Routes**: TypeScript-based RESTful API endpoints
- **Supabase PostgreSQL**: Enterprise-grade database with real-time capabilities
- **Drizzle ORM**: Type-safe database operations with schema validation
- **Express.js**: High-performance server with session management
- **Row Level Security**: Database-level multi-tenant isolation

### AI & Machine Learning
- **Google Gemini-2.5-Flash-Preview**: Primary AI engine for document extraction
- **OpenAI GPT-4o-Mini**: Secondary AI model for validation and fallback
- **Multi-Model Consensus**: Enhanced accuracy through model comparison
- **Portuguese Language Models**: Optimized prompts for Portuguese documents
- **Confidence Scoring**: Intelligent accuracy assessment and validation

### Cloud & Integration Services
- **Supabase Cloud**: Managed PostgreSQL hosting with global edge network
- **Google Drive API**: OAuth2 integration with automated monitoring
- **Dropbox API**: Real-time webhook integration for document processing
- **WebSocket Server**: Live updates and processing notifications
- **Background Schedulers**: Automated cloud storage synchronization

### Security & Encryption
- **AES-256 Encryption**: All sensitive credentials and data encrypted
- **Row Level Security (RLS)**: Database-level tenant isolation
- **Session Management**: Secure authentication with encrypted sessions
- **Environment Security**: Forced .env file precedence over external secrets
- **Audit Logging**: Comprehensive security and activity logging

## Quick Start Guide

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest stable version
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: 2GB free disk space

### Prerequisites Setup
1. **Supabase Account**: Create project at [supabase.com](https://supabase.com)
2. **AI API Keys**: Get keys from Google AI Studio and/or OpenAI
3. **Cloud Storage** (Optional): Google Drive and/or Dropbox developer accounts

### Installation Steps

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd contas-pt
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Configure your API keys and database credentials in .env
   ```

3. **Database Initialization**
   ```bash
   npm run db:push    # Deploy database schema
   npm run setup      # Initialize default data
   ```

4. **Development Server**
   ```bash
   npm run dev        # Start development server
   ```

5. **Access Application**
   - **Main Dashboard**: `http://localhost:5000`
   - **Admin Panel**: `http://localhost:5000/admin`
   - **Webhook Management**: `http://localhost:5000/webhooks-monitoring`
   - **Document Processing**: `http://localhost:5000/documents`

### Default Admin Access
- **Email**: aki@diamondnxt.com
- **Password**: admin123
- **Role**: Super Admin with full system access

## Environment Configuration

### Core Database Configuration (Required)
```bash
# Supabase Database Connection
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:[password]@host:port/postgres

# Session Security
SESSION_SECRET=your_secure_session_secret_minimum_32_chars
```

### AI Processing Configuration (At least one required)
```bash
# Primary AI Engine
GOOGLE_AI_API_KEY=your_google_ai_studio_api_key

# Secondary AI Engine (Fallback)
OPENAI_API_KEY=sk-your_openai_api_key
```

### Cloud Storage Integration (Optional)
```bash
# Google Drive Integration
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Dropbox Integration
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret
```

### Security & Encryption (Required for production)
```bash
# Webhook System Encryption
WEBHOOK_ENCRYPTION_KEY=your_32_character_encryption_key_for_credentials

# Additional Security
NODE_ENV=development  # or 'production'
PORT=5000            # Application port (default: 5000)
```

### Development vs Production
- **Development**: Uses .env file with override priority
- **Production**: Uses environment variables or secrets management
- **Security**: All credentials encrypted with AES-256 in production

## Documentation Library

### 📚 User Documentation
- **[Complete Project Overview](docs/COMPLETE_PROJECT_DOCUMENTATION.md)** - Comprehensive system guide
- **[System Architecture](docs/project-overview.md)** - Technical system overview
- **[Current Status Summary](docs/CURRENT_STATUS_SUMMARY.md)** - Latest development updates
- **[Local Development Setup](docs/LOCAL_DEVELOPMENT_SETUP.md)** - Developer onboarding guide
- **[Windows Setup Guide](docs/windows-local-setup.md)** - Windows-specific installation

### 🔧 Technical References  
- **[API Reference](docs/api-reference.md)** - Complete endpoint documentation
- **[Database Architecture](docs/supabase-database-architecture.md)** - Schema and relationships
- **[AI Processing Pipeline](docs/ai-processing-pipeline.md)** - Document processing workflow
- **[Frontend Components](docs/frontend-components.md)** - React component library
- **[Cloud AI Setup](docs/cloud-ai-setup.md)** - AI service configuration

### 🔗 Integration Guides
- **[Webhook Integration Summary](docs/WEBHOOK_INTEGRATION_SUMMARY.md)** - Webhook system overview
- **[Webhook Integration Status](docs/WEBHOOK_INTEGRATION_STATUS.md)** - Implementation status
- **[Dashboard Metrics System](docs/DASHBOARD_METRICS_SYSTEM.md)** - Analytics implementation
- **[Duplicate Detection System](docs/DUPLICATE_DETECTION_SYSTEM.md)** - Document deduplication

### 🛠️ Operational Guides
- **[Troubleshooting Guide](docs/troubleshooting.md)** - Common issues and solutions
- **[Database Architecture](docs/DATABASE_ARCHITECTURE.md)** - Advanced database concepts

## System Architecture Overview

### Application Structure
```
├── app/                     # Next.js App Router (Frontend Pages)
│   ├── admin/              # Admin panel with 8 comprehensive tabs
│   ├── api/                # RESTful API endpoints
│   ├── documents/          # Document management interface
│   ├── expenses/           # Expense tracking and management
│   ├── invoices/           # Invoice generation and tracking
│   ├── payments/           # Payment processing and banking
│   ├── cloud-drives/       # Cloud storage integration
│   ├── webhooks-monitoring/# Webhook management interface
│   └── user-settings/      # User preference management
├── components/             # React component library
├── lib/                    # Utility libraries and services
├── shared/                 # Database schema and shared types
├── docs/                   # Comprehensive documentation
└── gmail-contas/          # WhatsApp integration module
```

### Multi-Tenant Webhook System
- **Tenant Isolation**: Complete data separation with RLS policies
- **Encrypted Credentials**: AES-256 encryption for all stored API keys
- **Background Processing**: Continuous passive document processing
- **Real-Time Monitoring**: Live webhook activity tracking and logging
- **Integration Support**: Dropbox, Google Drive, Gmail, and WhatsApp

### AI Processing Pipeline
- **Dual AI Architecture**: Gemini + OpenAI for maximum accuracy
- **Portuguese Optimization**: Custom prompts for Portuguese documents
- **Multi-Model Consensus**: Enhanced accuracy through model validation
- **Real-Time Updates**: WebSocket-based processing notifications
- **Confidence Scoring**: Intelligent document quality assessment

## Development Workflow

### Available Scripts
```bash
# Development
npm run dev              # Start development server with hot reload
npm run build           # Build production bundle
npm run start           # Start production server

# Database Management
npm run db:push         # Deploy schema changes to database
npm run db:clean        # Clean database (development only)
npm run setup           # Initialize default data and admin user
npm run test:setup      # Test database setup

# Code Quality
npm run check           # TypeScript type checking
```

### Development Features
- **Hot Reload**: Instant updates during development
- **TypeScript**: Full type safety across frontend and backend
- **Environment Override**: .env file takes precedence over Replit secrets
- **Database Migrations**: Automated schema deployment with Drizzle
- **Real-Time Debugging**: Live logs and WebSocket connection monitoring

### Key Development Components
- **Authentication System**: Multi-tenant session management
- **AI Processing**: Document extraction with confidence scoring
- **Webhook Management**: Real-time integration monitoring
- **Admin Panel**: Comprehensive system administration
- **Cloud Integration**: Automated document synchronization
- **Financial Analytics**: Real-time metrics and reporting

## Production Deployment

### Replit Deployment (Recommended)
1. **Automatic Deployment**: Use Replit's built-in deployment system
2. **Environment Variables**: Configure secrets in Replit dashboard
3. **Database**: Supabase manages PostgreSQL hosting automatically
4. **Domain**: Automatic .replit.app domain with custom domain support

### Manual Production Setup
```bash
# Build and start production server
npm run build
NODE_ENV=production npm start

# Database initialization
npm run db:push
npm run setup
```

### Docker Deployment (Alternative)
```bash
# Build container
docker build -t contas-pt .

# Run with environment file
docker run -p 5000:5000 --env-file .env contas-pt

# Or with environment variables
docker run -p 5000:5000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  contas-pt
```

## System Access

### Default Super Admin
- **Email**: aki@diamondnxt.com
- **Password**: admin123
- **Role**: Super Admin (System Administrator)
- **Company**: DIAMOND NXT TRADING LDA
- **Permissions**: Full system access, user management, company administration

### Role Hierarchy
1. **Super Admin**: Complete system control and management
2. **Admin**: Company-wide access and user management
3. **Accountant**: Financial data access and document processing
4. **User**: Basic document upload and expense tracking

## Feature Highlights

### Recent Enhancements (January 2025)
- ✅ **Complete Button Functionality**: All 13 navigation pages fully operational
- ✅ **Real AI Processing**: Dual AI model architecture with authentic data extraction
- ✅ **Advanced Admin Panel**: 8 comprehensive management tabs
- ✅ **Multi-Tenant Webhooks**: Complete isolation with encrypted credentials
- ✅ **Portuguese Compliance**: Full VAT, NIF, and SAF-T support
- ✅ **Cloud Integration**: Automated Dropbox and Google Drive sync
- ✅ **Real-Time Analytics**: Live financial metrics and processing status

### Upcoming Features
- 🔄 **Mobile Application**: React Native app for iOS and Android
- 🔄 **Advanced Reporting**: Custom report builder with templates
- 🔄 **API Marketplace**: Third-party integration marketplace
- 🔄 **ML Improvements**: Enhanced Portuguese document recognition

## Contributing

### Development Guidelines
1. **Fork Repository**: Create your own fork for development
2. **Feature Branches**: Use descriptive branch names (feature/invoice-validation)
3. **Code Standards**: Follow TypeScript and React best practices
4. **Testing**: Ensure all functionality works with test data
5. **Documentation**: Update relevant docs for new features
6. **Pull Request**: Submit with detailed description and testing notes

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Follow configured linting rules
- **Prettier**: Consistent code formatting
- **Component Structure**: Use shadcn/ui patterns for consistency

## Support & Resources

### Documentation & Help
- 📖 [Complete Documentation](docs/COMPLETE_PROJECT_DOCUMENTATION.md)
- 🔧 [Troubleshooting Guide](docs/troubleshooting.md)
- 🚀 [API Reference](docs/api-reference.md)
- 🔗 [Integration Guides](docs/WEBHOOK_INTEGRATION_SUMMARY.md)

### Community & Contact
- 🐛 **Bug Reports**: Create GitHub issue with reproduction steps
- 💡 **Feature Requests**: Open GitHub discussion with use case
- 📧 **Security Issues**: Contact maintainers directly
- 📝 **Documentation**: Improve docs via pull request

---

## Project Information

**Current Version**: 3.2  
**Release Date**: January 30, 2025  
**Status**: Production Ready with Enterprise Features  
**License**: MIT License  
**Platform**: Next.js 15.3.4 with TypeScript  
**Database**: Supabase PostgreSQL with Row Level Security  
**AI Integration**: Google Gemini + OpenAI dual-model architecture