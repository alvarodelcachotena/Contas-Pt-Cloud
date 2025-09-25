'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Cpu,
  Database
} from 'lucide-react';

interface FieldProvenance {
  model: string;
  confidence: number;
  method: string;
  timestamp: Date;
  rawValue?: string;
  processingTime?: number;
  modelVersion?: string;
  extractionContext?: {
    pageNumber?: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    ocrConfidence?: number;
  };
}

interface LineItemProvenance {
  rowIndex: number;
  fieldProvenance: {
    [field: string]: FieldProvenance;
  };
  overallConfidence: number;
  extractionMethod: string;
}

interface ConsensusMetadata {
  totalModels: number;
  agreementLevel: number;
  conflictResolution: string;
  finalConfidence: number;
}

interface ProvenanceData {
  fieldProvenance: { [field: string]: FieldProvenance };
  lineItemProvenance?: LineItemProvenance[];
  consensusMetadata?: ConsensusMetadata;
}

interface ProvenanceDebuggerProps {
  documentId: string;
  tenantId: number;
  onError?: (error: string) => void;
}

export function ProvenanceDebugger({ 
  documentId, 
  tenantId, 
  onError 
}: ProvenanceDebuggerProps) {
  const [provenanceData, setProvenanceData] = useState<ProvenanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawValues, setShowRawValues] = useState(false);
  const [activeTab, setActiveTab] = useState('fields');

  useEffect(() => {
    if (documentId) {
      fetchProvenanceData();
    }
  }, [documentId, tenantId]);

  const fetchProvenanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/provenance?documentId=${documentId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch provenance data: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProvenanceData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch provenance data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const exportProvenanceData = () => {
    if (!provenanceData) return;
    
    const exportData = {
      documentId,
      tenantId,
      timestamp: new Date().toISOString(),
      ...provenanceData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provenance-${documentId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4" />;
    if (confidence >= 0.6) return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatTimestamp = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatProcessingTime = (time?: number) => {
    if (!time) return 'N/A';
    return `${time}ms`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading provenance data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={fetchProvenanceData}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!provenanceData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No provenance data available for this document.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Field-Level Provenance Debugger</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawValues(!showRawValues)}
            >
              {showRawValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showRawValues ? 'Hide' : 'Show'} Raw Values
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportProvenanceData}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProvenanceData}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fields">Field Provenance</TabsTrigger>
            <TabsTrigger value="lineitems">Line Items</TabsTrigger>
            <TabsTrigger value="consensus">Consensus</TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="space-y-4">
            <div className="grid gap-4">
              {Object.entries(provenanceData.fieldProvenance).map(([fieldName, provenance]) => (
                <Card key={fieldName}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium capitalize">{fieldName}</h4>
                      <Badge className={getConfidenceColor(provenance.confidence)}>
                        {getConfidenceIcon(provenance.confidence)}
                        <span className="ml-1">{(provenance.confidence * 100).toFixed(1)}%</span>
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Model:</span>
                        <Badge variant="outline" className="ml-2">
                          {provenance.model}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Method:</span>
                        <span className="ml-2 text-gray-600">{provenance.method}</span>
                      </div>
                      <div>
                        <span className="font-medium">Timestamp:</span>
                        <span className="ml-2 text-gray-600">
                          {formatTimestamp(provenance.timestamp)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Processing Time:</span>
                        <span className="ml-2 text-gray-600">
                          {formatProcessingTime(provenance.processingTime)}
                        </span>
                      </div>
                    </div>

                    {showRawValues && provenance.rawValue && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <span className="font-medium text-sm">Raw Value:</span>
                        <pre className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                          {provenance.rawValue}
                        </pre>
                      </div>
                    )}

                    {provenance.extractionContext && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <span className="font-medium text-sm">Extraction Context:</span>
                        <div className="mt-1 text-sm text-gray-700">
                          {provenance.extractionContext.pageNumber && (
                            <div>Page: {provenance.extractionContext.pageNumber}</div>
                          )}
                          {provenance.extractionContext.ocrConfidence && (
                            <div>OCR Confidence: {(provenance.extractionContext.ocrConfidence * 100).toFixed(1)}%</div>
                          )}
                          {provenance.extractionContext.boundingBox && (
                            <div>
                              Bounding Box: ({provenance.extractionContext.boundingBox.x}, {provenance.extractionContext.boundingBox.y}) 
                              {provenance.extractionContext.boundingBox.width}×{provenance.extractionContext.boundingBox.height}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="lineitems" className="space-y-4">
            {provenanceData.lineItemProvenance && provenanceData.lineItemProvenance.length > 0 ? (
              <div className="space-y-4">
                {provenanceData.lineItemProvenance.map((lineItem, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Line Item {lineItem.rowIndex + 1}
                        <Badge className="ml-2" variant="outline">
                          {lineItem.extractionMethod}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {Object.entries(lineItem.fieldProvenance).map(([fieldName, provenance]) => (
                          <div key={fieldName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-medium capitalize">{fieldName}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{provenance.model}</Badge>
                              <Badge className={getConfidenceColor(provenance.confidence)}>
                                {(provenance.confidence * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No line item provenance data available.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="consensus" className="space-y-4">
            {provenanceData.consensusMetadata ? (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Consensus Metadata</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Total Models:</span>
                        <span className="ml-2">{provenanceData.consensusMetadata.totalModels}</span>
                      </div>
                      <div>
                        <span className="font-medium">Agreement Level:</span>
                        <Badge className="ml-2" variant="outline">
                          {(provenanceData.consensusMetadata.agreementLevel * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Conflict Resolution:</span>
                        <span className="ml-2">{provenanceData.consensusMetadata.conflictResolution}</span>
                      </div>
                      <div>
                        <span className="font-medium">Final Confidence:</span>
                        <Badge className={`ml-2 ${getConfidenceColor(provenanceData.consensusMetadata.finalConfidence)}`}>
                          {(provenanceData.consensusMetadata.finalConfidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No consensus metadata available.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}





