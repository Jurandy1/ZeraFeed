/**
 * Valores públicos do Supabase (seguros no browser).
 * Vercel precisa de VITE_* no build; estes defaults evitam o site quebrar se faltar env.
 */
export const DEFAULT_SUPABASE_URL = "https://nepxjrpugxzcllljrdug.supabase.co";
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_DIQIItZ8q88F-yXqxRkmgg_K_kGHD-C";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lcHhqcnB1Z3h6Y2xsbGpyZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0MTQ0MjksImV4cCI6MjEwMjk5MDQyOX0.GTwf_K8-EneTVK7uAOP_B5oCS3zcKA6J_a3x8ewoxco";

export function resolvePublicSupabaseUrl(): string {
  return (
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined)?.trim() ||
    (typeof process !== "undefined" ? process.env.VITE_SUPABASE_URL : undefined)?.trim() ||
    DEFAULT_SUPABASE_URL
  );
}

export function resolvePublicSupabaseKey(): string {
  return (
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ||
    (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined)?.trim() ||
    (typeof process !== "undefined" ? process.env.VITE_SUPABASE_PUBLISHABLE_KEY : undefined)?.trim() ||
    (typeof process !== "undefined" ? process.env.SUPABASE_ANON_KEY : undefined)?.trim() ||
    DEFAULT_SUPABASE_PUBLISHABLE_KEY
  );
}
