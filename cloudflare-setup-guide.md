# Cloudflare Setup Guide for Il Buco Cleaning App

This guide explains how to set up the Cloudflare Worker with D1 database and R2 storage for the Il Buco Cleaning app.

## What Cloudflare Can Do (That Next.js Can't)

1. **D1 Database Access**: Cloudflare D1 can only be accessed directly from Cloudflare Workers, not from Next.js.
2. **R2 Storage Management**: Direct R2 bucket operations require Cloudflare Workers.
3. **Edge Computing**: Run code closer to users without a full server.
4. **Serverless Database**: D1 is a serverless SQL database that doesn't require managing a PostgreSQL server.

## Setup Steps

### 1. Install Wrangler CLI

\`\`\`bash
npm install -g wrangler
\`\`\`

### 2. Login to Cloudflare

\`\`\`bash
wrangler login
\`\`\`

### 3. Create D1 Database Tables

\`\`\`bash
# Create the tables using the schema
wrangler d1 execute ilbuco-cleaning-db --file=d1-schema.sql
\`\`\`

### 4. Configure R2 Bucket

Make sure your R2 bucket is created:

\`\`\`bash
wrangler r2 bucket create ilbuco-clean
\`\`\`

### 5. Update wrangler.toml

Edit the `wrangler.toml` file:
- Replace `your-domain.com` with your actual domain
- Update the `PUBLIC_R2_URL` with your Cloudflare account ID

### 6. Deploy the Worker

\`\`\`bash
wrangler deploy
\`\`\`

### 7. Configure CORS for R2 Bucket

\`\`\`bash
wrangler r2 bucket cors set ilbuco-clean --allowed-origins="*" --allowed-methods="GET,PUT,POST,HEAD" --allowed-headers="*"
\`\`\`

## Connecting Next.js to Cloudflare

### Option 1: API Routes Proxy

Create API routes in Next.js that proxy requests to your Cloudflare Worker:

\`\`\`typescript
// app/api/sessions/route.ts
export async function GET() {
  const response = await fetch('https://il-buco-cleaning.your-domain.workers.dev/api/sessions');
  const data = await response.json();
  return Response.json(data);
}
\`\`\`

### Option 2: Direct Client Calls

Update your client-side code to call the Cloudflare Worker directly:

\`\`\`typescript
// In your React components
const response = await fetch('https://il-buco-cleaning.your-domain.workers.dev/api/sessions');
\`\`\`

## Testing the Setup

1. Deploy the Cloudflare Worker
2. Run the `/demotest` page in your Next.js app
3. The test should now connect to your Cloudflare Worker, which will use D1 and R2

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure CORS is properly configured in the Worker
2. **D1 Connection Issues**: Verify your database ID is correct
3. **R2 Access Problems**: Check your R2 bucket permissions and CORS settings

### Debugging

Use `wrangler tail` to see live logs from your Worker:

\`\`\`bash
wrangler tail il-buco-cleaning
