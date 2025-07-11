import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

/**
 * Enhanced duplicate detection system for documents
 * Uses content hashing to detect duplicates regardless of filename
 */

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingDocumentId?: number
  existingDocumentName?: string
  matchType?: 'content_hash' | 'filename' | 'none'
}

/**
 * Generate SHA-256 hash of file content for duplicate detection
 */
export function generateFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Check if a document is a duplicate based on content hash and filename
 */
export async function checkForDuplicates(
  supabase: any,
  tenantId: number,
  filename: string,
  fileBuffer: Buffer
): Promise<DuplicateCheckResult> {
  try {
    const contentHash = generateFileHash(fileBuffer)
    
    // First check: Content hash (most reliable)
    const { data: hashMatch } = await supabase
      .from('documents')
      .select('id, filename, original_filename')
      .eq('tenant_id', tenantId)
      .eq('content_hash', contentHash)
      .single()
    
    if (hashMatch) {
      return {
        isDuplicate: true,
        existingDocumentId: hashMatch.id,
        existingDocumentName: hashMatch.original_filename || hashMatch.filename,
        matchType: 'content_hash'
      }
    }
    
    // Second check: Exact filename match
    const { data: filenameMatch } = await supabase
      .from('documents')
      .select('id, filename, original_filename')
      .eq('tenant_id', tenantId)
      .or(`filename.eq.${filename},original_filename.eq.${filename}`)
      .single()
    
    if (filenameMatch) {
      return {
        isDuplicate: true,
        existingDocumentId: filenameMatch.id,
        existingDocumentName: filenameMatch.original_filename || filenameMatch.filename,
        matchType: 'filename'
      }
    }
    
    return {
      isDuplicate: false,
      matchType: 'none'
    }
    
  } catch (error) {
    console.error('Error checking for duplicates:', error)
    // In case of error, assume no duplicate to avoid blocking uploads
    return {
      isDuplicate: false,
      matchType: 'none'
    }
  }
}

/**
 * Smart duplicate detection with configurable behavior
 */
export interface DuplicateDetectionOptions {
  allowDuplicates?: boolean // If true, process anyway but warn
  skipProcessing?: boolean // If true, just link to existing document
  createCopy?: boolean // If true, create new document but mark as duplicate
}

export async function smartDuplicateCheck(
  supabase: any,
  tenantId: number,
  filename: string,
  fileBuffer: Buffer,
  options: DuplicateDetectionOptions = {}
): Promise<{
  shouldProcess: boolean
  duplicateInfo: DuplicateCheckResult
  action: 'process_new' | 'skip_duplicate' | 'process_copy' | 'link_existing'
}> {
  const duplicateInfo = await checkForDuplicates(supabase, tenantId, filename, fileBuffer)
  
  if (!duplicateInfo.isDuplicate) {
    return {
      shouldProcess: true,
      duplicateInfo,
      action: 'process_new'
    }
  }
  
  // Found duplicate - determine action based on options
  if (options.skipProcessing) {
    return {
      shouldProcess: false,
      duplicateInfo,
      action: 'link_existing'
    }
  }
  
  if (options.createCopy) {
    return {
      shouldProcess: true,
      duplicateInfo,
      action: 'process_copy'
    }
  }
  
  if (options.allowDuplicates) {
    return {
      shouldProcess: true,
      duplicateInfo,
      action: 'process_copy'
    }
  }
  
  // Default: skip processing for duplicates
  return {
    shouldProcess: false,
    duplicateInfo,
    action: 'skip_duplicate'
  }
}