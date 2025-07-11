# Troubleshooting Guide - Contas-PT

Common issues and solutions for the Portuguese Accounting AI System powered by Supabase and cloud AI.

## Database Issues

### Supabase Connection Problems

**Problem**: Unable to connect to Supabase database
```
Error: Connection failed to Supabase database
```

**Solutions**:
1. Verify environment variables:
```bash
# Check these variables in .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

2. Test connection:
```bash
npm run db:push
```

3. Check Supabase dashboard for project status
4. Verify database URL encoding in `server/config.ts`

### Schema Migration Issues

**Problem**: Database schema out of sync
```
Error: Table doesn't exist or columns missing
```

**Solutions**:
1. Push latest schema:
```bash
npm run db:push
```

2. Clean and recreate (development only):
```bash
npm run db:clean
npm run db:push
```

3. Check for schema conflicts in Supabase dashboard

## AI Processing Issues

### Google AI API Errors

**Problem**: Gemini API returning errors
```
Error: Google AI API authentication failed
```

**Solutions**:
1. Verify API key in Google AI Studio
2. Check quota limits and billing status
3. Confirm model availability in your region
4. Test with simple request:
```bash
curl -X GET http://localhost:5000/api/cloud-processor-status
```

### OpenAI Fallback Issues

**Problem**: OpenAI backup processing fails
```
Error: OpenAI API rate limit exceeded
```

**Solutions**:
1. Check API key validity in OpenAI dashboard
2. Verify account credits and billing
3. Monitor rate limits (requests per minute)
4. Consider upgrading OpenAI plan for higher limits

### Document Processing Failures

**Problem**: Documents not processing correctly
```
Error: AI processing failed with confidence below threshold
```

**Solutions**:
1. Verify document format (PDF, JPG, PNG supported)
2. Check file size limits (10MB maximum)
3. Ensure document contains Portuguese invoice text
4. Test with known good document:
```bash
curl -X POST http://localhost:5000/api/test-cloud-extraction \
  -H "Content-Type: application/json" \
  -d '{"text":"Fatura FT 2024/001","filename":"test.pdf"}'
```

## Frontend Issues

### WebSocket Connection Problems

**Problem**: Real-time updates not working
```
Error: WebSocket connection failed
```

**Solutions**:
1. Check server WebSocket configuration
2. Verify port 5000 is accessible
3. Test with Supabase real-time:
```javascript
// Test Supabase subscription
const subscription = supabase
  .channel('test')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'documents'
  }, console.log)
  .subscribe();
```

### React Hook Errors

**Problem**: Hook dependencies missing
```
Error: useLocation is not defined
```

**Solutions**:
1. Check import statements:
```javascript
import { useLocation } from 'wouter';
```

2. Verify component is within Router context
3. Clear browser cache and restart development server

### Authentication Issues

**Problem**: Session management not working
```
Error: User session expired
```

**Solutions**:
1. Check session configuration in `server/index.ts`
2. Verify SESSION_SECRET environment variable
3. Clear browser cookies and login again
4. Check PostgreSQL session store connection

## Cloud Storage Integration

### Google Drive Sync Issues

**Problem**: OAuth authentication failing
```
Error: Google Drive authorization failed
```

**Solutions**:
1. Verify OAuth credentials in Google Cloud Console
2. Check redirect URI configuration
3. Ensure Google Drive API is enabled
4. Test OAuth flow:
```bash
curl -X GET http://localhost:5000/api/google-drive/auth
```

### Dropbox Integration Problems

**Problem**: Dropbox folder access denied
```
Error: Dropbox API permission denied
```

**Solutions**:
1. Check Dropbox app permissions
2. Verify access token validity
3. Refresh token if expired
4. Test folder access:
```bash
curl -X GET http://localhost:5000/api/dropbox/folders
```

## Performance Issues

### Slow Document Processing

**Problem**: AI processing taking too long
```
Warning: Processing time exceeding 30 seconds
```

**Solutions**:
1. Check AI API response times
2. Optimize document size (compress large PDFs)
3. Monitor system resources
4. Consider batch processing for multiple documents

### Memory Usage High

**Problem**: Server consuming excessive memory
```
Warning: Memory usage above 80%
```

**Solutions**:
1. Restart the development server:
```bash
npm run dev
```

2. Check for memory leaks in processing pipeline
3. Optimize database queries with indexes
4. Monitor Supabase connection pooling

## Development Environment

### Environment Variables Missing

**Problem**: Required environment variables not set
```
Error: Missing required environment variable
```

**Solutions**:
1. Copy from template:
```bash
cp .env.example .env
```

2. Verify all required variables:
```bash
# Required variables
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATABASE_URL=
SESSION_SECRET=

# Optional but recommended
GOOGLE_AI_API_KEY=
OPENAI_API_KEY=
```

3. Use validation script:
```bash
node validate-env.cjs
```

### Build Errors

**Problem**: TypeScript compilation failing
```
Error: Type errors in build process
```

**Solutions**:
1. Run type checking:
```bash
npm run check
```

2. Fix TypeScript errors in reported files
3. Update type definitions if needed
4. Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Port Configuration Issues

**Problem**: Server not accessible in production
```
Error: Cannot bind to port
```

**Solutions**:
1. Check PORT environment variable
2. Ensure port is available and not blocked
3. Use process manager (PM2) for production:
```bash
npm run build
npm run start
```

### Database Connection in Production

**Problem**: Production database connectivity
```
Error: Connection refused in production
```

**Solutions**:
1. Verify production Supabase credentials
2. Check database URL encoding
3. Ensure production environment variables are set
4. Test connection with production database

## API Issues

### Rate Limiting

**Problem**: API requests being rate limited
```
Error: Too many requests (429)
```

**Solutions**:
1. Implement request throttling
2. Cache frequently accessed data
3. Optimize API call patterns
4. Consider upgrading API plans

### CORS Errors

**Problem**: Cross-origin requests blocked
```
Error: CORS policy violation
```

**Solutions**:
1. Check CORS configuration in server
2. Verify frontend URL in allowed origins
3. Use proper headers for API requests
4. Test with same-origin requests first

## Portuguese Invoice Processing

### NIF Validation Failures

**Problem**: Portuguese tax ID validation failing
```
Error: Invalid NIF format
```

**Solutions**:
1. Verify NIF algorithm implementation
2. Check for 9-digit format requirement
3. Test with known valid NIFs
4. Review extraction accuracy for NIF field

### VAT Rate Recognition Issues

**Problem**: Incorrect VAT rates extracted
```
Warning: VAT rate outside valid range (6%, 13%, 23%)
```

**Solutions**:
1. Improve AI prompts for Portuguese VAT rates
2. Add validation rules for Portuguese rates
3. Check document quality and text clarity
4. Review extraction confidence scores

## Monitoring and Logs

### Enable Debug Logging

Add detailed logging for troubleshooting:

```bash
# Development environment
NODE_ENV=development DEBUG=* npm run dev
```

### Check Processing Logs

Monitor AI processing through Supabase:
1. Open Supabase dashboard
2. Navigate to Table Editor > documents
3. Check processing_status and processing_error columns
4. Review confidence scores and methods

### Health Check Endpoints

Test system components:

```bash
# Database connection
curl http://localhost:5000/api/dashboard/metrics

# AI system status
curl http://localhost:5000/api/cloud-processor-status

# Document processing
curl -X POST http://localhost:5000/api/test-cloud-extraction \
  -H "Content-Type: application/json" \
  -d '{"text":"Test document","filename":"test.pdf"}'
```

## Getting Help

### Log Collection

When reporting issues, include:
1. Error messages with full stack traces
2. Environment variables (excluding sensitive values)
3. Browser console logs for frontend issues
4. Network tab for API request failures
5. Database query logs from Supabase

### Common Log Locations

- **Development**: Console output
- **Supabase**: Dashboard > Logs section
- **Browser**: DevTools > Console
- **Network**: DevTools > Network tab

### Support Channels

1. Check existing issues in project documentation
2. Review API reference for proper usage
3. Test with minimal reproduction case

---

**Troubleshooting Guide Version**: 2.3  
**Last Updated**: June 23, 2025  
**System Coverage**: Complete Supabase-Only Architecture with Enhanced Dropbox Integration  
**Status**: Production Ready with Comprehensive Error Handling
4. Include environment details and error messages