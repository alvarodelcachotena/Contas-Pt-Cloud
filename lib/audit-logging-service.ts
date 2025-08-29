import { createClient } from '@supabase/supabase-js';
import { ragQueryLog, type InsertRagQueryLog } from '../shared/schema';
import { v4 as uuidv4 } from 'uuid';

export interface RAGQueryLogData {
  tenantId: number;
  userId?: number;
  sessionId?: string;
  queryText: string;
  queryType?: string;
  queryParameters?: Record<string, any>;
  totalResults: number;
  vectorHitIds: number[];
  similarityScores: number[];
  processingTimeMs: number;
  embeddingModel?: string;
  cacheHit: boolean;
  cacheKey?: string;
  responseTimeMs: number;
  tokensUsed?: number;
  costEstimate?: number;
  userAgent?: string;
  ipAddress?: string;
  requestHeaders?: Record<string, any>;
}

export interface AuditLogStats {
  totalQueries: number;
  uniqueUsers: number;
  avgResponseTime: number;
  cacheHitRate: number;
  topQueries: string[];
  queryTypes: Record<string, number>;
  performanceMetrics: {
    avgProcessingTime: number;
    avgTokensUsed: number;
    totalCostEstimate: number;
  };
}

export interface ExportOptions {
  format: 'json' | 'csv';
  startDate?: Date;
  endDate?: Date;
  tenantId?: number;
}

export class AuditLoggingService {
  private supabase: any;
  private isEnabled: boolean = true;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Log a RAG query for audit purposes
   */
  async logRAGQuery(logData: RAGQueryLogData): Promise<{ success: boolean; logId?: string; error?: string }> {
    if (!this.isEnabled) {
      return { success: true, logId: 'audit-disabled' };
    }

    try {
      const logEntry: InsertRagQueryLog = {
        tenantId: logData.tenantId,
        userId: logData.userId || null,
        sessionId: logData.sessionId || null,
        queryText: logData.queryText,
        queryType: logData.queryType || 'semantic_search',
        queryParameters: logData.queryParameters || {},
        totalResults: logData.totalResults,
        vectorHitIds: logData.vectorHitIds.map((id: number) => id.toString()),
        similarityScores: logData.similarityScores.map((score: number) => score.toString()),
        processingTimeMs: logData.processingTimeMs,
        embeddingModel: logData.embeddingModel || null,
        cacheHit: logData.cacheHit,
        cacheKey: logData.cacheKey || null,
        responseTimeMs: logData.responseTimeMs,
        tokensUsed: logData.tokensUsed || null,
        costEstimate: logData.costEstimate ? logData.costEstimate.toString() : null,
        userAgent: logData.userAgent || null,
        ipAddress: logData.ipAddress || null,
        requestHeaders: logData.requestHeaders || {}
      };

      const { data, error } = await this.supabase
        .from('rag_query_log')
        .insert(logEntry)
        .select('id')
        .single();

      if (error) {
        console.error('❌ Failed to log RAG query:', error);
        return { success: false, error: error.message };
      }

      console.log(`📝 RAG query logged: ${data.id}`);
      return { success: true, logId: data.id };

    } catch (error) {
      console.error('❌ Error logging RAG query:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditLogStats(
    tenantId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ success: boolean; stats?: AuditLogStats; error?: string }> {
    try {
      let query = this.supabase.rpc('get_rag_query_stats');
      
      if (tenantId) {
        query = query.eq('p_tenant_id', tenantId);
      }
      if (startDate) {
        query = query.eq('p_start_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.eq('p_end_date', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        // Fallback to manual query if RPC fails
        return await this.getAuditLogStatsManual(tenantId, startDate, endDate);
      }

      if (!data || data.length === 0) {
        return { success: true, stats: this.getEmptyStats() };
      }

      const stats = data[0];
      return {
        success: true,
        stats: {
          totalQueries: parseInt(stats.total_queries) || 0,
          uniqueUsers: parseInt(stats.unique_users) || 0,
          avgResponseTime: parseFloat(stats.avg_response_time) || 0,
          cacheHitRate: parseFloat(stats.cache_hit_rate) || 0,
          topQueries: stats.top_queries || [],
          queryTypes: stats.query_types || {},
          performanceMetrics: {
            avgProcessingTime: parseFloat(stats.performance_metrics?.avg_processing_time) || 0,
            avgTokensUsed: parseFloat(stats.performance_metrics?.avg_tokens_used) || 0,
            totalCostEstimate: parseFloat(stats.performance_metrics?.total_cost_estimate) || 0
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting audit log stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Manual fallback for getting audit log stats
   */
  private async getAuditLogStatsManual(
    tenantId?: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ success: boolean; stats?: AuditLogStats; error?: string }> {
    try {
      let query = this.supabase
        .from('rag_query_log')
        .select('*');

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return { success: true, stats: this.getEmptyStats() };
      }

      // Calculate stats manually
      const totalQueries = data.length;
      const uniqueUsers = new Set(data.filter((log: any) => log.user_id).map((log: any) => log.user_id)).size;
      const avgResponseTime = data.reduce((sum: number, log: any) => sum + (log.response_time_ms || 0), 0) / totalQueries;
      const cacheHitRate = (data.filter((log: any) => log.cache_hit).length / totalQueries) * 100;

      // Get top queries
      const queryCounts: Record<string, number> = {};
      data.forEach((log: any) => {
        queryCounts[log.query_text] = (queryCounts[log.query_text] || 0) + 1;
      });
      const topQueries = Object.entries(queryCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([query]) => query);

      // Get query types
      const queryTypes: Record<string, number> = {};
      data.forEach((log: any) => {
        queryTypes[log.query_type] = (queryTypes[log.query_type] || 0) + 1;
      });

      // Get performance metrics
      const avgProcessingTime = data.reduce((sum: number, log: any) => sum + (log.processing_time_ms || 0), 0) / totalQueries;
      const avgTokensUsed = data.reduce((sum: number, log: any) => sum + (log.tokens_used || 0), 0) / totalQueries;
      const totalCostEstimate = data.reduce((sum: number, log: any) => sum + parseFloat(log.cost_estimate || '0'), 0);

      return {
        success: true,
        stats: {
          totalQueries,
          uniqueUsers,
          avgResponseTime,
          cacheHitRate,
          topQueries,
          queryTypes,
          performanceMetrics: {
            avgProcessingTime,
            avgTokensUsed,
            totalCostEstimate
          }
        }
      };

    } catch (error) {
      console.error('❌ Error in manual stats calculation:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Export audit logs for analysis
   */
  async exportAuditLogs(options: ExportOptions): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      let query = this.supabase.rpc('export_rag_query_logs');
      
      if (options.tenantId) {
        query = query.eq('p_tenant_id', options.tenantId);
      }
      if (options.startDate) {
        query = query.eq('p_start_date', options.startDate.toISOString());
      }
      if (options.endDate) {
        query = query.eq('p_end_date', options.endDate.toISOString());
      }
      if (options.format) {
        query = query.eq('p_format', options.format);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback to manual export if RPC fails
        return await this.exportAuditLogsManual(options);
      }

      return { success: true, data };

    } catch (error) {
      console.error('❌ Error exporting audit logs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Manual fallback for exporting audit logs
   */
  private async exportAuditLogsManual(options: ExportOptions): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      let query = this.supabase
        .from('rag_query_log')
        .select('*');

      if (options.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (options.format === 'csv') {
        const csvData = this.convertToCSV(data);
        return { success: true, data: csvData };
      } else {
        const jsonData = JSON.stringify(data, null, 2);
        return { success: true, data: jsonData };
      }

    } catch (error) {
      console.error('❌ Error in manual export:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map((row: any) => 
        headers.map((header: string) => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ];

    return csvRows.join('\n');
  }

  /**
   * Clean old audit logs (retention policy)
   */
  async cleanOldLogs(daysToKeep: number = 90, tenantId?: number): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      let query = this.supabase.rpc('clean_old_rag_logs');
      
      if (daysToKeep) {
        query = query.eq('p_days_to_keep', daysToKeep);
      }
      if (tenantId) {
        query = query.eq('p_tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        // Fallback to manual cleanup if RPC fails
        return await this.cleanOldLogsManual(daysToKeep, tenantId);
      }

      return { success: true, deletedCount: data };

    } catch (error) {
      console.error('❌ Error cleaning old logs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Manual fallback for cleaning old logs
   */
  private async cleanOldLogsManual(daysToKeep: number, tenantId?: number): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      let query = this.supabase
        .from('rag_query_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, deletedCount: data?.length || 0 };

    } catch (error) {
      console.error('❌ Error in manual cleanup:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(
    limit: number = 100,
    tenantId?: number
  ): Promise<{ success: boolean; logs?: any[]; error?: string }> {
    try {
      let query = this.supabase
        .from('rag_query_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, logs: data || [] };

    } catch (error) {
      console.error('❌ Error getting recent logs:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Enable/disable audit logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`📝 Audit logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if audit logging is enabled
   */
  isAuditLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Get empty stats structure
   */
  private getEmptyStats(): AuditLogStats {
    return {
      totalQueries: 0,
      uniqueUsers: 0,
      avgResponseTime: 0,
      cacheHitRate: 0,
      topQueries: [],
      queryTypes: {},
      performanceMetrics: {
        avgProcessingTime: 0,
        avgTokensUsed: 0,
        totalCostEstimate: 0
      }
    };
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService();
