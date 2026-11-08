// Checks supabase/010_block_messages.sql: nobody can message across a block.
// The demo account blocks its first chat partner, tries to send, and unblocks.
import { call, outcome, chatPartner, check, run, signIn } from "./lib.mjs";

const BLOCKS = "/rest/v1/blocks";

let token;
let me;
let other;

await run(
  "010 blocking stops messages",
  async () => {
    ({ token, me } = await signIn());
    let conversationId;
    ({ conversationId, other } = await chatPartner(token, me));
    const messageCount = async () =>
      (await call("GET", `/rest/v1/messages?select=id&conversation_id=eq.${conversationId}`, { token })).data.length;
    const before = await messageCount();

    let r = await call("POST", BLOCKS, { token, body: { blocker_id: me, blocked_id: other } });
    check("demo account blocks its chat partner", r.status === 201, outcome(r));

    r = await call("POST", "/rest/v1/messages", {
      token,
      body: { conversation_id: conversationId, sender_id: me, body: "db-check 010 - must be refused" },
    });
    check("message refused while blocked", r.status >= 400, outcome(r));
    check("error is the clear, neutral text", r.data?.message === "You can't message this person.", JSON.stringify(r.data?.message));
    const after = await messageCount();
    check("nothing was added to the chat", after === before, `${before} -> ${after}`);
    if (r.status < 400) console.log(`WARN  a test message was sent (id ${r.data?.[0]?.id}); delete it in the SQL editor`);
  },
  async () => {
    if (!other) return;
    await call("DELETE", `${BLOCKS}?blocker_id=eq.${me}&blocked_id=eq.${other}`, { token });
    const { data } = await call("GET", `${BLOCKS}?select=blocked_id&blocked_id=eq.${other}`, { token });
    check("no test block left behind", data?.length === 0);
  }
);
