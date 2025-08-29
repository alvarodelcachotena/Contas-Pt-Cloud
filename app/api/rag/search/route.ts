import { NextRequest, NextResponse } from 'next/server';
import { ragService, type RAGQuery } from '../../../../lib/rag-service';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      tenantId, 
      topK, 
      similarityThreshold, 
      includeMetadata, 
      includeContent,
      filters = {},
      sortBy = 'similarity'
    } = body;

    // Validate required fields
    if (!query || !tenantId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'query and tenantId are required' 
        },
        { status: 400 }
      );
    }

    // Validate tenantId
    const tenantIdNum = parseInt(tenantId.toString());
    if (isNaN(tenantIdNum) || tenantIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'tenantId must be a positive integer' 
        },
        { status: 400 }
      );
    }

    // Validate optional parameters
    const validatedTopK = topK ? Math.max(1, Math.min(100, parseInt(topK.toString()) || 10)) : 10;
    const validatedThreshold = similarityThreshold ? 
      Math.max(0.1, Math.min(1.0, parseFloat(similarityThreshold.toString()) || 0.6)) : 0.6;

    // Validate filters
    const validatedFilters = validateFilters(filters);
    if (!validatedFilters.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: validatedFilters.error 
        },
        { status: 400 }
      );
    }

    // Validate sort options
    const validSortFields = ['similarity', 'filename', 'documentType', 'createdAt'];
    const validatedSortBy = validSortFields.includes(sortBy) ? sortBy : 'similarity';

    // Create RAG query object
    const ragQuery: RAGQuery = {
      query: query.trim(),
      tenantId: tenantIdNum,
      topK: validatedTopK,
      similarityThreshold: validatedThreshold,
      includeMetadata: Boolean(includeMetadata),
      includeContent: Boolean(includeContent)
    };

    // Execute RAG query
    const result = await ragService.query(ragQuery);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'RAG query failed' 
        },
        { status: 500 }
      );
    }

    // Apply additional filters and sorting
    const filteredAndSorted = applyFiltersAndSorting(
      result.documents,
      validatedFilters.filters,
      validatedSortBy
    );

    // Return enhanced response
    return NextResponse.json({
      success: true,
      data: {
        ...result,
        documents: filteredAndSorted,
        totalResults: filteredAndSorted.length,
        filters: validatedFilters.filters,
        sortBy: validatedSortBy,
        originalResults: result.totalResults
      }
    });

  } catch (error) {
    console.error('Error in RAG search endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Validate search filters
 */
function validateFilters(filters: any): { valid: boolean; filters?: any; error?: string } {
  try {
    const validated: any = {};

    // Document type filter
    if (filters.documentType) {
      if (typeof filters.documentType === 'string') {
        validated.documentType = filters.documentType.trim();
      } else if (Array.isArray(filters.documentType)) {
        validated.documentType = filters.documentType
          .filter((type: any) => typeof type === 'string')
          .map((type: string) => type.trim());
      } else {
        return { valid: false, error: 'documentType must be string or array of strings' };
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      if (startDate && !isValidDate(startDate)) {
        return { valid: false, error: 'startDate must be a valid ISO date string' };
      }
      if (endDate && !isValidDate(endDate)) {
        return { valid: false, error: 'endDate must be a valid ISO date string' };
      }
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return { valid: false, error: 'startDate must be before endDate' };
      }
      validated.dateRange = { startDate, endDate };
    }

    // Similarity range filter
    if (filters.similarityRange) {
      const { min, max } = filters.similarityRange;
      if (min !== undefined && (typeof min !== 'number' || min < 0 || min > 1)) {
        return { valid: false, error: 'min similarity must be a number between 0 and 1' };
      }
      if (max !== undefined && (typeof max !== 'number' || max < 0 || max > 1)) {
        return { valid: false, error: 'max similarity must be a number between 0 and 1' };
      }
      if (min !== undefined && max !== undefined && min > max) {
        return { valid: false, error: 'min similarity must be less than max similarity' };
      }
      validated.similarityRange = { min, max };
    }

    // Metadata filter
    if (filters.metadata) {
      if (typeof filters.metadata === 'object' && filters.metadata !== null) {
        validated.metadata = filters.metadata;
      } else {
        return { valid: false, error: 'metadata must be an object' };
      }
    }

    // Content length filter
    if (filters.contentLength) {
      const { min, max } = filters.contentLength;
      if (min !== undefined && (typeof min !== 'number' || min < 0)) {
        return { valid: false, error: 'min content length must be a positive number' };
      }
      if (max !== undefined && (typeof max !== 'number' || max < 0)) {
        return { valid: false, error: 'max content length must be a positive number' };
      }
      if (min !== undefined && max !== undefined && min > max) {
        return { valid: false, error: 'min content length must be less than max content length' };
      }
      validated.contentLength = { min, max };
    }

    return { valid: true, filters: validated };

  } catch (error) {
    return { valid: false, error: 'Invalid filter format' };
  }
}

/**
 * Check if string is valid ISO date
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Apply filters and sorting to search results
 */
function applyFiltersAndSorting(
  documents: any[],
  filters: any,
  sortBy: string
): any[] {
  let filtered = [...documents];

  // Apply document type filter
  if (filters.documentType) {
    if (Array.isArray(filters.documentType)) {
      filtered = filtered.filter(doc => 
        filters.documentType.includes(doc.documentType)
      );
    } else {
      filtered = filtered.filter(doc => 
        doc.documentType === filters.documentType
      );
    }
  }

  // Apply date range filter
  if (filters.dateRange) {
    const { startDate, endDate } = filters.dateRange;
    filtered = filtered.filter(doc => {
      if (doc.metadata?.generated_at) {
        const docDate = new Date(doc.metadata.generated_at);
        if (startDate && docDate < new Date(startDate)) return false;
        if (endDate && docDate > new Date(endDate)) return false;
      }
      return true;
    });
  }

  // Apply similarity range filter
  if (filters.similarityRange) {
    const { min, max } = filters.similarityRange;
    filtered = filtered.filter(doc => {
      if (min !== undefined && doc.similarity < min) return false;
      if (max !== undefined && doc.similarity > max) return false;
      return true;
    });
  }

  // Apply metadata filter
  if (filters.metadata) {
    filtered = filtered.filter(doc => {
      if (!doc.metadata) return false;
      
      for (const [key, value] of Object.entries(filters.metadata)) {
        if (doc.metadata[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  // Apply content length filter
  if (filters.contentLength) {
    const { min, max } = filters.contentLength;
    filtered = filtered.filter(doc => {
      const contentLength = doc.content?.length || doc.highlightedMatch?.length || 0;
      if (min !== undefined && contentLength < min) return false;
      if (max !== undefined && contentLength > max) return false;
      return true;
    });
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'similarity':
        return b.similarity - a.similarity;
      case 'filename':
        return a.filename.localeCompare(b.filename);
      case 'documentType':
        return a.documentType.localeCompare(b.documentType);
      case 'createdAt':
        const dateA = a.metadata?.generated_at ? new Date(a.metadata.generated_at) : new Date(0);
        const dateB = b.metadata?.generated_at ? new Date(b.metadata.generated_at) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      default:
        return 0;
    }
  });

  return filtered;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'filter-options':
        // Get available filter options for the tenant
        const filterOptions = await getFilterOptions(searchParams.get('tenantId'));
        return NextResponse.json({ 
          success: true, 
          data: filterOptions 
        });

      case 'search-suggestions':
        // Get search suggestions based on existing documents
        const suggestions = await getSearchSuggestions(searchParams.get('tenantId'));
        return NextResponse.json({ 
          success: true, 
          data: suggestions 
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Use: filter-options, search-suggestions' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in RAG search GET endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get available filter options for a tenant
 */
async function getFilterOptions(tenantId: string | null): Promise<any> {
  if (!tenantId) {
    return { error: 'tenantId is required' };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Get document types
    const { data: documentTypes } = await supabase
      .from('documents_embedding')
      .select('document_type')
      .eq('tenant_id', parseInt(tenantId))
      .not('document_type', 'is', null);

    const uniqueTypes = Array.from(new Set(documentTypes?.map(d => d.document_type) || []));

    // Get date range
    const { data: dateRange } = await supabase
      .from('documents_embedding')
      .select('metadata')
      .eq('tenantId', parseInt(tenantId))
      .not('metadata->generated_at', 'is', null);

    const dates = dateRange
      ?.map(d => d.metadata?.generated_at)
      .filter(Boolean)
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime()) || [];

    return {
      documentTypes: uniqueTypes,
      dateRange: {
        min: dates[0]?.toISOString(),
        max: dates[dates.length - 1]?.toISOString()
      },
      similarityRange: {
        min: 0.1,
        max: 1.0
      }
    };

  } catch (error) {
    console.error('Error getting filter options:', error);
    return { error: 'Failed to get filter options' };
  }
}

/**
 * Get search suggestions based on existing documents
 */
async function getSearchSuggestions(tenantId: string | null): Promise<any> {
  if (!tenantId) {
    return { error: 'tenantId is required' };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    // Get recent queries and common terms
    const { data: recentDocuments } = await supabase
      .from('documents_embedding')
      .select('filename, document_type, metadata')
      .eq('tenant_id', parseInt(tenantId))
      .order('created_at', { ascending: false })
      .limit(20);

    const suggestions = {
      recentDocuments: recentDocuments?.map(d => ({
        filename: d.filename,
        type: d.document_type,
        metadata: d.metadata
      })) || [],
      commonTerms: [
        'invoice', 'receipt', 'contract', 'statement', 'tax',
        'payment', 'expense', 'revenue', 'balance', 'report'
      ],
      exampleQueries: [
        'Find invoices from last month',
        'Show all expense receipts',
        'Search for contracts with specific vendor',
        'Find tax documents for Q4',
        'Show payment confirmations'
      ]
    };

    return suggestions;

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return { error: 'Failed to get search suggestions' };
  }
}
