# Customized Girl EDM System Flow
## **Embedded Design Maker**
## Use Update_Demo_guide.pdf as reference for the actual steps on how to save a design

## 1. Product Catalog Selection

URL: [design.customizedgirl.com/pages/product-catalog](https://design.customizedgirl.com/pages/product-catalog)

- This page displays a list of product catalogs from Printful with filtering options, such as categories like "Men's Clothing".
- It allows the customer to select a product and the corresponding decoration technique (e.g., embroidery, sublimation, DTG printing, etc.) they want to use via Customized Girl.

## 2. EDM Tool Integration

URL: [design.customizedgirl.com/pages/customize-product?id={product_id}](https://design.customizedgirl.com/pages/customize-product?id=163)

- The store is integrated with Printful's EDM (Embroidery, Direct-to-Garment, and More) Tool to fully customize the product catalog.
- After selecting a product from the catalog, users can proceed to the design customization page, where:
  - Customers can add their own designs, including:
    - Images
    - Logos
    - Fonts

- Users can save their custom designs by clicking the **"Save Design"** button.
- The average time for the design-saving process is approximately 1 minute, with a maximum of 2 to 3 minutes, depending on the number of design variants.

## 3. Final Product

- After 1–2 minutes, Customized Girl EDM will redirect the user to the product page where the final customized product is displayed.
- On this page, customers can select the desired variant of the product they wish to order and proceed to checkout.

# 🎨 Printful Integration  
### **Backend Process When Saving a Design**

This document describes the backend workflow and API interactions for integrating **Printful** within the EDM (Embedded Designer Maker) system.  
It explains how sessions, templates, and mockups are handled during the design creation and product customization process.

---

## 1. 🧩 EDM Session Handling and Nonce Authentication Flow

### **Overview**
When a customer starts designing a product inside the EDM, a unique session is generated to ensure design consistency and prevent duplicate templates.

- A session token and `templateId` are generated using the following format: `external_product_id = product_id + dateTime + cd-edm`
- This ensures each EDM session is unique and securely identified.
---

### **POST** `/api/printful/embedded-designer/nonces`

#### **Purpose**
Creates an EDM session token and generates a unique `templateId` for the selected product.

#### **Request Body Example**
```json
{
"external_product_id": "71_2025-10-14-08-32-54-123-cd-edm"
}
```
## 2. 🛍️ Usage of Catalog
- Products displayed on [design.customizedgirl.com/pages/product-catalog](https://design.customizedgirl.com/pages/product-catalog) are sourced from **Printful**.
- The backend uses the endpoint: `GET /api/printful/v2/catalog-products`

to fetch product details such as product name, price, description, variants, and available print techniques.
- This allows customers to browse and select their desired product before customizing it through the EDM (Embedded Designer Maker).
---

## 3. 🧱 Product Templates

- When the EDM is initialized, a **Product Template** is automatically created — as described in the EDM session handling process.
- The product template is a required component when creating a **Shopify product** later in the workflow.
- Template data is stored in the **Supabase** database for reference and tracking.
- This process occurs when a customer saves their design.

---

## 4. 🖼️ Mockup Generator

- After the template data is successfully saved in Supabase, the backend uses the customer’s EDM design to generate mockups.
- The EDM design includes layers such as images, fonts, colors, and text positioning.
- The backend then proceeds to create a **mockup generation task** in Printful.
---

## **POST** `/api/printful/mockup`

### **Purpose**
Generates a mockup task and queues it to Printful for processing.  
The mockup represents the final product preview with the user’s custom design.

#### **Request Body Example**
```json
{
  "template_id": "templateId from Supabase Templates table",
  "product_template_id": "Printful Template ID",
  "catalog_product_id": "Printful Catalog Product ID",
  "variant_ids": ["variantId_1", "variantId_2"]
}
```

### Shopify Frontend Integration

1. **Include the backend URL** in your Shopify app configuration
2. **Handle CORS** by ensuring your Shopify domain is in ALLOWED_ORIGINS

## 5. 🔐 Authentication and Customer Login Handling

- To access the **customization feature**, customers are required to **sign in** or **register** if they do not already have an account.
- This authentication process prevents **unauthorized customization** of products in the catalog.
- Only **authenticated users** are allowed to personalize products through the EDM (Embedded Designer Maker).
- Customer sessions are securely managed to ensure that each design and template is correctly associated with the logged-in user.

## 6. 👤 Customer Metafields

- The `edmTemplateId` is used to update the customer metafield named **`my_design`** in Shopify.
- The metafield stores a JSON value containing the `templateId` that belongs to the specific customer.
- This ensures that, on the storefront, customers can only view their own saved designs in the **My Designs** page.
- It also prevents unauthorized access to other users’ designs by enforcing ownership through metafield-based validation.

## 7. 🛒 Product Creation

- Once the **mockup task** has been completed and the generated images are available, the backend proceeds to create the corresponding **Shopify product**.
- Using the stored data from Supabase — including the `templateId`, `variantIds`, template details, and mockup images — a new product is created through the Shopify Admin API.
- This step links the EDM design (from Printful) to a live, sellable product in Shopify.
- The Shopify product includes:
  - Product title and description
  - Variants and pricing
  - Mockup images (from Printful)
  - Associated metafields and tags (e.g., `edmTemplateId` for tracking)
- Shopify Product tagging `edm_template_id_${edmTemplateId}`,`customer_id-${customerId}`

## **POST** `/api/shopify/product`

### **Purpose**
  - This endpoint creates a new Shopify product using product information and mockup images retrieved from **Printful**.  
  - The backend transforms Printful data into Shopify’s format and uses the Shopify Admin API to create the product.

### **Request Body Example**
```json
{
  "product_id": "71",
  "mockups": [
    {
      "extra": [],
      "placement": "placements",
      "mockup_url": "mockup_url",
      "variant_ids": [],
      "generator_mockup_id": 123456
    }
  ],
  "edmTemplateId": "138012",
  "availableVariantIds": [
    "variant1",
    "variant2"
  ],
  "customerId": "192104103",
  "customDesignName": "Custom Design Name"
}
```
## 8. 🔄 E-commerce Sync and Printful Fulfillment

- After the **Shopify product** is created and successfully published in the store,  
  the backend proceeds to **sync the product variants** with **Printful**.
- This synchronization ensures that all product variants in Shopify are linked to their corresponding Printful variants.
- Once synced, Printful can handle **fulfillment**, **inventory management**, and **stock tracking** automatically.

---

### **POST** `/api/printful/sync/variant/@{shopifyProductVariantId}`

#### **Purpose**
Synchronizes a **Shopify product variant** with its corresponding **Printful variant**.  
This process links product data between Shopify and Printful, enabling fulfillment, inventory tracking, and automatic updates.

---

#### **Path Parameter**

| Parameter | Type | Required | Description |
|------------|------|-----------|-------------|
| `shopifyProductVariantId` | `string` | ✅ | The unique Shopify product variant ID to be synced with Printful. |

---

#### **Example Request**
```bash
POST /api/printful/sync/variant/@43987431
```
### **Request Body Example**
```json
{
  "external_id": "shopifyProductId",
  "variant_id": "printfulVariantId",
  "retail_price": "shopifyVariantPrice",
  "is_ignored": false,
  "sku": "shopifyVariantSKU",
  "files": [
    {
      "type": "default",
      "url": "https://printful-upload.s3-accelerate.amazonaws.com/tmp/c15af4c94c6216a1fd9409fc998b1f91/printfile_default_11-oz.png",
      "visible": true,
      "filename": "printfile_default_11-oz.png"
    }
  ],
  "options": [
    {
      "id": "stringID",
      "value": "value"
    }
  ],
  "availability_status": "active"
}
```
## 9. 🪝 Webhook

- A **Shopify Webhook** is configured to listen for **product deletion events**.
- When a Shopify product is deleted, the backend automatically removes the corresponding records from the **Supabase tracking database**.
- This ensures data consistency between Shopify and the backend, preventing orphaned template or mockup records.
- The webhook helps maintain synchronization by keeping the internal database clean and aligned with the Shopify store’s state.

# Backend Architecture
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
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

create table public.mockup_tasks (
  id uuid not null default gen_random_uuid (),
  task_key text not null,
  template_id uuid null,
  created_at timestamp with time zone null default now(),
  status public.Mockup Task Status null default 'pending'::"Mockup Task Status",
  completed_at timestamp with time zone null,
  constraint mockup_tasks_pkey primary key (id),
  constraint mockup_tasks_template_id_fkey foreign KEY (template_id) references templates (id)
) TABLESPACE pg_default;

ALTER TABLE public.users ADD COLUMN shopify_customer_id TEXT;

ALTER TABLE public.templates
DROP CONSTRAINT templates_user_id_fkey1;

ALTER TABLE public.templates
ADD CONSTRAINT templates_user_id_fkey1
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;

ALTER TABLE public.mockup_tasks
DROP CONSTRAINT mockup_tasks_template_id_fkey;

ALTER TABLE public.mockup_tasks
ADD CONSTRAINT mockup_tasks_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES templates(id)
ON DELETE CASCADE;

ALTER TABLE public.users
DROP CONSTRAINT users_email_key;

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

#### `POST /api/printful/template`
Creates/updates Printful templates with background mockup generation.

**Request:**
```json
{
  "templateId": "printful-template-id",
  "user": {
    "name": "Customer Name",
    "email": "customer@example.com",
    "timestamp": "2025-01-15T10:30:00Z",
    "shopifyCustomerId": "customer id"
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
const response = await fetch('/api/customization', {
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
  'https://design.customizedgirl.com', // new Product EDM store
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





