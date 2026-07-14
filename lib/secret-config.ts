const MIN_SECRET_BYTES = 32;

export function readStrongSecret(
  names: readonly string[],
): string | null {
  for (const name of names) {
    const raw = process.env[name];
    if (raw === undefined || raw === "") continue;
    const value = raw.trim();
    if (
      value.length === 0 ||
      Buffer.byteLength(value, "utf8") < MIN_SECRET_BYTES
    ) {
      throw new Error(
        `${name} must contain at least ${MIN_SECRET_BYTES} bytes; generate a random value with: openssl rand -hex 32`,
      );
    }
    return value;
  }
  return null;
}
