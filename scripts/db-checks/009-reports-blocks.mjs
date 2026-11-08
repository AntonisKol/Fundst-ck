// Checks supabase/009_reports_blocks.sql: who may report and block whom.
// Uses the demo account's first chat partner. Reports can't be withdrawn, so one
// report against that partner stays (later runs see "already reported"); the
// test block is always removed.
import { call, outcome, chatPartner, check, refused, run, signIn } from "./lib.mjs";

const STRANGER = "00000000-0000-0000-0000-000000000001";
const REPORTS = "/rest/v1/reports";
const BLOCKS = "/rest/v1/blocks";

let token;
let me;
let other;

await run(
  "009 reports and blocks",
  async () => {
    ({ token, me } = await signIn());
    let conversationId;
    ({ conversationId, other } = await chatPartner(token, me));

    const { data: messages } = await call("GET", `/rest/v1/messages?select=id,sender_id&conversation_id=eq.${conversationId}`, { token });
    const theirMessage = messages?.find((m) => m.sender_id === other)?.id;
    const myMessage = messages?.find((m) => m.sender_id === me)?.id;

    const report = { reporter_id: me, reported_user_id: other, reason: "other", note: "db-check 009 - safe to delete" };
    const fileReport = (body, options = { token }) => call("POST", REPORTS, { ...options, body: { ...report, ...body } });

    // Refused reports first, so they never leave rows behind.
    let r = await fileReport({ reporter_id: other, reported_user_id: me });
    check("can't file a report as someone else", r.status >= 400, outcome(r));
    r = await fileReport({ reported_user_id: me });
    check("can't report yourself", r.status >= 400, outcome(r));
    r = await fileReport({ reported_user_id: STRANGER });
    check("can't report someone you don't chat with", r.status >= 400, outcome(r));
    r = await fileReport({ reason: "because" });
    check("invalid reason rejected", r.status >= 400, outcome(r));
    r = await fileReport({ note: "x".repeat(1001) });
    check("note over 1000 characters rejected", r.status >= 400, outcome(r));
    if (myMessage) {
      r = await fileReport({ message_id: myMessage });
      check("can't blame someone for a message they didn't send", r.status >= 400, outcome(r));
    }
    r = await fileReport({}, {});
    check("signed-out visitor can't report", r.status >= 400, outcome(r));

    const accepted = theirMessage ? { message_id: theirMessage } : {};
    r = await fileReport(accepted);
    check("can report a chat partner", r.status === 201 || r.status === 409, r.status === 409 ? "already filed by an earlier run" : outcome(r));
    r = await fileReport(accepted);
    check("duplicate report rejected", r.status === 409, outcome(r));

    const { status, data: mine } = await call("GET", `${REPORTS}?select=id,reporter_id`, { token });
    check("can read own reports only", status === 200 && mine.length > 0 && mine.every((x) => x.reporter_id === me), `${mine?.length ?? 0} row(s)`);
    const reportId = mine?.[0]?.id;
    r = await call("PATCH", `${REPORTS}?id=eq.${reportId}`, { token, body: { reason: "spam" } });
    check("reports can't be edited", refused(r.status, r.data), outcome(r));
    r = await call("DELETE", `${REPORTS}?id=eq.${reportId}`, { token });
    check("reports can't be withdrawn", refused(r.status, r.data), outcome(r));
    r = await call("GET", `${REPORTS}?select=id`);
    check("signed-out visitor sees no reports", refused(r.status, r.data), outcome(r));

    r = await call("POST", BLOCKS, { token, body: { blocker_id: other, blocked_id: me } });
    check("can't block as someone else", r.status >= 400, outcome(r));
    r = await call("POST", BLOCKS, { token, body: { blocker_id: me, blocked_id: me } });
    check("can't block yourself", r.status >= 400, outcome(r));
    r = await call("POST", BLOCKS, { body: { blocker_id: me, blocked_id: other } });
    check("signed-out visitor can't block", r.status >= 400, outcome(r));
    r = await call("POST", BLOCKS, { token, body: { blocker_id: me, blocked_id: other } });
    check("can block a chat partner", r.status === 201, outcome(r));
    r = await call("GET", `${BLOCKS}?select=blocked_id`, { token });
    check("can read own blocks", r.status === 200 && r.data.some((x) => x.blocked_id === other));
    r = await call("GET", `${BLOCKS}?select=blocked_id`);
    check("signed-out visitor sees no blocks", refused(r.status, r.data), outcome(r));
    r = await call("DELETE", `${BLOCKS}?blocker_id=eq.${me}&blocked_id=eq.${other}`, { token });
    check("can remove own block", r.status === 200 && r.data?.length === 1, outcome(r));
  },
  async () => {
    if (!other) return;
    await call("DELETE", `${BLOCKS}?blocker_id=eq.${me}&blocked_id=eq.${other}`, { token });
    const { data } = await call("GET", `${BLOCKS}?select=blocked_id&blocked_id=eq.${other}`, { token });
    check("no test block left behind", data?.length === 0);
  }
);
