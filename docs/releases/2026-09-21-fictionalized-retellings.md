# Fictionalized retellings: sixteen-story release

## Scope and editorial authority

The owner authorized changes where the historical stories could not be resolved,
then explicitly chose real historical names with the prominent label
**Fictionalized retelling**. This release implements that choice as a separate,
explicitly selected public collection at `/retellings`, linked from the home and
intake pages. It does not silently substitute fiction for a historical match.

The sixteen complete, seven-part stories concern Irving Berlin, George Washington
Carver, Agatha Christie, John Coltrane, Hedy Lamarr, Frances Glessner Lee, Edmonia
Lewis, Astrid Lindgren, Barbara McClintock, Jesse Owens, Sidney Poitier, Sergei
Rachmaninoff, Fred Rogers, Wilma Rudolph, Bayard Rustin and Vera Wang. Each has a
content note, a specific invention disclosure and separately sourced background.
Sources are not presented as evidence for invented scenes or dialogue.

Three authoring agents drafted the collection; different agents cross-reviewed
all sixteen stories against the available source packets. Cross-review corrected
Berlin's first-publication citation and a Rogers bridge phrase caught by the
unchanged tone checker. This records independent agent review and the owner's
format authorization, **not an assertion that the owner read this new exact prose**.

## Isolation from historical publication

No historical Figure Stage, StorySpec, matching surface, gold label, recipe,
release-lineage entry or database row is changed. Historical matching failures
remain unresolved and must not be reported as passing because fiction shipped.
PRs #141 and #142 remain separate historical review work, not deployment inputs.

Topic selection is a reading preference, not a personal assessment. The collection
does not consume intake text, create a session, save an Owner Story, call a model
or introduce telemetry. Reading state lives in the page. Existing site middleware
can still refresh authentication; the isolated-component no-network check does
not establish zero network activity across the whole application.

The reader shows the fiction label before reading and on every passage. Its adult
acknowledgement is a UI choice, not an access-control boundary: the prose is public
and delivered in page data. `STORY_CREATION_ENABLED=false` pauses both collection
routes while preserving crisis-resource links.

## Pre-release verification

Passed locally on the release branch:

- `check-retellings`: all sixteen stories, seven ordered passages each, 400–900
  words, disclosures, references, topic coverage, isolated rendering, unknown-slug
  rejection, incident pause, nine negative fixtures and unchanged historical gold.
- `typecheck`, `lint`, `check-fiction-special`, `check-intake-experience`,
  `check-core-accessibility`, `check-recipe-governance`, and recipe immutability
  against `117500612dac5ec0eff6c7e9a39737989f23080f`.
- `smoke`: 20/20 assertions; `eval-crisis`: 49/49 critical cases.
- Production build with local memory persistence and stub providers; no production
  credentials or database writes were used for these tests.

Browser verification confirmed the sixteen-card catalog, the topic filter
(Asking for help shows five), navigation to Carver, prominent fiction notice,
legible layout, and expandable documented-background/invention disclosure.
The agent did not submit an age acknowledgement on the owner's behalf.
Post-acknowledgement clicks, focus movement and screen-reader behavior were
reviewed in code, not exercised interactively; initial-state server rendering
does not replace those interaction checks.

## Deploy and rollback

Use a dedicated PR from `codex/fictionalized-retellings` to `main`. Require the
existing CI and promotion-authority checks plus Vercel preview to pass at the
exact release head. Keep the focused commits, authored and committed solely as
`taizhenC <tzhcheung@gmail.com>`, with no co-author trailers.

After merging, verify the Vercel production deployment belongs to the new main
commit. Read-only production checks must find the catalog, all sixteen named
story routes and their fiction notices, and a 404 for an unknown story. No
migration, seed, recipe promotion or environment change is needed for this
application-only release. Do not publish the held historical rows as a side effect.

For rollback, revert this release in a new reviewed code commit and redeploy; no
historical or owner data needs changing. The existing incident switch is available
for an urgent broader pause, but changing it also pauses historical story creation.
This pre-release document is not by itself evidence that deployment succeeded.
