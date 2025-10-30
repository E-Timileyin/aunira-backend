
---

# **AUNIRA BACKEND FEATURES (No AI Version)**

This version focuses purely on **commerce, user flow, and admin management**, optimized for **security, concurrency**, and **horizontal scalability** using **Golang**.

---

## 🧍‍♀️ 1. **Auth & User Module**

Handles authentication, authorization, and user identity management.

### 🔐 **Authentication Type (2025 Standard)**

AUNIRA uses a **Hybrid Passwordless + MFA Authentication Model**, designed for both **ease of use** and **enterprise-grade security**.

| Layer                    | Method                                              | Description                                                     |
| ------------------------ | --------------------------------------------------- | --------------------------------------------------------------- |
| **Primary Auth**         | Passwordless (Magic Link / OTP)                     | Users authenticate via email or SMS without storing passwords.  |
| **Secondary Auth (MFA)** | TOTP (Google Authenticator) / WebAuthn              | Required for high-risk actions like payment or address changes. |
| **Session Control**      | JWT (short-lived) + Refresh Token (secure rotation) | Tokens stored in httpOnly, Secure cookies.                      |
| **Role Enforcement**     | Role-based Guards                                   | Protect routes per user, admin, staff.                          |
| **Encryption**           | Argon2 + TLS 1.3                                    | Secure password fallback & connection encryption.               |
| **Adaptive Security**    | Risk-based contextual checks                        | Flags suspicious login attempts.                                |

---

### 🔹 **Features**

* Passwordless login (email/phone)
* MFA verification for sensitive actions
* JWT + Refresh token rotation
* Role-based access control
* Profile & preference management
* Token blacklist and session invalidation
* Activity tracking (login history)

---

### 📦 **Endpoints**

#### 👤 **User**

```
POST /auth/signup
POST /auth/login
POST /auth/verify
POST /auth/mfa/verify
POST /auth/refresh
GET  /user/profile
PUT  /user/profile
POST /auth/logout
```

#### 🛠️ **Admin**

```
POST /admin/login
POST /admin/refresh
GET  /admin/profile
```

### ⚙️ **Concurrency Implementation**

* **OTP sending & email verification** → handled via goroutines (async mail/SMS dispatch).
* **Token invalidation cleanup** → background worker goroutine (time-based cleanup).
* **Login activity logging** → non-blocking goroutine to write logs asynchronously.

---

## 🛍️ 2. **Product Module**

Handles product catalog, category, and inventory management.

### 🔹 **Features**

* CRUD for products (admin)
* Product categories/subcategories
* Product search and filtering
* Stock management
* Price updates & discount rules
* Product image upload (S3/Cloudinary)
* Pagination and caching

---

### 📦 **Endpoints**

#### 👤 **User**

```
GET    /products
GET    /products/:id
```

#### 🛠️ **Admin**

```
POST   /products
PUT    /products/:id
DELETE /products/:id
```

### ⚙️ **Concurrency Implementation**

* **Concurrent product fetching**: use goroutines to fetch multiple product categories or variants in parallel.
* **Concurrent image uploads**: upload to S3/Cloudinary concurrently using worker pool pattern.
* **Inventory update queue**: use channels to synchronize concurrent stock updates safely.

---

## 🛒 3. **Cart Module**

Manages user carts and session-based cart sync.

### 🔹 **Features**

* Add/update/remove cart items
* Auto-sync with user session
* Calculate total & discounts
* Apply coupon codes
* Guest cart support

---

### 📦 **Endpoints**

#### 👤 **User**

```
POST /cart
GET  /cart
PUT  /cart/:itemId
DELETE /cart/:itemId
```

### ⚙️ **Concurrency Implementation**

* **Parallel price/discount calculation**: calculate discounts, tax, and subtotal concurrently.
* **Concurrent DB writes**: batch cart updates using worker pools.
* **Cache sync worker**: use goroutines to sync Redis cart cache with DB in background.

---

## 💳 4. **Payment Module**

Integrates third-party payment gateways.

### 🔹 **Features**

* Initiate & verify payments
* Refunds & transaction logging
* Payment webhook processing
* Save transaction history
* Handle failed payments gracefully

---

### 📦 **Endpoints**

#### 👤 **User**

```
POST /checkout
GET  /payment/history
```

#### 🛠️ **Admin**

```
POST /payment/refund
POST /payment/webhook
```

### ⚙️ **Concurrency Implementation**

* **Webhook handler**: process multiple payment confirmations concurrently using goroutines.
* **Refund queue**: channel-based queue for async refunds.
* **Transaction verification**: concurrent gateway calls (Paystack, Flutterwave, Stripe) to minimize latency.

---

## 📦 5. **Order Module**

Handles order creation, tracking, and fulfillment.

### 🔹 **Features**

* Create order after payment success
* Track status (pending → delivered)
* Manage cancellations & returns
* Order history (user)
* Admin-wide order management

---

### 📦 **Endpoints**

#### 👤 **User**

```
POST /orders
GET  /orders
GET  /orders/:id
```

#### 🛠️ **Admin**

```
GET  /admin/orders
PUT  /orders/:id/status
```

### ⚙️ **Concurrency Implementation**

* **Concurrent order creation pipeline**: spawn goroutine per order item to deduct stock & create line item.
* **Parallel order tracking updates**: concurrent DB + cache update for real-time tracking.
* **Worker pool** for scheduled order status checks.

---

## 🧾 6. **Analytics Module**

Generates sales and product insights.

### 🔹 **Features**

* Revenue, sales, customer metrics
* Product popularity ranking
* Exportable CSV/PDF reports
* Time-based trend summaries

---

### 📦 **Endpoints**

#### 🛠️ **Admin**

```
GET /analytics/sales
GET /analytics/products
GET /analytics/customers
```

### ⚙️ **Concurrency Implementation**

* **Parallel aggregation**: compute sales, revenue, and customer data concurrently.
* **Channel-based result merging**: aggregate concurrent queries into unified report.
* **Async report generation**: goroutine to export analytics (CSV/PDF) without blocking request.

---

## 📣 7. **Notification Module**

Handles all app-wide notifications.

### 🔹 **Features**

* Email/SMS/push notifications
* Template-based messages
* Async background queue
* Failure retries

---

### 📦 **Endpoints**

#### 🛠️ **Admin**

```
POST /notifications/send
GET  /notifications
```

### ⚙️ **Concurrency Implementation**

* **Worker pool for notifications**: each worker sends notifications concurrently.
* **Retry goroutine** for failed messages.
* **Channel-based dispatcher** to distribute notification jobs.

---

## 🧰 8. **Admin Module**

Tools for administrative control.

### 🔹 **Features**

* Role-based admin management
* Order/user management
* Dashboard analytics
* Refund handling
* Audit logs

---

### 📦 **Endpoints**

#### 🛠️ **Admin**

```
GET  /admin/dashboard
GET  /admin/users
GET  /admin/orders
POST /admin/product
PUT  /admin/product/:id
DELETE /admin/product/:id
```

### ⚙️ **Concurrency Implementation**

* **Concurrent dashboard metrics**: use goroutines to fetch sales, orders, and inventory in parallel.
* **Audit log writer**: async write logs using channels.

---

## 🎁 9. **Promotion & Loyalty Module**

Manages engagement and retention.

### 🔹 **Features**

* Coupons, loyalty points, referrals
* Promotion scheduling
* Discount validation

---

### 📦 **Endpoints**

#### 👤 **User**

```
GET  /promotions
POST /coupons/validate
```

#### 🛠️ **Admin**

```
POST /promotions
```

### ⚙️ **Concurrency Implementation**

* **Parallel promotion checks**: verify multiple active discounts concurrently.
* **Scheduler worker**: goroutine to activate/deactivate promotions on time-based triggers.

---

## ❤️ 10. **Review & Rating Module**

Allows product feedback and moderation.

### 🔹 **Features**

* Add/edit/delete reviews
* Flag reviews
* Average rating aggregation

---

### 📦 **Endpoints**

#### 👤 **User**

```
POST   /reviews
GET    /reviews/:productId
PUT    /reviews/:id
DELETE /reviews/:id
```

#### 🛠️ **Admin**

```
DELETE /admin/reviews/:id
```

### ⚙️ **Concurrency Implementation**

* **Concurrent rating aggregation**: recalculate product ratings using goroutines.
* **Flag moderation queue**: channel for flagged reviews processed in background.

---

## 📍 11. **Address Module**

Manages user addresses.

### 🔹 **Features**

* CRUD operations
* Default address marking
* Address validation

---

### 📦 **Endpoints**

#### 👤 **User**

```
POST   /address
GET    /address
PUT    /address/:id
DELETE /address/:id
```

### ⚙️ **Concurrency Implementation**

* **Concurrent validation**: run multiple API lookups (country/state/postcode) concurrently.
* **Cache update worker**: goroutine updates address cache after write.

---

## 🧱 12. **System & Security Layer**

Ensures **stability**, **observability**, and **protection** across the system.

### 🔹 **Features**

* Centralized error handling
* Rate limiting middleware
* Structured logging (Zap/Logrus)
* Configuration via Viper
* Cron jobs & async background tasks
* TLS 1.3, Argon2, MFA enforcement
* Adaptive login risk scoring
* Token revocation list
* Real-time health monitoring

---

### 📦 **Endpoints**

#### 🛠️ **Admin**

```
GET /health
GET /metrics
```

### ⚙️ **Concurrency Implementation**

* **Health checks**: concurrent ping to DB, cache, payment gateway, mail service.
* **Metrics collector**: goroutines continuously update Prometheus metrics.
* **Cron job manager**: each scheduled job runs as a goroutine with context cancellation.

---

## ⚡ Summary of Concurrency Hotspots

| Module       | Concurrency Feature            | Type                      |
| ------------ | ------------------------------ | ------------------------- |
| Auth         | OTP sending, logging, cleanup  | Async Goroutines          |
| Product      | Image upload, inventory update | Worker Pool               |
| Cart         | Total calculation, Redis sync  | Parallel computation      |
| Payment      | Webhooks, refund queue         | Channels + Workers        |
| Order        | Creation pipeline              | Goroutines per order item |
| Analytics    | Report aggregation             | Channel fan-in            |
| Notification | Message delivery               | Worker Pool               |
| Admin        | Dashboard stats                | Parallel DB queries       |
| Review       | Rating recalculation           | Async background task     |
| Address      | Validation lookups             | Goroutines                |
| Security     | Health + metrics               | Concurrent monitoring     |

---
