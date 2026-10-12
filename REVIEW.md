# Review protocol (Claude and Cursor)

Used whenever someone asks for a review in Slack or on a PR.

## 1. Find the acceptance criteria
Look in this order and use the first one found:
1. Acceptance criteria written in the Slack thread that asked for the review.
2. The "Acceptance criteria" section of the PR description.
3. A linked issue's acceptance criteria.

If none exist, say "No acceptance criteria found", list 3–5 criteria you would infer from the
PR, and ask the requester to confirm them. Do not give a verdict without agreed criteria.

## 2. Check every criterion
For each one: **Met**, **Not met**, or **Can't verify**, plus evidence
(file:line, test name, or the command you ran). Run the tests/build if the repo has them.

## 3. Other findings (only what matters)
Bugs, security issues, data loss, missing tests for the criteria. Rank by severity
(High / Medium / Low). Skip style nitpicks unless they break a project rule. Respect "Out of scope".

## 4. Report format (post in the thread)
```
Verdict: Approve | Changes requested
Acceptance criteria: X/Y met
1. <criterion> — Met / Not met / Can't verify — <evidence>
...
Other findings:
- [High] <file:line> <problem> → <suggested fix>
```

## Rules
- Review only. Do not push commits or open PRs unless explicitly asked.
- Keep the report under ~30 lines; link to files instead of pasting code.
