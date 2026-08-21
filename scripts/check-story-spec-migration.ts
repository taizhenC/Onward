import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

type PublicationHealth = Readonly<{
  ok: boolean;
  identity_constraint_valid: boolean;
  lifecycle_trigger_enabled: boolean;
  published_stage_uniqueness_valid: boolean;
  promotion_cas_valid: boolean;
  legacy_rpc_revoked: boolean;
  boundary_granted: boolean;
}>;

const storySpecsMigration = read(
  "../supabase/migrations/0004_story_specs.sql",
);
const publicationMigration = read(
  "../supabase/migrations/0023_story_spec_publication_cas.sql",
);

async function main(): Promise<void> {
  await checkCanonicalPublicationBoundary();
  await checkLegacyReplayMarkerBoundary();
  await checkRelationGraphBoundary();
  await checkRewriteRuleBoundary();
  await checkGeneratedColumnBoundary();
  await checkPublicationCatalogInventoryBoundary();
  await checkHostileAclCutover();
  await checkFigureStagesDefinerBoundary();
  await checkAuthorityRootDriftDetection();
  await checkIdentityManifestDriftDetection();
  await checkStageIdentityFailClosed();
  await checkCatalogAlignmentDriftDetection();
  await checkPostCutoverDriftDetection();
  await checkUnexpectedTriggerFailsCutover();
  await checkStatusIndexFailsCutover();
  await checkLegacyPublicationFailsCutover();
  await checkOwnerAndOverloadBootstrapFailures();

  console.log("Onward StorySpec migration");
  console.log("==========================");
  console.log("PASS exact-snapshot promotion, stale rejection, and retirement");
  console.log("PASS pre-cutover v5 replay markers are one-way and read-only");
  console.log("PASS inheritance and partition publication planes fail closed");
  console.log("PASS table rewrite hooks fail closed before and after cutover");
  console.log("PASS generated-column publication hooks fail closed");
  console.log(
    "PASS exact publication columns, constraints, and indexes fail closed",
  );
  console.log("PASS direct service-role publication and retirement are blocked");
  console.log("PASS hostile table, column, and every lifecycle-function ACL is removed");
  console.log("PASS figure-stage trigger inheritance is closed before and after cutover");
  console.log(
    "PASS database-owner and service-role membership graphs stay fail-closed",
  );
  console.log(
    "PASS identity, owner, overload, trigger, full-index, and ACL drift fail closed",
  );
  console.log("PASS missing or forged stage identity rolls terminal writes back");
  console.log("PASS cutover and live health keep stage visibility aligned");
  console.log(
    "PASS legacy publication and unsafe schema cutovers roll back atomically",
  );
}

async function checkCanonicalPublicationBoundary(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await db.exec(`
      ${figureStageInsertSql("precutover-stage-only", "published")}
      ${figureStageInsertSql("precutover-spec-only")}
    `);

    await applyPublicationMigration(db, () => expectPublicationLocks(db));
    await expectHealth(db, {
      ok: true,
      identity_constraint_valid: true,
      lifecycle_trigger_enabled: true,
      published_stage_uniqueness_valid: true,
      promotion_cas_valid: true,
      legacy_rpc_revoked: true,
      boundary_granted: true,
    });
    await expectCanonicalPublicationCatalogCounts(db);
    await expectStageStatus(db, "precutover-stage-only", "draft");
    await expectStageStatus(db, "precutover-spec-only", "draft");

    await db.exec("set role service_role");
    try {
      await expectRejected(
        () =>
          db.exec(figureStageInsertSql("direct-stage", "published")),
        "direct published figure-stage insert",
        "owner-definer boundary",
      );
      await db.exec(figureStageInsertSql("direct-stage"));
      await expectRejected(
        () =>
          db.exec(`
            update public.figure_stages
            set status = 'published'
            where figure_key = 'direct-stage'
              and stage_id = 'stage';
          `),
        "direct figure-stage publication",
        "owner-definer boundary",
      );
    } finally {
      await db.exec("reset role");
    }
    await expectStageStatus(db, "direct-stage", "draft");

    await db.exec(figureStageInsertSql("figure"));

    const previous = storySpecDocument("previous", 1, "published");
    const candidate = storySpecDocument("candidate", 2, "review");
    await insertStorySpec(db, previous);
    await insertStorySpec(db, candidate);
    await db.exec(`
      update public.figure_stages
      set status = 'published'
      where figure_key = 'figure' and stage_id = 'stage';
    `);

    await db.exec("set role service_role");
    try {
      await db.exec(`
        select public.promote_story_spec_v2(
          'candidate',
          ${jsonbLiteral(candidate)}
        );
      `);
    } finally {
      await db.exec("reset role");
    }
    await expectStoryStates(db, {
      previous: "retired",
      candidate: "published",
    });

    const nextReview = storySpecDocument("next-review", 3, "review");
    await insertStorySpec(db, nextReview);
    const staleSnapshot = {
      ...nextReview,
      review: {
        ...nextReview.review,
        reviewedAt: "2026-07-28",
      },
    };
    await db.exec("set role service_role");
    try {
      await expectRejected(
        () =>
          db.exec(`
            select public.promote_story_spec_v2(
              'next-review',
              ${jsonbLiteral(staleSnapshot)}
            );
          `),
        "stale publication snapshot",
        "changed; reload and revalidate",
      );
      await expectRejected(
        () =>
          db.exec(`
            update public.story_specs
            set status = 'draft',
                spec = ${jsonbLiteral({
                  ...nextReview,
                  status: "draft",
                })}
            where story_spec_id = 'next-review';
          `),
        "stale seed demotion after editorial review",
        "owner-controlled transition",
      );
    } finally {
      await db.exec("reset role");
    }
    await expectStoryStates(db, {
      candidate: "published",
      "next-review": "review",
    });

    await db.exec(figureStageInsertSql("blocked"));
    const directRetireTarget = storySpecDocument(
      "direct-retire-target",
      3,
      "published",
      "blocked",
    );
    await insertStorySpec(db, directRetireTarget);

    await db.exec("set role service_role");
    try {
      await expectRejected(
        () =>
          insertStorySpec(
            db,
            storySpecDocument(
              "direct-published",
              1,
              "published",
              "blocked",
            ),
          ),
        "direct service-role published insert",
        "owner-definer boundary",
      );

      const directDraft = storySpecDocument(
        "direct-draft",
        2,
        "draft",
        "blocked",
      );
      await insertStorySpec(db, directDraft);
      await expectRejected(
        () =>
          db.exec(`
            update public.story_specs
            set status = 'published',
                spec = ${jsonbLiteral({
                  ...directDraft,
                  status: "published",
                })}
            where story_spec_id = 'direct-draft';
          `),
        "direct service-role published update",
        "owner-definer boundary",
      );
      await expectRejected(
        () =>
          db.exec(`
            update public.story_specs
            set status = 'retired',
                spec = ${jsonbLiteral({
                  ...directRetireTarget,
                  status: "retired",
                })}
            where story_spec_id = 'direct-retire-target';
          `),
        "direct service-role retirement",
        "owner-definer boundary",
      );
    } finally {
      await db.exec("reset role");
    }

    await db.exec("set role service_role");
    try {
      await db.exec(`
        select public.retire_story_spec('candidate');
      `);
    } finally {
      await db.exec("reset role");
    }
    await expectStoryStates(db, {
      candidate: "retired",
      "next-review": "review",
    });
    const stage = await db.query<{ status: string }>(`
      select status
      from public.figure_stages
      where figure_key = 'figure' and stage_id = 'stage'
    `);
    if (stage.rows[0]?.status !== "draft") {
      throw new Error("retirement did not return the figure stage to draft");
    }

    await db.exec(figureStageInsertSql("initial"));
    const initialCandidate = storySpecDocument(
      "initial-candidate",
      1,
      "review",
      "initial",
    );
    await insertStorySpec(db, initialCandidate);
    await db.exec("set role service_role");
    try {
      await db.exec(`
        select public.promote_story_spec_v2(
          'initial-candidate',
          ${jsonbLiteral(initialCandidate)}
        );
      `);
    } finally {
      await db.exec("reset role");
    }
    await expectStoryStates(db, {
      "initial-candidate": "published",
    });
    await expectStageStatus(db, "initial", "published");

    await expectRejected(
      () =>
        db.exec(`
          insert into public.story_specs (
            story_spec_id,
            figure_key,
            stage_id,
            version,
            schema_version,
            status,
            spec
          ) values (
            'missing-id',
            'figure',
            'stage',
            4,
            'v1',
            'draft',
            '{
              "figureKey": "figure",
              "stageId": "stage",
              "version": 4,
              "schemaVersion": "v1",
              "status": "draft"
            }'::jsonb
          );
        `),
      "missing JSON identity",
    );
  } finally {
    await db.close();
  }
}

async function checkLegacyReplayMarkerBoundary(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);

    const initial = await db.query<{ artifact_id: string }>(`
      select marker.artifact_id
      from public.story_artifact_legacy_v5_replay marker
      order by marker.artifact_id
    `);
    if (
      initial.rows.length !== 1 ||
      initial.rows[0]?.artifact_id !== "precutover-v5"
    ) {
      throw new Error(
        `legacy marker snapshot was not v5-only: ${JSON.stringify(initial.rows)}`,
      );
    }

    await db.exec("set role service_role");
    try {
      const readable = await db.query<{ marker_count: number }>(`
        select count(*)::int as marker_count
        from public.story_artifact_legacy_v5_replay
      `);
      if (readable.rows[0]?.marker_count !== 1) {
        throw new Error("service role could not read the legacy marker snapshot");
      }
      await expectRejected(
        () =>
          db.exec(`
            insert into public.story_artifact_legacy_v5_replay (artifact_id)
            values ('precutover-v4');
          `),
        "service-role legacy marker insert",
        "permission denied",
      );
    } finally {
      await db.exec("reset role");
    }

    await db.exec("set role anon");
    try {
      await expectRejected(
        () =>
          db.query(`
            select artifact_id
            from public.story_artifact_legacy_v5_replay
          `),
        "anonymous legacy marker read",
        "permission denied",
      );
    } finally {
      await db.exec("reset role");
    }

    await db.exec(`
      insert into public.story_artifacts (artifact_id, schema_version)
      values ('postcutover-v5', 'story-artifact-v5-2026-07');
    `);
    const postCutover = await db.query<{ marked: boolean }>(`
      select exists (
        select 1
        from public.story_artifact_legacy_v5_replay marker
        where marker.artifact_id = 'postcutover-v5'
      ) as marked
    `);
    if (postCutover.rows[0]?.marked !== false) {
      throw new Error("post-cutover v5 artifact entered the legacy cohort");
    }
    await expectHealth(db, { ok: true, boundary_granted: true });

    await db.exec(`
      insert into public.story_artifact_legacy_v5_replay (artifact_id)
      values ('precutover-v4');
    `);
    await expectHealth(db, { ok: false, boundary_granted: false });
    await db.exec(`
      delete from public.story_artifact_legacy_v5_replay
      where artifact_id = 'precutover-v4';
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      grant insert on public.story_artifact_legacy_v5_replay
        to service_role;
    `);
    await expectHealth(db, { ok: false, boundary_granted: false });
    await db.exec(`
      revoke insert on public.story_artifact_legacy_v5_replay
        from service_role;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter table public.story_artifact_legacy_v5_replay
        no force row level security;
    `);
    await expectHealth(db, { ok: false, boundary_granted: false });
    await db.exec(`
      alter table public.story_artifact_legacy_v5_replay
        force row level security;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      delete from public.story_artifacts
      where artifact_id = 'precutover-v5';
    `);
    const cascaded = await db.query<{ marker_count: number }>(`
      select count(*)::int as marker_count
      from public.story_artifact_legacy_v5_replay marker
      where marker.artifact_id = 'precutover-v5'
    `);
    if (cascaded.rows[0]?.marker_count !== 0) {
      throw new Error("artifact deletion did not cascade its legacy marker");
    }
    await expectHealth(db, { ok: true });
  } finally {
    await db.close();
  }
}

async function checkRelationGraphBoundary(): Promise<void> {
  const bootstrapTargets = [
    "story_specs",
    "figure_stages",
    "story_artifacts",
  ] as const;
  for (const target of bootstrapTargets) {
    const db = await createBaseDatabase();
    try {
      await db.exec(`
        create table public.onward_${target}_child ()
          inherits (public.${target});
        grant select, insert, update
          on public.onward_${target}_child to anon;
      `);
      await expectRejected(
        () => applyPublicationMigration(db),
        `${target} inherited-child bootstrap`,
        "forbids inheritance and partition edges",
      );
      await expectV2Absent(db, `${target} inherited-child rollback`);
    } finally {
      await db.close();
    }
  }

  const typedBootstrapDb = await createBaseDatabase();
  try {
    await typedBootstrapDb.exec(`
      create type public.onward_story_spec_typed_contract as (
        story_spec_id text,
        figure_key text,
        stage_id text,
        version int,
        schema_version text,
        status text,
        spec jsonb,
        created_at timestamptz,
        published_at timestamptz,
        retired_at timestamptz
      );
      alter table public.story_specs
        of public.onward_story_spec_typed_contract;
    `);
    await expectRejected(
      () => applyPublicationMigration(typedBootstrapDb),
      "typed StorySpec table bootstrap",
      "untyped heap tables and owner",
    );
    await expectV2Absent(typedBootstrapDb, "typed-table bootstrap rollback");
  } finally {
    await typedBootstrapDb.close();
  }

  const reservedMarkerDb = await createBaseDatabase();
  try {
    await reservedMarkerDb.exec(`
      create table public.story_artifact_legacy_v5_replay (
        artifact_id text primary key
      );
    `);
    await expectRejected(
      () => applyPublicationMigration(reservedMarkerDb),
      "pre-seeded legacy marker relation",
      "marker relation already exists",
    );
    await expectV2Absent(reservedMarkerDb, "pre-seeded marker rollback");
  } finally {
    await reservedMarkerDb.close();
  }

  const liveDb = await createBaseDatabase();
  try {
    await applyPublicationMigration(liveDb);
    const liveTargets = [
      "story_specs",
      "figure_stages",
      "story_artifacts",
      "story_artifact_legacy_v5_replay",
    ] as const;
    for (const target of liveTargets) {
      await liveDb.exec(`
        create table public.onward_${target}_child ()
          inherits (public.${target});
      `);
      await expectHealth(liveDb, {
        ok: false,
        boundary_granted: false,
      });
      await liveDb.exec(`
        drop table public.onward_${target}_child;
      `);
      await expectHealth(liveDb, { ok: true });
    }


    await liveDb.exec(`
      create type public.onward_story_spec_typed_contract as (
        story_spec_id text,
        figure_key text,
        stage_id text,
        version int,
        schema_version text,
        status text,
        spec jsonb,
        created_at timestamptz,
        published_at timestamptz,
        retired_at timestamptz
      );
      alter table public.story_specs
        of public.onward_story_spec_typed_contract;
    `);
    await expectHealth(liveDb, {
      ok: false,
      boundary_granted: false,
    });
    await liveDb.exec(`
      alter table public.story_specs not of;
      drop type public.onward_story_spec_typed_contract;
    `);
    await expectHealth(liveDb, { ok: true });
  } finally {
    await liveDb.close();
  }
}

async function checkRewriteRuleBoundary(): Promise<void> {
  const bootstrapDb = await createBaseDatabase();
  try {
    await bootstrapDb.exec(`
      create rule onward_story_spec_update_rule
      as on update to public.story_specs
      do instead nothing;
    `);
    await expectRejected(
      () => applyPublicationMigration(bootstrapDb),
      "pre-cutover StorySpec rewrite rule",
      "forbids table rewrite rules",
    );
    await expectV2Absent(bootstrapDb, "rewrite-rule bootstrap rollback");
  } finally {
    await bootstrapDb.close();
  }

  const liveDb = await createBaseDatabase();
  try {
    await applyPublicationMigration(liveDb);
    const targets = [
      "story_specs",
      "figure_stages",
      "story_artifacts",
      "story_artifact_legacy_v5_replay",
    ] as const;
    for (const target of targets) {
      const ruleName = `onward_${target}_update_rule`;
      await liveDb.exec(`
        create rule ${ruleName}
        as on update to public.${target}
        do instead nothing;
      `);
      await expectHealth(liveDb, {
        ok: false,
        lifecycle_trigger_enabled: false,
        boundary_granted: false,
      });
      await liveDb.exec(`
        drop rule ${ruleName} on public.${target};
      `);
      await expectHealth(liveDb, { ok: true });
    }
  } finally {
    await liveDb.close();
  }
}

async function checkGeneratedColumnBoundary(): Promise<void> {
  const bootstrapDb = await createBaseDatabase();
  try {
    await bootstrapDb.exec(`
      create function public.onward_block_generated_story_status(
        p_status text
      )
      returns text
      language plpgsql
      immutable
      as $$
      begin
        if p_status in ('published', 'retired') then
          raise exception 'generated column blocked terminal write';
        end if;
        return p_status;
      end
      $$;

      alter table public.story_specs
        add column onward_terminal_guard text
        generated always as (
          public.onward_block_generated_story_status(status)
        ) stored;
    `);
    await expectRejected(
      () => applyPublicationMigration(bootstrapDb),
      "StorySpec generated-column bootstrap",
      "forbids generated columns",
    );
    await expectV2Absent(
      bootstrapDb,
      "StorySpec generated-column rollback",
    );
  } finally {
    await bootstrapDb.close();
  }

  const liveDb = await createBaseDatabase();
  try {
    await applyPublicationMigration(liveDb);
    const blockingReview = storySpecDocument(
      "blocking-generated-column",
      1,
      "review",
      "blocking-generated-column",
    );
    await liveDb.exec(`
      ${figureStageInsertSql("blocking-generated-column")}

      create function public.onward_block_generated_stage_status(
        p_status text
      )
      returns text
      language plpgsql
      immutable
      as $$
      begin
        if p_status = 'published' then
          raise exception 'generated column blocked terminal write';
        end if;
        return p_status;
      end
      $$;
    `);
    await insertStorySpec(liveDb, blockingReview);
    await liveDb.exec(`
      alter table public.figure_stages
        add column onward_terminal_guard text
        generated always as (
          public.onward_block_generated_stage_status(status)
        ) stored;
    `);
    await expectHealth(liveDb, {
      ok: false,
      lifecycle_trigger_enabled: false,
      promotion_cas_valid: false,
    });
    await expectRejected(
      () =>
        liveDb.query(
          `
            select public.promote_story_spec_v2(
              $1::text,
              $2::jsonb
            )
          `,
          [blockingReview.storySpecId, JSON.stringify(blockingReview)],
        ),
      "generated-column terminal write",
      "generated column blocked terminal write",
    );
    await expectStoryStates(liveDb, {
      [blockingReview.storySpecId]: "review",
    });
    await expectStageStatus(liveDb, blockingReview.figureKey, "draft");
    await liveDb.exec(`
      alter table public.figure_stages
        drop column onward_terminal_guard;
      drop function public.onward_block_generated_stage_status(text);
    `);
    await expectHealth(liveDb, { ok: true });
  } finally {
    await liveDb.close();
  }
}

async function checkPublicationCatalogInventoryBoundary(): Promise<void> {
  const columnBootstrapCases = [
    {
      label: "missing created_at column",
      sql: `alter table public.story_specs drop column created_at;`,
    },
    {
      label: "altered published_at type",
      sql: `
        alter table public.story_specs
          alter column published_at type text
          using published_at::text;
      `,
    },
    {
      label: "altered retired_at default",
      sql: `
        alter table public.story_specs
          alter column retired_at set default pg_catalog.now();
      `,
    },
    {
      label: "missing figure-stage source column",
      sql: `alter table public.figure_stages drop column sources;`,
    },
  ] as const;

  for (const testCase of columnBootstrapCases) {
    const db = await createBaseDatabase();
    try {
      await db.exec(testCase.sql);
      await expectRejected(
        () => applyPublicationMigration(db),
        `${testCase.label} bootstrap`,
        "publication table column contract is unsafe",
      );
      await expectV2Absent(db, `${testCase.label} rollback`);
    } finally {
      await db.close();
    }
  }

  const missingValueDb = await createBaseDatabase({
    applyStorySpecsMigration: false,
  });
  try {
    const missingValueReview = storySpecDocument(
      "catalog-missing-value-review",
      1,
      "review",
      "catalog-column-contract",
    );
    await missingValueDb.exec(`
      ${figureStageInsertSql("catalog-column-contract")}

      create table public.story_specs (
        story_spec_id text primary key,
        figure_key text not null,
        stage_id text not null,
        version int not null,
        schema_version text not null,
        status text not null default 'draft',
        spec jsonb not null,
        created_at timestamptz not null default pg_catalog.now(),
        constraint story_specs_stage_fk
          foreign key (figure_key, stage_id)
          references public.figure_stages (figure_key, stage_id)
          on delete restrict,
        constraint story_specs_version_check check (version > 0),
        constraint story_specs_status_check
          check (status in ('draft', 'review', 'published', 'retired')),
        constraint story_specs_identity_unique
          unique (figure_key, stage_id, version),
        constraint story_specs_document_identity_check check (
          spec ->> 'storySpecId' = story_spec_id
          and spec ->> 'figureKey' = figure_key
          and spec ->> 'stageId' = stage_id
          and (spec ->> 'version')::int = version
          and spec ->> 'schemaVersion' = schema_version
          and spec ->> 'status' = status
        )
      );

      insert into public.story_specs (
        story_spec_id,
        figure_key,
        stage_id,
        version,
        schema_version,
        status,
        spec
      ) values (
        ${textLiteral(missingValueReview.storySpecId)},
        ${textLiteral(missingValueReview.figureKey)},
        ${textLiteral(missingValueReview.stageId)},
        ${missingValueReview.version},
        ${textLiteral(missingValueReview.schemaVersion)},
        ${textLiteral(missingValueReview.status)},
        ${jsonbLiteral(missingValueReview)}
      );

      alter table public.story_specs
        add column published_at timestamptz
        default '2001-01-01T00:00:00Z'::timestamptz;
      alter table public.story_specs
        alter column published_at drop default;
      alter table public.story_specs
        add column retired_at timestamptz;
    `);
    await missingValueDb.exec(storySpecsMigration);
    const missingValueFixture = await missingValueDb.query<{
      atthasmissing: boolean;
      missing_value_present: boolean;
      stale_value_visible: boolean;
    }>(`
      select
        attribute_row.atthasmissing,
        pg_catalog.to_jsonb(attribute_row) -> 'attmissingval'
          is distinct from 'null'::jsonb as missing_value_present,
        story_spec.published_at =
          '2001-01-01T00:00:00Z'::timestamptz as stale_value_visible
      from public.story_specs story_spec
      join pg_catalog.pg_attribute attribute_row
        on attribute_row.attrelid = 'public.story_specs'::regclass
        and attribute_row.attname = 'published_at'
      where story_spec.story_spec_id =
        ${textLiteral(missingValueReview.storySpecId)}
    `);
    if (
      !missingValueFixture.rows[0]?.atthasmissing ||
      !missingValueFixture.rows[0]?.missing_value_present ||
      !missingValueFixture.rows[0]?.stale_value_visible
    ) {
      throw new Error(
        `fast-default missing-value fixture did not retain stale publication time: ${JSON.stringify(
          missingValueFixture.rows[0] ?? null,
        )}`,
      );
    }
    await expectRejected(
      () => applyPublicationMigration(missingValueDb),
      "StorySpec fast-default catalog missing value bootstrap",
      "publication table column contract is unsafe",
    );
    await expectV2Absent(missingValueDb, "catalog missing-value rollback");
  } finally {
    await missingValueDb.close();
  }

  const constraintBootstrapCases = [
    {
      label: "constant-false StorySpec constraint",
      sql: `
        alter table public.story_specs
          add constraint onward_story_specs_false_check
          check (false) not valid;
      `,
    },
    {
      label: "same-name StorySpec constraint replacement",
      sql: `
        alter table public.story_specs
          drop constraint story_specs_version_check;
        alter table public.story_specs
          add constraint story_specs_version_check
          check (false) not valid;
      `,
    },
    {
      label: "same-name figure-stage constraint replacement",
      sql: `
        alter table public.figure_stages
          drop constraint figure_stages_age_check;
        alter table public.figure_stages
          add constraint figure_stages_age_check
          check (false) not valid;
      `,
    },
  ] as const;

  for (const testCase of constraintBootstrapCases) {
    const db = await createBaseDatabase();
    try {
      await db.exec(testCase.sql);
      await expectRejected(
        () => applyPublicationMigration(db),
        `${testCase.label} bootstrap`,
        "publication constraint inventory is unsafe",
      );
      await expectV2Absent(db, `${testCase.label} rollback`);
    } finally {
      await db.close();
    }
  }

  const unrelatedIndexDb = await createBaseDatabase();
  try {
    await unrelatedIndexDb.exec(`
      create function public.onward_catalog_stage_index_key(p_age int)
      returns int
      language sql
      immutable
      as $$ select p_age $$;

      create index onward_stage_unrelated_expression_idx
        on public.figure_stages (
          public.onward_catalog_stage_index_key(age_min)
        )
        where age_max >= age_min;
    `);
    await expectRejected(
      () => applyPublicationMigration(unrelatedIndexDb),
      "unrelated figure-stage expression/partial index bootstrap",
      "publication index inventory is unsafe",
    );
    await expectV2Absent(
      unrelatedIndexDb,
      "unrelated figure-stage index rollback",
    );
  } finally {
    await unrelatedIndexDb.close();
  }

  const sameNameIndexDb = await createBaseDatabase();
  try {
    await sameNameIndexDb.exec(`
      create function public.onward_catalog_story_index_key(
        p_created_at timestamptz
      )
      returns timestamptz
      language sql
      immutable
      as $$ select p_created_at $$;

      drop index public.story_specs_stage_history_idx;
      create index story_specs_stage_history_idx
        on public.story_specs (
          public.onward_catalog_story_index_key(created_at)
        )
        where schema_version <> '';
    `);
    await expectRejected(
      () => applyPublicationMigration(sameNameIndexDb),
      "same-name StorySpec expression/partial index bootstrap",
      "publication index inventory is unsafe",
    );
    await expectV2Absent(sameNameIndexDb, "same-name index rollback");
  } finally {
    await sameNameIndexDb.close();
  }

  const missingColumnDb = await createBaseDatabase();
  try {
    const review = await prepareCatalogReview(
      missingColumnDb,
      "catalog-column-contract",
    );
    await missingColumnDb.exec(`
      alter table public.story_specs drop column published_at;
    `);
    await expectHealth(missingColumnDb, {
      ok: false,
      promotion_cas_valid: false,
    });
    await expectPromotionBlockedAndRolledBack(
      missingColumnDb,
      review,
      "missing published_at promotion",
      "published_at",
    );
  } finally {
    await missingColumnDb.close();
  }

  const storyConstraintDb = await createBaseDatabase();
  try {
    const review = await prepareCatalogReview(
      storyConstraintDb,
      "catalog-constraint-contract",
    );
    await storyConstraintDb.exec(`
      alter table public.story_specs
        drop constraint story_specs_version_check;
      alter table public.story_specs
        add constraint story_specs_version_check
        check (false) not valid;
    `);
    await expectHealth(storyConstraintDb, {
      ok: false,
      promotion_cas_valid: false,
    });
    await expectPromotionBlockedAndRolledBack(
      storyConstraintDb,
      review,
      "same-name StorySpec constraint promotion",
      "story_specs_version_check",
    );
  } finally {
    await storyConstraintDb.close();
  }

  const stageConstraintDb = await createBaseDatabase();
  try {
    const review = await prepareCatalogReview(
      stageConstraintDb,
      "catalog-constraint-contract",
    );
    await stageConstraintDb.exec(`
      alter table public.figure_stages
        drop constraint figure_stages_age_check;
      alter table public.figure_stages
        add constraint figure_stages_age_check
        check (false) not valid;
    `);
    await expectHealth(stageConstraintDb, {
      ok: false,
      promotion_cas_valid: false,
    });
    await expectPromotionBlockedAndRolledBack(
      stageConstraintDb,
      review,
      "same-name figure-stage constraint promotion",
      "figure_stages_age_check",
    );
  } finally {
    await stageConstraintDb.close();
  }

  const indexHookDb = await createBaseDatabase();
  try {
    const review = await prepareCatalogReview(
      indexHookDb,
      "catalog-index-contract",
    );
    await indexHookDb.exec(`
      create function public.onward_catalog_blocking_index(
        p_created_at timestamptz
      )
      returns timestamptz
      language plpgsql
      immutable
      as $$
      begin
        if pg_catalog.current_setting(
          'onward.block_catalog_index',
          true
        ) = 'on' then
          raise exception 'catalog index hook blocked terminal write';
        end if;
        return p_created_at;
      end
      $$;

      drop index public.story_specs_stage_history_idx;
      create index story_specs_stage_history_idx
        on public.story_specs (
          public.onward_catalog_blocking_index(created_at)
        )
        where schema_version <> '';
    `);
    await expectHealth(indexHookDb, {
      ok: false,
      promotion_cas_valid: false,
    });
    await indexHookDb.exec(`set onward.block_catalog_index = 'on';`);
    await expectPromotionBlockedAndRolledBack(
      indexHookDb,
      review,
      "same-name unrelated StorySpec index hook promotion",
      "catalog index hook blocked terminal write",
    );
  } finally {
    await indexHookDb.close();
  }
}

async function checkHostileAclCutover(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await db.exec(`
      grant execute on function public.promote_story_spec(text)
        to onward_adversary;
      grant execute on function public.retire_story_spec(text)
        to onward_adversary;
      grant execute on function public.enforce_story_spec_lifecycle()
        to onward_adversary;
      grant delete, truncate on public.story_specs to onward_adversary;
      grant update(status) on public.story_specs to onward_adversary;
      grant select(story_spec_id) on public.story_specs to public;
      grant update, delete, truncate, trigger on public.figure_stages
        to onward_adversary;
      grant update(status) on public.figure_stages to authenticated;
    `);

    await applyPublicationMigration(db);
    await expectHealth(db, { ok: true });

    const leaked = await db.query<{
      legacy_exec: boolean;
      retire_exec: boolean;
      lifecycle_exec: boolean;
      v2_exec: boolean;
      health_exec: boolean;
      manifest_exec: boolean;
      table_delete: boolean;
      table_truncate: boolean;
      column_update: boolean;
      public_column_select: boolean;
      stage_update: boolean;
      stage_delete: boolean;
      stage_truncate: boolean;
      stage_trigger: boolean;
      stage_column_update: boolean;
    }>(`
      select
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.promote_story_spec(text)',
          'EXECUTE'
        ) as legacy_exec,
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.retire_story_spec(text)',
          'EXECUTE'
        ) as retire_exec,
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.enforce_story_spec_lifecycle()',
          'EXECUTE'
        ) as lifecycle_exec,
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.promote_story_spec_v2(text,jsonb)',
          'EXECUTE'
        ) as v2_exec,
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.story_spec_publication_schema_health_v1()',
          'EXECUTE'
        ) as health_exec,
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.story_spec_publication_manifest_v1()',
          'EXECUTE'
        ) as manifest_exec,
        pg_catalog.has_table_privilege(
          'onward_adversary',
          'public.story_specs',
          'DELETE'
        ) as table_delete,
        pg_catalog.has_table_privilege(
          'onward_adversary',
          'public.story_specs',
          'TRUNCATE'
        ) as table_truncate,
        pg_catalog.has_column_privilege(
          'onward_adversary',
          'public.story_specs',
          'status',
          'UPDATE'
        ) as column_update,
        pg_catalog.has_column_privilege(
          'public',
          'public.story_specs',
          'story_spec_id',
          'SELECT'
        ) as public_column_select,
        pg_catalog.has_table_privilege(
          'onward_adversary',
          'public.figure_stages',
          'UPDATE'
        ) as stage_update,
        pg_catalog.has_table_privilege(
          'onward_adversary',
          'public.figure_stages',
          'DELETE'
        ) as stage_delete,
        pg_catalog.has_table_privilege(
          'onward_adversary',
          'public.figure_stages',
          'TRUNCATE'
        ) as stage_truncate,
        pg_catalog.has_table_privilege(
          'onward_adversary',
          'public.figure_stages',
          'TRIGGER'
        ) as stage_trigger,
        pg_catalog.has_column_privilege(
          'authenticated',
          'public.figure_stages',
          'status',
          'UPDATE'
        ) as stage_column_update
    `);
    const escapedPrivileges = Object.entries(leaked.rows[0] ?? {})
      .filter(([, granted]) => granted)
      .map(([privilege]) => privilege);
    if (escapedPrivileges.length > 0) {
      throw new Error(
        `hostile ACL cutover leaked: ${escapedPrivileges.join(", ")}`,
      );
    }
  } finally {
    await db.close();
  }
}

async function checkFigureStagesDefinerBoundary(): Promise<void> {
  const cutoverDb = await createBaseDatabase();
  try {
    await cutoverDb.exec(`
      create function public.onward_stage_trigger()
      returns trigger
      language plpgsql
      as $$
      begin
        update public.story_specs
        set status = 'published',
            spec = pg_catalog.jsonb_set(
              spec,
              '{status}',
              pg_catalog.to_jsonb('published'::text),
              false
            )
        where story_spec_id = 'trigger-target';
        return new;
      end
      $$;

      create trigger onward_stage_after
      after update on public.figure_stages
      for each row execute function public.onward_stage_trigger();
    `);
    await expectRejected(
      () => applyPublicationMigration(cutoverDb),
      "pre-existing figure-stage trigger",
      "figure_stages must not have user triggers",
    );
    await expectV2Absent(cutoverDb, "figure-stage-trigger rollback");
  } finally {
    await cutoverDb.close();
  }

  const driftDb = await createBaseDatabase();
  try {
    await applyPublicationMigration(driftDb);
    await driftDb.exec(`
      create function public.onward_stage_trigger()
      returns trigger
      language plpgsql
      as $$
      begin
        return new;
      end
      $$;
    `);

    const triggerPrivilege = await driftDb.query<{ granted: boolean }>(`
      select pg_catalog.has_table_privilege(
        'onward_adversary',
        'public.figure_stages',
        'TRIGGER'
      ) as granted
    `);
    if (triggerPrivilege.rows[0]?.granted !== false) {
      throw new Error("adversary retained figure_stages TRIGGER");
    }

    await driftDb.exec("set role onward_adversary");
    try {
      await expectRejected(
        () =>
          driftDb.exec(`
            create trigger onward_stage_after
            after update on public.figure_stages
            for each row execute function public.onward_stage_trigger();
          `),
        "unprivileged post-cutover figure-stage trigger",
      );
    } finally {
      await driftDb.exec("reset role");
    }

    await driftDb.exec(`
      create trigger onward_stage_after
      after update on public.figure_stages
      for each row execute function public.onward_stage_trigger();
    `);
    await expectHealth(driftDb, {
      ok: false,
      boundary_granted: false,
    });
    await driftDb.exec(`
      drop trigger onward_stage_after on public.figure_stages;
      drop function public.onward_stage_trigger();
    `);
    await expectHealth(driftDb, { ok: true });

    await driftDb.exec(`
      grant trigger on public.figure_stages to onward_adversary;
    `);
    await expectHealth(driftDb, {
      ok: false,
      boundary_granted: false,
    });
    await driftDb.exec(`
      revoke trigger on public.figure_stages from onward_adversary;
    `);
    await expectHealth(driftDb, { ok: true });

    await driftDb.exec(`
      alter table public.figure_stages owner to onward_adversary;
    `);
    await expectHealth(driftDb, {
      ok: false,
      boundary_granted: false,
    });
  } finally {
    await driftDb.close();
  }
}

async function checkAuthorityRootDriftDetection(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);

    await db.exec(`
      grant postgres to onward_adversary;
    `);
    await expectRoleMembership(db, "onward_adversary", "postgres", true);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke postgres from onward_adversary;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter role anon inherit;
      grant service_role to anon;
    `);
    await expectRoleMembership(db, "anon", "service_role", true);
    await expectPublicationAccess(db, "anon");
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from anon;
      alter role anon noinherit;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator with inherit true;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator with admin option;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator with set false;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      revoke authenticator from supabase_storage_admin;
      grant authenticator to supabase_storage_admin with admin option;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke authenticator from supabase_storage_admin;
      grant authenticator to supabase_storage_admin;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      revoke authenticator from supabase_storage_admin;
      grant authenticator to supabase_storage_admin with inherit true;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke authenticator from supabase_storage_admin;
      grant authenticator to supabase_storage_admin with set false;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke authenticator from supabase_storage_admin;
      grant authenticator to supabase_storage_admin;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      grant service_role to supabase_storage_admin;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from supabase_storage_admin;
      revoke authenticator from supabase_storage_admin;
      grant service_role to supabase_storage_admin;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      revoke service_role from supabase_storage_admin;
      grant service_role to supabase_storage_admin with inherit true;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from supabase_storage_admin;
      grant service_role to supabase_storage_admin with set false;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from supabase_storage_admin;
      grant service_role to supabase_storage_admin with admin option;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke service_role from supabase_storage_admin;
      grant authenticator to supabase_storage_admin;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter role service_role superuser;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      alter role service_role nosuperuser;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter role authenticator createrole;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      alter role authenticator nocreaterole;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter role service_role nobypassrls;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      alter role service_role bypassrls;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter role anon superuser;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      alter role anon nosuperuser;
      alter role authenticated superuser;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      alter role authenticated nosuperuser;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter database postgres owner to onward_adversary;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
  } finally {
    await db.close();
  }
}

async function checkIdentityManifestDriftDetection(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);
    await db.exec(`
      alter table public.story_specs
        drop constraint story_specs_document_identity_check;
      alter table public.story_specs
        add constraint story_specs_document_identity_check
        check (pg_catalog.jsonb_typeof(spec) = 'object');

      do $do$
      declare
        drift_fingerprint text;
        story_specs_owner oid;
      begin
        select
          pg_catalog.md5(
            pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
          ),
          table_relation.relowner
        into strict drift_fingerprint, story_specs_owner
        from pg_catalog.pg_constraint constraint_row
        join pg_catalog.pg_class table_relation
          on table_relation.oid = constraint_row.conrelid
        where constraint_row.conrelid = 'public.story_specs'::regclass
          and constraint_row.conname =
            'story_specs_document_identity_check';

        execute pg_catalog.format(
          'comment on constraint story_specs_document_identity_check '
            || 'on public.story_specs is %L',
          'onward-story-spec-identity-v1:'
            || drift_fingerprint
            || ':owner='
            || story_specs_owner::text
        );
      end
      $do$;

      ${figureStageInsertSql("weak-identity")}

      insert into public.story_specs (
        story_spec_id,
        figure_key,
        stage_id,
        version,
        schema_version,
        status,
        spec
      ) values (
        'weak-identity',
        'weak-identity',
        'stage',
        1,
        'v1',
        'draft',
        '{}'::jsonb
      );
    `);
    await expectHealth(db, {
      ok: false,
      identity_constraint_valid: false,
    });
  } finally {
    await db.close();
  }
}

async function checkStageIdentityFailClosed(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);
    await db.exec(`
      alter table public.story_specs
        drop constraint story_specs_stage_fk;
    `);
    await expectHealth(db, {
      ok: false,
      identity_constraint_valid: false,
    });

    const orphan = storySpecDocument(
      "orphan-review",
      1,
      "review",
      "orphan",
    );
    await insertStorySpec(db, orphan);
    await db.exec("set role service_role");
    try {
      await expectRejected(
        () =>
          db.exec(`
            select public.promote_story_spec_v2(
              'orphan-review',
              ${jsonbLiteral(orphan)}
            );
          `),
        "orphan StorySpec promotion",
        "StorySpec stage not found",
      );
    } finally {
      await db.exec("reset role");
    }
    await expectStoryStates(db, {
      "orphan-review": "review",
    });

    await db.exec(`
      delete from public.story_specs
      where story_spec_id = 'orphan-review';

      alter table public.story_specs
        add constraint story_specs_stage_fk
        foreign key (figure_key, stage_id)
        references public.figure_stages (figure_key, stage_id)
        on delete cascade;

      do $do$
      declare
        drift_fingerprint text;
        story_specs_owner oid;
      begin
        select
          pg_catalog.md5(
            pg_catalog.pg_get_constraintdef(constraint_row.oid, true)
          ),
          table_relation.relowner
        into strict drift_fingerprint, story_specs_owner
        from pg_catalog.pg_constraint constraint_row
        join pg_catalog.pg_class table_relation
          on table_relation.oid = constraint_row.conrelid
        where constraint_row.conrelid = 'public.story_specs'::regclass
          and constraint_row.conname = 'story_specs_stage_fk';

        execute pg_catalog.format(
          'comment on constraint story_specs_stage_fk '
            || 'on public.story_specs is %L',
          'onward-story-spec-stage-fk-v1:'
            || drift_fingerprint
            || ':owner='
            || story_specs_owner::text
        );
      end
      $do$;
    `);
    await expectHealth(db, {
      ok: false,
      identity_constraint_valid: false,
    });
  } finally {
    await db.close();
  }
}

async function checkCatalogAlignmentDriftDetection(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);
    await db.exec(figureStageInsertSql("alignment"));
    await insertStorySpec(
      db,
      storySpecDocument(
        "alignment-published",
        1,
        "published",
        "alignment",
      ),
    );
    await expectHealth(db, {
      ok: false,
      published_stage_uniqueness_valid: false,
    });
    await db.exec(`
      update public.figure_stages
      set status = 'published'
      where figure_key = 'alignment'
        and stage_id = 'stage';
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      update public.figure_stages
      set status = 'draft'
      where figure_key = 'alignment'
        and stage_id = 'stage';
    `);
    await expectHealth(db, {
      ok: false,
      published_stage_uniqueness_valid: false,
    });
  } finally {
    await db.close();
  }
}

async function checkPostCutoverDriftDetection(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);

    await db.exec(`
      alter table public.story_specs
        drop constraint story_specs_pkey;
    `);
    await expectHealth(db, {
      ok: false,
      identity_constraint_valid: false,
      promotion_cas_valid: false,
    });
    await db.exec(`
      alter table public.story_specs
        add constraint story_specs_pkey primary key (story_spec_id);
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter table public.figure_stages
        add constraint onward_stage_draft_only
        check (status = 'draft')
        not valid;
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
    });
    await db.exec(`
      alter table public.figure_stages
        drop constraint onward_stage_draft_only;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter table public.story_specs
        add constraint onward_story_spec_no_publish
        check (status <> 'published')
        not valid;
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
    });
    await db.exec(`
      alter table public.story_specs
        drop constraint onward_story_spec_no_publish;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter table public.story_specs
        add constraint onward_story_spec_json_no_publish
        check ((spec ->> 'status') <> 'published')
        not valid;
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
      promotion_cas_valid: false,
    });
    await db.exec(`
      alter table public.story_specs
        drop constraint onward_story_spec_json_no_publish;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      create unique index onward_story_spec_terminal_timestamps
        on public.story_specs (published_at, retired_at);
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
      promotion_cas_valid: false,
    });
    await db.exec(`
      drop index public.onward_story_spec_terminal_timestamps;
    `);
    await expectHealth(db, { ok: true });

    const blockingReview = storySpecDocument(
      "blocking-terminal-index",
      1,
      "review",
      "blocking-terminal-index",
    );
    await db.exec(`
      ${figureStageInsertSql("blocking-terminal-index")}

      create function public.onward_block_terminal_index(p_status text)
      returns text
      language plpgsql
      immutable
      as $$
      begin
        if p_status in ('published', 'retired') then
          raise exception 'ordinary index blocked terminal write';
        end if;
        return p_status;
      end
      $$;
    `);
    await insertStorySpec(db, blockingReview);
    await db.exec(`
      create index onward_story_spec_terminal_expression
        on public.story_specs (
          public.onward_block_terminal_index(status)
        );
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
      promotion_cas_valid: false,
    });
    await expectRejected(
      () =>
        db.query(
          `
            select public.promote_story_spec_v2(
              $1::text,
              $2::jsonb
            )
          `,
          [blockingReview.storySpecId, JSON.stringify(blockingReview)],
        ),
      "ordinary expression-index terminal write",
      "ordinary index blocked terminal write",
    );
    await db.exec(`
      drop index public.onward_story_spec_terminal_expression;
      drop function public.onward_block_terminal_index(text);
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      create unique index onward_stage_status_unique
        on public.figure_stages (status);
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
    });
    await db.exec(`
      drop index public.onward_stage_status_unique;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      create unique index onward_story_spec_status_unique
        on public.story_specs (figure_key)
        where status = 'draft';
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
    });
    await db.exec(`
      drop index public.onward_story_spec_status_unique;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      create function public.onward_test_trigger()
      returns trigger
      language plpgsql
      as $$
      begin
        return new;
      end
      $$;

      create trigger onward_test_after
      after update on public.story_specs
      for each row execute function public.onward_test_trigger();
      alter table public.story_specs
        disable trigger onward_test_after;
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
    });
    await db.exec(`
      drop trigger onward_test_after on public.story_specs;
      drop function public.onward_test_trigger();
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      grant update(status) on public.story_specs to authenticated;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke update(status) on public.story_specs from authenticated;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      grant execute on function public.retire_story_spec(text)
        to onward_adversary;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      revoke execute on function public.retire_story_spec(text)
        from onward_adversary;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      alter function public.enforce_story_spec_lifecycle()
        owner to onward_adversary;
    `);
    await expectHealth(db, {
      ok: false,
      lifecycle_trigger_enabled: false,
      boundary_granted: false,
    });
    await db.exec(`
      alter function public.enforce_story_spec_lifecycle()
        owner to postgres;
      revoke all on function public.enforce_story_spec_lifecycle()
        from onward_adversary;
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      create function public.promote_story_spec_v2(text)
      returns void
      language sql
      security definer
      as $$
        select
      $$;
      grant execute on function public.promote_story_spec_v2(text)
        to service_role;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });
    await db.exec(`
      drop function public.promote_story_spec_v2(text);
    `);
    await expectHealth(db, { ok: true });

    await db.exec(`
      drop index public.story_specs_one_published_stage_idx;
      create unique index story_specs_one_published_stage_idx
        on public.story_specs (
          figure_key collate "C" text_pattern_ops desc nulls last,
          stage_id
        )
        where status = 'review';

      do $do$
      declare
        drift_fingerprint text;
        story_specs_owner oid;
      begin
        select
          pg_catalog.md5(
            pg_catalog.pg_get_indexdef(index_row.indexrelid, 0, true)
          ),
          table_relation.relowner
        into strict drift_fingerprint, story_specs_owner
        from pg_catalog.pg_index index_row
        join pg_catalog.pg_class index_relation
          on index_relation.oid = index_row.indexrelid
        join pg_catalog.pg_class table_relation
          on table_relation.oid = index_row.indrelid
        where index_relation.oid =
          'public.story_specs_one_published_stage_idx'::regclass;

        execute pg_catalog.format(
          'comment on index public.story_specs_one_published_stage_idx is %L',
          'onward-story-spec-published-index-v1:'
            || drift_fingerprint
            || ':owner='
            || story_specs_owner::text
        );
      end
      $do$;

      ${figureStageInsertSql("duplicate")}
    `);
    await insertStorySpec(
      db,
      storySpecDocument("duplicate-one", 1, "published", "duplicate"),
    );
    await insertStorySpec(
      db,
      storySpecDocument("duplicate-two", 2, "published", "duplicate"),
    );
    await expectHealth(db, {
      ok: false,
      published_stage_uniqueness_valid: false,
    });
    const duplicateCount = await db.query<{ count: number }>(`
      select count(*)::int as count
      from public.story_specs
      where figure_key = 'duplicate'
        and stage_id = 'stage'
        and status = 'published'
    `);
    if (duplicateCount.rows[0]?.count !== 2) {
      throw new Error("forged index fixture did not break published uniqueness");
    }
  } finally {
    await db.close();
  }
}

async function checkUnexpectedTriggerFailsCutover(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await db.exec(`
      create function public.onward_test_trigger()
      returns trigger
      language plpgsql
      as $$
      begin
        return new;
      end
      $$;

      create trigger onward_test_after
      after update on public.story_specs
      for each row execute function public.onward_test_trigger();
      alter table public.story_specs
        disable trigger onward_test_after;
    `);
    await expectRejected(
      () => applyPublicationMigration(db),
      "unexpected disabled trigger",
      "closed health boundary",
    );
    await expectV2Absent(db, "disabled-trigger rollback");
  } finally {
    await db.close();
  }
}

async function checkStatusIndexFailsCutover(): Promise<void> {
  const stageIndexDb = await createBaseDatabase();
  try {
    await stageIndexDb.exec(`
      create unique index onward_stage_status_unique
        on public.figure_stages (status);
    `);
    await expectRejected(
      () => applyPublicationMigration(stageIndexDb),
      "stage status-index bootstrap",
      "publication index inventory is unsafe",
    );
    await expectV2Absent(stageIndexDb, "stage status-index rollback");
  } finally {
    await stageIndexDb.close();
  }

  const storyIndexDb = await createBaseDatabase();
  try {
    await storyIndexDb.exec(`
      create unique index onward_story_spec_status_unique
        on public.story_specs (figure_key)
        where status = 'draft';
    `);
    await expectRejected(
      () => applyPublicationMigration(storyIndexDb),
      "StorySpec status-index bootstrap",
      "publication index inventory is unsafe",
    );
    await expectV2Absent(storyIndexDb, "StorySpec status-index rollback");
  } finally {
    await storyIndexDb.close();
  }

  const ordinaryPartialIndexDb = await createBaseDatabase();
  try {
    await ordinaryPartialIndexDb.exec(`
      create function public.onward_block_terminal_index(p_status text)
      returns boolean
      language plpgsql
      immutable
      as $$
      begin
        if p_status in ('published', 'retired') then
          raise exception 'ordinary index blocked terminal write';
        end if;
        return true;
      end
      $$;

      create index onward_story_spec_terminal_partial
        on public.story_specs (story_spec_id)
        where public.onward_block_terminal_index(status);
    `);
    await expectRejected(
      () => applyPublicationMigration(ordinaryPartialIndexDb),
      "ordinary partial-index bootstrap",
      "publication index inventory is unsafe",
    );
    await expectV2Absent(
      ordinaryPartialIndexDb,
      "ordinary partial-index rollback",
    );
  } finally {
    await ordinaryPartialIndexDb.close();
  }

  const storyMirrorDb = await createBaseDatabase();
  try {
    await storyMirrorDb.exec(`
      alter table public.story_specs
        add constraint onward_story_spec_json_no_publish
        check ((spec ->> 'status') <> 'published');
    `);
    await expectRejected(
      () => applyPublicationMigration(storyMirrorDb),
      "StorySpec JSON-status dependency bootstrap",
      "publication constraint inventory is unsafe",
    );
    await expectV2Absent(storyMirrorDb, "JSON-status dependency rollback");
  } finally {
    await storyMirrorDb.close();
  }

  const terminalTimestampDb = await createBaseDatabase();
  try {
    await terminalTimestampDb.exec(`
      create unique index onward_story_spec_terminal_timestamps
        on public.story_specs (published_at, retired_at);
    `);
    await expectRejected(
      () => applyPublicationMigration(terminalTimestampDb),
      "StorySpec terminal-timestamp dependency bootstrap",
      "publication index inventory is unsafe",
    );
    await expectV2Absent(
      terminalTimestampDb,
      "terminal-timestamp dependency rollback",
    );
  } finally {
    await terminalTimestampDb.close();
  }
}

async function checkLegacyPublicationFailsCutover(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await db.exec(figureStageInsertSql("legacy-publication", "published"));
    await insertStorySpec(
      db,
      storySpecDocument(
        "legacy-publication",
        1,
        "published",
        "legacy-publication",
      ),
    );
    await expectRejected(
      () => applyPublicationMigration(db),
      "legacy published StorySpec",
      "retire every published StorySpec",
    );
    await expectV2Absent(db, "legacy-publication rollback");
    await expectStoryStates(db, {
      "legacy-publication": "published",
    });
    await expectStageStatus(db, "legacy-publication", "published");
  } finally {
    await db.close();
  }
}

async function checkOwnerAndOverloadBootstrapFailures(): Promise<void> {
  const missingIdentityKeyDb = await createBaseDatabase();
  try {
    await missingIdentityKeyDb.exec(`
      alter table public.story_specs
        drop constraint story_specs_pkey;
    `);
    await expectRejected(
      () => applyPublicationMigration(missingIdentityKeyDb),
      "missing StorySpec identity key bootstrap",
      "publication constraint inventory is unsafe",
    );
    await expectV2Absent(
      missingIdentityKeyDb,
      "missing identity-key rollback",
    );
  } finally {
    await missingIdentityKeyDb.close();
  }

  const hostileOwnerDb = await createBaseDatabase();
  try {
    await hostileOwnerDb.exec(`
      alter table public.story_specs owner to onward_adversary;
    `);
    await expectRejected(
      () => applyPublicationMigration(hostileOwnerDb),
      "hostile table-owner bootstrap",
      "untyped heap tables and owner",
    );
    await expectV2Absent(hostileOwnerDb, "hostile-owner rollback");
  } finally {
    await hostileOwnerDb.close();
  }

  const coordinatedOwnerDb = await createBaseDatabase();
  try {
    await coordinatedOwnerDb.exec(`
      alter table public.story_specs owner to onward_adversary;
      alter table public.figure_stages owner to onward_adversary;
      alter table public.story_artifacts owner to onward_adversary;
      alter function public.enforce_story_spec_lifecycle()
        owner to onward_adversary;
      alter function public.promote_story_spec(text)
        owner to onward_adversary;
      alter function public.retire_story_spec(text)
        owner to onward_adversary;
      set role onward_adversary;
    `);
    try {
      await expectRejected(
        () => applyPublicationMigration(coordinatedOwnerDb),
        "coordinated hostile-owner bootstrap",
        "database owner",
      );
    } finally {
      await coordinatedOwnerDb.exec("reset role");
    }
    await expectV2Absent(coordinatedOwnerDb, "coordinated-owner rollback");
  } finally {
    await coordinatedOwnerDb.close();
  }

  const inheritedOwnerDb = await createBaseDatabase();
  try {
    await inheritedOwnerDb.exec(`
      grant postgres to onward_adversary;
    `);
    await expectRejected(
      () => applyPublicationMigration(inheritedOwnerDb),
      "unknown-role owner inheritance",
      "must not inherit StorySpec publication authority",
    );
    await expectV2Absent(inheritedOwnerDb, "owner-inheritance rollback");
  } finally {
    await inheritedOwnerDb.close();
  }

  const inheritedServiceDb = await createBaseDatabase();
  try {
    await inheritedServiceDb.exec(`
      alter role anon inherit;
      grant service_role to anon;
    `);
    await expectRejected(
      () => applyPublicationMigration(inheritedServiceDb),
      "anonymous service-role inheritance",
      "service authority role graph is unsafe",
    );
    await expectV2Absent(inheritedServiceDb, "service-inheritance rollback");
  } finally {
    await inheritedServiceDb.close();
  }

  const inheritedAuthenticatorDb = await createBaseDatabase();
  try {
    await inheritedAuthenticatorDb.exec(`
      revoke service_role from authenticator;
      grant service_role to authenticator with inherit true;
    `);
    await expectRejected(
      () => applyPublicationMigration(inheritedAuthenticatorDb),
      "inheriting authenticator membership",
      "service authority role graph is unsafe",
    );
    await expectV2Absent(
      inheritedAuthenticatorDb,
      "inheriting-authenticator rollback",
    );
  } finally {
    await inheritedAuthenticatorDb.close();
  }

  const delegatingStorageDb = await createBaseDatabase();
  try {
    await delegatingStorageDb.exec(`
      revoke authenticator from supabase_storage_admin;
      grant authenticator to supabase_storage_admin with admin option;
    `);
    await expectRejected(
      () => applyPublicationMigration(delegatingStorageDb),
      "delegating storage-admin bootstrap",
      "service authority role graph is unsafe",
    );
    await expectV2Absent(
      delegatingStorageDb,
      "delegating-storage rollback",
    );
  } finally {
    await delegatingStorageDb.close();
  }

  const dualStoragePathDb = await createBaseDatabase();
  try {
    await dualStoragePathDb.exec(`
      grant service_role to supabase_storage_admin;
    `);
    await expectRejected(
      () => applyPublicationMigration(dualStoragePathDb),
      "dual storage-admin path bootstrap",
      "service authority role graph is unsafe",
    );
    await expectV2Absent(
      dualStoragePathDb,
      "dual-storage-path rollback",
    );
  } finally {
    await dualStoragePathDb.close();
  }

  const privilegedServiceDb = await createBaseDatabase();
  try {
    await privilegedServiceDb.exec(`
      alter role service_role superuser;
    `);
    await expectRejected(
      () => applyPublicationMigration(privilegedServiceDb),
      "superuser service-role bootstrap",
      "service authority role graph is unsafe",
    );
    await expectV2Absent(
      privilegedServiceDb,
      "superuser-service rollback",
    );
  } finally {
    await privilegedServiceDb.close();
  }

  const delegatingAuthenticatorDb = await createBaseDatabase();
  try {
    await delegatingAuthenticatorDb.exec(`
      alter role authenticator createrole;
    `);
    await expectRejected(
      () => applyPublicationMigration(delegatingAuthenticatorDb),
      "delegating authenticator bootstrap",
      "service authority role graph is unsafe",
    );
    await expectV2Absent(
      delegatingAuthenticatorDb,
      "delegating-authenticator rollback",
    );
  } finally {
    await delegatingAuthenticatorDb.close();
  }

  const overloadDb = await createBaseDatabase();
  try {
    await overloadDb.exec(`
      create function public.promote_story_spec_v2(text)
      returns void
      language sql
      security definer
      as $$
        select
      $$;
      grant execute on function public.promote_story_spec_v2(text)
        to service_role;
    `);
    await expectRejected(
      () => applyPublicationMigration(overloadDb),
      "pre-cutover RPC overload",
      "unexpected routine, overload, or owner",
    );
    const exactV2 = await overloadDb.query<{ exact_v2_absent: boolean }>(`
      select pg_catalog.to_regprocedure(
        'public.promote_story_spec_v2(text,jsonb)'
      ) is null as exact_v2_absent
    `);
    if (exactV2.rows[0]?.exact_v2_absent !== true) {
      throw new Error("overload rollback left the exact v2 RPC installed");
    }
  } finally {
    await overloadDb.close();
  }
}

function storySpecDocument(
  storySpecId: string,
  version: number,
  status: "draft" | "review" | "published" | "retired",
  figureKey = "figure",
) {
  return {
    storySpecId,
    figureKey,
    stageId: "stage",
    version,
    schemaVersion: "v1",
    status,
    review: {
      researcherId: "researcher",
      historicalReviewerId: "historian",
      toneReviewerId: "tone-reviewer",
      reviewedAt: "2026-07-29",
      contentProfileReviewed: true,
    },
    facts: [
      {
        factId: "fact-1",
        sourceRefs: [{ sourceId: "source-1", scope: "exact" }],
      },
    ],
    quotes: [],
    arc: [
      {
        role: "scene",
        requiredFactIds: ["fact-1"],
      },
    ],
  };
}

async function insertStorySpec(
  db: PGlite,
  spec: ReturnType<typeof storySpecDocument>,
): Promise<void> {
  await db.exec(`
    insert into public.story_specs (
      story_spec_id,
      figure_key,
      stage_id,
      version,
      schema_version,
      status,
      spec
    ) values (
      ${textLiteral(spec.storySpecId)},
      ${textLiteral(spec.figureKey)},
      ${textLiteral(spec.stageId)},
      ${spec.version},
      ${textLiteral(spec.schemaVersion)},
      ${textLiteral(spec.status)},
      ${jsonbLiteral(spec)}
    );
  `);
}

async function prepareCatalogReview(
  db: PGlite,
  figureKey: string,
): Promise<ReturnType<typeof storySpecDocument>> {
  await applyPublicationMigration(db);
  await db.exec(figureStageInsertSql(figureKey));
  const review = storySpecDocument(
    `${figureKey}-review`,
    1,
    "review",
    figureKey,
  );
  await insertStorySpec(db, review);
  return review;
}

async function expectPromotionBlockedAndRolledBack(
  db: PGlite,
  review: ReturnType<typeof storySpecDocument>,
  label: string,
  expectedMessage: string,
): Promise<void> {
  await db.exec("set role service_role");
  try {
    await expectRejected(
      () =>
        db.query(
          `
            select public.promote_story_spec_v2(
              $1::text,
              $2::jsonb
            )
          `,
          [review.storySpecId, JSON.stringify(review)],
        ),
      label,
      expectedMessage,
    );
  } finally {
    await db.exec("reset role");
  }
  await expectStoryStates(db, {
    [review.storySpecId]: "review",
  });
  await expectStageStatus(db, review.figureKey, "draft");
}

async function expectStoryStates(
  db: PGlite,
  expected: Readonly<Record<string, string>>,
): Promise<void> {
  for (const [storySpecId, expectedStatus] of Object.entries(expected)) {
    const result = await db.query<{ status: string; spec_status: string }>(`
      select status, spec ->> 'status' as spec_status
      from public.story_specs
      where story_spec_id = ${textLiteral(storySpecId)}
    `);
    const row = result.rows[0];
    if (
      row?.status !== expectedStatus ||
      row.spec_status !== expectedStatus
    ) {
      throw new Error(
        `${storySpecId} state was ${String(row?.status)}/${String(
          row?.spec_status,
        )}; expected ${expectedStatus}`,
      );
    }
  }
}

async function expectStageStatus(
  db: PGlite,
  figureKey: string,
  expectedStatus: string,
): Promise<void> {
  const result = await db.query<{ status: string }>(`
    select status
    from public.figure_stages
    where figure_key = ${textLiteral(figureKey)}
      and stage_id = 'stage'
  `);
  if (result.rows[0]?.status !== expectedStatus) {
    throw new Error(
      `${figureKey} stage was ${String(
        result.rows[0]?.status,
      )}; expected ${expectedStatus}`,
    );
  }
}

async function expectV2Absent(db: PGlite, label: string): Promise<void> {
  const rollback = await db.query<{ v2_absent: boolean }>(`
    select pg_catalog.to_regprocedure(
      'public.promote_story_spec_v2(text,jsonb)'
    ) is null as v2_absent
  `);
  if (rollback.rows[0]?.v2_absent !== true) {
    throw new Error(`${label} left its v2 RPC installed`);
  }
}

function textLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function jsonbLiteral(value: unknown): string {
  return `${textLiteral(JSON.stringify(value))}::jsonb`;
}

function figureStageInsertSql(
  figureKey: string,
  status: "draft" | "published" = "draft",
): string {
  return `
    insert into public.figure_stages (
      figure_key,
      stage_id,
      stage_label,
      age_min,
      age_max,
      shape_sentences,
      facets,
      biographical_facts,
      themes,
      anti_themes,
      beats,
      sources,
      status
    ) values (
      ${textLiteral(figureKey)},
      'stage',
      'Migration contract fixture',
      20,
      21,
      array['A bounded emotional episode.']::text[],
      '{}'::jsonb,
      'A bounded biographical fact.',
      array['identity']::text[],
      '{}'::text[],
      '[]'::jsonb,
      array['https://example.com/source']::text[],
      ${textLiteral(status)}
    );
  `;
}

async function createBaseDatabase(
  options: Readonly<{ applyStorySpecsMigration?: boolean }> = {},
): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon noinherit;
    create role authenticated noinherit;
    create role service_role noinherit bypassrls;
    create role authenticator noinherit;
    create role supabase_storage_admin noinherit createrole login;
    create role onward_adversary noinherit bypassrls;
    grant service_role to authenticator;
    grant service_role to postgres;
    grant authenticator to supabase_storage_admin;

    create table public.figures (
      key text primary key,
      display_name text not null,
      birth_year int,
      death_year int
    );

    insert into public.figures (key, display_name)
    select fixture.key, fixture.key
    from (
      values
        ('precutover-stage-only'),
        ('precutover-spec-only'),
        ('direct-stage'),
        ('figure'),
        ('blocked'),
        ('initial'),
        ('blocking-generated-column'),
        ('weak-identity'),
        ('alignment'),
        ('blocking-terminal-index'),
        ('duplicate'),
        ('legacy-publication'),
        ('catalog-column-contract'),
        ('catalog-constraint-contract'),
        ('catalog-index-contract')
    ) as fixture(key);

    create table public.figure_stages (
      figure_key text not null
        references public.figures (key) on delete cascade,
      stage_id text not null,
      stage_label text not null,
      age_min int not null,
      age_max int not null,
      shape_sentences text[] not null,
      facets jsonb not null,
      biographical_facts text not null,
      themes text[] not null,
      anti_themes text[] not null default '{}',
      beats jsonb not null,
      sources text[] not null,
      status text not null default 'draft',
      primary key (figure_key, stage_id),
      constraint figure_stages_status_check
        check (status in ('draft', 'published')),
      constraint figure_stages_age_check check (age_min <= age_max)
    );

    create table public.story_artifacts (
      artifact_id text primary key,
      schema_version text not null
    );

    insert into public.story_artifacts (artifact_id, schema_version)
    values
      ('precutover-v5', 'story-artifact-v5-2026-07'),
      ('precutover-v4', 'story-artifact-v4-2026-07');
  `);
  await expectBaseAuthorityGraph(db);
  if (options.applyStorySpecsMigration !== false) {
    await db.exec(storySpecsMigration);
  }
  return db;
}

async function expectBaseAuthorityGraph(db: PGlite): Promise<void> {
  const result = await db.query<{
    owner_member_count: number;
    service_member_count: number;
    authenticator_member_count: number;
    owner_member_count_in_service: number;
    storage_member_count: number;
    unexpected_service_member_count: number;
    authenticator_noinherit: boolean;
    authenticator_not_super: boolean;
    authenticator_not_bypass: boolean;
    canonical_no_admin: boolean;
    canonical_no_inherit: boolean;
    canonical_can_set: boolean;
  }>(`
    with recursive owner_members(member_oid) as (
      select membership.member
      from pg_catalog.pg_auth_members membership
      where membership.roleid = (
        select database_row.datdba
        from pg_catalog.pg_database database_row
        where database_row.datname = pg_catalog.current_database()
      )
      union
      select membership.member
      from pg_catalog.pg_auth_members membership
      join owner_members inherited
        on membership.roleid = inherited.member_oid
    ),
    service_members(member_oid) as (
      select membership.member
      from pg_catalog.pg_auth_members membership
      where membership.roleid = 'service_role'::regrole
      union
      select membership.member
      from pg_catalog.pg_auth_members membership
      join service_members inherited
        on membership.roleid = inherited.member_oid
    )
    select
      (select count(*)::int from owner_members) as owner_member_count,
      (select count(*)::int from service_members) as service_member_count,
      (
        select count(*)::int
        from service_members
        where member_oid = 'authenticator'::regrole
      ) as authenticator_member_count,
      (
        select count(*)::int
        from service_members
        where member_oid = (
          select database_row.datdba
          from pg_catalog.pg_database database_row
          where database_row.datname = pg_catalog.current_database()
        )
      ) as owner_member_count_in_service,
      (
        select count(*)::int
        from service_members
        join pg_catalog.pg_roles member_role
          on member_role.oid = service_members.member_oid
        where member_role.rolname = 'supabase_storage_admin'
      ) as storage_member_count,
      (
        select count(*)::int
        from service_members
        join pg_catalog.pg_roles member_role
          on member_role.oid = service_members.member_oid
        where service_members.member_oid not in (
            'authenticator'::regrole,
            (
              select database_row.datdba
              from pg_catalog.pg_database database_row
              where database_row.datname = pg_catalog.current_database()
            )
          )
          and member_role.rolname <> 'supabase_storage_admin'
      ) as unexpected_service_member_count,
      not authenticator_role.rolinherit as authenticator_noinherit,
      not authenticator_role.rolsuper as authenticator_not_super,
      not authenticator_role.rolbypassrls as authenticator_not_bypass,
      not canonical_membership.admin_option as canonical_no_admin,
      not coalesce(
        (
          pg_catalog.to_jsonb(canonical_membership)
            ->> 'inherit_option'
        )::boolean,
        authenticator_role.rolinherit
      ) as canonical_no_inherit,
      coalesce(
        (
          pg_catalog.to_jsonb(canonical_membership)
            ->> 'set_option'
        )::boolean,
        true
      ) as canonical_can_set
    from pg_catalog.pg_roles authenticator_role
    join pg_catalog.pg_auth_members canonical_membership
      on canonical_membership.roleid = 'service_role'::regrole
      and canonical_membership.member = authenticator_role.oid
    where authenticator_role.oid = 'authenticator'::regrole
  `);
  const graph = result.rows[0];
  if (
    !graph ||
    graph.owner_member_count !== 0 ||
    graph.service_member_count !== 3 ||
    graph.authenticator_member_count !== 1 ||
    graph.owner_member_count_in_service !== 1 ||
    graph.storage_member_count !== 1 ||
    graph.unexpected_service_member_count !== 0 ||
    !graph.authenticator_noinherit ||
    !graph.authenticator_not_super ||
    !graph.authenticator_not_bypass ||
    !graph.canonical_no_admin ||
    !graph.canonical_no_inherit ||
    !graph.canonical_can_set
  ) {
    throw new Error(
      `base authority graph is unsafe: ${JSON.stringify(graph ?? null)}`,
    );
  }
}

async function expectRoleMembership(
  db: PGlite,
  member: string,
  role: string,
  expected: boolean,
): Promise<void> {
  const result = await db.query<{ member: boolean }>(`
    select pg_catalog.pg_has_role(
      ${textLiteral(member)},
      ${textLiteral(role)},
      'MEMBER'
    ) as member
  `);
  if (result.rows[0]?.member !== expected) {
    throw new Error(
      `${member} membership in ${role} was ${String(
        result.rows[0]?.member,
      )}; expected ${String(expected)}`,
    );
  }
}

async function expectPublicationAccess(
  db: PGlite,
  role: string,
): Promise<void> {
  const result = await db.query<{
    function_access: boolean;
    table_access: boolean;
  }>(`
    select
      pg_catalog.has_function_privilege(
        ${textLiteral(role)},
        'public.promote_story_spec_v2(text,jsonb)',
        'EXECUTE'
      ) as function_access,
      pg_catalog.has_table_privilege(
        ${textLiteral(role)},
        'public.story_specs',
        'SELECT'
      ) as table_access
  `);
  const access = result.rows[0];
  if (!access?.function_access || !access.table_access) {
    throw new Error(
      `${role} did not inherit the expected service-role publication access`,
    );
  }
}

async function applyPublicationMigration(
  db: PGlite,
  beforeCommit?: () => Promise<void>,
): Promise<void> {
  await db.exec("begin");
  try {
    await db.exec(publicationMigration);
    await beforeCommit?.();
    await db.exec("commit");
  } catch (error) {
    await db.exec("rollback");
    throw error;
  }
}

async function expectPublicationLocks(db: PGlite): Promise<void> {
  const result = await db.query<{ locked_relations: number }>(`
    select count(distinct lock_row.relation)::int as locked_relations
    from pg_catalog.pg_locks lock_row
    where lock_row.pid = pg_catalog.pg_backend_pid()
      and lock_row.granted
      and lock_row.mode = 'AccessExclusiveLock'
      and lock_row.relation in (
        'public.story_specs'::regclass,
        'public.figure_stages'::regclass,
        'public.story_artifacts'::regclass
      )
  `);
  if (result.rows[0]?.locked_relations !== 3) {
    throw new Error(
      `publication cutover held ${String(
        result.rows[0]?.locked_relations,
      )}/3 required AccessExclusiveLock rows`,
    );
  }
}

async function expectCanonicalPublicationCatalogCounts(
  db: PGlite,
): Promise<void> {
  const result = await db.query<{
    story_columns: number;
    stage_columns: number;
    story_constraints: number;
    stage_constraints: number;
    story_indexes: number;
    stage_indexes: number;
  }>(`
    select
      (
        select count(*)::int
        from pg_catalog.pg_attribute attribute_row
        where attribute_row.attrelid = 'public.story_specs'::regclass
          and attribute_row.attnum > 0
          and not attribute_row.attisdropped
      ) as story_columns,
      (
        select count(*)::int
        from pg_catalog.pg_attribute attribute_row
        where attribute_row.attrelid = 'public.figure_stages'::regclass
          and attribute_row.attnum > 0
          and not attribute_row.attisdropped
      ) as stage_columns,
      (
        select count(*)::int
        from pg_catalog.pg_constraint constraint_row
        where constraint_row.conrelid = 'public.story_specs'::regclass
          and constraint_row.contype <> 'n'
      ) as story_constraints,
      (
        select count(*)::int
        from pg_catalog.pg_constraint constraint_row
        where constraint_row.conrelid = 'public.figure_stages'::regclass
          and constraint_row.contype <> 'n'
      ) as stage_constraints,
      (
        select count(*)::int
        from pg_catalog.pg_index index_row
        where index_row.indrelid = 'public.story_specs'::regclass
      ) as story_indexes,
      (
        select count(*)::int
        from pg_catalog.pg_index index_row
        where index_row.indrelid = 'public.figure_stages'::regclass
      ) as stage_indexes
  `);
  const counts = result.rows[0];
  if (
    !counts ||
    counts.story_columns !== 10 ||
    counts.stage_columns !== 13 ||
    counts.story_constraints !== 6 ||
    counts.stage_constraints !== 4 ||
    counts.story_indexes !== 4 ||
    counts.stage_indexes !== 1
  ) {
    throw new Error(
      `publication catalog counts are not canonical: ${JSON.stringify(
        counts ?? null,
      )}`,
    );
  }
}

async function expectHealth(
  db: PGlite,
  expected: Partial<PublicationHealth>,
): Promise<void> {
  const result = await db.query<PublicationHealth>(`
    select *
    from public.story_spec_publication_schema_health_v1()
  `);
  const health = result.rows[0];
  if (!health) throw new Error("publication health returned no row");

  for (const [field, expectedValue] of Object.entries(expected)) {
    if (health[field as keyof PublicationHealth] !== expectedValue) {
      throw new Error(
        `publication health ${field} was ${String(
          health[field as keyof PublicationHealth],
        )}; expected ${String(expectedValue)}`,
      );
    }
  }
}

async function expectRejected(
  action: () => Promise<unknown>,
  label: string,
  expectedMessage?: string,
): Promise<void> {
  try {
    await action();
  } catch (error) {
    if (
      expectedMessage &&
      (!isError(error) || !error.message.includes(expectedMessage))
    ) {
      throw new Error(
        `${label} failed for an unexpected reason: ${describeError(error)}`,
      );
    }
    return;
  }
  throw new Error(`${label} unexpectedly succeeded`);
}

function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function describeError(value: unknown): string {
  return isError(value) ? value.message : String(value);
}

function read(relative: string): string {
  return readFileSync(
    fileURLToPath(new URL(relative, import.meta.url)),
    "utf8",
  );
}

void main().catch((error: unknown) => {
  console.error(describeError(error));
  process.exitCode = 1;
});
