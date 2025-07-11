# Contas-PT: Portuguese Accounting AI System with Multi-Tenant Webhooks

Contas-PT is a sophisticated Portuguese accounting system designed for small to medium businesses in Portugal. It provides comprehensive financial management with AI-powered document processing, Portuguese tax compliance (IVA), multi-tenant architecture, automated cloud storage integration, and complete webhook-based document ingestion system.

## Key Features

### 🔗 Multi-Tenant Webhook Integration
- **WhatsApp Integration**: Receive and process invoices sent via WhatsApp Business API
- **Gmail Integration**: Automatically process PDF attachments from Gmail accounts
- **Dropbox Integration**: Real-time document processing from Dropbox folders
- **Tenant Isolation**: Complete separation of webhook configurations per user
- **Encrypted Storage**: AES-256 encrypted credential storage with Row Level Security
- **Background Processing**: Passive webhook system running continuously for all configured users

### 🤖 AI-Powered Document Processing
- **Google Gemini-2.5-Flash-Preview**: Primary AI engine for Portuguese invoice extraction
- **OpenAI GPT-4o-Mini**: Fallback processing for maximum reliability
- **Multi-Model Consensus**: Combines results from multiple AI models for enhanced accuracy
- **Portuguese Optimization**: Specifically tuned for Portuguese business documents and tax requirements

### 🏛️ Portuguese Tax Compliance
- **IVA (VAT) Management**: Supports 6%, 13%, 23% Portuguese VAT rates
- **NIF Validation**: 9-digit Portuguese tax ID validation and verification
- **SAF-T Export**: Generate Portuguese tax authority compliant SAF-T files
- **Legal Compliance**: Built to meet Portuguese accounting and tax requirements

### 🏢 Multi-Tenant Architecture
- **Company Management**: Support for multiple companies per user
- **Role-Based Access**: Admin, accountant, and user role management
- **Data Isolation**: Complete tenant separation for security and compliance
- **User Management**: Comprehensive user and permission system

### ☁️ Cloud Storage Integration
- **Google Drive**: OAuth2 integration with automated document monitoring
- **Dropbox**: Real-time webhook integration for instant document processing
- **Automated Sync**: Scheduled monitoring every 5 minutes with delta sync
- **Token Management**: Robust token refresh handling for uninterrupted operation

### 📊 Real-Time Dashboard
- **Financial Metrics**: Live revenue, expenses, and profit tracking
- **Document Status**: Real-time processing status with confidence scores
- **Portuguese Formatting**: Currency, dates, and numbers in Portuguese format
- **WebSocket Updates**: Live updates without page refresh

## Technology Stack

### Frontend
- **Next.js 15.3.4**: React framework with App Router and TypeScript
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **shadcn/ui**: Modern React component library
- **TanStack Query**: Server state management and caching

### Backend
- **Next.js API Routes**: TypeScript-based API endpoints
- **Supabase**: PostgreSQL database with real-time capabilities
- **Drizzle ORM**: Type-safe database operations
- **Session Authentication**: Secure multi-tenant authentication

### AI & Processing
- **Google Gemini-2.5-Flash-Preview**: Primary document processing
- **OpenAI GPT-4o-Mini**: Fallback and validation processing
- **Node.js Schedulers**: Background processing for cloud storage
- **WebSocket Server**: Real-time status updates

### Webhook System
- **Multi-Tenant Isolation**: Separate webhook configurations per user
- **Encrypted Credentials**: AES-256 encryption for all stored credentials
- **Background Processing**: Continuous passive processing for all active configurations
- **Status Monitoring**: Real-time webhook activity monitoring and logging

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- AI API keys (Google AI and/or OpenAI)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contas-pt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Setup database**
   ```bash
   npm run db:push
   ```

5. **Start development**
   ```bash
   npm run dev
   ```

6. **Access webhook management**
   ```
   http://localhost:5000/webhook-management
   ```

## Environment Configuration

### Required Variables
```bash
# Database (Required)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
DATABASE_URL=your_supabase_database_url
SESSION_SECRET=your_session_secret

# AI Processing (At least one required)
GOOGLE_AI_API_KEY=your_google_ai_key
OPENAI_API_KEY=your_openai_key

# Cloud Storage (Optional)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret
DROPBOX_CLIENT_ID=your_dropbox_app_key
DROPBOX_CLIENT_SECRET=your_dropbox_app_secret

# Webhook Encryption (Required for webhook system)
WEBHOOK_ENCRYPTION_KEY=your_32_character_encryption_key
```

## Documentation

### User Guides
- [System Overview](docs/project-overview.md)
- [API Reference](docs/api-reference.md)
- [Webhook Integration Summary](docs/WEBHOOK_INTEGRATION_SUMMARY.md)
- [Webhook Integration Status](docs/WEBHOOK_INTEGRATION_STATUS.md)
- [Cloud AI Setup](docs/cloud-ai-setup.md)
- [Troubleshooting](docs/troubleshooting.md)

### Technical Documentation
- [Database Architecture](docs/supabase-database-architecture.md)
- [AI Processing Pipeline](docs/ai-processing-pipeline.md)
- [Frontend Components](docs/frontend-components.md)
- [Complete Project Documentation](docs/COMPLETE_PROJECT_DOCUMENTATION.md)

## Webhook System Features

### Multi-Tenant Configuration
- Each user can configure their own WhatsApp, Gmail, and Dropbox credentials
- Complete isolation between users ensures User1's documents go to User1's folder only
- Encrypted credential storage with tenant-based Row Level Security policies

### Supported Integrations
1. **WhatsApp Business API**: Receive invoices and receipts via WhatsApp messages
2. **Gmail IMAP**: Automatically process PDF attachments from email
3. **Dropbox API**: Real-time processing of documents uploaded to monitored folders

### Background Processing
- Passive system that runs continuously for all configured users
- Processes documents automatically without user intervention
- Real-time status updates and logging for all webhook activities

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema changes to database
npm run db:clean     # Clean database (development only)
npm run type-check   # TypeScript type checking
```

### Project Structure
```
├── app/                 # Next.js App Router pages
│   ├── webhook-management/ # Webhook configuration interface
│   └── api/webhooks/    # Webhook API endpoints
├── components/          # React components
│   └── webhook-config-manager.tsx # Webhook management UI
├── lib/                 # Utility libraries
│   ├── webhook-manager.ts # Multi-tenant webhook processor
│   └── webhook-credentials.ts # Encrypted credential storage
├── hooks/              # Custom React hooks
├── shared/             # Shared schemas and types
├── server/             # Server-side code
├── docs/               # Documentation
└── scripts/            # Utility scripts
```

## Production Deployment

### Docker Deployment
```bash
docker build -t contas-pt .
docker run -p 5000:5000 --env-file .env contas-pt
```

### Manual Deployment
```bash
npm run build
npm start
```

## Authentication

### Default Admin User
- **Email**: aki@diamondnxt.com
- **Password**: admin123
- **Role**: Super Admin
- **Company**: DIAMOND NXT TRADING LDA

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the [Troubleshooting Guide](docs/troubleshooting.md)
- Review the [API Documentation](docs/api-reference.md)
- Review the [Webhook Integration Guide](docs/WEBHOOK_INTEGRATION_SUMMARY.md)
- Open an issue on GitHub

---

**Version**: 3.0  
**Last Updated**: January 10, 2025  
**Status**: Production Ready with Multi-Tenant Webhook System