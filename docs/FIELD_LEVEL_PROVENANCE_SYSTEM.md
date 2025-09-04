# Sistema de Field-Level Provenance Metadata

## Resumen

El sistema de Field-Level Provenance Metadata permite rastrear qué modelo contribuyó a cada valor de campo en el consenso final. Esto proporciona transparencia completa sobre el origen de cada dato extraído y facilita el debugging y la auditoría del sistema.

## Características Principales

### 🔍 **Rastreo de Provenance por Campo**
- **Modelo de origen**: Identifica qué modelo AI extrajo cada campo
- **Confianza del modelo**: Nivel de confianza específico por campo
- **Método de extracción**: Técnica utilizada (API, OCR, etc.)
- **Contexto de extracción**: Información adicional sobre la extracción
- **Timestamp**: Momento exacto de la extracción

### 📊 **Metadata de Consenso**
- **Nivel de acuerdo**: Porcentaje de acuerdo entre modelos
- **Resolución de conflictos**: Cómo se resolvieron las discrepancias
- **Contribuciones por modelo**: Mapeo de qué modelo contribuyó a cada campo
- **Tiempo de procesamiento**: Métricas de rendimiento

### 🗄️ **Almacenamiento en Base de Datos**
- **Tabla `field_provenance`**: Metadata por campo individual
- **Tabla `line_item_provenance`**: Metadata para elementos de línea
- **Tabla `consensus_metadata`**: Metadata del proceso de consenso

## Arquitectura del Sistema

### 1. **Esquema de Base de Datos**

```sql
-- Field-Level Provenance Metadata
CREATE TABLE field_provenance (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  document_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  model TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  method TEXT NOT NULL,
  model_version TEXT,
  processing_time_ms INTEGER,
  raw_value TEXT,
  extraction_context JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Line Item Provenance Metadata
CREATE TABLE line_item_provenance (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  document_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  field_name TEXT NOT NULL,
  field_value TEXT,
  model TEXT NOT NULL,
  confidence NUMERIC(5,2) NOT NULL,
  method TEXT NOT NULL,
  model_version TEXT,
  processing_time_ms INTEGER,
  raw_value TEXT,
  extraction_context JSONB DEFAULT '{}',
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Consensus Metadata
CREATE TABLE consensus_metadata (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL,
  document_id TEXT NOT NULL UNIQUE,
  total_models INTEGER NOT NULL,
  agreement_level NUMERIC(5,2) NOT NULL,
  conflict_resolution TEXT NOT NULL,
  final_confidence NUMERIC(5,2) NOT NULL,
  model_contributions JSONB NOT NULL,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **Servicio de Provenance Manager**

```typescript
export class ProvenanceManager {
  // Almacenar metadata de provenance por campo
  async storeFieldProvenance(
    tenantId: number,
    documentId: string,
    fieldName: string,
    fieldValue: string,
    provenance: FieldProvenance
  ): Promise<void>

  // Almacenar metadata de provenance para elementos de línea
  async storeLineItemProvenance(
    tenantId: number,
    documentId: string,
    rowIndex: number,
    fieldName: string,
    fieldValue: string,
    provenance: FieldProvenance
  ): Promise<void>

  // Almacenar metadata de consenso
  async storeConsensusMetadata(
    tenantId: number,
    documentId: string,
    totalModels: number,
    agreementLevel: number,
    conflictResolution: string,
    finalConfidence: number,
    modelContributions: { [field: string]: string },
    processingTimeMs?: number
  ): Promise<void>

  // Obtener provenance completa de un documento
  async getDocumentProvenance(
    tenantId: number,
    documentId: string
  ): Promise<{
    fieldProvenance: DBFieldProvenance[];
    lineItemProvenance: DBLineItemProvenance[];
    consensusMetadata: DBConsensusMetadata | null;
  }>
}
```

### 3. **API Endpoints**

#### **GET /api/provenance**
Obtiene metadata de provenance para un documento específico.

**Parámetros:**
- `documentId`: ID del documento

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "fieldProvenance": [...],
    "lineItemProvenance": [...],
    "consensusMetadata": {...}
  }
}
```

#### **POST /api/provenance**
Almacena metadata de provenance para un documento.

**Body:**
```json
{
  "documentId": "doc_123",
  "extractionResult": {
    "data": {...},
    "agentResults": {
      "extractor": {
        "provenance": {...},
        "lineItemProvenance": [...],
        "consensusMetadata": {...}
      }
    }
  }
}
```

#### **GET /api/provenance/statistics**
Obtiene estadísticas de provenance para un tenant.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "totalDocuments": 150,
    "totalFields": 2250,
    "totalLineItems": 450,
    "modelDistribution": {
      "gemini-2.5-flash": 1200,
      "gpt-4": 800,
      "consensus": 250
    },
    "averageConfidence": 0.85,
    "processingTimeStats": {
      "average": 1250,
      "min": 800,
      "max": 2100
    }
  }
}
```

### 4. **Componente de Debugging**

El componente `ProvenanceDebugger` proporciona una interfaz visual para inspeccionar la metadata de provenance:

```typescript
interface ProvenanceDebuggerProps {
  documentId: string;
  tenantId: number;
  onError?: (error: string) => void;
}
```

**Características:**
- **Vista por pestañas**: Campos, Elementos de línea, Consenso
- **Indicadores de confianza**: Código de colores para niveles de confianza
- **Exportación de datos**: Descarga de metadata en formato JSON
- **Contexto de extracción**: Información detallada sobre la extracción
- **Valores raw**: Visualización de valores originales extraídos

## Integración con Agentes de Extracción

### 1. **AgentExtractorGemini**

```typescript
// Track field-level provenance with detailed metadata
const provenance: { [field: string]: any } = {};
const timestamp = new Date();

for (const [field, value] of Object.entries(cleanData)) {
  provenance[field] = {
    model: "gemini-2.5-flash",
    confidence: value ? 0.85 : 0.3,
    method: "genai_api",
    timestamp: timestamp,
    rawValue: String(value || ''),
    processingTime: 0,
    modelVersion: "2.5-flash",
    extractionContext: {
      pageNumber: 1,
      ocrConfidence: 0.95,
      boundingBox: { x: 100, y: 200, width: 300, height: 50 }
    }
  };
}
```

### 2. **CloudDocumentProcessor**

```typescript
// Build model contributions map
const modelContributions: { [field: string]: string } = {};
const fieldNames = Object.keys(mergedData) as Array<keyof typeof mergedData>;

fieldNames.forEach(fieldName => {
  const fieldValue = mergedData[fieldName];
  const contributingModel = this.findContributingModel(fieldName, fieldValue, results);
  modelContributions[fieldName] = contributingModel;
});

// Store consensus metadata
await provenanceManager.storeConsensusMetadata(
  tenantId,
  documentId,
  results.length,
  agreementLevel,
  conflictResolution,
  consensusConfidence,
  modelContributions,
  processingTimeMs
);
```

## Casos de Uso

### 1. **Debugging de Extracciones**
- Identificar qué modelo falló en campos específicos
- Analizar patrones de confianza por modelo
- Rastrear el origen de valores incorrectos

### 2. **Auditoría y Cumplimiento**
- Proporcionar trazabilidad completa de datos
- Demostrar el origen de cada valor extraído
- Cumplir con requisitos de auditoría

### 3. **Optimización de Modelos**
- Identificar campos donde un modelo es más confiable
- Analizar métricas de rendimiento por modelo
- Mejorar la lógica de consenso

### 4. **Análisis de Calidad**
- Medir la calidad de extracción por campo
- Identificar documentos problemáticos
- Optimizar el pipeline de procesamiento

## Configuración

### Variables de Entorno

```bash
# Configuración de base de datos
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Configuración de modelos AI
GOOGLE_AI_API_KEY=your_google_ai_key
OPENAI_API_KEY=your_openai_key
```

### Configuración de Drizzle

```typescript
// server/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { SUPABASE_URL } from './config';
import * as schema from '../shared/schema';

const connectionString = SUPABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

## Mantenimiento

### Limpieza de Datos Antiguos

```typescript
// Limpiar metadata de provenance antigua (más de 90 días)
await provenanceManager.cleanupOldProvenance(tenantId, 90);
```

### Monitoreo de Rendimiento

- **Métricas de almacenamiento**: Tamaño de tablas de provenance
- **Tiempo de consulta**: Rendimiento de búsquedas de metadata
- **Uso de memoria**: Impacto en el rendimiento del sistema

## Mejores Prácticas

### 1. **Almacenamiento Eficiente**
- Usar índices en campos de búsqueda frecuente
- Implementar particionado por fecha para tablas grandes
- Limpiar datos antiguos regularmente

### 2. **Privacidad y Seguridad**
- Enmascarar datos sensibles en logs de debugging
- Implementar control de acceso a metadata
- Cifrar datos sensibles en contexto de extracción

### 3. **Rendimiento**
- Usar consultas asíncronas para almacenamiento
- Implementar caché para consultas frecuentes
- Optimizar consultas de estadísticas

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**
   - Verificar variables de entorno de Supabase
   - Comprobar conectividad de red

2. **Metadata faltante**
   - Verificar que los agentes estén configurados correctamente
   - Comprobar que el ProvenanceManager esté siendo llamado

3. **Rendimiento lento**
   - Revisar índices de base de datos
   - Considerar particionado de tablas
   - Optimizar consultas de metadata

### Logs de Debugging

```typescript
// Habilitar logs detallados
console.log('Provenance metadata stored:', {
  documentId,
  fieldCount: Object.keys(provenance).length,
  processingTime: Date.now() - startTime
});
```

## Conclusión

El sistema de Field-Level Provenance Metadata proporciona transparencia completa sobre el origen de cada dato extraído, facilitando el debugging, la auditoría y la optimización del sistema de extracción de documentos. La implementación es robusta, escalable y sigue las mejores prácticas de desarrollo.


