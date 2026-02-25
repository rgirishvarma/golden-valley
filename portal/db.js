// portal/db.js
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

// Use sessionStorage (NOT localStorage) for session
const storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ---------- Auth helpers ----------
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

export async function getMyProfile() {
  const user = await getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,phone,role")
    .eq("id", user.id)
    .maybeSingle(); // ✅ avoids 406 when not found

  if (error) throw error;
  return data; // can be null if missing
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ---------- Profiles ----------
export async function listProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,phone,role,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(id) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Plots ----------
export async function listPlots() {
  const { data, error } = await supabase
    .from("plots")
    .select("id,plot,status,location,notes,total_price,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPlot(plotRow) {
  const { data, error } = await supabase
    .from("plots")
    .insert(plotRow)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlot(id, patch) {
  const { data, error } = await supabase
    .from("plots")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlot(id) {
  const { error } = await supabase.from("plots").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Assignments ----------
export async function listAssignments() {
  const { data, error } = await supabase
    .from("plot_assignments")
    .select("user_id,plot_id,assigned_at");
  if (error) throw error;
  return data;
}

export async function assignPlot(user_id, plot_id) {
  const { error: e1 } = await supabase
    .from("plot_assignments")
    .upsert({ user_id, plot_id }, { onConflict: "user_id,plot_id" });
  if (e1) throw e1;

  await updatePlot(plot_id, { status: "Assigned" });
}

export async function unassignPlot(user_id, plot_id) {
  const { error } = await supabase
    .from("plot_assignments")
    .delete()
    .eq("user_id", user_id)
    .eq("plot_id", plot_id);
  if (error) throw error;

  const { data: remaining, error: e2 } = await supabase
    .from("plot_assignments")
    .select("plot_id")
    .eq("plot_id", plot_id);
  if (e2) throw e2;

  if ((remaining || []).length === 0) {
    await updatePlot(plot_id, { status: "Available" });
  }
}

// ---------- Payments ----------
export async function listPayments() {
  const { data, error } = await supabase
    .from("payments")
    .select("id,user_id,plot_id,pay_date,amount,mode,note,created_at")
    .order("pay_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPayment(row) {
  const { data, error } = await supabase.from("payments").insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function deletePayment(id) {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}



