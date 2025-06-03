# Click Tracking Feature

This document provides an overview of the click tracking feature implemented in the Il Buco Cleaners application.

## Overview

The click tracking system allows you to track user interactions on your website, specifically clicks on various elements. The data is stored in a Cloudflare D1 database and can be viewed in the analytics dashboard.

## Features

- Track clicks on any HTML element with an `id` or `data-track` attribute
- View click analytics in a dedicated dashboard
- Filter clicks by page, element ID, and date range
- Secure access to analytics with authentication

## How It Works

### Frontend Tracking

1. The `ClickTracker` component is added to the root layout to automatically track clicks on elements with `data-track` attributes.
2. The `useClickTracker` hook can be used to manually track clicks on specific elements.
3. Click data is sent to the `/api/track-click` endpoint.

### Backend Processing

1. The Cloudflare Worker (`src/worker.js`) handles incoming click tracking requests.
2. Click data is stored in a Cloudflare D1 database.
3. The worker also serves the analytics API endpoints.

### Analytics Dashboard

1. Accessible at `/analytics` (requires authentication)
2. Displays click statistics and visualizations
3. Filterable by date range and element ID

## Setup

### Prerequisites

- Cloudflare account with D1 database
- Node.js and npm installed

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Update the variables in .env
   ```

3. Run database migrations:
   ```bash
   npx wrangler d1 migrations apply ilbuco-cleaning-db --local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

### Tracking Clicks

Add the `data-track` attribute to any HTML element you want to track:

```html
<button data-track="cta-button">Click me</button>
```

Or use the `useClickTracker` hook in your React components:

```tsx
import { useClickTracker } from '@/hooks/useClickTracker';

function MyComponent() {
  const { trackElement } = useClickTracker();
  
  return (
    <button ref={trackElement} id="my-button">Track me</button>
  );
}
```

### Viewing Analytics

1. Sign in at `/signin`
2. Navigate to `/analytics`
3. Use the filters to view specific click data

## API Endpoints

- `POST /api/track-click` - Track a click event
- `GET /api/analytics` - Get click analytics

## Security

- All analytics routes are protected and require authentication
- Click data is stored securely in Cloudflare D1
- Sensitive data is not collected

## Troubleshooting

- If clicks aren't being tracked, check the browser console for errors
- Ensure the `data-track` attribute is correctly formatted
- Verify that the Cloudflare Worker is running and accessible

## Future Improvements

- Add more detailed analytics and visualizations
- Implement A/B testing
- Add user segmentation
- Export functionality for analytics data
