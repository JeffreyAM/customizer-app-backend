# 🎨 Customizer App Backend - Technical Documentation

A Next.js backend service that handles product customization, Printful integration, and user session management for Shopify stores. This system supports EDM session handling and provides seamless Print API integration.

## 🏗️ Architecture Overview

This backend serves as a bridge between Shopify storefronts and Printful's print-on-demand services, managing:

- **Product Customizations**: Customer design choices (color, text, fonts)
- **Template Management**: Printful product templates and mockup generation
- **User Sessions**: EDM-style session handling with token-based persistence
- **Print API Integration**: Proxied access to Printful's API with authentication

## 🚀 Quick Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Printful account with API access

### Environment Configuration

Create `.env.local` with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Printful API
PRINTFUL_API_KEY=your-printful-api-key

# Optional: Development settings
NODE_ENV=development
```

### Database Setup

Run the migration to create required tables:

```sql
-- Execute in Supabase SQL Editor
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.customizations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  color text NOT NULL,
  message text NOT NULL,
  font text NOT NULL,
  shopify_product_id text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customizations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id text NOT NULL UNIQUE,
  product_title text NOT NULL,
  variant_options jsonb DEFAULT '{}'::jsonb,
  image_url text,
  user_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

The API will be available at `http://localhost:3000/api/`

## 📋 API Reference

### Template Management

#### `POST /api/shopify/template`
Creates/updates Printful templates with background mockup generation.

**Request:**
```json
{
  "templateId": "printful-template-id",
  "user": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "productId": "printful-product-id"
}
```

**Features:**
- Automatic user creation/retrieval
- Background mockup URL fetching with retry logic
- Template data caching in Supabase

#### `GET /api/templates`
Fetches templates with optional user filtering.

**Query Parameters:**
- `userId`: Filter by specific user
- `limit`: Max results (default: 50)
- `offset`: Pagination offset

### Print API Integration

#### `GET|POST|PUT|DELETE /api/printful/[...path]`
Proxies requests to Printful API with authentication.

**Features:**
- Automatic Bearer token injection
- Full HTTP method support
- Error handling and CORS management
- Request/response logging

#### `GET /api/printful/catalog`
Fetches Printful catalog products.

**Response:** Direct proxy of Printful's catalog API.

## 🔐 EDM Session Handling

### Token-Based Sessions

The system implements EDM (Electronic Direct Mail) style session management:

1. **Session Creation**: When a customization is saved without a token, a new UUID is generated
2. **Session Persistence**: Tokens are stored in localStorage as `customizationToken-{shopify_product_id}`
3. **Session Retrieval**: Existing tokens allow updating/retrieving previous customizations
4. **Cross-Product Sessions**: Each Shopify product maintains its own session token

### Session Flow

```javascript
// Frontend Implementation Example
const sessionKey = `customizationToken-${shopifyProductId}`;
const existingToken = localStorage.getItem(sessionKey);

// Save with existing token (update) or create new
const response = await fetch('/api/save-customization', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ...customizationData,
    token: existingToken // Include if exists
  })
});

const { token } = await response.json();
localStorage.setItem(sessionKey, token);
```

## 🖨️ Print API Integration Details

### Printful Proxy Architecture

The `/api/printful/[...path]/route.ts` route provides a secure proxy to Printful's API:

**Security Features:**
- API key stored server-side (not exposed to frontend)
- CORS headers for allowed origins only
- Request validation and error handling


**Proxy Base URL**
```
https://customizer-app-backend.vercel.app/api/printful/
```

**How to Use**

Use the same path as the Printful API, appended to the proxy base URL.

**Example:**

| Printful API                     | Proxy URL                                                                 |
|----------------------------------|---------------------------------------------------------------------------|
| `https://api.printful.com/v2/catalog-products` | `https://customizer-app-backend.vercel.app/api/printful/v2/catalog-products` |

**Features**

- Secure: Hides API key from frontend
- Flexible: Supports all Printful API paths and methods (`GET`, `POST`, etc.)
- Drop-in Replacement: Use the same request structure as the original API

**Notes**

- Include headers, query params, and body just like with the Printful API.
- All authentication is handled server-side.


### Template Mockup Retrieval

The system handles Printful's asynchronous mockup generation:

1. **Immediate Response**: Returns template data immediately
2. **Background Processing**: Starts retry process for mockup URL
3. **Exponential Backoff**: Attempts retrieval with increasing delays
4. **Database Updates**: Automatically updates image_url when available

```typescript
// Background mockup fetching with retry logic
async function updateMockupUrlInBackground(templateId: string) {
  for (let attempt = 1; attempt <= 8; attempt++) {
    // Exponential backoff: 2s, 3s, 4.5s, 6.75s, etc.
    const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 30000);
    
    const mockupUrl = await fetchMockupUrl(templateId);
    if (mockupUrl) {
      await updateDatabase(templateId, mockupUrl);
      return;
    }
    
    await sleep(delay);
  }
}
```

## 🌐 CORS Configuration

The API supports multiple origins for development and production:

```typescript
const ALLOWED_ORIGINS = [
  'https://customized-girl-edm.myshopify.com',  // Production EDM store
  'https://fqvyxf-a8.myshopify.com',           // Test store
  'http://localhost:3000',                      // Local development
  'http://localhost:3001',                      // Alt local port
  'http://127.0.0.1:3000',                     // Local IP
  'http://127.0.0.1:3001'                      // Alt local IP
];
```

## 📊 Database Schema

### Core Tables

**users**: Customer information
- `id`: UUID primary key
- `name`: Customer name
- `email`: Unique email address (used for deduplication)
- `created_at`/`updated_at`: Timestamps

**customizations**: Product customization data
- `id`: UUID primary key (used as session token)
- `shopify_product_id`: Links to Shopify product
- `color`, `message`, `font`: Customization options
- `created_at`: Session timestamp

**templates**: Printful template cache
- `template_id`: Printful template identifier (unique)
- `product_title`: Product name from Printful
- `variant_options`: JSON array of available variants
- `image_url`: Mockup URL (populated asynchronously)
- `user_id`: Optional link to user who created template

## 🔧 Development Notes

### Type Safety

The project uses TypeScript with strict mode enabled. Key types:

```typescript
type Template = {
  id: string;
  template_id: string;
  product_title: string;
  variant_options: any;
  image_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
};
```

### Error Handling

All API routes implement consistent error handling:
- **400**: Client errors (missing fields, invalid data)
- **404**: Resource not found
- **500**: Server errors (database, external API failures)

All responses include CORS headers and proper content types.

### Performance Considerations

- **Database Indexing**: Ensure indexes on frequently queried fields
- **Background Jobs**: Mockup URL fetching runs asynchronously

## 🚨 Security Notes

- API keys are server-side only
- CORS strictly enforced
- No authentication required for basic operations (suitable for public customization tools)
- UUID tokens provide session privacy without authentication complexity

## 🔄 Integration Guide

### Shopify Frontend Integration

1. **Include the backend URL** in your Shopify app configuration
2. **Handle CORS** by ensuring your Shopify domain is in ALLOWED_ORIGINS