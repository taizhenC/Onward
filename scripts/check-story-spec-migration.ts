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
  await checkCanonicalCutoverAndDriftDetection();
  await checkHostileAclCutover();
  await checkUnexpectedTriggerFailsCutover();

  console.log("Onward StorySpec migration");
  console.log("==========================");
  console.log("PASS migration 0023 executes and reports closed schema health");
  console.log("PASS strict identity plus trigger, index, and ACL drift are detected");
  console.log("PASS hostile table, column, and function ACLs are removed");
  console.log("PASS an unexpected active trigger aborts the atomic cutover");
}

async function checkCanonicalCutoverAndDriftDetection(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await applyPublicationMigration(db);
    await expectHealth(db, {
      ok: true,
      identity_constraint_valid: true,
      lifecycle_trigger_enabled: true,
      published_stage_uniqueness_valid: true,
      promotion_cas_valid: true,
      legacy_rpc_revoked: true,
      boundary_granted: true,
    });

    await db.exec(`
      insert into public.figure_stages (figure_key, stage_id)
      values ('figure', 'stage');

      insert into public.story_specs (
        story_spec_id,
        figure_key,
        stage_id,
        version,
        schema_version,
        status,
        spec
      ) values (
        'spec',
        'figure',
        'stage',
        1,
        'v1',
        'draft',
        '{
          "storySpecId": "spec",
          "figureKey": "figure",
          "stageId": "stage",
          "version": 1,
          "schemaVersion": "v1",
          "status": "draft"
        }'::jsonb
      );
    `);
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
          2,
          'v1',
          'draft',
          '{
            "figureKey": "figure",
            "stageId": "stage",
            "version": 2,
            "schemaVersion": "v1",
            "status": "draft"
          }'::jsonb
        );
      `),
      "missing JSON identity",
    );

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
      grant update(status) on public.story_specs to authenticated;
    `);
    await expectHealth(db, {
      ok: false,
      boundary_granted: false,
    });

    await db.exec(`
      revoke update(status) on public.story_specs from authenticated;
      drop index public.story_specs_one_published_stage_idx;
      create unique index story_specs_one_published_stage_idx
        on public.story_specs (figure_key, stage_id)
        where status = 'published';
    `);
    await expectHealth(db, {
      ok: false,
      published_stage_uniqueness_valid: false,
    });
  } finally {
    await db.close();
  }
}

async function checkHostileAclCutover(): Promise<void> {
  const db = await createBaseDatabase();
  try {
    await db.exec(`
      create function public.promote_story_spec_v2(text, jsonb)
      returns void
      language sql
      as $$
        select
      $$;

      create function public.story_spec_publication_schema_health_v1()
      returns table (
        ok boolean,
        identity_constraint_valid boolean,
        lifecycle_trigger_enabled boolean,
        published_stage_uniqueness_valid boolean,
        promotion_cas_valid boolean,
        legacy_rpc_revoked boolean,
        boundary_granted boolean
      )
      language sql
      as $$
        select false, false, false, false, false, false, false
      $$;

      grant execute on function public.promote_story_spec(text)
        to onward_adversary;
      grant execute on function public.promote_story_spec_v2(text, jsonb)
        to onward_adversary;
      grant execute
        on function public.story_spec_publication_schema_health_v1()
        to onward_adversary;
      grant delete, truncate on public.story_specs to onward_adversary;
      grant update(status) on public.story_specs to onward_adversary;
      grant select(story_spec_id) on public.story_specs to public;
    `);

    await applyPublicationMigration(db);
    await expectHealth(db, { ok: true });

    const leaked = await db.query<{
      legacy_exec: boolean;
      v2_exec: boolean;
      health_exec: boolean;
      table_delete: boolean;
      table_truncate: boolean;
      column_update: boolean;
      public_column_select: boolean;
    }>(`
      select
        pg_catalog.has_function_privilege(
          'onward_adversary',
          'public.promote_story_spec(text)',
          'EXECUTE'
        ) as legacy_exec,
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
        ) as public_column_select
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
    const rollback = await db.query<{ v2_absent: boolean }>(`
      select pg_catalog.to_regprocedure(
        'public.promote_story_spec_v2(text,jsonb)'
      ) is null as v2_absent
    `);
    if (rollback.rows[0]?.v2_absent !== true) {
      throw new Error("failed publication cutover left its v2 RPC installed");
    }
  } finally {
    await db.close();
  }
}

async function createBaseDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(`
    create role anon noinherit;
    create role authenticated noinherit;
    create role service_role noinherit bypassrls;
    create role onward_adversary noinherit bypassrls;

    create table public.figure_stages (
      figure_key text not null,
      stage_id text not null,
      status text not null default 'draft',
      primary key (figure_key, stage_id)
    );
  `);
  await db.exec(storySpecsMigration);
  return db;
}

async function applyPublicationMigration(db: PGlite): Promise<void> {
  await db.exec("begin");
  try {
    await db.exec(publicationMigration);
    await db.exec("commit");
  } catch (error) {
    await db.exec("rollback");
    throw error;
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
