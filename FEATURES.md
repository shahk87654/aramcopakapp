# Features for Aramco Review Platform

This document lists the important features implemented (or expected) by the project. It is organized into user-facing, admin, backend, security/anti-cheat, developer, testing, and deployment features.

## User-facing features

- Station selection
  - Select station by GPS (nearby search using device coordinates)
  - Scan station QR code that encodes station identity or deep link
  - Station detail page with information and location

- Review submission
  - Submit review with star rating (1-5) and free-form text
  - Optionally attach metadata (timestamp, GPS location, device info)
  - Review edit/delete (subject to cooldown or admin settings)

- Reward system
  - Earn coupons/rewards after configurable actions (for example, every 5th valid review)
  - View earned coupons in user profile
  - Redeem coupons at station or via code

- Authentication & profile
  - Sign-up / login with email and/or phone number
  - Profile page showing reviews, earned rewards and coupon codes

- QR code utilities
  - Generate QR code on coupons (`client/src/components/CouponQRCode.js`)
  - Scan station QR codes to select a station quickly

## Admin features

- Admin dashboard
  - Overview metrics (reviews count, active users, coupon redemptions, station stats)
  - Time-range filtering and basic charts (daily/weekly/monthly)

- Review moderation
  - List and filter pending or flagged reviews
  - Approve, reject or edit reviews
  - Ban or suspend users who violate rules

- Coupon management
  - Issue, revoke, or expire coupons
  - Configure reward rules (thresholds, frequency)

- Audit & logs
  - Track admin actions and key events for accountability

## Backend features

- REST API
  - CRUD APIs for reviews, users, stations, and coupons (in `server/routes`)

- Data models
  - Mongoose models for Users, Stations, Reviews and Coupons (in `server/models`)
  - Proper indexes for location-based queries and common lookups

- Anti-cheat & validation
  - Prevent duplicate or rapid repeated reviews for the same station
  - Velocity checks to detect impossible travel between station check-ins
  - Validate QR payloads server-side and verify station identity

- Scripts & maintenance
  - Scripts to bulk import stations (`server/scripts/bulkAddStations.js`)
  - Cleanup and test data scripts (`deleteTestReviews.js`, `test_review_cooldown.js`)

## Security & privacy features

- Authentication
  - Token-based (JWT) auth and server-side session validation

- Input validation
  - Server-side input sanitization and length checks for reviews and user data

- Rate limiting & abuse prevention
  - Throttle review submissions per user and per station to prevent spam

- Data minimization
  - Only store necessary metadata (e.g., location when required) and respect user privacy

## Developer features

- Local development support
  - `server/` and `client/` can be run independently for faster development
  - Sample `build/` artifacts included for quick static testing

- Tests
  - Frontend unit tests for helper utilities (`client/src/utils/__tests__/stationUtils.test.js`)

- Scripts
  - Utility scripts for seeding and testing

## Deployment & hosting

- Multi-target deployment configurations
  - `vercel.json` and `README-vercel.md` for Vercel static hosting and API rewrites
  - `client-clean/netlify.toml` for Netlify
  - `server/fly.toml`, `render.yaml`, `railway.json` for cloud hosts
  - `server/Dockerfile` for containerized deployment

- CI/CD notes
  - Deploy scripts and manifests are present; ensure env variables and secrets are configured in the target host

## Observability & maintenance

- Logging
  - Server-side logging for routes and errors (see `server/index.js` and logging middleware)

- Monitoring
  - Add application monitoring (Sentry, Datadog) for production environments

- Backups
  - Regular MongoDB backups recommended for production

---

If you want, I can:
- Add this features list into the main `README.md` under a "Features" section,
- Convert each feature into a checklist with implementation status (todo/in-progress/done), or
- Create a simple `FEATURES.md` badge and link from the README.

Which of those would you like next?