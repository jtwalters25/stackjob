# QuickBooks Integration Architecture

## System Design Overview

```
┌─────────────────┐
│   StackJob UI   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      OAuth 2.0       ┌──────────────────┐
│  Next.js API    │◄────────────────────►│   QuickBooks     │
│    Routes       │                       │   Online API     │
└────────┬────────┘                       └──────────────────┘
         │                                         │
         │                                         │ Webhooks
         ▼                                         ▼
┌─────────────────┐                       ┌──────────────────┐
│   Supabase DB   │                       │  Webhook Handler │
│  - sync_state   │                       │  (Background)    │
│  - sync_logs    │                       └──────────────────┘
│  - qb_tokens    │
└─────────────────┘
```

## Data Flow

### 1. OAuth Connection Flow
```
User clicks "Connect QuickBooks"
  ↓
Redirect to QuickBooks OAuth
  ↓
User authorizes app
  ↓
QuickBooks redirects back with code
  ↓
Exchange code for access + refresh tokens
  ↓
Store tokens securely in database
  ↓
Initial sync of customers
```

### 2. Job → Invoice Sync Flow
```
User clicks "Sync to QuickBooks" on job
  ↓
Create background sync job
  ↓
Check if customer exists in QB
  ├─ No → Create customer first
  └─ Yes → Continue
  ↓
Map job data to invoice format
  ↓
POST to QuickBooks API
  ├─ Success → Update job with QB invoice ID
  └─ Failure → Log error, schedule retry
  ↓
Update UI with sync status
```

### 3. Webhook Flow (Real-time Updates)
```
QuickBooks sends webhook
  ↓
Verify webhook signature
  ↓
Parse event type (invoice.updated, customer.created, etc.)
  ↓
Update local database
  ↓
Invalidate React Query cache
  ↓
UI auto-updates
```

## Database Schema

### quickbooks_connections
```sql
CREATE TABLE quickbooks_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  realm_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  connected_at TIMESTAMP DEFAULT now(),
  last_sync_at TIMESTAMP,
  UNIQUE(user_id)
);
```

### sync_jobs
```sql
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'invoice', 'customer', 'payment'
  direction TEXT NOT NULL, -- 'to_qb', 'from_qb'
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  qb_id TEXT, -- QuickBooks entity ID
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### sync_logs
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID REFERENCES sync_jobs(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- 'info', 'warn', 'error'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);
```

## API Endpoints

### `/api/quickbooks/connect`
- **Method**: GET
- **Purpose**: Initiate OAuth flow
- **Returns**: Redirect URL to QuickBooks

### `/api/quickbooks/callback`
- **Method**: GET
- **Purpose**: Handle OAuth callback
- **Params**: code, state, realmId
- **Action**: Exchange code for tokens, store in DB

### `/api/quickbooks/disconnect`
- **Method**: POST
- **Purpose**: Revoke access and delete tokens

### `/api/quickbooks/sync/customer`
- **Method**: POST
- **Body**: `{ job_id: string }`
- **Purpose**: Sync customer from job to QuickBooks
- **Returns**: Customer ID

### `/api/quickbooks/sync/invoice`
- **Method**: POST
- **Body**: `{ job_id: string, include_line_items: boolean }`
- **Purpose**: Create invoice in QuickBooks from job
- **Returns**: Invoice ID

### `/api/quickbooks/webhook`
- **Method**: POST
- **Purpose**: Handle QuickBooks webhooks
- **Verifies**: Signature validation
- **Action**: Update local data based on QB changes

### `/api/quickbooks/status`
- **Method**: GET
- **Purpose**: Get connection status and last sync time
- **Returns**: `{ connected: boolean, last_sync: timestamp }`

## Error Handling & Retry Logic

### Retry Strategy
```typescript
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 60000, // 1 minute
  backoffFactor: 2, // Exponential backoff
};

// Retry delays: 1s, 2s, 4s, then fail
```

### Error Types
1. **Authentication errors** (401/403)
   - Refresh token
   - If refresh fails, disconnect and notify user

2. **Rate limit errors** (429)
   - Respect Retry-After header
   - Exponential backoff

3. **Validation errors** (400)
   - Log error
   - Don't retry (user action needed)

4. **Server errors** (500/502/503)
   - Retry with backoff
   - Alert on repeated failures

## Security Considerations

### Token Storage
- Encrypt access/refresh tokens at rest
- Use Supabase Row Level Security
- Never expose tokens in client code

### Webhook Verification
- Validate QuickBooks signature on every webhook
- Reject unsigned or tampered requests

### Rate Limiting
- Respect QuickBooks API rate limits (500 requests/minute)
- Implement client-side rate limiter
- Queue requests if needed

## Performance Optimizations

### Batch Operations
- Sync multiple jobs in one batch request
- Reduce API calls by 80%

### Caching
- Cache QuickBooks customer list
- Refresh every 5 minutes
- Use React Query for client cache

### Background Jobs
- Process syncs asynchronously
- Don't block UI
- Show progress indicators

## Scalability Patterns

### For Netflix-Scale Traffic

1. **Job Queue System**
   - Use Redis or RabbitMQ
   - Process syncs in background workers
   - Handle 1000+ syncs/second

2. **Database Sharding**
   - Partition by user_id
   - Distribute load across replicas

3. **Rate Limiter**
   - Token bucket algorithm
   - Per-user limits
   - Global limits

4. **Webhook Processing**
   - Validate and queue immediately
   - Process asynchronously
   - Handle out-of-order events

## Monitoring & Observability

### Metrics to Track
- Sync success rate
- Average sync duration
- Token refresh success rate
- Webhook processing latency
- Error rate by error type

### Alerts
- Failed syncs > 5% in 5 minutes
- Token refresh failures
- Webhook signature failures
- API rate limit warnings

### Logging
- All API calls to QuickBooks
- All webhook events
- All errors with context
- Sync job status changes

## Interview Talking Points

**"Tell me about a complex integration you built"**

*"I built QuickBooks integration for StackJob that demonstrates several system design concepts:*

1. *OAuth 2.0 with automatic token refresh*
2. *Webhook handling with signature verification*
3. *Background job processing with retry logic*
4. *Rate limiting to respect API quotas*
5. *Real-time UI updates via React Query cache invalidation*

*The most interesting challenge was handling eventual consistency between StackJob and QuickBooks. I implemented a sync_jobs table to track synchronization state, with exponential backoff retry logic for transient failures.*

*If scaling to Netflix traffic, I'd add:*
- *Redis job queue for async processing*
- *Database read replicas for webhook ingestion*
- *Circuit breaker pattern to handle QB API outages*
- *Dedicated sync workers with horizontal scaling*"

---

## Next Steps

1. Implement OAuth flow
2. Create database schema
3. Build sync endpoints
4. Add webhook handler
5. Create UI components
6. Add monitoring/logging
7. Write tests
8. Document for portfolio
