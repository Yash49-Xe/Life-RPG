"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email:    (formData.get("email")    as string).trim(),
    password:  formData.get("password") as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/tasks");
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register(formData: FormData) {
  const supabase = await createClient();

  const email    = (formData.get("email")    as string).trim();
  const password =  formData.get("password") as string;

  if (!email || !password) {
    redirect(`/register?error=${encodeURIComponent("Email and password are required")}`);
  }

  if (password.length < 6) {
    redirect(`/register?error=${encodeURIComponent("Password must be at least 6 characters")}`);
  }

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?message=" + encodeURIComponent("Account created! Check your email to confirm, then sign in."));
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
