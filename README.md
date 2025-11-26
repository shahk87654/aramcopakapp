
# Aramco Review Platform

A full-stack web application for Aramco station reviews and admin CRM.

## Structure
- `client/` - React frontend
- `server/` - Express backend

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or cloud)

## Setup

### 1. Backend (server)

```
cd server
cp .env.example .env   # Edit .env with your MongoDB URI and secrets
npm install
npm run dev            # or npm start
```

### 2. Frontend (client)

```
cd client
npm install
npm start
```

The frontend will run on http://localhost:3000 and the backend on http://localhost:5000 by default.

## Usage

- Users can select a station by GPS or QR code, submit reviews, and earn rewards.
- Admins can log in and access the dashboard at `/admin/dashboard` for analytics, review moderation, and coupon management.

## Environment Variables

See `server/.env.example` for required backend environment variables.

## Aramco Review Platform

A full-stack web application for collecting, moderating and rewarding station reviews.

This README documents the repository layout, the responsibilities of each top-level folder, how to run the app locally, and deployment notes.

## Quick summary

- Full-stack stack using a React client and an Express/Node server with MongoDB persistence.
- Features: GPS & QR station selection, review submission with star ratings, reward/coupon system, admin dashboard for moderation and analytics, and multiple deployment targets (Vercel/Netlify/Fly/Render/Railway/Docker).

## Repository structure (high level)

- `client/` - React frontend application (source in `client/src`).
	- `src/` - app source (App.js, index.js)
	- `src/components/` - reusable UI components (QRCode, StarRating, ErrorBoundary, etc.)
	- `src/pages/` - page-level components (Home, Login, Review, Admin pages, Reward flow)
	- `src/utils/` - frontend helpers and API client (`api.js`, `stationUtils.js`) and unit tests under `__tests__`
	- `build/` & `public/` - production build artifacts checked into this repo for static hosting

- `client-clean/` - an alternate/older build artifact and Netlify config (kept for historic deployments or quick static hosting)

- `server/` - Express backend and API
	- `index.js` - server bootstrap / express app entry
	- `routes/` - REST endpoints (reviews, rewards, stations, auth, admin, captcha, health checks)
	- `models/` - Mongoose models (`User.js`, `Review.js`, `Station.js`, `Coupon.js`)
	- `middleware/` - auth and other middleware used by routes
	- `utils/` - helpers (MongoDB connection etc.)
	- `scripts/` - convenience scripts for data operations (bulk add stations, delete test reviews, test review cooldown)
	- `Dockerfile`, `fly.toml`, `render.yaml` - deployment configs for various hosts

- `Functions/` - serverless functions (used by some hosts like Vercel; inspect to see which endpoints are deployed as functions)

- `build/`, `public/`, `scripts/` (top-level) - root-level static builds and convenient scripts used for test/automation and the deployed front-end

- config and meta files at the repo root: `package.json`, `railway.json`, `vercel.json`, `README-vercel.md`, `TODO.md` and deployment manifests


## Important files and their purpose

- `server/index.js` - starts the Express server, attaches routes and middleware.
- `server/routes/*.js` - define HTTP APIs. Notable routes:
	- `reviews.js` - create and fetch reviews
	- `rewards.js` - coupon generation and redemption
	- `stations.js` - station lookup (by GPS, QR payload)
	- `auth.js`, `admin.js` - authentication and admin-only actions
- `server/models/*.js` - Mongoose schemas for Users, Stations, Reviews and Coupons; these define core data shapes and validations.
- `client/src/pages/*` - the user-facing pages and admin pages (AdminDashboard, AdminReviews, AdminCoupons, Login, Register, Reward flow).
- `client/src/components/*` - UI building blocks like `CouponQRCode.js`, `StarRating.js`, and an `ErrorBoundary` to capture UI errors.
- `client/src/utils/api.js` - centralized API client used by the frontend to call the server APIs.
- `client/src/utils/stationUtils.js` - helpers for station selection and coordinate handling; unit tests exist at `client/src/utils/__tests__/stationUtils.test.js`.
- `server/scripts/*` - utilities for data import and maintenance. Example: `bulkAddStations.js` to seed stations.


## Core functionality overview

- Station selection
	- Users can select a station via GPS or by scanning a station-specific QR code. The QR payload and GPS coordinates are validated server-side.

- Review submission and moderation
	- Users submit reviews consisting of a star rating and text. Reviews are stored in MongoDB and surfaced to admins for moderation.
	- Anti-cheat checks prevent repeated reviews for the same station within short time windows; velocity/GPS checks are applied server-side.

- Rewards / Coupons
	- The system awards coupons/rewards based on configurable rules (for example, every 5th review earns a coupon).
	- Coupons are represented as their own model and can be generated or redeemed via the rewards API.

- Authentication & Admin features
	- Authentication supports email/phone flows (see `server/routes/auth.js`).
	- Admin routes are protected and provide analytics, the ability to moderate reviews, and to manage coupons.


## Development setup (local)

Prerequisites:
- Node.js (recommended v18+)
- MongoDB (local instance or a cloud MongoDB URI)

Start backend server:

```powershell
cd server
cp .env.example .env  # Windows: copy the variables and create .env manually or use copy
# Edit server/.env with your MongoDB URI and secrets (see next section)
npm install
npm run dev   # or npm start for production-mode start
```

Start frontend dev server:

```powershell
cd client
npm install
npm start
```

Default ports:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000 (or the PORT set in `server/.env`)


## Environment variables

The exact variables used by the server are listed in `server/.env.example`. Typical variables include:

- `PORT` - server listen port
- `MONGODB_URI` or `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret for auth tokens
- `NODE_ENV` - environment (development|production)

If your project uses SMS / third-party providers or captcha, you may also need credentials for those services — check `server/.env.example` and route implementations in `server/routes`.


## Tests

- Frontend unit tests exist in `client/src/utils/__tests__/stationUtils.test.js`. Run frontend tests with:

```powershell
cd client
npm test
```

- The repository does not ship a comprehensive backend test suite in `server/` by default (check `server/package.json`), but add tests using Jest or your preferred test runner if needed.


## Scripts & maintenance

- `server/scripts/*` contains utilities to seed or clean data:
	- `bulkAddStations.js` — import many stations from a dataset
	- `deleteTestReviews.js` — cleanup script for test reviews
	- `test_review_cooldown.js` — helper for validating rate-limits and cooldown logic

Run these with `node server/scripts/<script>.js` after setting `NODE_ENV` and database connection.


## Deployment notes

- Multiple deployment targets are supported or have configuration files in the repo:
	- Vercel: `vercel.json` and `README-vercel.md` provide hints for deploying the client and serverless functions.
	- Netlify: `client-clean/netlify.toml` and static builds can be hosted on Netlify.
	- Fly: `server/fly.toml` for fly.io deployments.
	- Render / Railway: `render.yaml` and `railway.json` contain example configuration for those hosts.
	- Docker: `server/Dockerfile` for containerized server deployments.

Recommended production flow (simple):
1. Build the client: from `client` run `npm run build` (produces `build/` or `public/`).
2. Serve the `build/` static files from a static host (Vercel/Netlify) or from the Express server (copy `build` into server's static folder).
3. Configure the server with a production MongoDB instance and secure secrets.


## Debugging tips

- Inspect server logs (`server/index.js` and any logger middleware) for route errors.
- Use the browser devtools to trace frontend API calls to the backend `api.js` wrapper.
- If reviews fail to submit, verify MongoDB connection, JWT token validity, and that the routes return 2xx responses.


## Contributing

If you add features or change data models:

1. Add/adjust unit tests for the affected code.
2. Update models in `server/models` and any API docs.
3. Ensure the client UI in `client/src/pages` reflects new API shapes.


## Small extras & housekeeping

- There are checked-in `build/` artifacts in `client/build` and top-level `build/` which are convenient for static hosting or quick demos. Keep them up-to-date with `npm run build` from the `client` folder.
- Keep the `server/.env.example` in sync with real env variables required by `server`.


## Where to look for specifics

- To understand review and reward rules, inspect `server/routes/reviews.js` and `server/routes/rewards.js`.
- For anti-cheat and GPS/velocity checks look in the relevant route handlers and middleware in `server/middleware`.
- Admin UI and pages live in `client/src/pages/Admin*` and `client/src/components`.


## License / Intent

This repository is provided as a development/demo project.


---

If you'd like, I can also:

- extract and list the exact environment variables from `server/.env.example` into this README,
- add quickstart PowerShell scripts under `.vscode/tasks.json` or a `make`/npm script to start both client & server concurrently,
- or open a PR that adds a lightweight end-to-end test to validate the review+reward flow.

Let me know which of those you'd like next.
