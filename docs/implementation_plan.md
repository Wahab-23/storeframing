# Admin Panel Implementation Plan & API Route Audit (Approved)

This plan outlines the architecture, API audit, missing route handlers, security middleware, and UI design implementation for the **Marketplace Admin Panel**. It strictly adheres to the **Navigation Map** in `docs/Marketplace_Admin_Panel_Information_Architecture.pdf`, existing Prisma schemas, and the reference dashboard layout provided.

## Key Updates & User Feedback Incorporated
1. **Dashboard Route**: `/admin/dashboard` is the main overview dashboard (`/admin` redirects to `/admin/dashboard`).
2. **Admin Login & Authentication**: Dedicated `/admin/login` route.
3. **Strict Route Protection**: Middleware in `proxy.ts` enforces authentication for all `/admin/*` routes (except `/admin/login`). Unauthenticated requests are redirected to `/admin/login`.

---

## 1. API Route Audit & Inventory

| Module Section | Navigation Route | Existing API Route | Action Required |
| :--- | :--- | :--- | :--- |
| **Auth** | `/admin/login` | `POST /api/auth/login` | Create `/admin/login` page & `proxy.ts` guard |
| **Dashboard** | `/admin/dashboard` | `GET /api/admin/overview` | Exists (enhance for full stats, top sources, upcoming feed) |
| **Catalogue** | `/admin/catalogue/products` | `GET /api/admin/products`, `PATCH .../[id]/status` | Complete detail endpoints |
| | `/admin/catalogue/product-submissions` | `GET`, `POST .../[id]/approve`, `POST .../reject` | Add bulk review actions |
| | `/admin/catalogue/product-revisions` | `GET`, `POST .../[id]/approve`, `POST .../reject` | Exists |
| | `/admin/catalogue/categories` | `GET`, `tree`, `reorder`, `move`, `archive`, `restore` | Exists |
| | `/admin/catalogue/brands` | *None* | `[NEW]` Create `GET/POST /api/admin/brands` |
| | `/admin/catalogue/attributes` | *None* | `[NEW]` Create `GET/POST /api/admin/attributes` |
| | `/admin/catalogue/listings` | *None* | `[NEW]` Create `GET /api/admin/listings` |
| | `/admin/catalogue/buy-box` | *None* | `[NEW]` Create `GET /api/admin/buy-box` |
| | `/admin/catalogue/inventory` | *None* | `[NEW]` Create `GET/POST /api/admin/inventory` |
| **Sellers** | `/admin/sellers` | `GET /api/admin/sellers`, `PATCH .../[id]/status` | Exists |
| | `/admin/sellers/approvals` | *Partial in sellers list* | `[NEW]` Create `GET /api/admin/sellers/approvals` |
| | `/admin/sellers/verification` | *None* | `[NEW]` Create `GET/POST /api/admin/sellers/verification` |
| | `/admin/sellers/performance` | *None* | `[NEW]` Create `GET /api/admin/sellers/performance` |
| | `/admin/sellers/staff` | *None* | `[NEW]` Create `GET /api/admin/sellers/staff` |
| **Customers** | `/admin/customers` | *Partial via users route* | `[NEW]` Create `GET /api/admin/customers` |
| | `/admin/customers/reviews` | *Public route `/api/reviews`* | `[NEW]` Create `GET/DELETE /api/admin/customers/reviews` |
| | `/admin/customers/support-history` | *None* | `[NEW]` Create `GET /api/admin/customers/support-history` |
| **Orders** | `/admin/orders` | `GET /api/admin/orders` | Exists |
| | `/admin/orders/seller-orders` | *None* | `[NEW]` Create `GET /api/admin/orders/seller-orders` |
| | `/admin/orders/payments` | *None* | `[NEW]` Create `GET /api/admin/orders/payments` |
| | `/admin/orders/shipments` | *None* | `[NEW]` Create `GET /api/admin/orders/shipments` |
| | `/admin/orders/returns` | `POST /api/admin/returns/[id]/refund` | `[NEW]` Create `GET /api/admin/orders/returns` |
| | `/admin/orders/refunds` | *None* | `[NEW]` Create `GET /api/admin/orders/refunds` |
| **Finance** | `/admin/finance/commission-rules` | *None* | `[NEW]` Create `GET/POST /api/admin/finance/commission-rules` |
| | `/admin/finance/earnings` | *Seller-facing route exists* | `[NEW]` Create `GET /api/admin/finance/earnings` |
| | `/admin/finance/wallets` | *None* | `[NEW]` Create `GET /api/admin/finance/wallets` |
| | `/admin/finance/wallet-transactions` | *None* | `[NEW]` Create `GET /api/admin/finance/wallet-transactions` |
| | `/admin/finance/withdrawals` | *None* | `[NEW]` Create `GET/PATCH /api/admin/finance/withdrawals` |
| | `/admin/finance/payouts` | *None* | `[NEW]` Create `GET /api/admin/finance/payouts` |
| | `/admin/finance/reconciliation` | *None* | `[NEW]` Create `GET /api/admin/finance/reconciliation` |
| **Marketing** | `/admin/marketing/coupons` | *Public route exists* | `[NEW]` Create `GET/POST /api/admin/marketing/coupons` |
| | `/admin/marketing/promotions` | *None* | `[NEW]` Create `GET/POST /api/admin/marketing/promotions` |
| | `/admin/marketing/featured-products` | *None* | `[NEW]` Create `GET/POST /api/admin/marketing/featured-products` |
| | `/admin/marketing/campaigns` | *None* | `[NEW]` Create `GET/POST /api/admin/marketing/campaigns` |
| **Content** | `/admin/content/pages` | *None* | `[NEW]` Create `GET/POST /api/admin/content/pages` |
| | `/admin/content/faqs` | *None* | `[NEW]` Create `GET/POST /api/admin/content/faqs` |
| | `/admin/content/navigation` | *None* | `[NEW]` Create `GET/POST /api/admin/content/navigation` |
| | `/admin/content/seo` | *None* | `[NEW]` Create `GET/POST /api/admin/content/seo` |
| | `/admin/content/media` | *None* | `[NEW]` Create `GET/POST /api/admin/content/media` |
| **Support** | `/admin/support/conversations` | *None* | `[NEW]` Create `GET /api/admin/support/conversations` |
| | `/admin/support/tickets` | *None* | `[NEW]` Create `GET/PATCH /api/admin/support/tickets` |
| | `/admin/support/disputes` | *None* | `[NEW]` Create `GET/PATCH /api/admin/support/disputes` |
| **Reports** | `/admin/reports` | `GET /api/admin/reports/summary`, `analytics/overview` | `[NEW]` Create `GET /api/admin/reports/exports` |
| **Administration** | `/admin/administration/users` | `GET /api/admin/users`, `PATCH .../[id]/status` | Exists |
| | `/admin/administration/roles` | *None* | `[NEW]` Create `GET/POST /api/admin/roles` |
| | `/admin/administration/permissions` | *None* | `[NEW]` Create `GET /api/admin/permissions` |
| | `/admin/administration/notifications` | *None* | `[NEW]` Create `GET/POST /api/admin/notifications` |
| | `/admin/administration/settings` | `GET/PATCH /api/admin/settings` | Exists |
| | `/admin/administration/integrations` | *None* | `[NEW]` Create `GET/POST /api/admin/integrations` |
| | `/admin/administration/audit-logs` | `GET /api/admin/audit-logs` | Exists |

---

## 2. Proposed UI Architecture & Security Guard

1. **Security Guard (`proxy.ts`)**:
   - Matches `/admin/:path*`
   - If token is missing/invalid, redirects unauthenticated requests to `/admin/login`
   - If path is `/admin/login` and user is already authenticated, redirects to `/admin/dashboard`
   - Handles `/admin` root redirect to `/admin/dashboard`

2. **Collapsible Navigation Sidebar**:
   - Logo with quick environment indicator
   - Structured module grouping: *Dashboard, Catalogue, Sellers, Customers, Orders, Finance, Marketing, Content, Support, Reports, Administration*
   - Active state highlighting, badge counters (e.g. pending submissions, pending approvals)
   - Profile footer with logout action

3. **Header**:
   - Dynamic breadcrumb navigation
   - Quick search bar (Ctrl + K)
   - Notifications drawer dropdown
   - Admin user badge with logout button

4. **Main Dashboard Page (`/admin/dashboard`)**:
   - **KPI Hero Section**: Prominent visual banner for active submissions & sales stats with action button
   - **Stat Cards**: Application count, interviews/sellers count, hired/approved stats, revenue metrics
   - **Analytics & Hiring/Source Chart**: Interactive tab bar (Design, Engineering, Marketing / Day, Week, Month) with custom bar charts
   - **Right Widget Column**:
     - Interactive Mini Calendar with current date highlighting
     - "Upcoming Approvals & Activity Feed" list with avatars, time chips, and status badges
   - **Data Table**: "Current Open Listings & Submissions" with status pills, pagination, and action menus

---

## 3. Verification Plan

- Build & lint checks via `npm run build`
- Access control verification: navigating to `/admin/dashboard` while logged out redirects to `/admin/login`.
- Interactive testing of dashboard tabs, calendar, and module routes.
