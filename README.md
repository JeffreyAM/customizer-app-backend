# 🧵 Customizer App Backend

This project implements a simplified backend API for a product customization flow, inspired by Shopify-style product pages. Customers can customize t-shirts (color, message, font), and the data is saved per product using Supabase as the database.

Built using **Next.js (App Router)** and hosted locally or via your preferred platform.

---

## 🧠 Approach

- **Frontend:** Uses shopify with custom button that opens a modal to customize a t-shirt
    - Custom code: https://github.com/JeffreyAM/shopify-app-custom-codes
    - Store Password is: `jeff123`
- **Backend:** API endpoints accept and return customization data
    - Next.js as backend
    - Supabase as db
- **Persistence:** Customizations are saved in Supabase with a generated token
- **Integration Logic:** Token is stored in `localStorage` and reused to update 

---

## 🧪 Running Locally

1. **Clone this repository**

```bash
git clone https://github.com/JeffreyAM/customizer-app-backend
cd customizer-app-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

   * Contact the developer for the required `.env.local` file, or create it manually using the provided template.

4. **Run the development server**

```bash
npm run dev
```

**Notes:**

* API will be available at: `http://localhost:3000/api/...`
* You can test endpoints using **Postman** or the **Swagger UI** at: [http://localhost:3000/swagger](http://localhost:3000/swagger)

---

## 📜 API Documentation

A full, interactive API reference is available at:
**[http://localhost:3000/swagger](http://localhost:3000/swagger)**

This Swagger-based documentation lets you explore all available endpoints, test requests, and view request/response schemas.

### 📌 Tags Overview

* **Internal** – Internal endpoints for customization and data management.
* **External/Shopify** – Endpoints for interacting with Shopify store data and orders that are modified for our use.
* **External/Printful** – Endpoints for interacting with Printful's API and services that are modified for our use.
* **External/Printful Proxy** – Routes that forward requests to the Printful API, maintaining authentication and store context.
* **External/Shopify/Webhook** – Endpoints for interacting with Shopify store webhooks. 

---

## 🌐 CORS

All endpoints are CORS-enabled for access from:

```
https://customized-girl-edm.myshopify.com
```

To change the allowed origin, edit the `NEXT_ALLOWED_ORIGINS` on the .env

---

## 📝 Notes

* Token is stored in `localStorage` as:
  `customizationToken-{shopify_product_id}`
* Data is saved per product
