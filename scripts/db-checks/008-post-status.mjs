// Checks supabase/008_post_status.sql: who may change or delete a post, and how.
// All changes happen on a temporary post that is deleted at the end.
import { call, outcome, check, refused, run, signIn } from "./lib.mjs";

let token;
let tempId;

const posts = (query = "") => `/rest/v1/lost_items${query}`;

await run(
  "008 post status",
  async () => {
    let me;
    ({ token, me } = await signIn());

    const created = await call("POST", posts(), {
      token,
      body: { user_id: me, category: "Other", location: "10115", notes: "db-check 008 - safe to delete" },
    });
    tempId = created.data?.[0]?.id;
    if (!tempId) throw new Error(`Couldn't create the temporary post: HTTP ${created.status}`);
    const temp = posts(`?id=eq.${tempId}`);

    check("new posts start open", created.data[0].status === "open" && created.data[0].returned_at === null);

    let r = await call("PATCH", temp, { token, body: { status: "returned" } });
    check("owner can mark a post returned", r.status === 200 && r.data?.[0]?.returned_at !== null, outcome(r));
    r = await call("PATCH", temp, { token, body: { status: "open" } });
    check("reopening clears returned_at", r.status === 200 && r.data?.[0]?.returned_at === null, outcome(r));

    r = await call("PATCH", temp, { token, body: { status: "lost-forever" } });
    check("invalid status rejected", r.status >= 400, outcome(r));
    r = await call("PATCH", temp, { token, body: { user_id: "00000000-0000-0000-0000-000000000000" } });
    check("owner can't change user_id", r.status >= 400, outcome(r));
    r = await call("PATCH", temp, { token, body: { returned_at: "2000-01-01T00:00:00Z" } });
    check("owner can't set returned_at directly", r.status >= 400, outcome(r));

    r = await call("PATCH", temp, { body: { status: "returned" } });
    check("signed-out visitor can't update", refused(r.status, r.data), outcome(r));
    r = await call("DELETE", temp);
    check("signed-out visitor can't delete", refused(r.status, r.data), outcome(r));

    // Someone else's open post, "changed" to the value it already has: if the rule
    // were broken nothing would actually change, so real users' posts stay safe.
    // (Deleting someone else's post isn't tested, since a broken rule would really delete it.)
    const { data: others } = await call("GET", posts(`?select=id&status=eq.open&user_id=neq.${me}&limit=1`));
    if (others?.length) {
      r = await call("PATCH", posts(`?id=eq.${others[0].id}`), { token, body: { status: "open" } });
      check("can't update someone else's post", refused(r.status, r.data), `rows changed: ${r.data?.length ?? 0}`);
    } else {
      console.log("SKIP  can't update someone else's post - no other user's open post found");
    }

    r = await call("DELETE", temp, { token });
    check("owner can delete a post", r.status === 200 && r.data?.length === 1, outcome(r));
    if (r.data?.length === 1) tempId = null;
  },
  async () => {
    if (tempId) await call("DELETE", posts(`?id=eq.${tempId}`), { token });
  }
);
