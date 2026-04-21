// src/data/authStore.ts
// localStorage-based auth — no backend required for the demo.
// All accounts must use @aero.com email addresses.
// Passwords are stored in plain text in a separate credentials key — demo only.

export type UserRole = "Pilot" | "Analyst" | "Fleet Manager";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  joinedAt: string;
}

interface Credential {
  email: string;
  password: string;
}

const USERS_KEY   = "aeroscan_users";
const CREDS_KEY   = "aeroscan_credentials";
const SESSION_KEY = "aeroscan_session";

// ── Internal helpers ──────────────────────────────────────────────────────────

function loadUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]") as User[];
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadCreds(): Credential[] {
  try {
    return JSON.parse(localStorage.getItem(CREDS_KEY) ?? "[]") as Credential[];
  } catch {
    return [];
  }
}

function saveCreds(creds: Credential[]): void {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): { ok: true; user: User } | { ok: false; error: string } {
  if (!name.trim()) return { ok: false, error: "Please enter your full name." };

  const e = email.toLowerCase().trim();
  if (!e.endsWith("@aero.com"))
    return { ok: false, error: "Only @aero.com email addresses are permitted." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    return { ok: false, error: "Please enter a valid email address." };
  if (password.length < 6)
    return { ok: false, error: "Password must be at least 6 characters." };

  const users = loadUsers();
  if (users.some((u) => u.email === e))
    return { ok: false, error: "An account with this email already exists." };

  const user: User = {
    id: `USR-${Date.now().toString(36).toUpperCase()}`,
    name: name.trim(),
    email: e,
    role,
    joinedAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);

  // Store credential separately (never expose password inside the User object)
  const creds = loadCreds().filter((c) => c.email !== e);
  saveCreds([...creds, { email: e, password }]);

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}

export function loginUser(
  email: string,
  password: string,
): { ok: true; user: User } | { ok: false; error: string } {
  const e = email.toLowerCase().trim();

  const user = loadUsers().find((u) => u.email === e);
  if (!user)
    return { ok: false, error: "No account found with this email. Please register first." };

  const cred = loadCreds().find((c) => c.email === e);
  if (!cred || cred.password !== password)
    return { ok: false, error: "Incorrect password. Please try again." };

  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
