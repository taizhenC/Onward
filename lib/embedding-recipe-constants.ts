// Effective Gemini query configuration that a promoted FacetsRAG recipe may
// use in production. Seeding can deliberately override retry posture, but the
// online matcher is pinned so an endpoint/timeout drift cannot silently change
// retrieval or force a fallback under an approved recipe ID.
export const DEFAULT_EMBEDDING_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
export const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";
export const DEFAULT_EMBEDDING_DIM = 1536;
export const DEFAULT_EMBEDDING_TIMEOUT_MS = 20000;
export const DEFAULT_EMBEDDING_MAX_RETRIES = 3;
export const DEFAULT_EMBEDDING_RETRY_BASE_MS = 3000;
