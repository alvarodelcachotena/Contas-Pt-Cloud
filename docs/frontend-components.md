# Frontend Components Documentation - Contas-PT

*Last updated: July 10, 2025*

**Recent Update:** Webhook credentials management integrated into Admin Panel > Configurações tab. Removed standalone webhook credentials page for better UX. All webhook configuration now accessible through unified admin interface.

Complete documentation of React components and frontend architecture for the Portuguese Accounting AI System.

## Overview

The frontend is built with Next.js 15.3.4 App Router, TypeScript, and Tailwind CSS, using shadcn/ui components for consistent design. The architecture follows modern patterns with TanStack Query for server state management and Next.js built-in routing.

## Component Architecture

### Core Layout Components

#### Header Component (`layout/header.tsx`)
Main navigation header with authentication and tenant context.

**Features:**
- User authentication status display
- Tenant switcher for multi-tenant support
- Navigation menu with role-based access
- Mobile-responsive design
- Theme toggle functionality

#### Sidebar Component (`layout/sidebar.tsx`)
Collapsible navigation sidebar with contextual menu items.

**Features:**
- Role-based menu filtering
- Active route highlighting
- Collapsible sections for organization
- Portuguese business-focused navigation
- Quick actions and shortcuts

### Business Management Components

#### Company Switcher (`CompanySwitcher.tsx`)
Multi-tenant company selection and management.

**Features:**
- Dropdown company selector
- Current tenant context display
- Role-based company access
- Quick switching between tenants
- Company creation shortcuts for admins

#### Role-Based Access (`RoleBasedAccess.tsx`)
Permission-based component rendering wrapper.

**Features:**
- Granular permission checking
- Role hierarchy enforcement (admin, accountant, assistant, viewer)
- Conditional component rendering
- Tenant-scoped permission validation
- Fallback UI for unauthorized access

### Document Processing Components

#### Simple File Upload (`SimpleFileUpload.tsx`)
Drag-and-drop file upload with AI processing integration.

**Features:**
- Multi-file drag-and-drop support
- File type validation (PDF, JPG, PNG)
- Real-time upload progress
- AI processing status display
- Preview functionality for uploaded files
- Error handling and validation feedback

#### Dropbox Sync Control (`DropboxSyncControl.tsx`)
Dropbox integration management and monitoring.

**Features:**
- Dropbox OAuth2 authentication flow
- Real-time sync status display
- Manual sync trigger buttons
- Connection health monitoring
- Error reporting and troubleshooting
- Sync history and statistics

#### Dropbox Folder Browser (`DropboxFolderBrowser.tsx`)
Navigate and select Dropbox folders for sync configuration.

**Features:**
- Hierarchical folder navigation
- Folder selection for sync setup
- File count and size statistics
- Breadcrumb navigation
- Search and filter capabilities
- Permission verification

#### Dropbox Folder Selector (`DropboxFolderSelector.tsx`)
Modal component for selecting specific Dropbox folders.

**Features:**
- Modal folder selection interface
- Folder validation and verification
- Visual folder hierarchy display
- Selection confirmation workflow
- Integration with cloud drive configs

#### Google Drive Manual Auth (`GoogleDriveManualAuth.tsx`)
Google Drive OAuth2 authentication and folder selection.

**Features:**
- OAuth2 flow initiation
- Google Drive API integration
- Folder permission validation
- Manual authentication fallback
- Connection status verification

### Form Components

#### Expense Form (`forms/expense-form.tsx`)
Comprehensive expense entry and editing form.

**Features:**
- React Hook Form integration with Zod validation
- Portuguese VAT rate selection (6%, 13%, 23%)
- Vendor autocomplete with NIF validation
- Category selection with Portuguese accounting standards
- Receipt attachment handling
- Date picker with Portuguese formatting
- Currency input with EUR formatting
- Expense categorization and subcategorization

#### Invoice Form (`forms/invoice-form.tsx`)
Professional invoice creation with Portuguese compliance.

**Features:**
- Sequential invoice numbering (legal requirement)
- Client selection with NIF validation
- Line item management with VAT calculations
- Payment terms configuration
- Portuguese invoice template compliance
- PDF generation preview
- Due date calculation
- Multiple currency support (EUR primary)

## Page Components (Next.js App Router)

### Dashboard (`app/page.tsx`)
Main business overview and metrics display.

**Features:**
- Financial metrics cards with trend analysis
- Recent document processing status
- Quick action buttons for common tasks
- Monthly revenue and expense charts
- Pending invoice and payment tracking
- Real-time updates via WebSocket integration
- Portuguese currency and date formatting

### Documents (`app/documents/page.tsx`)
Document management and AI processing interface.

**Features:**
- Document listing with processing status
- Upload interface with progress tracking
- AI extraction results display
- Document preview functionality
- Batch processing capabilities
- Search and filter by processing status
- Export and download functionality

### Expenses (`app/expenses/page.tsx`)
Expense tracking and management interface.

**Features:**
- Expense listing with pagination
- Advanced filtering by category, date, vendor
- Bulk expense operations
- AI-extracted data validation
- Receipt attachment viewing
- Export to various formats (CSV, PDF)
- Portuguese VAT compliance checking

### Invoices (`app/invoices/page.tsx`)
Invoice management and generation interface.

**Features:**
- Invoice listing with status indicators
- Professional invoice creation
- PDF generation and preview
- Payment tracking and status updates
- Sequential numbering compliance
- Client management integration
- Portuguese invoice template formatting

### Clients (`app/clients/page.tsx`)
Customer relationship management interface.

**Features:**
- Client database management
- NIF validation and verification
- Contact information management
- Payment terms configuration
- Invoice history per client
- Email integration for communications
- Portuguese business validation

### Banking (`pages/banking.tsx`)
Bank account and transaction management.

**Features:**
- Bank account listing and management
- Transaction import and categorization
- Reconciliation interface
- Balance tracking and monitoring
- Portuguese IBAN validation
- Statement upload and processing
- Integration with accounting entries

### Cloud Drives (`pages/cloud-drives.tsx`)
Cloud storage integration management.

**Features:**
- Google Drive and Dropbox connection setup
- Folder configuration and monitoring
- Sync status and history display
- Token management and refresh handling
- Error reporting and troubleshooting
- Automation configuration
- Processing statistics and analytics

### Admin Panel (`app/admin/page.tsx`)
System administration and user management with integrated webhook credentials.

**Features:**
- User account management
- Tenant creation and configuration
- Role assignment and permissions
- System monitoring and health checks
- Database maintenance tools
- Audit log viewing
- Configuration management
- **Webhook Credentials Management** (Configurações tab)

#### Webhook Credentials Component (`components/WebhookCredentials.tsx`)
**Integrated into Admin Panel > Configurações tab**

Multi-service webhook credential management with per-tenant security:

**Features:**
- **Service Configuration**: WhatsApp Business API, Gmail IMAP, Dropbox, Custom services
- **Security**: AES-256 encrypted credential storage per tenant
- **Role-based Access**: Only admin/manager roles can configure credentials
- **Service-specific Forms**: Tailored input forms for each webhook service
- **Real-time Status**: Connection health monitoring and status indicators
- **Credential Management**: Add, update, delete credentials with confirmation dialogs
- **Multi-tenant Isolation**: Each company maintains separate, encrypted credentials
- **Unified Interface**: All webhook configuration accessible through single admin tab

### AI Assistant (`pages/ai-assistant.tsx`)
Conversational AI interface for accounting questions.

**Features:**
- Chat interface with AI assistant
- Portuguese business context understanding
- Accounting and tax guidance
- Document processing assistance
- Integration with system data
- Conversation history
- Export chat transcripts

### SAF-T Export (`pages/saft.tsx`)
Portuguese tax authority file generation.

**Features:**
- SAF-T file generation interface
- Period selection and validation
- Export progress monitoring
- File download and verification
- Compliance checking
- Historical export tracking
- Tax authority submission preparation

### VAT Management (`pages/vat.tsx`)
Portuguese VAT rate and compliance management.

**Features:**
- VAT rate configuration by region
- Compliance checking and validation
- VAT return preparation assistance
- Rate history and changes tracking
- Regional settings (mainland, Azores, Madeira)
- IVA calculation verification

### Settings (`pages/settings.tsx`)
System configuration and preferences.

**Features:**
- Application settings management
- Theme and appearance preferences
- Language and localization settings
- Notification preferences
- Integration configurations
- Backup and export settings

### User Settings (`pages/user-settings.tsx`)
Personal user account preferences.

**Features:**
- Profile information management
- Password change functionality
- Email preferences
- Session management
- Two-factor authentication setup
- Privacy settings

## UI Component Library

### Core UI Components

Built on Radix UI primitives with shadcn/ui styling:

- **Form Components**: Input, Textarea, Select, Checkbox, Radio Group, Switch
- **Display Components**: Card, Badge, Avatar, Progress, Skeleton
- **Navigation**: Breadcrumb, Navigation Menu, Pagination
- **Feedback**: Alert, Toast, Dialog, Alert Dialog
- **Layout**: Accordion, Collapsible, Separator, Tabs
- **Data Display**: Table, Calendar, Chart components

### Custom Components

#### Metrics Card (`ui/metrics-card.tsx`)
Financial metrics display with trend indicators.

#### Chart Card (`ui/chart-card.tsx`)
Reusable chart container with Portuguese formatting.

#### Tenant Selector (`ui/tenant-selector.tsx`)
Multi-tenant context switching component.

#### Theme Toggle (`ui/theme-toggle.tsx`)
Dark/light mode switching with persistence.

## State Management

### TanStack Query Integration

All server state is managed through TanStack Query v5:

```typescript
// Example query pattern
const { data: expenses, isLoading } = useQuery({
  queryKey: ['/api/expenses', filters],
  queryFn: ({ queryKey }) => fetch(queryKey[0]).then(res => res.json())
});

// Example mutation pattern
const createExpense = useMutation({
  mutationFn: (newExpense) => apiRequest('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(newExpense)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/expenses'] });
    toast({ title: 'Expense created successfully' });
  }
});
```

### Authentication State

Managed through custom `useAuth` hook:

```typescript
const { user, tenant, isAuthenticated, login, logout } = useAuth();
```

## Routing

Using Wouter for client-side routing:

```typescript
// Route configuration in App.tsx
const routes = [
  { path: '/', component: Dashboard },
  { path: '/expenses', component: Expenses },
  { path: '/invoices', component: Invoices },
  { path: '/admin', component: Admin, protected: 'admin' }
];
```

## Styling and Theming

### Tailwind CSS Configuration

```typescript
// tailwind.config.ts highlights
{
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))"
      }
    }
  }
}
```

### Dark Mode Support

System supports automatic dark mode switching with proper contrast and accessibility.

## Portuguese Localization

### Currency Formatting
- EUR symbol placement according to Portuguese standards
- Decimal separator and thousands grouping
- VAT rate display (6%, 13%, 23%)

### Date Formatting
- DD/MM/YYYY format for Portuguese users
- Portuguese month names and date validation
- Business day calculations for payment terms

### Business Compliance
- NIF (tax ID) validation and formatting
- Portuguese address formats
- VAT compliance indicators

## Performance Optimization

### Code Splitting
- Route-based code splitting with React.lazy
- Component-level lazy loading for heavy forms
- Dynamic imports for optional features

### Caching Strategy
- TanStack Query caching for server state
- Local storage for user preferences
- Session storage for form state preservation

### Bundle Optimization
- Tree shaking for unused code elimination
- SVG optimization for icons
- Image optimization and lazy loading

This documentation covers all frontend components and architecture patterns used in the Contas-PT system as of June 23, 2025.