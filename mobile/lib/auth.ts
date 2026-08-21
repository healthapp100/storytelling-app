import { supabase } from "./supabase";

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
  if (error) throw error;

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
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
