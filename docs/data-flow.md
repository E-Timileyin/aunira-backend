# Data Flow

## Request lifecycle

Every request takes the same path. Cross-cutting middleware runs first, then exactly one route handler.

```mermaid
flowchart TD
    A[Client] --> B[helmet]
    B --> C[cors + credentials]
    C --> D[express.json / urlencoded]
    D --> E[cookieParser]
    E --> F[requestLogger]
    F --> G{"/api/auth?"}
    G -- yes --> H[authLimiter: 5 req / 15 min]
    G -- no --> I[router match]
    H --> I
    I --> J[authenticateToken]
    J --> K[requireAdmin, where mounted]
    K --> L[validateBody]
    L --> M[controller]
    M --> N[service]
    N --> O[repository]
    O --> P[(Postgres)]
    N -.->|refresh tokens| Q[(Redis)]
    I -.->|no match| R["404 NOT_FOUND"]
    M -.->|ApiError| S[errorHandler]
    N -.->|ApiError| S
    S --> T[JSON error response]
```

Response envelope: success returns the resource or `{ status, message, data }`; failure returns `{ error }` or `{ status: "error", message, code }` depending on the module. Shapes are stable per endpoint — clients depend on them.

## Authentication

### Register

```mermaid
sequenceDiagram
    participant C as Client
    participant R as auth.routes
    participant S as AuthService
    participant DB as Postgres
    participant RD as Redis

    C->>R: POST /api/auth/register {name,email,password}
    R->>S: register(...)
    S->>S: inline validation (name/email/password)
    S->>DB: findByEmail(email.toLowerCase())
    DB-->>S: null
    S->>S: bcrypt.hash(password, 10)
    S->>DB: insert User (role USER, lastLoginAt now)
    DB-->>S: user row
    S->>S: generateTokens(user) -> access + refresh
    S->>RD: SET refresh_token:<token> = userId EX 604800
    S-->>R: user + tokens
    R-->>C: 201 {message, status: USER_REGISTERED, data:{id,name,email,accessToken,expiresIn}}
```

The refresh token is also set as an httpOnly cookie; the body carries only the access token.

### Login

```mermaid
sequenceDiagram
    participant C as Client
    participant S as AuthService
    participant DB as Postgres
    participant RD as Redis

    C->>S: POST /api/auth/login {email,password}
    S->>DB: findByEmail(email.toLowerCase())
    DB-->>S: user | null
    S->>S: bcrypt.compare(password, user?.password ?? DUMMY_HASH)
    Note over S: constant-time against a dummy hash so a missing user costs the same as a wrong password
    S->>S: reject 401 INVALID_CREDENTIALS if either fails
    S->>DB: updateLastLogin(user.id)
    S->>RD: SET refresh_token:<token> = userId EX 604800
    S-->>C: 200 {status: USER_LOGGED_IN, data:{accessToken, expiresIn, ...}}
```

### Refresh (rotation)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as AuthService
    participant RD as Redis
    participant DB as Postgres

    C->>S: POST /api/auth/refresh-token (cookie or body)
    S->>S: verify signature + expiry (refresh secret)
    S->>RD: GET refresh_token:<token>
    RD-->>S: userId | null
    S->>S: reject 401 if the key is absent (revoked / already rotated)
    S->>DB: findById(userId)
    S->>S: generateTokens(user)
    S->>RD: DEL refresh_token:<old>
    S->>RD: SET refresh_token:<new> = userId EX 604800
    S-->>C: 200 {data:{accessToken, refreshToken, expiresIn, ...}}
```

Any failure returns `401 INVALID_REFRESH_TOKEN`. The old token is dead the moment the new one is issued.

### Protected request

```mermaid
sequenceDiagram
    participant C as Client
    participant M as authenticateToken
    participant H as Handler

    C->>M: Authorization: Bearer <access>
    alt no header
        M-->>C: 401 MISSING_TOKEN
    else expired
        M-->>C: 403 TOKEN_EXPIRED
    else signature invalid
        M-->>C: 403 INVALID_TOKEN
    else valid
        M->>M: req.user = decoded payload
        M->>H: next()
        H-->>C: 200
    end
```

The access token carries `id`, `email`, and `role`. `role` is what `requireAdmin` reads — without the claim in the payload every admin route fails closed.

Revocation is not per-request: the access token stays valid until it expires (15m). Password change and account deletion call `revokeUserTokens(userId)`, which scans Redis for every key whose value is that user and deletes it — killing refresh, not the live access token.

## Checkout: cart to order

```mermaid
sequenceDiagram
    participant C as Client
    participant OS as OrderService
    participant CR as CartRepository
    participant OR as OrderRepository
    participant DB as Postgres

    C->>OS: POST /api/orders/create
    OS->>CR: findCartByUserId(userId)
    OS->>CR: getCartWithItems(cartId)
    CR-->>OS: items with price + quantity
    OS->>OS: reject 400 CART_EMPTY if no items
    OS->>OS: total = sum(price * quantity)
    OS->>OR: createWithItems({userId, total, items})
    OR->>DB: BEGIN
    OR->>DB: INSERT Order (status PENDING)
    OR->>DB: INSERT OrderItem[] (price captured at purchase time)
    OR->>DB: COMMIT
    OS->>CR: clear cart items
    OS->>OR: findById(orderId)
    OR-->>C: 200 order with items
```

Two things to know:

- `OrderItem.price` is a snapshot. Changing a product price later does not rewrite past orders.
- Checkout consumes the cart. The same items are not orderable twice.

`Order.userId` is unique at the database level, so a user has at most one order row. Revisit before supporting repeat purchases — the fix is dropping that unique index and letting orders accumulate.

## Cart operations

`POST /api/cart/add` looks up the product (404 `PRODUCT_NOT_FOUND` if absent), finds or creates the user's cart, then upserts the line: increment when `(cartId, productId)` already exists, insert otherwise.

`GET /api/cart` returns `{ id: null, items: [], total: 0 }` when no cart exists rather than a 404 — an empty cart is a valid state.

## Admin flows

The parent admin router mounts `authenticateToken` and `requireAdmin` once, so every route below it — including the nested dashboard router — is covered by the same guard. A non-admin gets `403 FORBIDDEN` before any handler runs.

`GET /api/admin/orders` inner-joins users, left-joins order items and products, groups rows into orders with a nested `items` array, and returns `{ orders, pagination: { total, page, totalPages, limit } }`. Default page size is 50. An invalid `status` filter reaches Postgres and surfaces as a 500 — the enum rejects it before the app can.

`GET /api/admin/dashboard/stats` reports `totalUsers`, `activeUsers` (logged in within 30 days), and `newUsers` (created within 30 days).

## Data model

```mermaid
erDiagram
    User ||--o| Cart : "has (app-enforced one)"
    User ||--o| Order : "has at most one"
    Cart ||--o{ CartItem : contains
    Order ||--o{ OrderItem : contains
    Product ||--o{ CartItem : "referenced by"
    Product ||--o{ OrderItem : "referenced by"
    Category ||--o{ Product : groups

    User {
        text id PK
        text email UK
        text name
        text password
        UserRole role
        boolean isEmailVerified
        timestamp lastLoginAt
        int phone
        timestamp createdAt
        timestamp updatedAt
    }
    Product {
        text id PK
        text name
        text description
        float price
        text image_url
        text sku UK
        text categoryId FK
    }
    Category {
        text id PK
        text name
    }
    Cart {
        text id PK
        text userId FK
    }
    CartItem {
        text id PK
        text cartId FK
        text productId FK
        int quantity
    }
    Order {
        text id PK
        text userId FK_UK
        float total
        OrderStatus status
    }
    OrderItem {
        text id PK
        text orderId FK
        text productId FK
        int quantity
        float price
    }
```

Enums: `UserRole` = `ADMIN | USER`, `OrderStatus` = `PENDING | PROCESSING | COMPLETED | CANCELLED`.

Foreign keys cascade on delete for every required relation; `Product.categoryId` is the exception and sets null, so deleting a category leaves its products in place.

Two schema facts worth flagging before they surprise someone:

- `Cart.userId` has no unique constraint, so the schema permits several carts per user. Application code (`findOrCreateCart`) treats it as one. A unique index would make that explicit.
- `Order.userId` is unique, which is what caps a user at a single order.

## Migrations

Model changes flow one way:

```
model.ts  --drizzle-kit generate-->  src/db/migrations/NNNN_*.sql
                                            |
                                    app/migrate.ts applies it
                                            |
                                  __drizzle_migrations (file hash)
```

The runner skips any file whose hash is already recorded, and treats duplicate-object Postgres errors as already-applied. Adding a module means adding its model to `src/db/postgres.schema.ts`, or the generator will not see the tables.
