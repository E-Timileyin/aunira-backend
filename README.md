
---

# **AUNIRA BACKEND FEATURES**

This version focuses purely on **commerce, user flow, and admin management**, optimized for scalability.

---

## 🧍‍♀️ 1. **Auth & User Module**

Handles authentication, authorization, and user management.

### 🔹 Features:

* User signup/login (email/phone)
* Password reset + verification
* JWT + Refresh token flow
* Role-based access (user, admin, staff)
* Profile management (skin type, preferences)
* Logout + token invalidation
* Activity tracking (login history)

### 📦 Endpoints

```
POST /auth/signup
POST /auth/login
POST /auth/refresh
GET  /user/profile
PUT  /user/profile
POST /auth/logout
```

---

## 🛍️ 2. **Product Module**

Manages all products, categories, and inventory.

### 🔹 Features:

* CRUD for products (admin)
* Categories & subcategories
* Product image upload (S3, Cloudinary, etc.)
* Stock management
* Price updates & discounts
* Product search & filter
* Pagination and sorting

### 📦 Endpoints

```
GET    /products
GET    /products/:id
POST   /products
PUT    /products/:id
DELETE /products/:id
```

---

## 🛒 3. **Cart Module**

Handles cart operations before checkout.

### 🔹 Features:

* Add/update/remove items
* Sync cart with user session
* Calculate total with discounts
* Apply coupons
* Guest cart (optional)

### 📦 Endpoints

```
POST /cart
GET  /cart
PUT  /cart/:itemId
DELETE /cart/:itemId
```

---

## 💳 4. **Payment Module**

Integrates with payment gateways (Paystack, Flutterwave, Stripe).

### 🔹 Features:

* Initiate payment
* Verify transaction webhook
* Refunds and payment logs
* Save transaction history
* Handle failed/expired payments

### 📦 Endpoints

```
POST /checkout
POST /payment/webhook
GET  /payment/history
```

---

## 📦 5. **Order Module**

Responsible for order creation and tracking.

### 🔹 Features:

* Create orders after successful payment
* Track order status (`pending`, `processing`, `shipped`, `delivered`)
* Manage cancellations and returns
* Order history for customers
* Admin dashboard for all orders

### 📦 Endpoints

```
POST /orders
GET  /orders
GET  /orders/:id
PUT  /orders/:id/status
```

---

## 🧾 6. **Analytics Module**

For reporting and business insight.

### 🔹 Features:

* Track sales, revenue, and popular products
* Customer purchase behavior
* Export reports (CSV/PDF)
* Daily/weekly/monthly summaries

### 📦 Endpoints

```
GET /analytics/sales
GET /analytics/products
GET /analytics/customers
```

---

## 📣 7. **Notification Module**

Handles all customer notifications.

### 🔹 Features:

* Email/SMS notifications (order updates, promotions)
* Push notifications (optional)
* Notification templates
* Background queue (async delivery)

### 📦 Endpoints

```
POST /notifications/send
GET  /notifications
```

---

## 🧰 8. **Admin Module**

Tools for managing products, customers, and orders.

### 🔹 Features:

* Role-based admin accounts
* Manage users, orders, and inventory
* View analytics dashboard
* Handle refunds and cancellations
* Audit logs for actions

### 📦 Endpoints

```
GET  /admin/dashboard
GET  /admin/users
GET  /admin/orders
POST /admin/product
PUT  /admin/product/:id
```

---

## 🎁 9. **Promotion & Loyalty Module**

Drives engagement and customer retention.

### 🔹 Features:

* Manage discount codes and coupons
* Track loyalty points
* Referral program
* Promotions scheduling

### 📦 Endpoints

```
POST /promotions
GET  /promotions
POST /coupons/validate
```

---

## ❤️ 10. **Review & Rating Module**

Allows users to share product feedback.

### 🔹 Features:

* Add reviews & ratings
* Edit/delete own reviews
* Flag/report reviews (admin moderation)
* Average rating per product

### 📦 Endpoints

```
POST   /reviews
GET    /reviews/:productId
PUT    /reviews/:id
DELETE /reviews/:id
```

---

## 📍 11. **Address Module**

Manages user shipping/billing addresses.

### 🔹 Features:

* Add/edit/delete addresses
* Mark default address
* Link address with orders
* Validate country/state/postcode

### 📦 Endpoints

```
POST   /address
GET    /address
PUT    /address/:id
DELETE /address/:id
```

---

## 🧱 12. **System & Security Layer**

Cross-cutting backend infrastructure.

### 🔹 Features:

* Centralized error handling
* Request validation middleware
* Rate limiting
* Logging & request tracing (Zap, Logrus)
* Config management (dotenv/viper)
* Health check endpoints
* Background workers (cron jobs, notifications)

### 📦 Endpoints

```
GET /health
GET /metrics
```

---

# 🧭 **Module Summary Table**

| Module       | Purpose                   | Priority  |
| ------------ | ------------------------- | --------- |
| Auth         | Authentication & roles    | 🟢 High   |
| Product      | Product catalog & filters | 🟢 High   |
| Cart         | Cart operations           | 🟢 High   |
| Payment      | Gateway integration       | 🟢 High   |
| Order        | Order lifecycle           | 🟢 High   |
| Notification | Order & promo alerts      | 🟠 Medium |
| Analytics    | Sales insights            | 🟠 Medium |
| Admin        | Staff management          | 🟢 High   |
| Promotion    | Discounts & loyalty       | 🟠 Medium |
| Review       | Product feedback          | 🟢 Medium |
| Address      | Shipping management       | 🟢 Medium |
| System       | Security, health, config  | 🟢 High   |

---
