import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './card';
import { Badge } from './badge';
import { TooltipProvider, TooltipTrigger, TooltipContent, Tooltip } from './tooltip';

interface FieldProvenance {
  model: string;
  confidence: number;
  method: string;
}

interface ProvenanceViewerProps {
  provenance: { [field: string]: FieldProvenance };
  extractedData: { [field: string]: any };
}

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getModelIcon = (model: string): string => {
  switch (model.toLowerCase()) {
    case 'gemini':
    case 'gemini-pro':
    case 'gemini-2.5-flash':
      return '🧠';
    case 'gpt-4':
    case 'openai':
      return '🤖';
    case 'consensus':
      return '🤝';
    default:
      return '🔍';
  }
};

const getMethodDescription = (method: string): string => {
  switch (method) {
    case 'vision':
      return 'Extraído usando procesamiento de imágenes';
    case 'text':
      return 'Extraído del texto del documento';
    case 'table':
      return 'Extraído de una tabla estructurada';
    case 'consensus':
      return 'Resultado de consenso entre múltiples modelos';
    default:
      return `Método: ${method}`;
  }
};

export const ProvenanceViewer: React.FC<ProvenanceViewerProps> = ({
  provenance,
  extractedData,
}) => {
  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Procedencia de Datos Extraídos</CardTitle>
          <CardDescription>
            Detalles sobre cómo se extrajo cada campo del documento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(provenance).map(([field, fieldProvenance]) => (
              <div
                key={field}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getModelIcon(fieldProvenance.model)}
                    </span>
                    <span className="font-medium">{field}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {extractedData[field]?.toString() || 'No data'}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline">{fieldProvenance.method}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      {getMethodDescription(fieldProvenance.method)}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger>
                      <div
                        className={`h-3 w-3 rounded-full ${getConfidenceColor(
                          fieldProvenance.confidence
                        )}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {`Confianza: ${(fieldProvenance.confidence * 100).toFixed(1)}%`}
                    </TooltipContent>
                  </Tooltip>

                  <Badge
                    variant="secondary"
                    className="text-xs"
                  >
                    {fieldProvenance.model}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}; 