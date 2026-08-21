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
- Video upload goes browser → directly to the `videos` bucket in Supabase Storage (using the admin's own session, enforced by `storage.objects` RLS in `supabase/migrations/0007_storage.sql`) → then a Server Action writes the `videos` row. No presigned-URL step, no separate storage credentials needed.
- "Remove now" on a video sets it to expire immediately rather than hard-deleting the row, so the nightly `expire-videos` sweep still purges the storage file. See the comment in `src/app/(admin)/sections/[id]/actions.ts`.
