# Onward Domain Language

## Disclosure

The situation a reader writes before requesting a story. A Disclosure is
emotionally sensitive even when it contains no names or other obvious
identifiers.

Avoid: `prompt`, `query`, `payload`, or `raw data` when the intended meaning is
the reader's own words.

## Recovery Context

The Disclosure together with the reader's story limits and any closed
clarification needed to finish or safely retry the original story flow.
Recovery Context has a shorter life than the story it helps create.

Avoid: `profile`, `memory`, or `history`. Onward does not treat one story
request as a durable psychological profile.

## Working Material

An intermediate value used only while one request is running. Working Material
may include a reduced emotional shape, a provider response, an embedding, or a
candidate composition plan. It is never a saved story, an operational record,
or an editorial record.

Avoid: `temporary cache`. Working Material is not authorized for caching.

## Owner Story

The validated story, its source explanation, and the reading state attached to
one account owner. A temporary guest owns an Owner Story only for the guest
lifetime. A permanent account keeps it until the owner deletes the story or
account.

Avoid: `Saved Story` when the account is still temporary. Ownership and
permanent saving are different states.

## Save

The reader's informed choice to convert a temporary guest account into a
permanent account. Saving keeps the generated wording in each Owner Story; it
does not extend the Recovery Context deadline.

Avoid: `copy` or `export`. Saving changes the owner's account lifecycle; it
does not create a second story.

## Bounded Record

A closed, purpose-specific record with a fixed maximum lifetime. Feedback,
recovery state, abuse controls, and operational measurements are different
kinds of Bounded Record and may have different deadlines.

Avoid: `analytics data` as a catch-all. Name the bounded purpose.

## Operational Evidence

A Bounded Record made only from approved identifiers, enums, counts, and time
buckets. Operational Evidence contains no Disclosure, story prose, provider
body, or free-form error.

Avoid: `event payload` or `metadata`, which imply an open-ended shape.

## Shared Editorial Record

A de-linked, closed report about curated historical material. It may outlive
the Owner Story that prompted it, but it cannot identify or be rejoined to the
reader, session, or generated wording.

Avoid: `user report` after the de-linking boundary.

## Curated Reference

Historical content, evidence, recipes, and catalog-derived search material
maintained by Onward's editorial or release process. Curated Reference is not
derived from a reader.

Avoid: `user content`.

## Retention Class

A closed lifecycle contract that states where a kind of information may be
used, whether it may be kept, its maximum lifetime, and which deletion
authority applies. Every new provider-derived output and durable store must
name a Retention Class before release.

Avoid: `sensitivity label`. Sensitivity alone does not define a lifecycle.
