# Admin panel

Next.js app for managing sections, videos, pricing, and home-page content. See `../ARCHITECTURE.md` §7 for the design.

## Setup

```bash
cp .env.example .env.local   # fill in your Supabase URL + anon key (same project as mobile/)
npm install
npm run dev
```

Sign in with an account already promoted to `admin` (see `../supabase/README.md` step 6). There's no separate admin sign-up flow — promote an existing user via SQL.

## Notes

- Never put the Supabase **service role** key in this app. Every write goes through RLS using the signed-in admin's own session — see `supabase/migrations/0002_rls.sql`.
- Video upload goes browser → `r2-upload-url` Edge Function (for a presigned URL) → directly to R2 → then a Server Action writes the `videos` row. The admin app never touches R2 credentials.
- "Remove now" on a video sets it to expire immediately rather than hard-deleting the row, so the nightly `expire-videos` sweep still purges the R2 file. See the comment in `src/app/(admin)/sections/[id]/actions.ts`.
