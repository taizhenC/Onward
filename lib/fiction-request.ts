// Public, pure recognition. A named entertainment request is not an inferred
// emotional match. Keep this closed list in sync with the server's release.
export const NIUDA_FICTION_ID = "niuda-v1";
export const NIUDA_FICTION_HREF = "/fiction/niuda-v1";

const NIUDA_REQUESTS = new Set([
  "牛大", "牛大boy", "/牛大", "我想看牛大", "我要看牛大", "讲个牛大的故事", "讲一个牛大的故事",
  "我想看牛大的故事", "我要看牛大的故事", "给我讲牛大的故事",
  "给我讲个牛大的故事", "请讲牛大的故事", "show me 牛大",
]);

export function isNiudaFictionRequest(value: string): boolean {
  // Only outer whitespace and ordinary sentence-final punctuation are inert.
  // Do not strip quotes, inner characters, zero-width text, or arbitrary words.
  const request = value.normalize("NFC").trim().replace(/[。.!！?？]+$/u, "").toLowerCase();
  return NIUDA_REQUESTS.has(request);
}

export type FictionSpecialResponse = Readonly<{
  fictionSpecial: typeof NIUDA_FICTION_ID;
}>;

export function fictionRequestFailureMessage(priorStoryUncertainty: boolean): string {
  return "暂时没能打开牛大。这是固定的公开虚构短篇，不会保存到 Your stories。输入仍留在本页，可以稍后重试。"
    + (priorStoryUncertainty ? " 如果你之前还提交过历史故事请求且未收到结果，请先查看 Your stories，避免重复提交那次请求。" : "");
}

export function fictionSpecialHref(value: unknown): string | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && record.fictionSpecial === NIUDA_FICTION_ID
    ? NIUDA_FICTION_HREF : null;
}
