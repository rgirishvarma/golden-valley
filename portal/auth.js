// portal/auth.js
import { getUser, getMyProfile } from "./db.js";

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    window.location.replace("./login.html");
    return null;
  }
  return user;
}

export async function requireRole(allowedRoles = []) {
  const user = await requireAuth();
  if (!user) return null;

  const profile = await getMyProfile();
  if (!profile) {
    // user exists but no profile row yet
    alert("Profile not found. Ask admin to create your profile.");
    window.location.replace("./login.html");
    return null;
  }

  if (allowedRoles.length && !allowedRoles.includes(profile.role)) {
    alert("Access denied.");
    // send user to their home page if not admin
    window.location.replace(profile.role === "admin" ? "./index.html" : "./user-home.html");
    return null;
  }

  return { user, profile };
}

export function wireLogout(buttonId = "btnLogout") {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const { signOut } = await import("./db.js");
    await signOut();
    window.location.replace("./login.html");
  });
}