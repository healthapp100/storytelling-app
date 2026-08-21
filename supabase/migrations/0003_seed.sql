-- Starter seed data — adjust freely, this just gets the app runnable.

insert into public.sections (slug, title, description, display_order) values
  ('sutras', 'Sutras', 'Core teachings, explained.', 1),
  ('slokas', 'Slokas', 'Verses with meaning and context.', 2),
  ('puranas', 'Puranas', 'Stories from the Puranas.', 3);

insert into public.subscription_plans (code, price_cents, duration_days, active) values
  ('daily', 1900, 1, true),
  ('weekly', 9900, 7, true),
  ('monthly', 29900, 30, true);
-- price_cents above are placeholders — replace with real pricing, then set
-- revenuecat_product_id to match the product IDs created in App Store
-- Connect / Play Console (see ARCHITECTURE.md §6).

insert into public.app_content (key, value) values
  ('home_intro_text', '"Welcome — this app brings you daily stories, slokas, and puranas, explained simply."'),
  ('home_intro_video_key', 'null');
-- home_intro_video_key should be set to the R2 object key of the static
-- 2-3 minute intro video once the admin uploads it.
