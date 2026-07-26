import "server-only";
import {
  EXTERNAL_PROVIDER_EXCHANGES,
  assertRetentionSink,
  type DerivedOutputSurface,
  type ExternalProviderExchangeId,
} from "./derived-output-retention";

type ProviderExchangeDefinition = Readonly<{
  requestSurface: DerivedOutputSurface;
  responseSurface: DerivedOutputSurface;
}>;

// The only production egress for external AI-provider HTTP requests. A new
// exchange cannot call fetch until its request and response surfaces have both
// entered the closed retention registry. Transport failures are deliberately
// rethrown without the original error/cause because provider errors can carry
// request bodies.
export async function fetchExternalProvider(
  exchangeId: ExternalProviderExchangeId,
  input: string | URL,
  init: RequestInit,
): Promise<Response> {
  const exchange = (
    EXTERNAL_PROVIDER_EXCHANGES as Readonly<
      Record<string, ProviderExchangeDefinition | undefined>
    >
  )[exchangeId];
  if (!exchange) throw new Error("external provider exchange is not registered");

  assertRetentionSink(exchange.requestSurface, "external_provider");
  assertRetentionSink(exchange.responseSurface, "request_memory");

  try {
    return await fetch(input, init);
  } catch {
    throw new ExternalProviderTransportError(exchangeId);
  }
}

export class ExternalProviderTransportError extends Error {
  constructor(readonly exchangeId: ExternalProviderExchangeId) {
    super(`external provider transport failed: ${exchangeId}`);
    this.name = "ExternalProviderTransportError";
  }
}
