# 🧵 Customizer App Backend

This project implements a simplified backend API for a product customization flow, inspired by Shopify-style product pages. Customers can customize t-shirts (color, message, font), and the data is saved per product using Supabase as the database.

Built using **Next.js (App Router)** and hosted locally or via your preferred platform.

---

## 🧠 Approach

- **Frontend:** Uses shopify with custom button that opens a modal to customize a t-shirt
    - Custom code: https://github.com/JeffreyAM/shopify-app-custom-codes
    - Test Product: https://fqvyxf-a8.myshopify.com/products/customizable-tshirt-test-product
    - Store Password is: `jeff123`
- **Backend:** API endpoints accept and return customization data
    - Next.js as backend
    - Supabase as db
- **Persistence:** Customizations are saved in Supabase with a generated token
- **Integration Logic:** Token is stored in `localStorage` and reused to update

---

## 📦 API Endpoints

### `POST /api/save-customization`

Saves or updates a product customization.

#### ✅ Request Body

```json
{
  "color": "black",
  "message": "My custom text",
  "font": "Arial",
  "shopify_product_id": "123456789",
  "token": "optional-existing-token"
}
```

* If `token` is provided, updates the existing record.
* If not, creates a new record.

#### 🔁 Response

```json
{
  "token": "generated-or-updated-uuid"
}
```

---

### `GET /api/customization/:token`

Retrieves a saved customization by its token.

#### 🔍 Example

```
GET /api/customization/8cba99ae-f2bb-4dc0-bcd1-0174fa82a3aa
```

#### 🧾 Response

```json
{
  "id": "8cba99ae-...",
  "color": "black",
  "message": "Hello world",
  "font": "Courier New",
  "shopify_product_id": "123456789",
  "created_at": "2025-07-15T14:32:00.000Z"
}
```

---

## 🧱 Supabase Setup

Run this SQL command in your Supabase SQL Editor to create the `customizations` table:

```sql
create table customizations (
  id uuid primary key default gen_random_uuid(),
  shopify_product_id text not null,
  color text not null,
  message text not null,
  font text not null,
  created_at timestamp with time zone default now()
);
```

Enable RLS (Row-Level Security) if needed, and make sure your Supabase project has:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🧪 Running Locally

1. Clone this repository

```bash
git clone https://github.com/JeffreyAM/customizer-app-backend
cd customizer-app-backend
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables in `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET_KEY=your-service-role-key
```

4. Run the development server

```bash
npm run dev
```

* API will be available at: `http://localhost:3000/api/...`
* You can now test using Postman or connect from your Shopify frontend

---

## 🌐 CORS

All endpoints are CORS-enabled for access from:

```
https://fqvyxf-a8.myshopify.com
```

To change the allowed origin, edit the `allowedOrigin` constant in each route file.

---

## 📝 Notes

* Token is stored in `localStorage` as:
  `customizationToken-{shopify_product_id}`
* Data is saved per product
