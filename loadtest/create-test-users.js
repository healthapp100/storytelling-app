// Creates throwaway accounts for the load test to sign in as — same
// signup endpoint the app itself uses, so this only works if it works,
// which is a decent smoke test on its own. Run once before `k6 run browse.js`.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const PASSWORD = process.env.TEST_USER_PASSWORD;
const COUNT = Number(process.env.TEST_USER_COUNT ?? 220);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !PASSWORD) {
  console.error("Set SUPABASE_URL, SUPABASE_ANON_KEY, and TEST_USER_PASSWORD first.");
  process.exit(1);
}

async function createUser(index) {
  const email = `loadtest-${index}-${Date.now()}@example.com`;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Signup failed for ${email}: ${response.status} ${body}`);
  }
  return email;
}

async function main() {
  const emails = [];
  const batchSize = 20; // avoid tripping Supabase's own signup rate limit
  for (let i = 0; i < COUNT; i += batchSize) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(batchSize, COUNT - i) }, (_, j) => createUser(i + j))
    );
    emails.push(...batch);
    console.log(`Created ${emails.length}/${COUNT} test users...`);
  }

  const fs = await import("node:fs/promises");
  await fs.writeFile(
    new URL("./test-users.json", import.meta.url),
    JSON.stringify({ password: PASSWORD, emails }, null, 2)
  );
  console.log(`Done — wrote loadtest/test-users.json with ${emails.length} accounts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
