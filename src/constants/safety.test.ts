/// <reference types="node" />
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blockedContentReason } from "./safety";

const EMAIL = "Email addresses aren't allowed in chat. Keep the conversation in the app.";
const LINK = "Links aren't allowed in chat, to protect you from phishing.";

// The database enforces the same rules (supabase/007_chat_safety.sql). Its regexes
// are read from the file so a change on one side only fails these tests.
const sqlPatterns = [
  ...readFileSync(join(__dirname, "../../supabase/007_chat_safety.sql"), "utf8").matchAll(/body ~\* '([^']+)'/g),
].map(([, pattern]) => new RegExp(pattern.replace(/\\y/g, "\\b"), "i"));

const blockedByDatabase = (text: string) => sqlPatterns.some((pattern) => pattern.test(text));

const expectAllowed = (text: string) => {
  expect(blockedContentReason(text)).toBeNull();
  expect(blockedByDatabase(text)).toBe(false);
};

const expectBlocked = (text: string, reason: string) => {
  expect(blockedContentReason(text)).toBe(reason);
  expect(blockedByDatabase(text)).toBe(true);
};

describe("the database rules", () => {
  it("are found in 007_chat_safety.sql", () => {
    expect(sqlPatterns).toHaveLength(2);
  });
});

describe("allowed messages", () => {
  it.each([
    "Hi, is the wallet still there?",
    "See you at 14.30 at the station",
    "Tomorrow at 9.15?",
    "I lost it on 12.05.2026",
    "Near 10115 Berlin",
    "It cost 12.50 €, but I'll pay nothing upfront",
    "Version 2.0 of the app",
    "Call me on 0176 12345678",
    "My number is +49 176 1234567",
    "Hi. How are you?",
    "It's black, z.B. like a Samsung, d.h. no case",
    "At U-Bhf. Alexanderplatz, i.e. the exit",
    "Thanks!!! :)",
  ])("%s", (text) => expectAllowed(text));
});

describe("links and IP addresses", () => {
  it.each([
    "https://example.com",
    "Look here: http://bit.ly/abc123",
    "www.paypal-secure",
    "Go to WWW.EXAMPLE.COM",
    "discord.gg/abc",
    "discogs.gg/sbc",
    "write me on x.ru",
    "visit fundstueck.de",
    "192.168.0.1",
    "Server at 8.8.8.8 now",
  ])("%s", (text) => expectBlocked(text, LINK));
});

describe("email addresses", () => {
  it.each(["me@example.com", "first.last+tag@mail.co.uk", "Mail ME@GMX.NET please"])(
    "%s gets the email reason, not the link one",
    (text) => expectBlocked(text, EMAIL)
  );
});

// Deliberate choices: these pin the current behaviour so changing it is a decision, not an accident.
describe("known trade-offs", () => {
  it.each([
    ["a missing space after a full stop", "Hi.How are you"],
    ["a file name", "Sent you photo.jpg"],
    ["a name with a dot", "Near St.Pauli"],
    ["a phone number written with dots", "030.123.45.67"],
    ["four numbers that can't be an IP", "999.999.999.999"],
  ])("blocks %s", (_, text) => expectBlocked(text, LINK));

  it.each([
    ["spaced-out domains", "example . com"],
    ["obfuscated links", "hxxp://example[.]com"],
    ["spelled-out emails", "me at example dot com"],
  ])("lets through %s", (_, text) => expectAllowed(text));
});
