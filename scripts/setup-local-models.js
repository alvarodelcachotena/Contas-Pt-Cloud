#!/usr/bin/env node

/**
 * Setup Local Embedding Models for Contas-PT
 * This script helps configure InstructorXL and sentence-transformers locally
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function setupLocalModels() {
  console.log('🚀 Setting up Local Embedding Models for Contas-PT...\n');

  try {
    // Check if Python is available
    console.log('🐍 Step 1: Checking Python installation...');
    try {
      const pythonVersion = execSync('python --version', { encoding: 'utf8' });
      console.log('✅ Python found:', pythonVersion.trim());
    } catch (error) {
      try {
        const python3Version = execSync('python3 --version', { encoding: 'utf8' });
        console.log('✅ Python3 found:', python3Version.trim());
      } catch (error) {
        console.log('❌ Python not found. Please install Python 3.8+ first.');
        console.log('   Download from: https://www.python.org/downloads/');
        return;
      }
    }

    // Check if pip is available
    console.log('\n📦 Step 2: Checking pip installation...');
    try {
      const pipVersion = execSync('pip --version', { encoding: 'utf8' });
      console.log('✅ pip found:', pipVersion.trim());
    } catch (error) {
      try {
        const pip3Version = execSync('pip3 --version', { encoding: 'utf8' });
        console.log('✅ pip3 found:', pip3Version.trim());
      } catch (error) {
        console.log('❌ pip not found. Please install pip first.');
        return;
      }
    }

    // Create Python requirements file
    console.log('\n📋 Step 3: Creating Python requirements file...');
    const requirementsContent = `# Local Embedding Models for Contas-PT
# Install with: pip install -r requirements.txt

# Core dependencies
torch>=2.0.0
transformers>=4.30.0
sentence-transformers>=2.2.0
instructor-embedding>=1.0.0

# Additional utilities
numpy>=1.24.0
scikit-learn>=1.3.0
fastapi>=0.100.0
uvicorn>=0.23.0
python-multipart>=0.0.6

# Optional: GPU support (uncomment if you have CUDA)
# torch[cu118]>=2.0.0
`;

    writeFileSync('requirements-embeddings.txt', requirementsContent);
    console.log('✅ Created requirements-embeddings.txt');

    // Create Python server for local models
    console.log('\n🤖 Step 4: Creating Python embedding server...');
    const serverContent = `#!/usr/bin/env python3
"""
Local Embedding Server for Contas-PT
Provides InstructorXL and sentence-transformers embeddings via HTTP API
"""

import os
import json
import time
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

# Import embedding models
try:
    from sentence_transformers import SentenceTransformer
    from instructor_embedding import INSTRUCTOR
    MODELS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Some models not available: {e}")
    MODELS_AVAILABLE = False

app = FastAPI(title="Contas-PT Embedding Server", version="1.0.0")

# Global model instances
sentence_model = None
instructor_model = None

class EmbeddingRequest(BaseModel):
    text: str
    model: str = "sentence-transformers"  # or "instructor"
    instruction: str = ""  # For InstructorXL

class EmbeddingResponse(BaseModel):
    success: bool
    embedding: List[float] = []
    model: str = ""
    dimensions: int = 0
    processing_time: float = 0.0
    error: str = ""

def load_models():
    """Load embedding models into memory"""
    global sentence_model, instructor_model
    
    try:
        if MODELS_AVAILABLE:
            print("Loading sentence-transformers model...")
            sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            print("✅ sentence-transformers model loaded")
            
            print("Loading InstructorXL model...")
            instructor_model = INSTRUCTOR('hkunlp/instructor-xl')
            print("✅ InstructorXL model loaded")
        else:
            print("⚠️  Models not available, server will return errors")
    except Exception as e:
        print(f"❌ Error loading models: {e}")

@app.on_event("startup")
async def startup_event():
    """Load models when server starts"""
    load_models()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Contas-PT Embedding Server",
        "models_available": MODELS_AVAILABLE,
        "sentence_model_loaded": sentence_model is not None,
        "instructor_model_loaded": instructor_model is not None
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "models": {
            "sentence_transformers": sentence_model is not None,
            "instructor": instructor_model is not None
        }
    }

@app.post("/embed", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """Generate embedding for text"""
    start_time = time.time()
    
    try:
        if request.model == "sentence-transformers":
            if not sentence_model:
                raise HTTPException(status_code=500, detail="sentence-transformers model not loaded")
            
            embedding = sentence_model.encode(request.text)
            dimensions = len(embedding)
            
            return EmbeddingResponse(
                success=True,
                embedding=embedding.tolist(),
                model="sentence-transformers",
                dimensions=dimensions,
                processing_time=time.time() - start_time
            )
            
        elif request.model == "instructor":
            if not instructor_model:
                raise HTTPException(status_code=500, detail="InstructorXL model not loaded")
            
            # InstructorXL expects instruction + text format
            instruction_text = f"{request.instruction} {request.text}" if request.instruction else request.text
            embedding = instructor_model.encode(instruction_text)
            dimensions = len(embedding)
            
            return EmbeddingResponse(
                success=True,
                embedding=embedding.tolist(),
                model="instructor-xl",
                dimensions=dimensions,
                processing_time=time.time() - start_time
            )
            
        else:
            raise HTTPException(status_code=400, detail=f"Unknown model: {request.model}")
            
    except Exception as e:
        return EmbeddingResponse(
            success=False,
            error=str(e),
            processing_time=time.time() - start_time
        )

@app.get("/models")
async def list_models():
    """List available models"""
    return {
        "available_models": [
            {
                "name": "sentence-transformers",
                "type": "local",
                "loaded": sentence_model is not None,
                "default_dimensions": 384
            },
            {
                "name": "instructor",
                "type": "local",
                "loaded": instructor_model is not None,
                "default_dimensions": 768
            }
        ]
    }

if __name__ == "__main__":
    print("🚀 Starting Contas-PT Embedding Server...")
    print("📖 API Documentation: http://localhost:8001/docs")
    print("🔍 Health Check: http://localhost:8001/health")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
`;

    writeFileSync('embedding-server.py', serverContent);
    console.log('✅ Created embedding-server.py');

    // Create startup script
    console.log('\n📜 Step 5: Creating startup scripts...');
    
    const startScriptContent = `@echo off
echo Starting Contas-PT Embedding Server...
echo.
echo Make sure you have installed the requirements:
echo pip install -r requirements-embeddings.txt
echo.
echo Starting server on http://localhost:8001
echo Press Ctrl+C to stop
echo.
python embedding-server.py
pause
`;

    writeFileSync('start-embedding-server.bat', startScriptContent);
    console.log('✅ Created start-embedding-server.bat (Windows)');

    const startScriptUnixContent = `#!/bin/bash
echo "Starting Contas-PT Embedding Server..."
echo ""
echo "Make sure you have installed the requirements:"
echo "pip install -r requirements-embeddings.txt"
echo ""
echo "Starting server on http://localhost:8001"
echo "Press Ctrl+C to stop"
echo ""
python3 embedding-server.py
`;

    writeFileSync('start-embedding-server.sh', startScriptUnixContent);
    console.log('✅ Created start-embedding-server.sh (Unix/Linux)');

    // Make Unix script executable
    try {
      execSync('chmod +x start-embedding-server.sh');
      console.log('✅ Made start-embedding-server.sh executable');
    } catch (error) {
      console.log('ℹ️  Could not make script executable (Windows environment)');
    }

    // Create environment configuration
    console.log('\n⚙️  Step 6: Creating environment configuration...');
    
    const envContent = `# Local Embedding Models Configuration
# Add these to your .env file

# Local embedding server URL (when running locally)
INSTRUCTOR_API_URL=http://localhost:8001/embed

# Local model paths (alternative to API)
INSTRUCTOR_LOCAL_PATH=./models/instructor-xl
SENTENCE_TRANSFORMERS_PATH=./models/sentence-transformers

# Model preferences (comma-separated, first is preferred)
PREFERRED_EMBEDDING_MODELS=openai,instructor,sentence-transformers
`;

    writeFileSync('env-embeddings.txt', envContent);
    console.log('✅ Created env-embeddings.txt');

    // Create installation instructions
    console.log('\n📚 Step 7: Creating installation instructions...');
    
    const instructionsContent = `# Local Embedding Models Installation Guide

## Prerequisites
- Python 3.8 or higher
- pip package manager
- At least 4GB RAM (8GB recommended)
- Optional: CUDA-compatible GPU for faster processing

## Installation Steps

### 1. Install Python Dependencies
\`\`\`bash
pip install -r requirements-embeddings.txt
\`\`\`

### 2. Start the Embedding Server
**Windows:**
\`\`\`bash
start-embedding-server.bat
\`\`\`

**Unix/Linux/macOS:**
\`\`\`bash
./start-embedding-server.sh
\`\`\`

### 3. Test the Server
Open your browser and go to: http://localhost:8001/docs

### 4. Update Environment Variables
Add these to your .env file:
\`\`\`
INSTRUCTOR_API_URL=http://localhost:8001/embed
PREFERRED_EMBEDDING_MODELS=instructor,openai,sentence-transformers
\`\`\`

## Model Information

### sentence-transformers
- **Model**: all-MiniLM-L6-v2
- **Dimensions**: 384
- **Speed**: Fast
- **Quality**: Good for general purpose
- **Memory**: ~100MB

### InstructorXL
- **Model**: hkunlp/instructor-xl
- **Dimensions**: 768
- **Speed**: Medium
- **Quality**: Excellent for instruction-following
- **Memory**: ~2GB

## Usage Examples

### Via API
\`\`\`bash
curl -X POST "http://localhost:8001/embed" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Sample text", "model": "sentence-transformers"}'
\`\`\`

### Via Contas-PT
The system will automatically use local models when available.

## Troubleshooting

### Common Issues
1. **Out of Memory**: Reduce batch size or use smaller models
2. **Model Download Fails**: Check internet connection and try again
3. **Port Already in Use**: Change port in embedding-server.py

### Performance Tips
1. Use GPU if available (CUDA)
2. Adjust batch sizes based on your hardware
3. Monitor memory usage during processing

## Support
For issues with local models, check:
- Python version compatibility
- Available system memory
- GPU drivers (if using CUDA)
`;

    writeFileSync('LOCAL_MODELS_README.md', instructionsContent);
    console.log('✅ Created LOCAL_MODELS_README.md');

    console.log('\n🎉 Local embedding models setup completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Install Python dependencies: pip install -r requirements-embeddings.txt');
    console.log('   2. Start the server: start-embedding-server.bat (Windows) or ./start-embedding-server.sh (Unix)');
    console.log('   3. Test the server: http://localhost:8001/docs');
    console.log('   4. Update your .env file with the new variables');
    console.log('   5. Test the pipeline with local models');

    console.log('\n📚 Documentation:');
    console.log('   - LOCAL_MODELS_README.md - Complete installation guide');
    console.log('   - env-embeddings.txt - Environment variables to add');
    console.log('   - embedding-server.py - Python server code');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n💡 Manual setup required:');
    console.log('   1. Install Python 3.8+');
    console.log('   2. Install required packages manually');
    console.log('   3. Configure environment variables');
  }
}

// Run the setup
setupLocalModels();
