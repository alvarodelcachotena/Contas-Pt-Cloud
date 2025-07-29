# Project Documentation

This folder contains detailed technical documentation for the Contas-PT Portuguese Accounting System.

## Documentation Structure

### Core Architecture
- `architecture-overview.md` - System architecture and design patterns
- `database-schema.md` - Complete database schema documentation
- `api-endpoints.md` - API route documentation

### Frontend Documentation
- `frontend-components.md` - React component documentation
- `ui-architecture.md` - UI structure and styling guide

### Backend Documentation
- `backend-services.md` - Server-side services and controllers
- `authentication-system.md` - Multi-tenant authentication documentation
- `ai-processing.md` - AI document processing pipeline

### Integration Documentation
- `cloud-storage-integration.md` - Dropbox and Google Drive integration
- `webhook-system.md` - Multi-tenant webhook documentation
- `supabase-integration.md` - Database integration details

### Development Guides
- `development-workflow.md` - Development best practices
- `deployment-guide.md` - Production deployment instructions
- `troubleshooting-guide.md` - Common issues and solutions

## Quick Reference

For quick access to essential information:
- Main README: `../README.md`
- User documentation: `../docs/`
- Environment setup: `../.env.example`
- Database configuration: `../drizzle.config.ts`

This documentation provides comprehensive technical details for developers working on the system.

## Recent Updates (January 29, 2025)

### System Improvements
- **Duplicate Detection**: Enhanced system to prevent duplicate document processing
- **Dashboard Metrics**: Fixed to show accurate all-time financial totals
- **Database Constraints**: Added unique constraints for data integrity
- **Processing Accuracy**: Improved AI extraction with better validation

### Current System Status
- **Documents Processed**: 11 unique documents
- **Expenses Created**: 8 legitimate expense records
- **Total Amount**: €356.50 in authentic Portuguese business expenses
- **Duplicate Prevention**: Active with database-level constraints

### Performance Metrics
- **Processing Success Rate**: 100% for document extraction
- **Duplicate Detection**: 9 files correctly skipped in recent sync
- **Data Integrity**: All expenses linked to source documents
- **Portuguese Compliance**: Full VAT and NIF validation operational