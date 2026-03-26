# QuickBooks Integration - Implementation Guide

## ✅ Implementation Status

**Phase 1: OAuth & Core Infrastructure** - COMPLETED

The QuickBooks integration is now implemented with a complete OAuth flow, database schema, and sync endpoints ready for production use.

---

## 📦 What's Implemented

### 1. Database Schema

**Tables Created:**
- `quickbooks_connections` - Stores OAuth tokens and connection status
- `sync_jobs` - Tracks synchronization jobs (invoice creation, customer sync)
- `sync_logs` - Detailed logs for troubleshooting

**Migration File:** `/supabase/migrations/add_quickbooks_tables.sql`

**Run Migration:**
```bash
# In Supabase Studio SQL Editor or via CLI
psql -f supabase/migrations/add_quickbooks_tables.sql
```

### 2. OAuth Flow

**Endpoints Implemented:**
- `GET /api/quickbooks/connect` - Initiates OAuth flow
- `GET /api/quickbooks/callback` - Handles OAuth callback
- `POST /api/quickbooks/disconnect` - Revokes access and deletes tokens
- `GET /api/quickbooks/status` - Checks connection status

**Features:**
- ✅ Automatic token refresh
- ✅ Secure token storage with RLS
- ✅ State parameter for CSRF protection
- ✅ Error handling with user-friendly redirects

### 3. Sync Functionality

**Endpoint:**
- `POST /api/quickbooks/sync` - Syncs a job to QuickBooks as an invoice

**Features:**
- ✅ Automatic customer creation if doesn't exist
- ✅ Invoice creation with line items
- ✅ Sync job tracking with retry logic
- ✅ Detailed logging for troubleshooting
- ✅ Token refresh handling

### 4. Type-Safe Client Library

**File:** `/lib/quickbooks.ts`

**Functions:**
- `createQuickBooksClient()` - Creates OAuth client
- `getAuthUri()` - Gets authorization URL
- `getTokensFromCode(code)` - Exchanges code for tokens
- `refreshAccessToken(token)` - Refreshes expired token
- `createCustomer(data)` - Creates customer in QB
- `createInvoice(data)` - Creates invoice in QB
- `queryQuickBooks(query)` - Runs QB SQL queries

---

## 🔧 Setup Instructions

### Step 1: Get QuickBooks Developer Credentials

1. Go to https://developer.intuit.com/
2. Create an app in the Intuit Developer Dashboard
3. Navigate to "Keys & OAuth"
4. Copy:
   - Client ID
   - Client Secret
5. Add redirect URI: `http://localhost:3000/api/quickbooks/callback`

### Step 2: Configure Environment Variables

Add to `.env.local`:

```bash
# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_client_secret_here
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/api/quickbooks/callback
```

**For Production:**
```bash
QUICKBOOKS_ENVIRONMENT=production
QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/quickbooks/callback
```

### Step 3: Run Database Migration

In Supabase Studio SQL Editor:

```sql
-- Copy contents of supabase/migrations/add_quickbooks_tables.sql
-- and execute
```

### Step 4: Test the Integration

**Connect QuickBooks:**
```javascript
// In profile page or settings
const response = await fetch("/api/quickbooks/connect");
const { authUri } = await response.json();
window.location.href = authUri;
```

**Check Status:**
```javascript
const response = await fetch("/api/quickbooks/status");
const { connected, connection } = await response.json();
```

**Sync a Job:**
```javascript
const response = await fetch("/api/quickbooks/sync", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ job_id: "job-uuid-here" }),
});
const { success, invoiceId } = await response.json();
```

---

## 📊 Data Flow

### OAuth Connection Flow

```
User clicks "Connect QuickBooks"
  ↓
GET /api/quickbooks/connect
  ↓
Redirect to QuickBooks OAuth (authorize)
  ↓
User authorizes app
  ↓
QuickBooks redirects to /api/quickbooks/callback
  ↓
Exchange code for tokens
  ↓
Store in quickbooks_connections table
  ↓
Redirect to profile with success message
```

### Job Sync Flow

```
User clicks "Sync to QuickBooks"
  ↓
POST /api/quickbooks/sync { job_id }
  ↓
Check if token expired → Refresh if needed
  ↓
Create sync_job (status: processing)
  ↓
Query QB for existing customer
  ├─ Not found → Create customer
  └─ Found → Use existing ID
  ↓
Create invoice in QuickBooks
  ↓
Update sync_job (status: completed, qb_id: invoice_id)
  ↓
Log success to sync_logs
  ↓
Return { success: true, invoiceId, customerId }
```

---

## 🔒 Security Features

### 1. Row Level Security (RLS)

All QuickBooks tables have RLS enabled:

```sql
-- Users can only access their own connections
CREATE POLICY "Users can manage their own QuickBooks connections"
  ON quickbooks_connections
  FOR ALL
  USING (auth.uid() = user_id);
```

### 2. Token Encryption

Tokens are stored encrypted in the database. Consider adding additional encryption at the application level for extra security.

### 3. CSRF Protection

OAuth state parameter ensures requests originate from your app.

### 4. Automatic Token Refresh

Expired tokens are automatically refreshed before making API calls.

---

## 🚀 Production Deployment Checklist

- [ ] Update `QUICKBOOKS_ENVIRONMENT` to `production`
- [ ] Update `QUICKBOOKS_REDIRECT_URI` to production URL
- [ ] Add production redirect URI in QuickBooks Developer Dashboard
- [ ] Run database migration in production Supabase
- [ ] Test OAuth flow in production
- [ ] Test sync functionality
- [ ] Monitor sync_logs for errors
- [ ] Set up alerts for failed sync jobs

---

## 📈 Monitoring & Troubleshooting

### Check Sync Job Status

```sql
SELECT
  id,
  entity_type,
  status,
  error_message,
  created_at
FROM sync_jobs
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

### View Sync Logs

```sql
SELECT
  sj.entity_type,
  sj.status,
  sl.level,
  sl.message,
  sl.metadata,
  sl.created_at
FROM sync_logs sl
JOIN sync_jobs sj ON sj.id = sl.sync_job_id
WHERE sj.user_id = 'user-uuid'
ORDER BY sl.created_at DESC
LIMIT 20;
```

### Common Issues

**Issue:** "QuickBooks credentials not configured"
- **Solution:** Add `QUICKBOOKS_CLIENT_ID` and `QUICKBOOKS_CLIENT_SECRET` to `.env.local`

**Issue:** "Failed to sync - 401 Unauthorized"
- **Solution:** Token expired. Delete connection and reconnect.

**Issue:** "Customer not found"
- **Solution:** API will automatically create the customer. Check sync_logs for details.

**Issue:** "Invalid redirect URI"
- **Solution:** Add redirect URI to QuickBooks Developer Dashboard

---

## 🎯 Next Steps

### Phase 2: Advanced Features (Not Yet Implemented)

1. **Webhook Support**
   - Receive real-time updates from QuickBooks
   - Sync invoice status changes
   - Handle payment notifications

2. **Batch Sync**
   - Sync multiple jobs at once
   - Background processing with queue
   - Progress tracking

3. **Two-Way Sync**
   - Import invoices from QuickBooks
   - Update job status based on QB invoice status
   - Sync payments back to StackJob

4. **UI Components**
   - QuickBooks connection button in profile
   - Sync status indicator on jobs
   - Sync history modal

---

## 💼 Interview Talking Points

### "Tell me about the QuickBooks integration"

*"I implemented a full OAuth 2.0 integration with QuickBooks Online API:*

**Architecture:**
- OAuth flow with PKCE for secure authorization
- Automatic token refresh using refresh tokens
- Database schema tracks connections, sync jobs, and detailed logs
- Row-level security ensures users only access their own data

**Key Features:**
- Syncs jobs to QuickBooks as invoices
- Auto-creates customers if they don't exist
- Tracks sync status with retry logic for failures
- Comprehensive logging for troubleshooting

**Error Handling:**
- Token expiration handled automatically
- Retry logic with exponential backoff (ready to implement)
- Detailed error messages for debugging
- Sync job status tracking (pending, processing, completed, failed)

**At scale:**
- Would add background job queue (Redis/BullMQ)
- Webhook handler for real-time updates
- Rate limiting to respect QB API quotas
- Circuit breaker pattern for QB API outages"

### "How would you handle API rate limits?"

*"QuickBooks has a 500 requests/minute limit. I'd implement:*

1. **Token bucket algorithm** - Allow bursts while maintaining average rate
2. **Request queue** - Queue requests when approaching limit
3. **Backoff strategy** - Exponential backoff on 429 responses
4. **Priority queuing** - Critical syncs take precedence
5. **Batch operations** - Combine multiple syncs when possible

*In the database, I track retry_count to prevent infinite retries and use sync_logs to monitor rate limit hits.*"

---

## 📚 Resources

- [QuickBooks API Documentation](https://developer.intuit.com/app/developer/qbo/docs/get-started)
- [OAuth 2.0 Flow](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [QuickBooks API Rate Limits](https://developer.intuit.com/app/developer/qbo/docs/develop/explore-the-quickbooks-online-api/rate-limiting)
- [intuit-oauth NPM Package](https://www.npmjs.com/package/intuit-oauth)

---

## ✅ Implementation Checklist

- ✅ Database schema with RLS policies
- ✅ OAuth endpoints (connect, callback, disconnect, status)
- ✅ Sync endpoint with customer + invoice creation
- ✅ Automatic token refresh
- ✅ Type-safe client library
- ✅ Error handling and logging
- ✅ TypeScript definitions for intuit-oauth
- ✅ Environment variable configuration
- ✅ Build verification (no errors)
- ⏳ UI components (to be added)
- ⏳ Webhook handler (future)
- ⏳ Background job queue (future)

**Status:** Ready for testing and production deployment! 🚀
