const LAST_UPDATED = "16 September 2026";
const APP_NAME = "Storytelling";
// TODO: replace with the client's real support inbox before publishing.
const SUPPORT_EMAIL = "sumith.guru@hrud.ai";

export const metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-ink">
      <h1 className="font-display text-3xl text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-muted">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
        <p>
          This Privacy Policy explains what information {APP_NAME} ("the app", "we", "us")
          collects, why, and how it's protected. By using the app, you agree to this policy.
        </p>

        <section>
          <h2 className="font-display text-xl text-ink">Information we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Account information:</strong> your email address or phone number, and the
              display name you choose, used only to sign you in and identify your account.
            </li>
            <li>
              <strong>Purchase information:</strong> which subscription plan or videos you've
              purchased, and the associated transaction ID from Apple or Google — never your card
              or payment details, which we never see or store. Payments are handled entirely by
              Apple/Google and RevenueCat.
            </li>
            <li>
              <strong>Push notification token:</strong> a device identifier used only to send you
              a notification when a new video is featured, if you've allowed notifications.
            </li>
            <li>
              <strong>Crash and error reports:</strong> technical details (device type, app
              version, and what the app was doing) captured automatically if the app crashes or
              errors, so we can fix it. This does not include your password or payment details.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">How we use it</h2>
          <p className="mt-2">
            Solely to run the app: signing you in, unlocking the content you've paid for, sending
            you the notifications you've opted into, and fixing bugs. We do not sell your data,
            and we do not use it for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Who we share it with</h2>
          <p className="mt-2">
            We use a small number of service providers to run the app, each of whom only sees the
            minimum needed to do their job: Supabase (database and file storage), RevenueCat
            (subscription and purchase management), Apple/Google (app stores and payment
            processing), Expo (push notifications), and Sentry (crash reporting). None of them are
            permitted to use your data for their own purposes.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Data retention and deletion</h2>
          <p className="mt-2">
            We keep your account information for as long as your account is active. If you've
            purchased a video individually, we keep a record of that purchase even if you later
            delete your account, purely so we (and Apple/Google, if there's ever a billing
            dispute) can prove what you paid for — nothing else about you is kept. To request full
            account deletion, email {SUPPORT_EMAIL}.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Children's privacy</h2>
          <p className="mt-2">
            This app is not directed at children under 13, and we don't knowingly collect
            information from them.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Changes to this policy</h2>
          <p className="mt-2">
            If this policy changes, the "Last updated" date above will change too. Continued use
            of the app after an update means you accept the revised policy.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">Contact us</h2>
          <p className="mt-2">
            Questions about this policy, or a data request: <strong>{SUPPORT_EMAIL}</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
