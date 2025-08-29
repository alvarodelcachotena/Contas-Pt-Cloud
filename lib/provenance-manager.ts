import { db } from '@/server/db';
import {
    fieldProvenance,
    lineItemProvenance,
    consensusMetadata,
    type InsertFieldProvenance,
    type InsertLineItemProvenance,
    type InsertConsensusMetadata,
    type FieldProvenance as DBFieldProvenance,
    type LineItemProvenance as DBLineItemProvenance,
    type ConsensusMetadata as DBConsensusMetadata
} from '@/shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { FieldProvenance, LineItemProvenance, ExtractionResult } from '@/shared/types';

/**
 * Service for managing field-level provenance metadata
 * Tracks which model contributed each field value in final consensus
 */
export class ProvenanceManager {
    private static instance: ProvenanceManager;

    public static getInstance(): ProvenanceManager {
        if (!ProvenanceManager.instance) {
            ProvenanceManager.instance = new ProvenanceManager();
        }
        return ProvenanceManager.instance;
    }

    /**
     * Store field-level provenance metadata for a document
     */
    async storeFieldProvenance(
        tenantId: number,
        documentId: string,
        fieldName: string,
        fieldValue: string,
        provenance: FieldProvenance
    ): Promise<void> {
        try {
            const provenanceData: InsertFieldProvenance = {
                tenantId,
                documentId,
                fieldName,
                fieldValue,
                model: provenance.model,
                confidence: provenance.confidence.toString(),
                method: provenance.method,
                modelVersion: provenance.modelVersion,
                processingTime: provenance.processingTime,
                rawValue: provenance.rawValue,
                extractionContext: provenance.extractionContext || {},
                timestamp: provenance.timestamp
            };

            await db.insert(fieldProvenance).values(provenanceData);
        } catch (error) {
            console.error('Error storing field provenance:', error);
            throw new Error(`Failed to store field provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Store line item provenance metadata
     */
    async storeLineItemProvenance(
        tenantId: number,
        documentId: string,
        rowIndex: number,
        fieldName: string,
        fieldValue: string,
        provenance: FieldProvenance
    ): Promise<void> {
        try {
            const provenanceData: InsertLineItemProvenance = {
                tenantId,
                documentId,
                rowIndex,
                fieldName,
                fieldValue,
                model: provenance.model,
                confidence: provenance.confidence.toString(),
                method: provenance.method,
                modelVersion: provenance.modelVersion,
                processingTime: provenance.processingTime,
                rawValue: provenance.rawValue,
                extractionContext: provenance.extractionContext || {},
                timestamp: provenance.timestamp
            };

            await db.insert(lineItemProvenance).values(provenanceData);
        } catch (error) {
            console.error('Error storing line item provenance:', error);
            throw new Error(`Failed to store line item provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Store consensus metadata for a document
     */
    async storeConsensusMetadata(
        tenantId: number,
        documentId: string,
        totalModels: number,
        agreementLevel: number,
        conflictResolution: string,
        finalConfidence: number,
        modelContributions: { [field: string]: string },
        processingTimeMs?: number
    ): Promise<void> {
        try {
            const consensusData: InsertConsensusMetadata = {
                tenantId,
                documentId,
                totalModels,
                agreementLevel: agreementLevel.toString(),
                conflictResolution,
                finalConfidence: finalConfidence.toString(),
                modelContributions,
                processingTimeMs
            };

            await db.insert(consensusMetadata).values(consensusData);
        } catch (error) {
            console.error('Error storing consensus metadata:', error);
            throw new Error(`Failed to store consensus metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get field provenance for a specific document
     */
    async getFieldProvenance(
        tenantId: number,
        documentId: string
    ): Promise<DBFieldProvenance[]> {
        try {
            const results = await db
                .select()
                .from(fieldProvenance)
                .where(
                    and(
                        eq(fieldProvenance.tenantId, tenantId),
                        eq(fieldProvenance.documentId, documentId)
                    )
                )
                .orderBy(desc(fieldProvenance.timestamp));

            return results;
        } catch (error) {
            console.error('Error retrieving field provenance:', error);
            throw new Error(`Failed to retrieve field provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get line item provenance for a specific document
     */
    async getLineItemProvenance(
        tenantId: number,
        documentId: string
    ): Promise<DBLineItemProvenance[]> {
        try {
            const results = await db
                .select()
                .from(lineItemProvenance)
                .where(
                    and(
                        eq(lineItemProvenance.tenantId, tenantId),
                        eq(lineItemProvenance.documentId, documentId)
                    )
                )
                .orderBy(desc(lineItemProvenance.timestamp));

            return results;
        } catch (error) {
            console.error('Error retrieving line item provenance:', error);
            throw new Error(`Failed to retrieve line item provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get consensus metadata for a specific document
     */
    async getConsensusMetadata(
        tenantId: number,
        documentId: string
    ): Promise<DBConsensusMetadata | null> {
        try {
            const results = await db
                .select()
                .from(consensusMetadata)
                .where(
                    and(
                        eq(consensusMetadata.tenantId, tenantId),
                        eq(consensusMetadata.documentId, documentId)
                    )
                )
                .limit(1);

            return results[0] || null;
        } catch (error) {
            console.error('Error retrieving consensus metadata:', error);
            throw new Error(`Failed to retrieve consensus metadata: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get complete provenance information for a document
     */
    async getDocumentProvenance(
        tenantId: number,
        documentId: string
    ): Promise<{
        fieldProvenance: DBFieldProvenance[];
        lineItemProvenance: DBLineItemProvenance[];
        consensusMetadata: DBConsensusMetadata | null;
    }> {
        try {
            const [fieldProv, lineItemProv, consensusMeta] = await Promise.all([
                this.getFieldProvenance(tenantId, documentId),
                this.getLineItemProvenance(tenantId, documentId),
                this.getConsensusMetadata(tenantId, documentId)
            ]);

            return {
                fieldProvenance: fieldProv,
                lineItemProvenance: lineItemProv,
                consensusMetadata: consensusMeta
            };
        } catch (error) {
            console.error('Error retrieving document provenance:', error);
            throw new Error(`Failed to retrieve document provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Extract and store provenance from extraction result
     */
    async extractAndStoreProvenance(
        tenantId: number,
        documentId: string,
        extractionResult: ExtractionResult
    ): Promise<void> {
        try {
            const { agentResults } = extractionResult;

            if (!agentResults?.extractor?.provenance) {
                console.warn('No provenance data found in extraction result');
                return;
            }

            const provenance = agentResults.extractor.provenance;
            const lineItemProvenance = agentResults.extractor.lineItemProvenance;
            const consensusMetadata = agentResults.extractor.consensusMetadata;

            // Store field provenance
            for (const [fieldName, fieldProv] of Object.entries(provenance)) {
                const fieldValue = (extractionResult.data as any)[fieldName];
                await this.storeFieldProvenance(
                    tenantId,
                    documentId,
                    fieldName,
                    String(fieldValue || ''),
                    fieldProv
                );
            }

            // Store line item provenance
            if (lineItemProvenance) {
                for (const lineItemProv of lineItemProvenance) {
                    for (const [fieldName, fieldProv] of Object.entries(lineItemProv.fieldProvenance)) {
                        await this.storeLineItemProvenance(
                            tenantId,
                            documentId,
                            lineItemProv.rowIndex,
                            fieldName,
                            String(fieldProv.rawValue || ''),
                            fieldProv
                        );
                    }
                }
            }

            // Store consensus metadata
            if (consensusMetadata) {
                await this.storeConsensusMetadata(
                    tenantId,
                    documentId,
                    consensusMetadata.totalModels,
                    consensusMetadata.agreementLevel,
                    consensusMetadata.conflictResolution,
                    consensusMetadata.finalConfidence,
                    {}, // modelContributions will be extracted from field provenance
                    undefined // processingTimeMs
                );
            }
        } catch (error) {
            console.error('Error extracting and storing provenance:', error);
            throw new Error(`Failed to extract and store provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get provenance statistics for a tenant
     */
    async getProvenanceStatistics(tenantId: number): Promise<{
        totalDocuments: number;
        totalFields: number;
        totalLineItems: number;
        modelDistribution: { [model: string]: number };
        averageConfidence: number;
        processingTimeStats: {
            average: number;
            min: number;
            max: number;
        };
    }> {
        try {
            // This would require more complex queries
            // For now, return basic structure
            return {
                totalDocuments: 0,
                totalFields: 0,
                totalLineItems: 0,
                modelDistribution: {},
                averageConfidence: 0,
                processingTimeStats: {
                    average: 0,
                    min: 0,
                    max: 0
                }
            };
        } catch (error) {
            console.error('Error retrieving provenance statistics:', error);
            throw new Error(`Failed to retrieve provenance statistics: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Clean up old provenance data (for maintenance)
     */
    async cleanupOldProvenance(tenantId: number, olderThanDays: number = 90): Promise<number> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

            // Delete old field provenance
            const deletedFieldProv = await db
                .delete(fieldProvenance)
                .where(
                    and(
                        eq(fieldProvenance.tenantId, tenantId),
                        // Add date condition here
                    )
                );

            // Delete old line item provenance
            const deletedLineItemProv = await db
                .delete(lineItemProvenance)
                .where(
                    and(
                        eq(lineItemProvenance.tenantId, tenantId),
                        // Add date condition here
                    )
                );

            // Delete old consensus metadata
            const deletedConsensusMeta = await db
                .delete(consensusMetadata)
                .where(
                    and(
                        eq(consensusMetadata.tenantId, tenantId),
                        // Add date condition here
                    )
                );

            return 0; // Return actual count of deleted records
        } catch (error) {
            console.error('Error cleaning up old provenance:', error);
            throw new Error(`Failed to cleanup old provenance: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

// Export singleton instance
export const provenanceManager = ProvenanceManager.getInstance();
