# Server (Aramco Review API)

This folder contains the Express API for the Aramco Review application.

## Purpose

Short guide for configuring and deploying the server portion of the app.

## Required environment variables

The server expects a MongoDB connection string or components. Set at least one of the following:

- `MONGO_URI` (recommended) — full connection string, e.g. `mongodb+srv://<user>:<pass>@cluster0.mongodb.net/mydb`
- `MONGODB_URI`, `DATABASE_URL`, or `DB_URI` — alternative names some providers inject

Or provide components (useful when you want to set pieces separately):

- `MONGO_HOST` (or `DB_HOST`)
- `MONGO_PORT` (or `DB_PORT`) — defaults to `27017` if not provided
- `MONGO_DBNAME` (or `DB_NAME`) — required when building URI from components
- `MONGO_USER` and `MONGO_PASS` (optional credentials; include both if your DB requires auth)

Other useful variables:

- `JWT_SECRET` — application JWT secret
- `PORT` — port the server should listen on (default 5000 in code)
- `NODE_ENV` — typically `production` or `development`

## Railway (or other host) setup

1. In the Railway project, open the service settings for this repository.
2. Go to the Environment / Variables section.
3. Add `MONGO_URI` (or the provider-specific variable if Railway provides one) and any other variables like `JWT_SECRET`.
4. Save and trigger a redeploy.

Note: If you use a Railway-managed MongoDB plugin, check which variable name it exposes (often `DATABASE_URL` or `MONGODB_URI`) and either set `MONGO_URI` to that value or add the provided name to the Railway env variables.

## Local development

1. Create a `.env` file inside the `server/` folder (this repository includes a `.env` example but DO NOT commit secrets to the repo):

```
# Example server/.env (DO NOT commit this file)
MONGO_URI=mongodb://<user>:<pass>@localhost:27017/mydb
JWT_SECRET=replace_with_secure_random_string
PORT=5000
NODE_ENV=development
```

2. Install server dependencies (from the repo root) and run the server:

PowerShell example:

```powershell
npm --prefix server install --omit=dev
npm start
```

Or run directly in the server folder:

```powershell
cd server
npm install --omit=dev
npm start
```

## Security / housekeeping

- Never commit `.env` or files with credentials. Add `server/.env` to `.gitignore` if it isn't already ignored.
- If you accidentally committed secrets, rotate them immediately (change DB password, JWT secret, etc.) and remove the file from the repository history.

## Notes about the start script

The repository root `package.json` was updated so the `start` script installs server dependencies before launching the server. This ensures production hosts that run the root start command will install the server runtime modules.

## Debugging tips

- If you see `MONGO_URI environment variable is not set or invalid` on deploy, confirm the environment variable name in your host and add it to the service.
- To test which env var name your host provides, print env vars in a lightweight start script or check the provider's dashboard for the injected variable name.

If you'd like, I can (a) add `server/.env` to `.gitignore` and remove any committed `.env` from git history, or (b) add a startup log that prints which env var the app is using (without printing credentials).
# Aramco Review Platform - Server

This is the Express backend for the Aramco station review and admin CRM platform.

## Features
- REST API for stations, reviews, users, rewards
- JWT authentication
- MongoDB integration
- QR code generation
- reCAPTCHA verification
- Admin analytics endpoints

## Setup
1. Run `npm install` in this directory.
2. Create a `.env` file with MongoDB and JWT secrets.
3. Run `npm run dev` to start the server in development mode.
"# aramco" 
