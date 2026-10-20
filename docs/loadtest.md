# Load test

Simulates real app traffic — signed-in users browsing sections, a section's
videos, today's featured video, and subscription plans — the exact read
pattern the app itself generates. Every one of these tables is RLS-gated to
signed-in users, so the test authenticates real (throwaway) accounts first,
same as the app does, rather than hitting the REST API anonymously.

## Setup

1. Install [k6](https://k6.io/docs/get-started/installation/).
2. Set three environment variables (values from `mobile/.env` and the
   Supabase dashboard → Settings → API):
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export TEST_USER_PASSWORD="some-throwaway-password-123"
   ```
3. Run the setup script once to create the throwaway test accounts the load
   test will sign in as (default: 220, covering the 200+ concurrent-user
   target with headroom):
   ```bash
   node loadtest/create-test-users.js
   ```
   This writes `loadtest/test-users.json` — do not commit it, and delete
   these accounts from `auth.users` afterward if you don't want them
   sitting in production.

## Running it

```bash
k6 run loadtest/browse.js
```

This ramps up to 200 concurrent virtual users over 30 seconds, holds for 3
minutes, then ramps down — long enough to see whether response times hold
up under sustained load, not just survive a brief spike. Each VU logs in
once, then loops: fetch sections → fetch one section's videos → fetch
today's video → fetch subscription plans, with a short pause between
loops to mimic real user behavior instead of hammering as fast as possible.

## Reading the results

k6 prints `http_req_duration` percentiles at the end. As a rough bar for
this app (simple reads behind RLS, not video streaming itself — video
bytes are served straight from Supabase Storage's CDN, not through these
API calls): p95 under ~500ms and an error rate near 0% at 200 concurrent
users means the database/RLS layer is not the bottleneck. If it's much
worse than that, the fix is almost always a missing index or an
underprovisioned Supabase compute tier — not application code.
