# ML-Based Confidence Score Calibration System

## Overview

El sistema de calibración de puntuaciones de confianza basado en ML reemplaza la fórmula estática tradicional con un modelo de aprendizaje automático que mejora continuamente su precisión basándose en datos de consenso y correcciones manuales.

## Características Principales

### 🔄 **Recolección Automática de Datos**
- **Datos de Consenso**: Recopila automáticamente resultados de múltiples modelos y sus niveles de acuerdo
- **Correcciones Manuales**: Registra las correcciones realizadas por usuarios y las usa para entrenar el modelo
- **Métricas de Calidad**: Evalúa la calidad del documento, OCR y extracción

### 🤖 **Modelo de ML Adaptativo**
- **Regresor Lineal**: Predice puntuaciones de confianza calibradas basándose en múltiples características
- **Entrenamiento Automático**: Se reentrena automáticamente cuando se acumulan suficientes datos
- **Validación Cruzada**: Evalúa el rendimiento en conjuntos de validación separados

### ⚙️ **Feature Toggles Configurables**
- **Learned Scoring**: Habilita/deshabilita el scoring basado en ML
- **Data Collection**: Controla la recolección de datos de consenso y correcciones
- **Auto-retraining**: Habilita el reentrenamiento automático del modelo

## Configuración

### Variables de Entorno

```bash
# Habilitar scoring basado en ML
ENABLE_ML_CONFIDENCE_SCORING=true

# Habilitar recolección de datos de consenso
ENABLE_CONSENSUS_DATA_COLLECTION=true

# Habilitar recolección de correcciones manuales
ENABLE_MANUAL_CORRECTION_COLLECTION=true

# Habilitar reentrenamiento automático
ENABLE_AUTOMATIC_RETRAINING=true

# Umbral para reentrenamiento (número de muestras)
ML_RETRAINING_THRESHOLD=100

# Habilitar persistencia del modelo
ENABLE_MODEL_PERSISTENCE=true

# Tamaño máximo de datos de entrenamiento
MAX_TRAINING_DATA_SIZE=1000
```

### Configuración en Código

```typescript
import { ML_CONFIDENCE_CONFIG } from './server/config';

// Verificar configuración
if (ML_CONFIDENCE_CONFIG.enableLearnedScoring) {
  console.log('ML confidence scoring enabled');
}
```

## Uso

### Inicialización

```typescript
import { ConfidenceCalibrator } from './server/agents/ConfidenceCalibrator';

const calibrator = new ConfidenceCalibrator(
  process.env.GOOGLE_AI_API_KEY!,
  true, // useMLCalibration
  manualCorrectionCollector // opcional
);
```

### Calibración de Confianza

```typescript
// Calibrar puntuación de confianza
const calibratedConfidence = await calibrator.calibrateConfidence(extractionResult);

// El sistema automáticamente:
// 1. Extrae características del documento
// 2. Aplica el modelo de ML si está habilitado
// 3. Cae en la fórmula tradicional si es necesario
```

### Recolección de Datos

```typescript
// Recolectar datos de consenso
await calibrator.collectConsensusData(
  documentId,
  tenantId,
  modelResults,
  finalResult
);

// Recolectar corrección manual
await calibrator.collectManualCorrection(
  documentId,
  tenantId,
  originalResult,
  correctedResult,
  correctionTime
);
```

### Gestión del Modelo

```typescript
// Obtener estado del modelo
const status = calibrator.getModelStatus();
console.log(`Model version: ${status.version}`);
console.log(`Training samples: ${status.trainingSamples}`);

// Actualizar feature flags
calibrator.updateFeatureFlags({
  enableLearnedScoring: false,
  retrainingThreshold: 50
});

// Reentrenar manualmente
await calibrator.retrainModel();

// Exportar/importar modelo
const exportedModel = calibrator.exportModel();
calibrator.importModel(exportedModel);
```

## Arquitectura del Modelo

### Características de Entrada

El modelo utiliza 8 características principales:

1. **Confianza del Modelo** (0-1): Puntuación de confianza original del modelo
2. **Acuerdo de Consenso** (0-1): Nivel de acuerdo entre múltiples modelos
3. **Completitud** (0-1): Porcentaje de campos requeridos extraídos
4. **Consistencia** (0-1): Coherencia lógica de los datos extraídos
5. **Plausibilidad** (0-1): Verosimilitud de los valores extraídos
6. **Calidad OCR** (0-1): Calidad del texto extraído por OCR
7. **Calidad de Imagen** (0-1): Calidad visual del documento
8. **Calidad de Estructura** (0-1): Organización y estructura del documento

### Algoritmo de Entrenamiento

```typescript
// Gradiente descendente simple
for (const sample of trainingData) {
  const prediction = this.predict(sample.features);
  const error = sample.label - prediction;

  // Actualizar pesos
  for (let i = 0; i < this.mlModel.weights.length; i++) {
    this.mlModel.weights[i] += this.learningRate * error * sample.features[i];
  }

  // Actualizar bias
  this.mlModel.bias += this.learningRate * error;
}
```

### Activación Sigmoidal

```typescript
private predict(features: number[]): number {
  let prediction = this.mlModel.bias;
  for (let i = 0; i < this.mlModel.weights.length; i++) {
    prediction += features[i] * this.mlModel.weights[i];
  }
  return 1 / (1 + Math.exp(-prediction)); // Sigmoid
}
```

## Monitoreo y Métricas

### Estadísticas del Modelo

```typescript
const stats = calibrator.getModelStatus();

// Rendimiento
console.log(`MSE: ${stats.performance.mse.toFixed(4)}`);
console.log(`Accuracy: ${stats.performance.accuracy.toFixed(3)}`);

// Datos de entrenamiento
console.log(`Training samples: ${stats.trainingSamples}`);
console.log(`Last trained: ${stats.lastTrained.toISOString()}`);
```

### Estadísticas de Datos

```typescript
const dataStats = calibrator.getDataStatistics();

console.log(`Consensus data: ${dataStats.consensusDataCount}`);
console.log(`Manual corrections: ${dataStats.manualCorrectionsCount}`);
console.log(`Training samples: ${dataStats.trainingDataCount}`);
```

## Comparación: Tradicional vs ML

### Fórmula Tradicional

```typescript
// Fórmula estática: avg * (0.7 + 0.3 * agreement)
const traditionalConfidence = baseConfidence * (0.7 + 0.3 * agreement);
```

### Fórmula ML

```typescript
// Fórmula aprendida: ML(features) + ajustes históricos
const mlConfidence = this.mlCalibration(features);

// Con ajuste por historial de correcciones
if (features.correctionHistory) {
  const historicalAccuracy = this.calculateHistoricalAccuracy();
  mlConfidence *= (0.8 + 0.2 * historicalAccuracy);
}
```

## Ventajas del Sistema ML

### 📈 **Mejora Continua**
- El modelo se adapta a patrones específicos del dominio
- Aprende de errores pasados para mejorar predicciones futuras
- Optimiza automáticamente los pesos de las características

### 🎯 **Precisión Adaptativa**
- Considera múltiples factores de calidad del documento
- Incorpora feedback de usuarios a través de correcciones
- Ajusta dinámicamente la confianza basándose en el contexto

### 🔧 **Flexibilidad Operacional**
- Feature toggles para control granular
- Fácil rollback a sistema tradicional si es necesario
- Monitoreo completo del rendimiento del modelo

## Consideraciones de Producción

### Rendimiento
- El modelo ML agrega ~1-2ms de latencia
- Los datos de entrenamiento se limitan a 1000 muestras para evitar problemas de memoria
- El reentrenamiento automático se ejecuta en background

### Robustez
- Fallback automático a fórmula tradicional si falla el ML
- Validación de entrada para todas las características
- Manejo de errores graceful en todas las operaciones

### Escalabilidad
- Los datos se almacenan en memoria (considerar persistencia para producción)
- El modelo se puede exportar/importar para despliegues distribuidos
- Los feature flags permiten rollouts graduales

## Roadmap Futuro

### 🚀 **Próximas Mejoras**
- **Modelos Avanzados**: Random Forest, Neural Networks
- **Persistencia de Datos**: Base de datos para datos de entrenamiento
- **A/B Testing**: Comparación automática de modelos
- **Ensemble Methods**: Combinación de múltiples modelos

### 🔮 **Características Avanzadas**
- **Transfer Learning**: Aprovechar modelos pre-entrenados
- **Online Learning**: Actualización incremental del modelo
- **Multi-tenant**: Modelos específicos por cliente
- **Explainability**: Interpretación de las predicciones del modelo

## Troubleshooting

### Problemas Comunes

#### Modelo no se entrena
```typescript
// Verificar configuración
const config = calibrator.getModelStatus().featureFlags;
console.log('Auto-retraining:', config.enableAutomaticRetraining);
console.log('Threshold:', config.retrainingThreshold);

// Verificar datos disponibles
const stats = calibrator.getDataStatistics();
console.log('Training samples:', stats.trainingDataCount);
```

#### Bajo rendimiento del modelo
```typescript
// Verificar métricas
const performance = calibrator.getModelStatus().performance;
console.log('MSE:', performance.mse);
console.log('Accuracy:', performance.accuracy);

// Reentrenar manualmente si es necesario
if (performance.accuracy < 0.7) {
  await calibrator.retrainModel();
}
```

#### Feature flags no funcionan
```typescript
// Verificar configuración actual
const currentFlags = calibrator.getModelStatus().featureFlags;
console.log('Current flags:', currentFlags);

// Actualizar flags
calibrator.updateFeatureFlags({
  enableLearnedScoring: true
});
```

## Conclusión

El sistema de calibración de confianza basado en ML representa una mejora significativa sobre la fórmula estática tradicional. Proporciona:

- **Mejor precisión** a través de aprendizaje continuo
- **Flexibilidad operacional** con feature toggles
- **Monitoreo completo** del rendimiento
- **Escalabilidad** para entornos de producción

La implementación actual utiliza un modelo lineal simple pero efectivo, con una arquitectura que permite futuras mejoras hacia modelos más sofisticados.

