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
  await checkHostileAclCutover();
  await checkFigureStagesDefinerBoundary();
  await checkAuthorityRootDriftDetection();
  await checkIdentityManifestDriftDetection();
  await checkStageIdentityFailClosed();
  await checkPostCutoverDriftDetection();
  await checkUnexpectedTriggerFailsCutover();
  await checkOwnerAndOverloadBootstrapFailures();

  console.log("Onward StorySpec migration");
  console.log("==========================");
  console.log("PASS exact-snapshot promotion, stale rejection, and retirement");
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
  console.log("PASS unsafe bootstrap and active-trigger cutovers roll back atomically");
}

async function checkCanonicalPublicationBoundary(): Promise<void> {
  const db = await createBaseDatabase();
  try {
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

    await db.exec("set role service_role");
    try {
      await expectRejected(
        () =>
          db.exec(`
            insert into public.figure_stages (
              figure_key,
              stage_id,
              status
            ) values ('direct-stage', 'stage', 'published');
          `),
        "direct published figure-stage insert",
        "owner-definer boundary",
      );
      await db.exec(`
        insert into public.figure_stages (figure_key, stage_id)
        values ('direct-stage', 'stage');
      `);
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

    await db.exec(`
      insert into public.figure_stages (figure_key, stage_id)
      values ('figure', 'stage');
    `);

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
    } finally {
      await db.exec("reset role");
    }
    await expectStoryStates(db, {
      candidate: "published",
      "next-review": "review",
    });

    await db.exec(`
      insert into public.figure_stages (figure_key, stage_id)
      values ('blocked', 'stage');
    `);
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

    await db.exec(`
      insert into public.figure_stages (figure_key, stage_id)
      values ('initial', 'stage');
    `);
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

      insert into public.figure_stages (figure_key, stage_id)
      values ('weak-identity', 'stage');

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

async function checkPostCutoverDriftDetection(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);

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

      insert into public.figure_stages (figure_key, stage_id)
      values ('duplicate', 'stage');
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
    `);
    await expectRejected(
      () => applyPublicationMigration(db),
      "unexpected active trigger",
      "closed health boundary",
    );
    await expectV2Absent(db, "active-trigger rollback");
  } finally {
    await db.close();
  }
}

async function checkOwnerAndOverloadBootstrapFailures(): Promise<void> {
  const hostileOwnerDb = await createBaseDatabase();
  try {
    await hostileOwnerDb.exec(`
      alter table public.story_specs owner to onward_adversary;
    `);
    await expectRejected(
      () => applyPublicationMigration(hostileOwnerDb),
      "hostile table-owner bootstrap",
      "canonical table owner",
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

async function createBaseDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon noinherit;
    create role authenticated noinherit;
    create role service_role noinherit bypassrls;
    create role authenticator noinherit;
    create role onward_adversary noinherit bypassrls;
    grant service_role to authenticator;

    create table public.figure_stages (
      figure_key text not null,
      stage_id text not null,
      status text not null default 'draft',
      constraint figure_stages_status_check
        check (status in ('draft', 'published')),
      primary key (figure_key, stage_id)
    );
  `);
  await expectBaseAuthorityGraph(db);
  await db.exec(storySpecsMigration);
  return db;
}

async function expectBaseAuthorityGraph(db: PGlite): Promise<void> {
  const result = await db.query<{
    owner_member_count: number;
    service_member_count: number;
    authenticator_member_count: number;
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
    graph.service_member_count !== 1 ||
    graph.authenticator_member_count !== 1 ||
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
        'public.figure_stages'::regclass
      )
  `);
  if (result.rows[0]?.locked_relations !== 2) {
    throw new Error(
      `publication cutover held ${String(
        result.rows[0]?.locked_relations,
      )}/2 required AccessExclusiveLock rows`,
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
