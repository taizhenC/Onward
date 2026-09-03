# Security policy

Onward is maintained by one person and is built for people who are hurting.
A problem that could expose what a reader wrote, or show a reader in crisis
the wrong resources, is treated as the most urgent kind of bug.

## Reporting a vulnerability

Please do not open a public issue or pull request for a security problem.

Report it privately through GitHub: open the repository's **Security** tab and
choose **Report a vulnerability**. If that option is not visible, open a plain
issue titled "Security contact request" with no details in it, and the
maintainer will reply with a private channel.

Include what you found, where it is (a URL, file, or endpoint), the steps to
reproduce it, and what you believe the impact is. A proof of concept is welcome
when it can be run without touching anyone else's data.

What to expect:

- an acknowledgement within 7 days;
- an assessment and a plan within 14 days of that acknowledgement;
- a note when the fix ships, and credit in the fixing pull request if you want it.

If you find a problem with the crisis resources the app shows readers, such as
a wrong number or a dead link, report it the same way. It is handled with the
same urgency as a data exposure.

## Scope

In scope:

- this repository, as deployed from `main`;
- the deployed app at <https://onwardapp.me>.

Out of scope:

- volumetric denial of service or sustained load. A rate-limit bypass shown
  with a handful of requests is in scope; degrading the service for other
  readers to prove it is not;
- reports from automated scanners with no demonstrated impact;
- missing hardening headers or best-practice findings without a demonstrated
  impact;
- vulnerabilities in the managed services the app depends on (Supabase, Vercel,
  the model providers), which should go to those providers;
- the public Supabase anon key being visible in the browser bundle. It is public
  by design, reaches only the Auth endpoints, and every table sits behind
  default-deny row-level security. A way to read a table with it *is* in scope.

## Rules for testing

- Test only with accounts and stories you created yourself.
- If you reach another person's story, session, or disclosure, stop, do not read
  further, do not keep a copy, and report it immediately.
- Do not submit disclosures about real third parties while testing.
- Do not use social engineering against the maintainer or the providers.

Research that follows these rules is considered authorised. The maintainer will
not pursue legal action against you for it and, if a third party does, will say
that you acted in good faith. That authorisation covers only what the maintainer
controls; it cannot authorise testing of Supabase, Vercel, or the model
providers' own systems.

## Supported versions

Only the current `main` branch and the deployment built from it receive fixes.
There are no release branches and no backports.

## How the app already defends itself

The privacy design is enforced in code and tested in CI. The short version is
in the README under **Privacy and safety**, and the operating detail is in
[`docs/SAFETY_RUNBOOK.md`](docs/SAFETY_RUNBOOK.md). Knowing it will help you aim:

- the browser never talks to the database; it calls Supabase Auth only;
- the crisis check is regex-only, runs before any model call, and persists
  nothing;
- prompts, provider responses, disclosures, raw IPs, and raw errors never reach
  logs or telemetry, including on error paths;
- a story that is not yours is a 404 indistinguishable from a missing one.
