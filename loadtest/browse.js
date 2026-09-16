// Simulates the app's real read pattern under load: sign in, browse
// sections, open a section's videos, check today's featured video, and
// check subscription plans — the same queries mobile/lib/queries.ts makes.
// Run `node create-test-users.js` first; see README.md for setup.
import http from "k6/http";
import { check, sleep } from "k6";
import { SharedArray } from "k6/data";

const SUPABASE_URL = __ENV.SUPABASE_URL;
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
}

const users = new SharedArray("test users", () => {
  const data = JSON.parse(open("./test-users.json"));
  return data.emails.map((email) => ({ email, password: data.password }));
});

export const options = {
  stages: [
    { duration: "30s", target: 200 }, // ramp up to the 200+ concurrent-user target
    { duration: "3m", target: 200 }, // hold — sustained load matters more than a spike
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // fewer than 1% of requests should fail
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
  },
};

function headers(accessToken) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export default function () {
  // Each VU picks one account and reuses it for the whole test run — signing
  // in once per iteration would test auth throughput, not browsing throughput.
  const user = users[__VU % users.length];

  const loginRes = http.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    JSON.stringify({ email: user.email, password: user.password }),
    { headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" } }
  );
  const accessToken = loginRes.json("access_token");
  if (!check(loginRes, { "login succeeded": () => !!accessToken })) {
    return;
  }
  const h = headers(accessToken);

  // getSections()
  const sectionsRes = http.get(`${SUPABASE_URL}/rest/v1/sections?select=*&order=display_order`, {
    headers: h,
  });
  check(sectionsRes, { "sections ok": (r) => r.status === 200 });
  const sections = sectionsRes.json();

  // getVideosForSection() — a real user opens one section, not all of them
  if (Array.isArray(sections) && sections.length > 0) {
    const section = sections[Math.floor(Math.random() * sections.length)];
    const videosRes = http.get(
      `${SUPABASE_URL}/rest/v1/videos_catalog?select=*&section_id=eq.${section.id}&order=posted_at.desc`,
      { headers: h }
    );
    check(videosRes, { "videos ok": (r) => r.status === 200 });
  }

  // getTodaysVideo()
  const todayRes = http.get(
    `${SUPABASE_URL}/rest/v1/videos_catalog?select=*&is_daily_featured=eq.true&limit=1`,
    { headers: h }
  );
  check(todayRes, { "today's video ok": (r) => r.status === 200 });

  // getSubscriptionPlans()
  const plansRes = http.get(
    `${SUPABASE_URL}/rest/v1/subscription_plans?select=*&active=eq.true&order=duration_days`,
    { headers: h }
  );
  check(plansRes, { "plans ok": (r) => r.status === 200 });

  sleep(Math.random() * 3 + 2); // 2-5s between actions, like an actual person
}
