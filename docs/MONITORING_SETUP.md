# Monitoring & Analytics Setup

This document explains how to set up monitoring, error tracking, and analytics for StackJob.

## 📊 What's Included

- **Sentry**: Error tracking and performance monitoring (FREE tier: 5,000 errors/month)
- **Vercel Analytics**: Page view tracking (FREE on Hobby plan)
- **Vercel Speed Insights**: Core Web Vitals monitoring (FREE on Hobby plan)
- **Custom Metrics**: Business and performance metrics tracking

## 🚀 Setup Instructions

### 1. Sentry (Error Tracking)

1. **Create free account** at [sentry.io](https://sentry.io)

2. **Create a new project**:
   - Click "Create Project"
   - Select platform: **Next.js**
   - Give it a name (e.g., "stackjob")
   - Click "Create Project"

3. **Get your DSN**:
   - After creating the project, copy your DSN (looks like: `https://xxxxx@yyyyy.ingest.sentry.io/zzzzz`)

4. **Add to environment variables**:
   ```bash
   # In .env.local
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@yyyyy.ingest.sentry.io/zzzzz
   SENTRY_ORG=your-org-name
   SENTRY_PROJECT=stackjob

   # Optional: For source map uploads (get from Settings → Developer Settings → Auth Tokens)
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

5. **That's it!** Sentry is now tracking:
   - JavaScript errors (client & server)
   - Unhandled promise rejections
   - API errors
   - Performance metrics
   - Session replays (on errors only)

### 2. Vercel Analytics & Speed Insights

**No setup required!** These are already configured and work automatically when deployed to Vercel.

- View analytics at: `https://vercel.com/your-username/stackjob/analytics`
- View speed insights at: `https://vercel.com/your-username/stackjob/speed-insights`

## 📈 What Gets Tracked

### Business Metrics

- **Job Creation**: Track which trades and roles are most common
- **Document Uploads**: File types, sizes, and upload duration
- **AI Parsing**: Folder parsing performance and accuracy
- **Stage Changes**: Job workflow progression

### Performance Metrics

- **API Latency**: Response times for all endpoints
- **Database Queries**: Query performance by table
- **Cache Hit Rate**: Effectiveness of caching (when React Query is added)

### User Engagement

- **Feature Usage**: Which features are being used
- **Navigation**: User journey through the app
- **Drag & Drop**: Interaction tracking

### Error Tracking

- **Validation Errors**: Form validation failures
- **API Errors**: Failed requests with context
- **Unhandled Exceptions**: Crashes with stack traces

## 🔍 Viewing Metrics

### Sentry Dashboard

1. Go to [sentry.io](https://sentry.io) and log in
2. Select your project
3. View:
   - **Issues**: All errors grouped by type
   - **Performance**: API latency, database queries
   - **Metrics**: Custom business metrics
   - **Replays**: Session recordings (on errors)

### Vercel Dashboard

1. Go to [vercel.com](https://vercel.com/dashboard)
2. Select your project
3. View:
   - **Analytics**: Page views, unique visitors
   - **Speed Insights**: Core Web Vitals (LCP, FID, CLS)
   - **Logs**: Runtime logs from serverless functions

## 🧪 Testing Metrics

### Test Error Tracking

Add a test error button to any page:

```typescript
<button onClick={() => {
  throw new Error("Test Sentry error!");
}}>
  Test Error
</button>
```

### Test Custom Metrics

Metrics are automatically tracked on:
- Creating a job (`/jobs/new`)
- Uploading a document
- Importing jobs via folder
- Changing job stages

## 🎯 Free Tier Limits

### Sentry (FREE Forever)

- ✅ 5,000 errors per month
- ✅ 10,000 performance units per month
- ✅ 1 GB attachments
- ✅ 7-day retention

For StackJob (portfolio project), you'll likely use:
- ~10-50 errors/month (testing + edge cases)
- ~500-1000 performance events/month
- **Well within free tier**

### Vercel (Hobby Plan - FREE)

- ✅ Unlimited analytics events
- ✅ Unlimited speed insights
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments

## 💡 Best Practices

1. **Don't log sensitive data**: Never track PII, passwords, or API keys
2. **Use breadcrumbs**: Sentry automatically tracks user actions leading to errors
3. **Tag errors**: Use tags to filter (e.g., by trade, role, feature)
4. **Set up alerts**: Get notified on Slack/Email for critical errors
5. **Review weekly**: Check metrics every week to spot trends

## 🚨 Troubleshooting

### Sentry not tracking errors

1. Check `.env.local` has `NEXT_PUBLIC_SENTRY_DSN`
2. Restart dev server: `npm run dev`
3. Check browser console for Sentry init errors
4. Verify DSN is correct at sentry.io

### Metrics not appearing

1. Metrics appear in Sentry after ~1 minute
2. Go to Sentry → Metrics → Custom Metrics
3. Check for recent events
4. Make sure environment variables are set

### Vercel Analytics not working

1. Analytics only work on deployed apps (not localhost)
2. Deploy to Vercel
3. Visit the deployed URL
4. Check analytics dashboard after ~5 minutes

## 📚 Additional Resources

- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Vercel Speed Insights Docs](https://vercel.com/docs/speed-insights)
- [Sentry Metrics Docs](https://docs.sentry.io/product/metrics/)

---

**Questions?** Open an issue or check the docs above.
