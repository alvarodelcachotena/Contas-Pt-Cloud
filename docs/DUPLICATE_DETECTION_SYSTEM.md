# Duplicate Detection System - Contas-PT

*Last Updated: January 29, 2025*

## Overview

The Contas-PT system implements a comprehensive duplicate detection system to prevent the same documents from being processed multiple times, ensuring data integrity and accurate financial metrics.

## Problem Statement

Previously, the system was experiencing duplicate document processing issues where:
- Same documents were being processed multiple times
- Dashboard metrics showed inflated totals due to duplicates
- Multiple expense records were created for identical invoices
- Database contained redundant data affecting system performance

## Solution Implementation

### Database Constraints

Added a unique constraint to the documents table to prevent duplicate filenames per tenant:

```sql
ALTER TABLE documents ADD CONSTRAINT unique_filename_per_tenant 
UNIQUE (tenant_id, filename);
```

This ensures that at the database level, no two documents with the same filename can exist for the same tenant.

### Enhanced Duplicate Detection Logic

**File:** `lib/duplicate-detection.ts`

The duplicate detection system now uses multiple validation methods:

1. **Filename Matching**: Primary check against existing document filenames
2. **File Size Validation**: Secondary verification using file size comparison
3. **Content Hashing**: SHA-256 hash generation for future content-based detection

```typescript
export async function checkForDuplicates(
  supabase: any,
  tenantId: number,
  filename: string,
  fileBuffer: Buffer
): Promise<DuplicateCheckResult>
```

### Processing Flow

1. **File Download**: Document is downloaded from cloud storage (Dropbox)
2. **Duplicate Check**: System checks for existing documents with same filename and file size
3. **Skip Processing**: If duplicate detected, file is skipped with log message
4. **Process New Files**: Only new, unique files are processed through AI extraction
5. **Database Storage**: New documents are stored with unique constraint enforcement

## Current Performance

### Metrics (January 29, 2025)
- **Total Documents**: 11 unique documents processed
- **Total Expenses**: 8 legitimate expense records created
- **Total Amount**: €356.50 in authentic expense data
- **Duplicate Prevention**: 9 files correctly skipped during last sync

### Log Example
```
📄 Processing:  740493261787971.jpg
📥 Downloaded  740493261787971.jpg (318979 bytes)
⏭️ Skipping  740493261787971.jpg - duplicate detected (filename):  740493261787971.jpg
```

## Technical Details

### Dropbox Sync Integration

The duplicate detection is integrated into the Dropbox manual sync process:

**Endpoint:** `/api/dropbox/manual-sync`

1. System fetches all files from configured Dropbox folder
2. Each file is checked against existing database records
3. Only new files are processed through AI extraction pipeline
4. Duplicate files are logged and skipped automatically

### Database Impact

- **Before Fix**: Multiple records for same documents (IDs 150-300+)
- **After Fix**: Clean, unique records with proper constraint enforcement
- **Data Integrity**: Accurate financial totals without duplicate inflation

## Future Enhancements

### Planned Improvements
1. **Content Hash Storage**: Store SHA-256 hashes in database for content-based detection
2. **Cross-Tenant Detection**: Detect duplicates across different tenants (optional)
3. **File Metadata**: Enhanced metadata comparison (creation date, modification time)
4. **Batch Processing**: Optimized duplicate detection for bulk operations

### Configuration Options
- Enable/disable duplicate detection per tenant
- Configure detection sensitivity (filename only vs. content-based)
- Set retention policies for duplicate detection history

## Monitoring and Maintenance

### Health Checks
- Monitor unique constraint violations
- Track duplicate detection performance
- Analyze false positive/negative rates

### Troubleshooting
- Check database constraint status
- Verify duplicate detection logic execution
- Review processing logs for skipped files

The duplicate detection system ensures data integrity while maintaining optimal performance for the Portuguese accounting workflow.