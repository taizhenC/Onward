import "./_smoke-bootstrap";
import assert from "node:assert/strict";
import {
  BASE_WEIGHTS,
  blendLaneWeights,
  boundedNormalizeWeights,
  FACET_DYNAMIC_LAMBDA_MAX,
  WEIGHT_BOUNDS,
  type VectorLane,
} from "../lib/match-config";
import { FACET_TYPES, type FacetType } from "../lib/types";

// Invariant tests for the (inert) bounded-dynamic lane weighting. The helpers have no runtime
// caller while the installed tagger identity keeps weightingMode="static"; these checks are the
// evidence that flipping the mode later starts from a correct weighter, and the tripwire that
// keeps refactors honest in the meantime.

const LANES = Object.keys(BASE_WEIGHTS) as VectorLane[];
const EPSILON = 1e-9;

function sumOf(weights: Record<VectorLane, number>): number {
  return LANES.reduce((total, lane) => total + weights[lane], 0);
}

function assertWithinBounds(
  weights: Record<VectorLane, number>,
  label: string,
): void {
  for (const lane of LANES) {
    assert(
      weights[lane] >= WEIGHT_BOUNDS[lane].min - EPSILON &&
        weights[lane] <= WEIGHT_BOUNDS[lane].max + EPSILON,
      `${label}: ${lane}=${weights[lane]} escapes [${WEIGHT_BOUNDS[lane].min}, ${WEIGHT_BOUNDS[lane].max}]`,
    );
  }
}

function importance(
  values: Partial<Record<FacetType, number>>,
): Record<FacetType, number> {
  const record = {} as Record<FacetType, number>;
  for (const facet of FACET_TYPES) record[facet] = values[facet] ?? 0;
  return record;
}

function main(): void {
  // Feasibility of the shipped bounds — the precondition every guarantee below rests on.
  const minSum = LANES.reduce((total, lane) => total + WEIGHT_BOUNDS[lane].min, 0);
  const maxSum = LANES.reduce((total, lane) => total + WEIGHT_BOUNDS[lane].max, 0);
  assert(minSum <= 1 + EPSILON && maxSum >= 1 - EPSILON, "WEIGHT_BOUNDS are infeasible");

  // BASE_WEIGHTS is a fixed point: already within bounds and summing to 1.
  const identity = boundedNormalizeWeights(BASE_WEIGHTS);
  assert.deepEqual(identity, BASE_WEIGHTS, "BASE_WEIGHTS is not a normalization fixed point");

  // Any raw input lands inside bounds with sum exactly 1 (feasible bounds).
  const rawInputs: Array<Record<VectorLane, number>> = [
    { shape: 0, emotional_core: 0, decision_shape: 0, trigger_event: 0, agency_state: 0 },
    { shape: 10, emotional_core: 10, decision_shape: 10, trigger_event: 10, agency_state: 10 },
    { shape: 0.9, emotional_core: 0.02, decision_shape: 0.02, trigger_event: 0.03, agency_state: 0.03 },
    { shape: 0.31, emotional_core: 0.16, decision_shape: 0.24, trigger_event: 0.19, agency_state: 0.14 },
  ];
  for (const raw of rawInputs) {
    const normalized = boundedNormalizeWeights(raw);
    assertWithinBounds(normalized, `normalize(${JSON.stringify(raw)})`);
    assert(
      Math.abs(sumOf(normalized) - 1) < EPSILON,
      `normalize(${JSON.stringify(raw)}) sums to ${sumOf(normalized)}`,
    );
  }

  // Determinism: identical inputs produce identical outputs.
  const skewed = importance({ decision_shape: 0.9, emotional_core: 0.6 });
  assert.deepEqual(
    blendLaneWeights(skewed),
    blendLaneWeights(skewed),
    "blendLaneWeights is not deterministic",
  );

  // λ=0 and uniform importance both reduce to BASE_WEIGHTS exactly — the passive default.
  assert.deepEqual(blendLaneWeights(skewed, 0), BASE_WEIGHTS, "λ=0 tilted the weights");
  assert.deepEqual(
    blendLaneWeights(importance({ emotional_core: 0.5, decision_shape: 0.5, trigger_event: 0.5, agency_state: 0.5 })),
    BASE_WEIGHTS,
    "uniform importance tilted the weights",
  );

  // A skewed importance moves the emphasized lane up, stays bounded, sums to 1, and the tilt on
  // any facet lane never exceeds λ (before normalization redistributes residue).
  const blended = blendLaneWeights(skewed);
  assertWithinBounds(blended, "blended");
  assert(Math.abs(sumOf(blended) - 1) < EPSILON, "blended weights do not sum to 1");
  assert(
    blended.decision_shape > BASE_WEIGHTS.decision_shape,
    "emphasized lane did not gain weight",
  );
  assert(
    blended.agency_state < BASE_WEIGHTS.agency_state,
    "de-emphasized lane did not lose weight",
  );
  for (const facet of FACET_TYPES) {
    assert(
      Math.abs(blended[facet] - BASE_WEIGHTS[facet]) <=
        FACET_DYNAMIC_LAMBDA_MAX + EPSILON,
      `${facet} moved more than λ from its base weight`,
    );
  }

  // Extreme importance still cannot push a lane past its bound (λ bounds the tilt, the
  // projection bounds the result).
  const extreme = blendLaneWeights(importance({ trigger_event: 1 }));
  assertWithinBounds(extreme, "extreme importance");
  assert(Math.abs(sumOf(extreme) - 1) < EPSILON, "extreme blend does not sum to 1");

  console.log("Onward facet-weighting invariants");
  console.log("=================================");
  console.log("PASS bounds are feasible and BASE_WEIGHTS is a fixed point");
  console.log("PASS normalization lands in-bounds with sum exactly 1 for arbitrary input");
  console.log("PASS blending is deterministic, passive at λ=0/uniform, and λ-bounded per lane");
}

main();
