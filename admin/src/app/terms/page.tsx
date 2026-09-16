const LAST_UPDATED = "16 September 2026";
const APP_NAME = "Storytelling";
// TODO: replace with the client's real support inbox before publishing.
const SUPPORT_EMAIL = "sumith.guru@hrud.ai";

export const metadata = {
  title: `Terms of Service — ${APP_NAME}`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-ink">
      <h1 className="font-display text-3xl text-ink">Terms of Service</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
        <p>
          These terms govern your use of {APP_NAME}. By creating an account or using the app, you
          agree to them.
        </p>

        <section>
          <h2 className="font-display text-xl text-ink">Your account</h2>
          <p className="mt-2">
            You're responsible for keeping your password confidential and for anything that
            happens under your account. Tell us right away at {SUPPORT_EMAIL} if you believe your
            account has been accessed without your permission.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Subscriptions and purchases</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Subscription plans automatically renew until you cancel them through your Apple or
              Google account's subscription settings — not through the app itself, since Apple and
              Google manage all billing.
            </li>
            <li>
              A pay-per-video purchase unlocks that specific video for as long as it remains live
              in the app; it is not a subscription and does not renew.
            </li>
            <li>
              Refunds are handled by Apple or Google under their own refund policies — we don't
              process refunds directly, since we never receive your payment details.
            </li>
            <li>
              Videos are only guaranteed to be available until their listed expiry date; content
              may be removed after that date even if you previously had access to it.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Acceptable use</h2>
          <p className="mt-2">
            The content in this app is for your personal viewing only. You agree not to copy,
            redistribute, or share your account access with others, and not to attempt to bypass
            the app's security or access controls.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Content changes</h2>
          <p className="mt-2">
            We may add, change, or remove content, features, or pricing at any time. We'll try to
            give notice of major changes where practical, but the app is provided as-is.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Ending your account</h2>
          <p className="mt-2">
            You may stop using the app and request account deletion at any time by emailing{" "}
            {SUPPORT_EMAIL}. We may suspend or terminate an account that violates these terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Limitation of liability</h2>
          <p className="mt-2">
            The app is provided "as is." To the fullest extent permitted by law, we aren't liable
            for indirect or incidental damages arising from your use of the app.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Changes to these terms</h2>
          <p className="mt-2">
            If these terms change, the "Last updated" date above will change too. Continued use of
            the app after an update means you accept the revised terms.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Contact us</h2>
          <p className="mt-2">
            Questions about these terms: <strong>{SUPPORT_EMAIL}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
