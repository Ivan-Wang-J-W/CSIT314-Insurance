# FRWA — Fund Raising Web Application

A React.js frontend for an online fundraising platform (CSIT314 group project), built with the **BCE (Boundary – Control – Entity)** architectural framework. Data is mocked entirely in the browser — no backend required.

---

## Quick start

```bash
npm install
npm run dev      # start the dev server at http://localhost:5173
npm run test     # run Vitest unit tests
npm run build    # production build
```

### Demo accounts

| Role              | Username / Email     | Password   |
| ----------------- | -------------------- | ---------- |
| Admin             | `admin`              | `admin123` |
| Platform Manager  | `pm`                 | `pm123`    |
| Fundraiser        | `fr1@frwa.io`        | `password` |
| Donee             | `dn1@frwa.io`        | `password` |

Any `fr<N>@frwa.io` / `dn<N>@frwa.io` (N = 1–50) works with `password`.

---

## Architecture — BCE framework

The app is organised into three strict layers. Each layer depends only on the layers below it.

```
┌─────────────────────────────────────────┐
│  Boundary  (React components / pages)   │ ◄── user interaction
├─────────────────────────────────────────┤
│  Control   (controllers / use cases)    │ ◄── business logic
├─────────────────────────────────────────┤
│  Entity    (domain models / classes)    │ ◄── data & invariants
└─────────────────────────────────────────┘
```

### Entity layer — [`src/entity/`](src/entity/)

Pure object-oriented classes that model the domain. Methods express invariants and behaviour, not UI concerns.

- [`User.js`](src/entity/User.js) – account, role predicates, `toSafeObject()`
- [`FSA.js`](src/entity/FSA.js) – campaign with `progressPercent()`, `isCompleted()`, `daysRemaining()`
- [`Donation.js`](src/entity/Donation.js) – one donation from a Donee to an FSA
- [`Category.js`](src/entity/Category.js) – FSA category/service
- [`Favorite.js`](src/entity/Favorite.js) – (doneeId, fsaId) bookmark pair
- [`Notification.js`](src/entity/Notification.js) – in-app alert

### Control layer — [`src/control/`](src/control/)

Controllers expose the system's use cases. They are the **only** layer allowed to talk to storage. Swapping localStorage for a real REST API later is a one-file change ([`dataStore.js`](src/control/dataStore.js)).

- [`AuthController.js`](src/control/AuthController.js) – login / logout / register / session
- [`UserController.js`](src/control/UserController.js) – admin user management
- [`FSAController.js`](src/control/FSAController.js) – CRUD, search/filter/sort, analytics
- [`DonationController.js`](src/control/DonationController.js) – create donations (updates FSA), query history
- [`FavoriteController.js`](src/control/FavoriteController.js) – toggle favourites (updates FSA.shortlisted)
- [`CategoryController.js`](src/control/CategoryController.js) – CRUD with referential-integrity check
- [`NotificationController.js`](src/control/NotificationController.js) – per-user notifications
- [`ReportController.js`](src/control/ReportController.js) – daily/weekly/monthly aggregates
- [`dataStore.js`](src/control/dataStore.js) – centralised localStorage-backed store + seed hook

### Boundary layer — [`src/boundary/`](src/boundary/)

React components, grouped by role. All data access goes through controllers; no component reads localStorage directly.

```
boundary/
  common/      Layout, ProtectedRoute, FSACard, StatCard, ConfirmDialog, …
  auth/        Login, Register
  admin/       AdminDashboard, UserManagement
  fundraiser/  FRDashboard, CreateFSA, ManageFSA, FSAAnalytics, FRHistory, FSAForm
  donee/       DoneeDashboard, BrowseFSA, FSADetail (+ DonateDialog), Favorites, DonationHistory
  platform/    PlatformDashboard, CategoryManagement, Reports
```

### Cross-cutting

- [`src/context/AuthContext.jsx`](src/context/AuthContext.jsx) – current user + auth actions
- [`src/context/ToastContext.jsx`](src/context/ToastContext.jsx) – toast notifications (MUI Snackbar)
- [`src/utils/`](src/utils/) – `storage`, `validators`, `formatters`
- [`src/data/seed.js`](src/data/seed.js) – deterministic seed for ≥100 records per entity

---

## Features implemented

### User roles and access control

- Four roles with dedicated dashboards and navigation: **Admin**, **Fundraiser**, **Donee**, **Platform Manager**
- [`ProtectedRoute`](src/boundary/common/ProtectedRoute.jsx) enforces authentication and role-based access at the route level
- Role-aware sidebar inside [`Layout`](src/boundary/common/Layout.jsx)

### Fundraiser
- Create, edit, cancel, delete FSAs (reusable [`FSAForm`](src/boundary/fundraiser/FSAForm.jsx) handles both create and edit)
- Per-FSA analytics: views, shortlists, donations list
- Filter past/completed FSAs by category and date range
- Fundraiser-scoped dashboard KPIs

### Donee
- Browse FSAs with keyword search, category filter, and sort (newest / ending / most funded / most viewed)
- Detailed FSA page with donate dialog (validated) and favourite toggle
- Favourites list
- Donation history with category + date-range filter and live FSA progress tracking

### Platform Manager
- KPI dashboard with donations-by-category breakdown
- Full CRUD on categories (blocks delete when category is still referenced)
- Daily / Weekly / Monthly reports, in-house bar chart, and CSV export

### Admin
- System-wide stats
- User management: search, filter by role/status, suspend/reactivate, delete
- "Reset Demo Data" button for live demos

### UX niceties
- Fully responsive (mobile drawer, responsive grids) using MUI
- In-app notifications (bell + dropdown) per user
- Toast feedback on every mutation
- Form validation with composable rules ([`utils/validators.js`](src/utils/validators.js))
- Loading and empty states on every list
- Pagination everywhere lists can get long

---

## Design decisions

1. **Controllers as a seam.** Every UI component imports from `src/control/*` — never from `utils/storage` directly. This makes a future swap to a real backend a mechanical change inside one folder.
2. **Entity classes over plain objects.** Domain methods (`progressPercent`, `isCompleted`, `toSafeObject`) live on the entity itself, which keeps UI code dumb and easy to test.
3. **Local-first mock data.** Seed data lives in [`src/data/seed.js`](src/data/seed.js) with a deterministic PRNG, so reloads and demos stay consistent. Writes persist to localStorage.
4. **Context API instead of Redux.** The only truly global state is the current user and toasts. Redux would be overkill — two small contexts cover it.
5. **MUI for speed and polish.** The theme in [`theme.js`](src/boundary/common/theme.js) is the single source of truth for colours, shape, and type, so the four role UIs feel like one product.
6. **Reusable UI building blocks.** `FSACard`, `StatCard`, `PageHeader`, `ConfirmDialog`, `EmptyState`, `Loader` are shared — they keep the role-specific pages short.

---

## Testing

- Unit tests with **Vitest** + **@testing-library/react**
- Test setup at [`src/test/setup.js`](src/test/setup.js) clears localStorage between tests
- Example entity tests in [`src/test/entity.test.js`](src/test/entity.test.js)
- Example controller tests (auth, donation, favourite, category referential integrity) in [`src/test/controllers.test.js`](src/test/controllers.test.js)

Run all tests with `npm run test`.

---

## Project layout

```
FRWA/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx              ← React entry
    ├── App.jsx               ← Providers + router
    ├── index.css             ← Global styles
    ├── entity/               ← Domain models (OO classes)
    ├── control/              ← Controllers (business logic)
    ├── boundary/             ← UI components (pages + reusable)
    │   ├── common/
    │   ├── auth/
    │   ├── admin/
    │   ├── fundraiser/
    │   ├── donee/
    │   └── platform/
    ├── context/              ← Auth + Toast providers
    ├── data/seed.js          ← ≥100-record seed (deterministic)
    ├── utils/                ← storage, validators, formatters
    └── test/                 ← Vitest tests
```
