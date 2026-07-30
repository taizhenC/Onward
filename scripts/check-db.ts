import "./_smoke-bootstrap";
import { isDeepStrictEqual } from "node:util";
import { loadEnvLocal } from "./_load-env";
import { FIGURE_STAGES } from "../lib/figures-data";
import { _resetFigureCache, listAll } from "../lib/figures";
import { getSupabase } from "../lib/db";
import { handleIntake } from "../lib/intake";
import {
  createTelemetryFlowId,
} from "../lib/telemetry";
import { _sessionCount } from "../lib/session";
import type { FigureStageRow } from "../lib/types";
import {
  inspectPublishedStorySpecs,
  storySpecStageKey,
} from "../lib/story-spec-repository";
import {
  getStoryRecipeById,
  getStoryRecipePromotion,
  PRIMARY_STORY_RECIPE,
  ROLLBACK_STORY_RECIPE,
  SELECTABLE_STORY_RECIPE_IDS,
} from "../lib/story-recipe";

// Supabase-mode release check. Run after migrations, seeding, and publishing the launch
// subset, as a SEPARATE process so the
// load-once figure cache reflects current DB state. Pins PERSISTENCE=supabase so it exercises
// the real DB paths (figure serving + session store); LLM stays stub (the crisis probe returns
// before any match/LLM call, so no LLM provider key is needed).
process.env.PERSISTENCE = "supabase";
process.env.LLM_PROVIDER = "stub";

type Step = { name: string; ok: boolean; detail: string };

async function tableCount(table: string): Promise<number> {
  const { count, error } = await getSupabase()
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(`count(${table}) failed: ${error.message}`);
  return count ?? 0;
}

// Gate 1 — the library is seeded.
async function checkSeeded(): Promise<Step> {
  const name = "library seeded (figures + figure_stages)";
  try {
    const figures = await tableCount("figures");
    const stages = await tableCount("figure_stages");
    const expectedFigures = new Set(FIGURE_STAGES.map((s) => s.figureKey)).size;
    const ok = figures >= expectedFigures && stages >= FIGURE_STAGES.length;
    return {
      name,
      ok,
      detail: ok
        ? `figures=${figures}, figure_stages=${stages}`
        : `figures=${figures} (expected ≥${expectedFigures}), figure_stages=${stages} (expected ≥${FIGURE_STAGES.length}) — run \`npm run seed\``,
    };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

// Gate 2 — figures served from the DB are byte-identical to the authored library.
async function checkServingParity(): Promise<Step> {
  const name = "figures served from DB == authored library";
  try {
    _resetFigureCache(); // separate process from seed, but reset anyway so the cache can't lie.
    const dbStages = await listAll();
    const statusResult = await getSupabase()
      .from("figure_stages")
      .select("figure_key,stage_id")
      .eq("status", "published");
    if (statusResult.error) throw new Error(statusResult.error.message);
    const publishedKeys = new Set(
      (statusResult.data ?? []).map((row) =>
        storySpecStageKey(row.figure_key, row.stage_id),
      ),
    );
    const expectedStages = FIGURE_STAGES.filter((stage) =>
      publishedKeys.has(storySpecStageKey(stage.figureKey, stage.stageId)),
    );
    if (dbStages.length !== expectedStages.length) {
      return {
        name,
        ok: false,
        detail: `served ${dbStages.length} stage(s), expected ${expectedStages.length} published authored stage(s)`,
      };
    }
    const dbSorted = sortByKey(dbStages);
    const authoredSorted = sortByKey(expectedStages);
    for (let i = 0; i < authoredSorted.length; i += 1) {
      if (!isDeepStrictEqual(dbSorted[i], authoredSorted[i])) {
        return {
          name,
          ok: false,
          detail: `mismatch at ${authoredSorted[i].figureKey}/${authoredSorted[i].stageId} — check seed mapping / jsonb fidelity`,
        };
      }
    }
    return { name, ok: true, detail: `${dbStages.length} stage(s) deep-equal the const` };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

async function checkPublishedStorySpecs(): Promise<Step> {
  const name = "public stages have valid published StorySpecs";
  try {
    const inspection = await inspectPublishedStorySpecs();
    const keys = new Set(inspection.catalog.keys());
    const served = await listAll();
    const servedKeys = new Set(
      served.map((stage) => storySpecStageKey(stage.figureKey, stage.stageId)),
    );
    const disabled = [...keys].filter((key) => !servedKeys.has(key));
    const uncovered = [...servedKeys].filter((key) => !keys.has(key));
    const ok =
      inspection.rawPublishedRowCount > 0 &&
      inspection.quarantinedRowCount === 0 &&
      inspection.rawPublishedRowCount === inspection.catalog.size &&
      disabled.length === 0 &&
      uncovered.length === 0;
    return {
      name,
      ok,
      detail: ok
        ? `${keys.size} valid published StorySpec(s) eligible for matching`
        : inspection.rawPublishedRowCount === 0
          ? "no valid published StorySpecs; review and publish the launch subset"
          : inspection.quarantinedRowCount > 0
            ? `${inspection.quarantinedRowCount} published StorySpec row(s) failed the runtime integrity boundary`
            : inspection.rawPublishedRowCount !== inspection.catalog.size
              ? "raw published StorySpec rows do not match the valid catalog"
              : disabled.length > 0
                ? `${disabled.length} valid StorySpec stage(s) are disabled/missing`
                : `${uncovered.length} served stage(s) lack a valid published StorySpec`,
    };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

async function checkStorySpecPublicationSchema(): Promise<Step> {
  const name = "StorySpec publication compare-and-set schema installed";
  try {
    const health = await getSupabase().rpc(
      "story_spec_publication_schema_health_v1",
    );
    if (health.error) throw new Error(health.error.message);
    const row =
      Array.isArray(health.data) && health.data.length === 1
        ? health.data[0]
        : null;
    const expectedKeys = [
      "boundary_granted",
      "identity_constraint_valid",
      "legacy_rpc_revoked",
      "lifecycle_trigger_enabled",
      "ok",
      "promotion_cas_valid",
    ].sort();
    const healthOk =
      row !== null &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      Object.keys(row).sort().join(",") === expectedKeys.join(",") &&
      Object.values(row).every((value) => typeof value === "boolean") &&
      "ok" in row &&
      row.ok === true;
    if (!healthOk) {
      throw new Error("StorySpec publication schema health is unsafe");
    }
    return {
      name,
      ok: true,
      detail:
        "strict JSON identity, lifecycle trigger, snapshot-bound promotion, legacy revocation, and service-only grants are safe",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0023 before publishing`,
    };
  }
}

async function checkArtifactSchema(): Promise<Step> {
  const name = "StoryArtifact and retention schema installed";
  try {
    const artifacts = await tableCount("story_artifacts");
    const artifactLabels = await getSupabase()
      .from("story_artifacts")
      .select("retention_policy_version,retention_class")
      .limit(1);
    if (artifactLabels.error) throw new Error(artifactLabels.error.message);
    const sessions = await getSupabase()
      .from("sessions")
      .select(
        "story_artifact_id,retention_policy_version,story_retention_class,context_retention_class",
      )
      .limit(1);
    if (sessions.error) throw new Error(sessions.error.message);
    const health = await getSupabase().rpc(
      "derived_output_retention_schema_health_v1",
    );
    if (health.error) throw new Error(health.error.message);
    const row = Array.isArray(health.data) ? health.data[0] : null;
    const expectedKeys = [
      "boundary_granted",
      "columns_classified",
      "constraints_valid",
      "current_defaults",
      "helper_bodies_valid",
      "labels_valid",
      "ok",
      "trigger_enabled",
    ].sort();
    const healthOk =
      row !== null &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      Object.keys(row).sort().join(",") === expectedKeys.join(",") &&
      Object.values(row).every((value) => typeof value === "boolean") &&
      "ok" in row &&
      row.ok === true;
    if (!healthOk) {
      throw new Error("derived-output retention schema health is unsafe");
    }
    return {
      name,
      ok: true,
      detail: `story_artifacts reachable (${artifacts} row(s)); columns, current defaults, validated constraints, exact trigger helpers, labels, and grants are safe`,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} — apply migrations 0005 and 0021`,
    };
  }
}

async function checkOwnerStorySaveSchema(): Promise<Step> {
  const name = "durable account-level Owner Story Save schema installed";
  try {
    const health = await getSupabase().rpc(
      "owner_story_save_schema_health_v1",
    );
    if (health.error) throw new Error(health.error.message);
    const row =
      Array.isArray(health.data) && health.data.length === 1
        ? health.data[0]
        : null;
    const expectedKeys = [
      "constraints_valid",
      "coverage_valid",
      "grants_valid",
      "helper_bodies_valid",
      "ok",
      "rls_valid",
      "rows_valid",
      "table_shape_valid",
      "triggers_enabled",
    ].sort();
    const healthOk =
      row !== null &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      Object.keys(row).sort().join(",") === expectedKeys.join(",") &&
      Object.values(row).every((value) => typeof value === "boolean") &&
      "ok" in row &&
      row.ok === true;
    if (!healthOk) {
      throw new Error("owner-story Save schema health is unsafe");
    }
    return {
      name,
      ok: true,
      detail:
        "all 9 closed health flags prove table shape, constraints, Auth trigger, immutable helpers, grants, RLS, owner coverage, and row validity",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0022 before the Save-aware application`,
    };
  }
}

async function checkStoryRecipeRegistry(): Promise<Step> {
  const name = "immutable promoted story-recipe registry installed";
  try {
    const configured = process.env.ONWARD_PRODUCTION_RECIPE_ID?.trim();
    const active = configured
      ? getStoryRecipeById(configured)
      : PRIMARY_STORY_RECIPE;
    if (!active || !SELECTABLE_STORY_RECIPE_IDS.includes(active.recipeId)) {
      throw new Error("configured production recipe is not selectable");
    }
    const selectable = [...new Map(
      [PRIMARY_STORY_RECIPE, ROLLBACK_STORY_RECIPE].map((recipe) => [
        recipe.recipeId,
        recipe,
      ]),
    ).values()];
    for (const recipe of selectable) {
      const promotion = getStoryRecipePromotion(recipe.recipeId);
      if (!promotion) throw new Error(`${recipe.recipeId} is not promoted`);
      const result = await getSupabase()
        .from("story_recipe_registry")
        .select(
          "recipe_id,manifest_sha256,dataset_version,match_config_version,library_snapshot_sha256,retrieval_mode,llm_provider,rerank_model_id,prose_model_id,embedding_model_id,rerank_prompt_version,story_prompt_version,rerank_temperature,rerank_reasoning_effort,rerank_top_k,story_temperature,story_composer_mode,hybrid_story_composer_enabled,composer_version,validator_version,story_spec_schema_version,boundary_policy_version,resonance_brief_version,decision_id,promoted_at",
        )
        .eq("recipe_id", recipe.recipeId)
        .maybeSingle();
      if (result.error) throw new Error(result.error.message);
      const expected = {
        recipe_id: recipe.recipeId,
        manifest_sha256: recipe.manifestSha256,
        dataset_version: recipe.datasetVersion,
        match_config_version: recipe.matchConfigVersion,
        library_snapshot_sha256: recipe.librarySnapshotSha256,
        retrieval_mode: recipe.retrievalMode,
        llm_provider: recipe.llmProvider,
        rerank_model_id: recipe.rerankModelId,
        prose_model_id: recipe.proseModelId,
        embedding_model_id: recipe.embeddingModelId,
        rerank_prompt_version: recipe.rerankPromptVersion,
        story_prompt_version: recipe.storyPromptVersion,
        rerank_temperature: recipe.rerankTemperature,
        rerank_reasoning_effort: recipe.rerankReasoningEffort,
        rerank_top_k: recipe.rerankTopK,
        story_temperature: recipe.storyTemperature,
        story_composer_mode: recipe.storyComposerMode,
        hybrid_story_composer_enabled:
          recipe.hybridStoryComposerEnabled,
        composer_version: recipe.composerVersion,
        validator_version: recipe.validatorVersion,
        story_spec_schema_version: recipe.storySpecSchemaVersion,
        boundary_policy_version: recipe.boundaryPolicyVersion,
        resonance_brief_version: recipe.resonanceBriefVersion,
        decision_id: promotion.decisionId,
        promoted_at: promotion.promotedAt,
      };
      const actual = result.data
        ? {
            ...result.data,
            rerank_temperature: Number(result.data.rerank_temperature),
            rerank_top_k: Number(result.data.rerank_top_k),
            story_temperature: Number(result.data.story_temperature),
            promoted_at:
              typeof result.data.promoted_at === "string"
                ? new Date(result.data.promoted_at).toISOString()
                : result.data.promoted_at,
          }
        : null;
      if (!actual || !isDeepStrictEqual(actual, expected)) {
        throw new Error(`${recipe.recipeId} differs from the manifest`);
      }
    }
    return {
      name,
      ok: true,
      detail: `active ${active.recipeId}; ${selectable.length} selectable manifest(s) installed`,
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0020` };
  }
}

async function checkMatchRecoverySchema(): Promise<Step> {
  const name = "single-use match recovery schema installed";
  try {
    const flows = await tableCount("match_recovery_flows");
    const probe = await getSupabase().rpc("consume_match_recovery_flow", {
      p_token_hash: "0".repeat(64),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_input_hash: "0".repeat(64),
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === null;
    return {
      name,
      ok,
      detail: ok
        ? `table/RPC reachable (${flows} active or recently consumed row(s))`
        : "consume RPC accepted a nonexistent recovery flow",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} 鈥?apply migration 0006` };
  }
}

async function checkHistoricalConcernSchema(): Promise<Step> {
  const name = "privacy-safe historical concern queue installed";
  try {
    const reports = await tableCount("historical_concern_reports");
    const probe = await getSupabase().rpc("submit_historical_concern", {
      p_report_id: "0".repeat(32),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_session_id: "0".repeat(32),
      p_artifact_id: "0".repeat(32),
      p_fact_id: "fact-probe",
      p_reason: "incorrect_fact",
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === null;
    return {
      name,
      ok,
      detail: ok
        ? `queue/RPC reachable (${reports} bounded report row(s))`
        : "submission RPC accepted a nonexistent owned artifact",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} — apply migration 0007`,
    };
  }
}

async function checkStoryFeedbackSchema(): Promise<Step> {
  const name = "bounded story feedback schema installed";
  try {
    const feedback = await tableCount("story_feedback");
    const probe = await getSupabase().rpc("submit_story_feedback", {
      p_feedback_id: "0".repeat(32),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_session_id: "0".repeat(32),
      p_artifact_id: "0".repeat(32),
      p_policy_version: "resonance-feedback-v1-2026-07",
      p_verdict: "felt_close",
      p_reason: null,
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? `table/RPC reachable (${feedback} bounded row(s))`
        : "feedback RPC accepted a nonexistent owned story",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} — apply migration 0008`,
    };
  }
}

async function checkAlternateStorySchema(): Promise<Step> {
  const name = "one-use alternate story schema installed";
  try {
    const flows = await tableCount("alternate_story_flows");
    const sessions = await getSupabase()
      .from("sessions")
      .select(
        "story_request_context,disclosure_expires_at,alternate_of_session_id",
      )
      .limit(1);
    if (sessions.error) throw new Error(sessions.error.message);
    const probe = await getSupabase().rpc("issue_alternate_story_flow", {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_source_session_id: "0".repeat(32),
      p_source_artifact_id: "0".repeat(32),
      p_token_hash: "0".repeat(64),
      p_policy_version: "alternate-story-v1-2026-07",
      p_allow_create: false,
    });
    if (probe.error) throw new Error(probe.error.message);
    const data = probe.data as { status?: unknown } | null;
    const ok = data?.status === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? `context columns and flow RPC reachable (${flows} bounded row(s))`
        : "alternate issue RPC accepted a nonexistent owned story",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0009`,
    };
  }
}

async function checkOwnedStoryDeletionSchema(): Promise<Step> {
  const name = "owner-scoped story deletion boundary installed";
  try {
    const probe = await getSupabase().rpc("delete_owned_story_v1", {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_session_id: "0".repeat(32),
    });
    if (probe.error) throw new Error(probe.error.message);

    const directDelete = await getSupabase()
      .from("sessions")
      .delete()
      .eq("session_id", "0".repeat(32));
    const directDenied =
      directDelete.error !== null && directDelete.error.code === "42501";
    const ok = probe.data === false && directDenied;
    return {
      name,
      ok,
      detail: ok
        ? "nonexistent owner probe is closed; direct service-role delete is denied"
        : "RPC accepted a nonexistent target or direct session delete remains available",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0018`,
    };
  }
}

async function checkOwnedAccountDeletionSchema(): Promise<Step> {
  const name = "owner-confirmed account deletion boundary installed";
  try {
    const probe = await getSupabase().rpc("delete_owned_account_v1", {
      p_user_id: "00000000-0000-0000-0000-000000000000",
    });
    if (probe.error) throw new Error(probe.error.message);
    const rateProjection = await getSupabase()
      .from("rate_limits")
      .select("bucket_key,owner_user_id")
      .limit(1);
    if (rateProjection.error) throw new Error(rateProjection.error.message);
    const ok = probe.data === false;
    return {
      name,
      ok,
      detail: ok
        ? "nonexistent auth owner is closed; rate-limit ownership FK is reachable"
        : "account deletion accepted a nonexistent auth owner",
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0019`,
    };
  }
}

async function checkTelemetrySchema(): Promise<Step> {
  const name = "privacy-safe telemetry schemas installed";
  try {
    const productEvents = await tableCount("product_events");
    const generationAttempts = await tableCount("generation_attempts");
    const productProjection = await getSupabase()
      .from("product_events")
      .select(
        "event_id,schema_version,flow_id,event_name,latency_bucket,error_class,occurred_at,expires_at",
      )
      .limit(1);
    if (productProjection.error) throw new Error(productProjection.error.message);
    const attemptProjection = await getSupabase()
      .from("generation_attempts")
      .select(
        "attempt_id,schema_version,operation,recipe_id,provider,outcome,latency_bucket,cost_micros,occurred_at,expires_at",
      )
      .limit(1);
    if (attemptProjection.error) throw new Error(attemptProjection.error.message);
    return {
      name,
      ok: true,
      detail: `typed tables reachable (${productEvents} product event(s), ${generationAttempts} reduced attempt(s))`,
    };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: `${message(error)} - apply migration 0010`,
    };
  }
}

async function checkTelemetryLifecycleSchema(): Promise<Step> {
  const name = "transactional telemetry lifecycle RPCs installed";
  try {
    const userId = "00000000-0000-0000-0000-000000000000";
    const rootSessionId = "0".repeat(32);
    const flowId = createTelemetryFlowId();
    const registerValidation = await getSupabase().rpc(
      "register_telemetry_flow_v1",
      {
        p_flow_id: "invalid",
        p_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
      },
    );
    requireRpcValidationError("flow registration", registerValidation.error);
    const revokeValidation = await getSupabase().rpc(
      "revoke_telemetry_flow_v1",
      {
        p_flow_id: "invalid",
        p_user_id: userId,
      },
    );
    requireRpcValidationError("flow revocation", revokeValidation.error);
    const captureValidation = await getSupabase().rpc(
      "capture_product_event_v1",
      {
        p_event_id: "invalid",
        p_schema_version: "product-event-v1-2026-07",
        p_flow_id: null,
        p_event_name: "intake_started",
      },
    );
    requireRpcValidationError("typed event capture", captureValidation.error);
    const byRoot = await getSupabase().rpc("resolve_owned_telemetry_flow_v1", {
      p_user_id: userId,
      p_root_session_id: rootSessionId,
    });
    if (byRoot.error) throw new Error(byRoot.error.message);
    const byFlow = await getSupabase().rpc("resolve_owned_telemetry_root_v1", {
      p_user_id: userId,
      p_flow_id: flowId,
    });
    if (byFlow.error) throw new Error(byFlow.error.message);
    const claim = await getSupabase().rpc("claim_telemetry_flow_owner_v1", {
      p_flow_id: flowId,
      p_user_id: userId,
    });
    if (claim.error) throw new Error(claim.error.message);
    const v3 = await getSupabase().rpc("create_story_session_v3", {
      p_session_id: rootSessionId,
      p_user_id: userId,
      p_figure_key: "probe",
      p_stage_id: "probe",
      p_framing: "partial",
      p_age: 22,
      p_feeling: "non-mutating lifecycle probe",
      p_story_request_context: {},
      p_match_recipe: {},
      p_artifact: {},
      p_telemetry_flow_id: flowId,
    });
    if (v3.error) throw new Error(v3.error.message);
    const v3Data = v3.data as { status?: unknown } | null;
    const ok =
      byRoot.data === null &&
      byFlow.data === null &&
      claim.data === "not_found" &&
      v3Data?.status === "flow_not_found";
    return {
      name,
      ok,
      detail: ok
        ? "all lifecycle/capture signatures and service-role grants are reachable without writes"
        : "a nonexistent lifecycle probe returned an unsafe disposition",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0011` };
  }
}

async function checkTelemetryRollupDispatcherSchema(): Promise<Step> {
  const name = "first-party telemetry rollup dispatcher installed";
  try {
    const invalidDispatch = await getSupabase().rpc(
      "dispatch_product_event_rollups_v1",
      { p_limit: 0 },
    );
    requireRpcValidationError(
      "telemetry rollup dispatcher",
      invalidDispatch.error,
    );

    const health = await getSupabase().rpc("telemetry_outbox_health_v1");
    if (health.error) throw new Error(health.error.message);
    const row = Array.isArray(health.data) ? health.data[0] : null;
    const healthShapeOk =
      row !== null &&
      typeof row === "object" &&
      !Array.isArray(row) &&
      Object.keys(row).sort().join(",") ===
        [
          "delivered_count",
          "dispatch_enabled",
          "actionable_count",
          "exhausted_count",
          "leased_count",
          "oldest_actionable_age_bucket",
          "pending_count",
        ]
          .sort()
          .join(",");
    const schemaHealth = await getSupabase().rpc(
      "telemetry_rollup_schema_health_v1",
    );
    if (schemaHealth.error) throw new Error(schemaHealth.error.message);
    const schemaRow = Array.isArray(schemaHealth.data)
      ? schemaHealth.data[0]
      : null;
    const expectedSchemaKeys = [
      "boundaries_granted",
      "cron_jobs_active",
      "dispatch_enabled",
      "helpers_private",
      "ok",
      "raw_paths_revoked",
      "tables_forced_rls",
    ].sort();
    const schemaOk =
      schemaRow !== null &&
      typeof schemaRow === "object" &&
      !Array.isArray(schemaRow) &&
      "ok" in schemaRow &&
      Object.keys(schemaRow).sort().join(",") === expectedSchemaKeys.join(",") &&
      Object.values(schemaRow).every((value) => typeof value === "boolean") &&
      schemaRow.ok === true;
    const ok = healthShapeOk && schemaOk;
    return {
      name,
      ok,
      detail: ok
        ? "count-only dispatch, closed queue health, private helpers, grants, RLS, and cron definitions are reachable"
        : "dispatcher schema health or queue-health shape is unsafe",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0017` };
  }
}

async function checkMatchTelemetryProducerSchema(): Promise<Step> {
  const name = "transactional match telemetry producer RPCs installed";
  try {
    const userId = "00000000-0000-0000-0000-000000000000";
    const invalidEventId = "invalid";
    const schemaVersion = "product-event-v1-2026-07";
    const limiter = await getSupabase().rpc("consume_match_rate_limit_v2", {
      p_user_key: `u:${userId}`,
      p_ip_key: `ip:${"0".repeat(64)}`,
      p_user_hour_max: 5,
      p_user_day_max: 30,
      p_ip_hour_max: 15,
      p_ip_day_max: 60,
      p_event_id: invalidEventId,
      p_schema_version: schemaVersion,
    });
    requireRpcValidationError("match limiter telemetry", limiter.error);

    const recovery = await getSupabase().rpc(
      "issue_match_recovery_flow_v2",
      {
        p_token_hash: "0".repeat(64),
        p_user_id: userId,
        p_input_hash: "0".repeat(64),
        p_purpose: "clarification",
        p_expires_at: new Date(Date.now() + 60_000).toISOString(),
        p_telemetry_flow_id: "invalid",
        p_match_event_id: invalidEventId,
        p_clarification_event_id: invalidEventId,
        p_schema_version: schemaVersion,
        p_recipe_id: "probe",
        p_confidence_bucket: "low",
        p_match_path: "not_run",
        p_age_fallback: false,
        p_boundary_outcome: "not_set",
      },
    );
    requireRpcValidationError("match recovery telemetry", recovery.error);

    const session = await getSupabase().rpc("create_story_session_v4", {
      p_session_id: "0".repeat(32),
      p_user_id: userId,
      p_figure_key: "probe",
      p_stage_id: "probe",
      p_framing: "partial",
      p_age: 22,
      p_feeling: "non-mutating producer probe",
      p_story_request_context: {},
      p_match_recipe: {},
      p_artifact: {},
      p_telemetry_flow_id: "invalid",
      p_artifact_event_id: invalidEventId,
      p_telemetry_schema_version: schemaVersion,
    });
    requireRpcValidationError("initial artifact telemetry", session.error);

    return {
      name,
      ok: true,
      detail: "rate-limit, recovery, and artifact producer signatures reject before any write",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0012` };
  }
}

async function checkStoryProgressTelemetrySchema(): Promise<Step> {
  const name = "transactional story progress telemetry RPC installed";
  try {
    const probe = await getSupabase().rpc(
      "acknowledge_story_position_v1",
      {
        p_session_id: "0".repeat(32),
        p_user_id: "00000000-0000-0000-0000-000000000000",
        p_expected_beat_index: 0,
        p_expected_chunk_index: 0,
        p_next_beat_index: 0,
        p_next_chunk_index: 1,
        p_telemetry_flow_id: null,
        p_passage_event_id: null,
        p_completion_event_id: null,
        p_schema_version: null,
        p_story_role: null,
        p_passage_ordinal: null,
      },
    );
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? "owner-first acknowledgement signature is reachable without writes"
        : "a nonexistent progress probe returned an unsafe disposition",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0013` };
  }
}

async function checkStoryFeedbackTelemetrySchema(): Promise<Step> {
  const name = "transactional story feedback telemetry RPC installed";
  try {
    const probe = await getSupabase().rpc("submit_story_feedback_v2", {
      p_feedback_id: "0".repeat(32),
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_session_id: "0".repeat(32),
      p_artifact_id: "0".repeat(32),
      p_policy_version: "resonance-feedback-v1-2026-07",
      p_verdict: "felt_close",
      p_reason: null,
      p_telemetry_flow_id: null,
      p_feedback_event_id: null,
      p_telemetry_schema_version: null,
      p_story_role: null,
      p_feedback_verdict: null,
    });
    if (probe.error) throw new Error(probe.error.message);
    const ok = probe.data === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? "owner-first feedback signature is reachable without writes"
        : "a nonexistent feedback probe returned an unsafe disposition",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0014` };
  }
}

async function checkAlternateRequestTelemetrySchema(): Promise<Step> {
  const name = "transactional alternate-request telemetry RPC installed";
  try {
    const probe = await getSupabase().rpc("claim_alternate_story_flow_v2", {
      p_user_id: "00000000-0000-0000-0000-000000000000",
      p_source_session_id: "0".repeat(32),
      p_source_artifact_id: "0".repeat(32),
      p_token_hash: "0".repeat(64),
      p_policy_version: "alternate-story-v1-2026-07",
      p_lease_id: "0".repeat(32),
      p_telemetry_flow_id: null,
      p_alternate_requested_event_id: null,
      p_telemetry_schema_version: null,
    });
    if (probe.error) throw new Error(probe.error.message);
    const data = probe.data as { status?: unknown } | null;
    const ok = data?.status === "not_found";
    return {
      name,
      ok,
      detail: ok
        ? "claim-first alternate telemetry signature is reachable without writes"
        : "a nonexistent alternate claim probe returned an unsafe disposition",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0015` };
  }
}

async function checkAlternateResolutionTelemetrySchema(): Promise<Step> {
  const name = "transactional alternate-resolution telemetry RPCs installed";
  try {
    const userId = "00000000-0000-0000-0000-000000000000";
    const sourceSessionId = "0".repeat(32);
    const sourceArtifactId = "0".repeat(32);
    const leaseId = "0".repeat(32);

    const claim = await getSupabase().rpc("claim_alternate_story_flow_v3", {
      p_user_id: userId,
      p_source_session_id: sourceSessionId,
      p_source_artifact_id: sourceArtifactId,
      p_token_hash: "0".repeat(64),
      p_policy_version: "alternate-story-v1-2026-07",
      p_lease_id: leaseId,
      p_telemetry_flow_id: null,
      p_alternate_requested_event_id: null,
      p_alternate_resolved_event_id: null,
      p_telemetry_schema_version: null,
    });
    if (claim.error) throw new Error(claim.error.message);

    const release = await getSupabase().rpc(
      "release_alternate_story_claim_v2",
      {
        p_user_id: userId,
        p_source_session_id: sourceSessionId,
        p_lease_id: leaseId,
        p_telemetry_flow_id: null,
        p_alternate_resolved_event_id: null,
        p_telemetry_schema_version: null,
      },
    );
    if (release.error) throw new Error(release.error.message);

    const unavailable = await getSupabase().rpc(
      "complete_alternate_story_unavailable_v2",
      {
        p_user_id: userId,
        p_source_session_id: sourceSessionId,
        p_lease_id: leaseId,
        p_telemetry_flow_id: null,
        p_alternate_resolved_event_id: null,
        p_telemetry_schema_version: null,
      },
    );
    if (unavailable.error) throw new Error(unavailable.error.message);

    const expired = await getSupabase().rpc(
      "complete_alternate_story_expired_v1",
      {
        p_user_id: userId,
        p_source_session_id: sourceSessionId,
        p_lease_id: leaseId,
        p_telemetry_flow_id: null,
        p_alternate_resolved_event_id: null,
        p_telemetry_schema_version: null,
      },
    );
    if (expired.error) throw new Error(expired.error.message);

    const ready = await getSupabase().rpc(
      "complete_alternate_story_session_v2",
      {
        p_user_id: userId,
        p_source_session_id: sourceSessionId,
        p_lease_id: leaseId,
        p_session_id: sourceSessionId,
        p_artifact: {},
        p_telemetry_flow_id: null,
        p_artifact_event_id: null,
        p_alternate_resolved_event_id: null,
        p_telemetry_schema_version: null,
      },
    );
    if (ready.error) throw new Error(ready.error.message);

    const claimData = claim.data as { status?: unknown } | null;
    const readyData = ready.data as { status?: unknown } | null;
    const ok =
      claimData?.status === "not_found" &&
      release.data === false &&
      unavailable.data === false &&
      expired.data === false &&
      readyData?.status === "rejected";
    return {
      name,
      ok,
      detail: ok
        ? "claim/release/unavailable/expired/ready signatures are reachable without writes"
        : "a nonexistent alternate terminal probe returned an unsafe disposition",
    };
  } catch (error) {
    return { name, ok: false, detail: `${message(error)} - apply migration 0016` };
  }
}

function requireRpcValidationError(
  label: string,
  error: { code?: string; message: string } | null,
): void {
  if (error?.code === "P0001") return;
  throw new Error(
    `${label} RPC signature/grant probe failed: ${error?.message ?? "expected a validation error"}`,
  );
}

// Gate 3 — a crisis intake writes no session row (handleIntake returns before createSession).
// The fixed ctx is safe in supabase mode: crisis short-circuits before the rate limiter and
// the store, so this non-uuid user id never reaches Postgres.
async function checkCrisisPersistsNothing(): Promise<Step> {
  const name = "crisis persists nothing";
  try {
    const before = await _sessionCount();
    const result = await handleIntake(
      {
        age: 22,
        feeling: "I want to kill myself",
      },
      {
        userId: "check-db",
        ipHash: "check-db",
        telemetryFlowId: createTelemetryFlowId(),
      },
    );
    const after = await _sessionCount();

    const isCrisis = "crisis" in result && result.crisis === true;
    const ok = isCrisis && after === before;
    return {
      name,
      ok,
      detail: ok
        ? `crisis response, sessions unchanged (${after})`
        : `isCrisis=${isCrisis}, sessions ${before}→${after} (must be equal)`,
    };
  } catch (error) {
    return { name, ok: false, detail: message(error) };
  }
}

function sortByKey(stages: FigureStageRow[]): FigureStageRow[] {
  return [...stages].sort((a, b) =>
    `${a.figureKey}:${a.stageId}`.localeCompare(`${b.figureKey}:${b.stageId}`),
  );
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  console.log("Onward Supabase check (PERSISTENCE=supabase)");
  console.log("============================================");
  console.log("");

  const env = loadEnvLocal();
  console.log(
    env.found
      ? `Loaded ${env.loaded} var(s) from .env.local`
      : "No .env.local found; using shell environment",
  );

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log("");
    console.log("FAIL  Supabase env missing (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).");
    process.exit(1);
  }
  if (
    !process.env.TELEMETRY_ID_SECRET ||
    Buffer.byteLength(process.env.TELEMETRY_ID_SECRET.trim(), "utf8") < 32
  ) {
    console.log("");
    console.log("FAIL  TELEMETRY_ID_SECRET must be a dedicated secret of at least 32 bytes.");
    process.exit(1);
  }

  const steps = [
    await checkSeeded(),
    await checkServingParity(),
    await checkPublishedStorySpecs(),
    await checkStorySpecPublicationSchema(),
    await checkArtifactSchema(),
    await checkOwnerStorySaveSchema(),
    await checkStoryRecipeRegistry(),
    await checkMatchRecoverySchema(),
    await checkHistoricalConcernSchema(),
    await checkStoryFeedbackSchema(),
    await checkAlternateStorySchema(),
    await checkOwnedStoryDeletionSchema(),
    await checkOwnedAccountDeletionSchema(),
    await checkTelemetrySchema(),
    await checkTelemetryLifecycleSchema(),
    await checkTelemetryRollupDispatcherSchema(),
    await checkMatchTelemetryProducerSchema(),
    await checkStoryProgressTelemetrySchema(),
    await checkStoryFeedbackTelemetrySchema(),
    await checkAlternateRequestTelemetrySchema(),
    await checkAlternateResolutionTelemetrySchema(),
    await checkCrisisPersistsNothing(),
  ];

  console.log("");
  let failed = 0;
  steps.forEach((step, index) => {
    const tag = step.ok ? "OK  " : "FAIL";
    console.log(`[${index + 1}/${steps.length}] ${tag}  ${step.name}`);
    console.log(`         ${step.detail}`);
    if (!step.ok) failed += 1;
  });

  console.log("");
  if (failed === 0) {
    console.log("Supabase foundation healthy. Sessions persist; figures served from DB.");
    process.exit(0);
  }
  console.log(`${failed} check(s) failed. Fix the above before relying on PERSISTENCE=supabase.`);
  process.exit(1);
}

main().catch((error) => {
  console.error(message(error));
  process.exit(1);
});
