import "server-only";
import {
  EXTERNAL_PROVIDER_EXCHANGES,
  assertRetentionSink,
  type DerivedOutputSurface,
  type ExternalProviderExchangeId,
} from "./derived-output-retention";
import { DEFAULT_EMBEDDING_BASE_URL } from "./embedding-recipe-constants";
import { DEFAULT_LLM_BASE_URL } from "./llm-recipe-constants";

type ProviderExchangeDefinition = Readonly<{
  provider: "cerebras" | "gemini";
  requestSurfaces: readonly DerivedOutputSurface[];
  responseSurface: DerivedOutputSurface;
  endpointPathSuffix: string;
}>;

declare const externalProviderRequestBodyBrand: unique symbol;
export type ExternalProviderRequestBody = Readonly<{
  [externalProviderRequestBodyBrand]: true;
}>;

type StoredProviderRequestBody = Readonly<{
  exchangeId: ExternalProviderExchangeId;
  serialized: string;
}>;

const providerRequestBodies = new WeakMap<
  ExternalProviderRequestBody,
  StoredProviderRequestBody
>();

type CerebrasRequestInput = Readonly<{
  model: string;
  temperature: number;
  systemPrompt: string;
  userPrompt: string;
}>;

export function buildCerebrasRerankRequestBody(
  input: CerebrasRequestInput &
    Readonly<{
      reasoningEffort?: string;
      responseFormat: "json_object";
    }>,
): ExternalProviderRequestBody {
  return storeProviderRequestBody("cerebras.rerank", {
    model: input.model,
    temperature: input.temperature,
    response_format: { type: input.responseFormat },
    messages: chatMessages(input),
    ...(input.reasoningEffort
      ? { reasoning_effort: input.reasoningEffort }
      : {}),
  });
}

export function buildCerebrasOpeningCopyRequestBody(
  input: CerebrasRequestInput &
    Readonly<{ responseFormat?: "json_object" }>,
): ExternalProviderRequestBody {
  return storeProviderRequestBody("cerebras.opening_copy", {
    model: input.model,
    temperature: input.temperature,
    ...(input.responseFormat
      ? { response_format: { type: input.responseFormat } }
      : {}),
    messages: chatMessages(input),
  });
}

export function buildCerebrasFacetTaggerRequestBody(
  input: CerebrasRequestInput &
    Readonly<{
      reasoningEffort?: string;
      responseFormat: "json_object";
    }>,
): ExternalProviderRequestBody {
  return storeProviderRequestBody("cerebras.facet_tagger", {
    model: input.model,
    temperature: input.temperature,
    response_format: { type: input.responseFormat },
    messages: chatMessages(input),
    ...(input.reasoningEffort
      ? { reasoning_effort: input.reasoningEffort }
      : {}),
  });
}

export function buildCerebrasHybridPlanRequestBody(
  input: CerebrasRequestInput &
    Readonly<{ responseFormat: "json_object" }>,
): ExternalProviderRequestBody {
  return storeProviderRequestBody("cerebras.hybrid_plan", {
    model: input.model,
    temperature: input.temperature,
    response_format: { type: input.responseFormat },
    messages: chatMessages(input),
  });
}

export function buildGeminiQueryEmbeddingRequestBody(input: {
  model: string;
  text: string;
  outputDimensionality: number;
}): ExternalProviderRequestBody {
  return storeProviderRequestBody("gemini.query_embedding", {
    model: `models/${input.model}`,
    content: { parts: [{ text: input.text }] },
    taskType: "RETRIEVAL_QUERY",
    outputDimensionality: input.outputDimensionality,
  });
}

export function buildGeminiDocumentEmbeddingRequestBody(input: {
  model: string;
  texts: readonly string[];
  outputDimensionality: number;
}): ExternalProviderRequestBody {
  return storeProviderRequestBody("gemini.document_embedding", {
    requests: input.texts.map((text) => ({
      model: `models/${input.model}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: input.outputDimensionality,
    })),
  });
}

function chatMessages(input: CerebrasRequestInput): readonly unknown[] {
  return [
    { role: "system", content: input.systemPrompt },
    { role: "user", content: input.userPrompt },
  ];
}

function storeProviderRequestBody(
  exchangeId: ExternalProviderExchangeId,
  value: Readonly<Record<string, unknown>>,
): ExternalProviderRequestBody {
  const token = Object.freeze({}) as ExternalProviderRequestBody;
  providerRequestBodies.set(
    token,
    Object.freeze({ exchangeId, serialized: JSON.stringify(value) }),
  );
  return token;
}

// The only production egress for external AI-provider HTTP requests. A new
// exchange cannot call fetch until its request and response surfaces have both
// entered the closed retention registry. Transport failures are deliberately
// rethrown without the original error/cause because provider errors can carry
// request bodies.
export async function fetchExternalProvider(
  exchangeId: ExternalProviderExchangeId,
  path: string,
  init: Omit<RequestInit, "body"> &
    Readonly<{ body: ExternalProviderRequestBody }>,
): Promise<Response> {
  const exchange = (
    EXTERNAL_PROVIDER_EXCHANGES as Readonly<
      Record<string, ProviderExchangeDefinition | undefined>
    >
  )[exchangeId];
  if (!exchange) throw new Error("external provider exchange is not registered");

  for (const surface of exchange.requestSurfaces) {
    assertRetentionSink(surface, "external_provider");
  }
  assertRetentionSink(exchange.responseSurface, "request_memory");
  const storedBody = providerRequestBodies.get(init.body);
  if (!storedBody || storedBody.exchangeId !== exchangeId) {
    throw new ExternalProviderBoundaryError(exchangeId, "body");
  }
  const request = validateProviderRequest(exchangeId, exchange, path, {
    ...init,
    body: storedBody.serialized,
  });

  try {
    return await fetch(request.url, request.init);
  } catch {
    throw new ExternalProviderTransportError(exchangeId);
  }
}

function validateProviderRequest(
  exchangeId: ExternalProviderExchangeId,
  exchange: ProviderExchangeDefinition,
  path: string,
  init: RequestInit,
): Readonly<{ url: string; init: RequestInit }> {
  let url: URL;
  try {
    if (
      path.trim() !== path ||
      !path.startsWith("/") ||
      path.startsWith("//") ||
      path.includes("\\") ||
      path.includes("%") ||
      path.includes("?") ||
      path.includes("#") ||
      path.split("/").includes(".") ||
      path.split("/").includes("..")
    ) {
      throw new Error("invalid provider path");
    }
    url = new URL(
      `${providerBaseUrl(exchange.provider)}/${path.replace(/^\/+/, "")}`,
    );
  } catch {
    throw new ExternalProviderBoundaryError(exchangeId, "endpoint");
  }
  const localHttp =
    process.env.NODE_ENV !== "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  const productionOrigin =
    exchange.provider === "cerebras"
      ? new URL(DEFAULT_LLM_BASE_URL).origin
      : new URL(DEFAULT_EMBEDDING_BASE_URL).origin;
  const providerPathIsValid =
    url.pathname.endsWith(exchange.endpointPathSuffix) &&
    (exchange.provider !== "gemini" || url.pathname.includes("/models/"));
  if (
    (url.protocol !== "https:" && !(localHttp && url.protocol === "http:")) ||
    url.username !== "" ||
    url.password !== "" ||
    url.search !== "" ||
    url.hash !== "" ||
    (process.env.NODE_ENV === "production" &&
      url.origin !== productionOrigin) ||
    !providerPathIsValid
  ) {
    throw new ExternalProviderBoundaryError(exchangeId, "endpoint");
  }

  const headers = new Headers(init.headers);
  const allowedInitKeys = new Set(["body", "headers", "method", "signal"]);
  if (Object.keys(init).some((key) => !allowedInitKeys.has(key))) {
    throw new ExternalProviderBoundaryError(exchangeId, "options");
  }
  const contentType = headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (init.method?.toUpperCase() !== "POST") {
    throw new ExternalProviderBoundaryError(exchangeId, "method");
  }
  if (contentType !== "application/json") {
    throw new ExternalProviderBoundaryError(exchangeId, "content_type");
  }
  const expectedHeaderNames =
    exchange.provider === "cerebras"
      ? ["authorization", "content-type"]
      : ["content-type", "x-goog-api-key"];
  if (
    JSON.stringify([...headers.keys()].sort()) !==
      JSON.stringify(expectedHeaderNames) ||
    (exchange.provider === "cerebras" &&
      !headers.get("authorization")?.startsWith("Bearer ")) ||
    (exchange.provider === "gemini" &&
      !headers.get("x-goog-api-key")?.trim())
  ) {
    throw new ExternalProviderBoundaryError(exchangeId, "headers");
  }
  if (typeof init.body !== "string") {
    throw new ExternalProviderBoundaryError(exchangeId, "body");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(init.body) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("provider body is not an object");
    }
  } catch {
    throw new ExternalProviderBoundaryError(exchangeId, "body");
  }
  if (!validProviderBody(exchangeId, parsed, url)) {
    throw new ExternalProviderBoundaryError(exchangeId, "schema");
  }

  return Object.freeze({
    url: url.href,
    init: Object.freeze({
      ...init,
      method: "POST",
      headers,
      redirect: "error",
    }),
  });
}

function validProviderBody(
  exchangeId: ExternalProviderExchangeId,
  value: unknown,
  url: URL,
): boolean {
  switch (exchangeId) {
    case "cerebras.rerank":
      return validChatBody(value, {
        responseFormat: "required",
        optionalReasoningEffort: true,
      });
    case "cerebras.opening_copy":
      return validChatBody(value, {
        responseFormat: "optional",
        optionalReasoningEffort: false,
      });
    case "cerebras.facet_tagger":
      return validChatBody(value, {
        responseFormat: "required",
        optionalReasoningEffort: true,
      });
    case "cerebras.hybrid_plan":
      return validChatBody(value, {
        responseFormat: "required",
        optionalReasoningEffort: false,
      });
    case "gemini.query_embedding":
      return validGeminiQueryBody(value, url);
    case "gemini.document_embedding":
      return validGeminiDocumentBody(value, url);
  }
}

function validChatBody(
  value: unknown,
  options: Readonly<{
    responseFormat: "required" | "optional" | "forbidden";
    optionalReasoningEffort: boolean;
  }>,
): boolean {
  if (!isRecord(value)) return false;
  const hasReasoningEffort = "reasoning_effort" in value;
  const hasResponseFormat = "response_format" in value;
  const expectedKeys = [
    "messages",
    "model",
    "temperature",
    ...(hasResponseFormat ? ["response_format"] : []),
    ...(hasReasoningEffort ? ["reasoning_effort"] : []),
  ];
  if (
    !hasExactKeys(value, expectedKeys) ||
    typeof value.model !== "string" ||
    value.model.trim() === "" ||
    typeof value.temperature !== "number" ||
    !Number.isFinite(value.temperature) ||
    !Array.isArray(value.messages) ||
    value.messages.length !== 2 ||
    !validChatMessage(value.messages[0], "system") ||
    !validChatMessage(value.messages[1], "user") ||
    (options.responseFormat === "required" && !hasResponseFormat) ||
    (options.responseFormat === "forbidden" && hasResponseFormat) ||
    (hasReasoningEffort &&
      (!options.optionalReasoningEffort ||
        typeof value.reasoning_effort !== "string" ||
        value.reasoning_effort.trim() === ""))
  ) {
    return false;
  }
  return hasResponseFormat
    ? isRecord(value.response_format) &&
        hasExactKeys(value.response_format, ["type"]) &&
        value.response_format.type === "json_object"
    : true;
}

function validChatMessage(
  value: unknown,
  role: "system" | "user",
): boolean {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["content", "role"]) &&
    value.role === role &&
    typeof value.content === "string" &&
    value.content.trim() !== ""
  );
}

function validGeminiQueryBody(value: unknown, url: URL): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "content",
      "model",
      "outputDimensionality",
      "taskType",
    ])
  ) {
    return false;
  }
  return (
    value.model === geminiModelFromUrl(url) &&
    value.taskType === "RETRIEVAL_QUERY" &&
    validEmbeddingDimension(value.outputDimensionality) &&
    validGeminiContent(value.content)
  );
}

function validGeminiDocumentBody(value: unknown, url: URL): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["requests"]) ||
    !Array.isArray(value.requests) ||
    value.requests.length === 0 ||
    value.requests.length > 100
  ) {
    return false;
  }
  const model = geminiModelFromUrl(url);
  return value.requests.every(
    (request) =>
      isRecord(request) &&
      hasExactKeys(request, [
        "content",
        "model",
        "outputDimensionality",
        "taskType",
      ]) &&
      request.model === model &&
      request.taskType === "RETRIEVAL_DOCUMENT" &&
      validEmbeddingDimension(request.outputDimensionality) &&
      validGeminiContent(request.content),
  );
}

function validGeminiContent(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ["parts"]) ||
    !Array.isArray(value.parts) ||
    value.parts.length !== 1
  ) {
    return false;
  }
  const part = value.parts[0];
  return (
    isRecord(part) &&
    hasExactKeys(part, ["text"]) &&
    typeof part.text === "string" &&
    part.text.trim() !== ""
  );
}

function geminiModelFromUrl(url: URL): string | null {
  const match = url.pathname.match(
    /\/models\/([a-z0-9][a-z0-9._-]*):(embedContent|batchEmbedContents)$/,
  );
  return match ? `models/${match[1]}` : null;
}

function validEmbeddingDimension(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return (
    Object.keys(value).sort().join(",") === [...keys].sort().join(",")
  );
}

function providerBaseUrl(provider: ProviderExchangeDefinition["provider"]): string {
  const configured =
    provider === "cerebras"
      ? [
          process.env.LLM_BASE_URL,
          process.env.CEREBRAS_BASE_URL,
          process.env.GROQ_BASE_URL,
        ]
          .map((value) => value?.trim())
          .find((value): value is string => Boolean(value))
      : [process.env.EMBEDDING_BASE_URL, process.env.GEMINI_BASE_URL]
          .map((value) => value?.trim())
          .find((value): value is string => Boolean(value));
  const fallback =
    provider === "cerebras"
      ? DEFAULT_LLM_BASE_URL
      : DEFAULT_EMBEDDING_BASE_URL;
  return (configured ?? fallback).replace(/\/+$/, "") || fallback;
}

export type ExternalProviderBoundaryErrorClass =
  | "endpoint"
  | "method"
  | "content_type"
  | "headers"
  | "options"
  | "body"
  | "schema";

export class ExternalProviderBoundaryError extends Error {
  constructor(
    readonly exchangeId: ExternalProviderExchangeId,
    readonly errorClass: ExternalProviderBoundaryErrorClass,
  ) {
    super(`external provider request rejected: ${exchangeId}:${errorClass}`);
    this.name = "ExternalProviderBoundaryError";
  }
}

export class ExternalProviderTransportError extends Error {
  constructor(readonly exchangeId: ExternalProviderExchangeId) {
    super(`external provider transport failed: ${exchangeId}`);
    this.name = "ExternalProviderTransportError";
  }
}
