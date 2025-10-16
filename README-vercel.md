Vercel deploy instructions

This repository uses Vercel to host the static client located in `client/build`. The Vercel configuration is in `vercel.json` which rewrites `/api/*` to your Railway backend.

Prerequisites
- Install the Vercel CLI: `npm i -g vercel`
- Log in to Vercel: `vercel login`

Deploy (production)
Run this from the repo root:

```bash
npm run vercel:deploy
```

Notes
- The `vercel:deploy` script runs the Vercel CLI and will prompt for login if needed. It does not include any tokens.
- If you need to change rewrites, edit `vercel.json` then redeploy.
- Ensure the Railway backend URL in `vercel.json` is correct and that the Railway service is reachable.
