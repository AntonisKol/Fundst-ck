// Shared helpers for the database rule checks. They talk to Supabase over its
// REST API with the anon key, exactly like the app, so the rules (RLS, grants,
// triggers) are tested as a real signed-in or signed-out user meets them.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const ROOT = new URL("../../", import.meta.url).pathname;

const readKeyValues = (path) =>
  Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim().replace(/^['"]|['"]$/g, "")];
      })
  );

const env = readKeyValues(join(ROOT, ".env"));
const SUPABASE_URL = env.SUPABASE_URL;
const ANON_KEY = env.SUPABASE_ANON_KEY;

// The demo login lives outside the repo: DEMO_EMAIL/DEMO_PASSWORD, or a file
// with EMAIL= and PASSWORD= lines (default ~/fundstueck-demo.txt).
const demoLogin = () => {
  if (process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD) {
    return { email: process.env.DEMO_EMAIL, password: process.env.DEMO_PASSWORD };
  }
  const file = process.env.DEMO_CREDENTIALS ?? join(homedir(), "fundstueck-demo.txt");
  if (!existsSync(file)) throw new Error(`No demo login: set DEMO_EMAIL and DEMO_PASSWORD, or create ${file}`);
  const { EMAIL, PASSWORD } = readKeyValues(file);
  return { email: EMAIL, password: PASSWORD };
};

// Returns { status, data }; never throws on HTTP errors, since many checks expect them.
export const call = async (method, path, { body, token = ANON_KEY } = {}) => {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
};

export const signIn = async () => {
  const { status, data } = await call("POST", "/auth/v1/token?grant_type=password", { body: demoLogin() });
  if (status !== 200) throw new Error(`Demo sign-in failed: HTTP ${status} ${data?.msg ?? data?.error_description ?? ""}`);
  return { token: data.access_token, me: data.user.id };
};

// The checks on reports and blocks need someone the demo account already chats with.
export const chatPartner = async (token, me) => {
  const { data } = await call("GET", "/rest/v1/conversations?select=id,owner_id,requester_id&limit=1", { token });
  if (!data?.length) throw new Error("The demo account needs at least one conversation for this check.");
  const [conversation] = data;
  return {
    conversationId: conversation.id,
    other: conversation.owner_id === me ? conversation.requester_id : conversation.owner_id,
  };
};

const results = [];

export const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  - ${detail}` : ""}`);
};

// RLS refuses by returning 0 rows rather than an error, so show both.
export const outcome = ({ status, data }) => `HTTP ${status}${Array.isArray(data) ? `, ${data.length} row(s)` : ""}`;

export const refused =(status, rows) => status >= 400 || (Array.isArray(rows) && rows.length === 0);

// Runs the checks, always runs the clean-up, and exits non-zero if anything failed.
export const run = async (title, checks, cleanUp = async () => {}) => {
  console.log(`\n${title}\n`);
  try {
    await checks();
  } catch (error) {
    check("ran to the end", false, error.message);
  } finally {
    await cleanUp();
  }
  const passed = results.filter(Boolean).length;
  console.log(`\n${passed}/${results.length} checks passed`);
  if (passed !== results.length) process.exitCode = 1;
};
