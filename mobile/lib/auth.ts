import { AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Supabase's raw error messages are written for developers, not the person
// typing into this form — translate the ones users will actually hit.
function friendlyAuthError(error: AuthError): Error {
  const message = error.message.toLowerCase();
  if (message.includes("rate limit")) {
    return new Error("Too many attempts too quickly — wait a minute and try again.");
  }
  if (message.includes("already registered") || message.includes("already exists")) {
    return new Error("An account with that email or phone number already exists — try signing in instead.");
  }
  if (message.includes("invalid login credentials")) {
    return new Error("That email/phone or password doesn't match an existing account.");
  }
  return new Error(error.message);
}

// Supabase Auth only ships email+password natively. Phone+password reuses
// the same identity system by mapping the phone number to a synthetic,
// never-shown email — see ARCHITECTURE.md §3 for why.
const PHONE_DOMAIN = "phone.internal";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) {
    throw new Error("Enter a valid phone number, including country code.");
  }
  return digits;
}

function syntheticEmailFor(phone: string): string {
  return `${normalizePhone(phone)}@${PHONE_DOMAIN}`;
}

export type Credential =
  | { kind: "email"; email: string; password: string }
  | { kind: "phone"; phone: string; password: string };

function toAuthEmail(credential: Credential): string {
  return credential.kind === "email"
    ? credential.email.trim().toLowerCase()
    : syntheticEmailFor(credential.phone);
}

export async function signUp(credential: Credential, displayName: string) {
  const email = toAuthEmail(credential);
  const { data, error } = await supabase.auth.signUp({
    email,
    password: credential.password,
  });
  if (error) throw friendlyAuthError(error);

  // profiles row is also auto-created by a DB trigger (see supabase/migrations),
  // this fills in the fields the trigger can't know about.
  if (data.user) {
    await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        phone: credential.kind === "phone" ? credential.phone : null,
        email: credential.kind === "email" ? credential.email : null,
      })
      .eq("id", data.user.id);
  }

  return data;
}

export async function signIn(credential: Credential) {
  const email = toAuthEmail(credential);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: credential.password,
  });
  if (error) throw friendlyAuthError(error);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
