export const INTAKE_MIN_AGE = 13;
export const INTAKE_MAX_AGE = 100;
export const INTAKE_MIN_FEELING_LENGTH = 10;
export const INTAKE_MAX_FEELING_LENGTH = 1000;

export function isValidIntakeAge(age: number): boolean {
  return (
    Number.isFinite(age) &&
    Number.isInteger(age) &&
    age >= INTAKE_MIN_AGE &&
    age <= INTAKE_MAX_AGE
  );
}

export function normalizeIntakeFeeling(feeling: string): string {
  return feeling.normalize("NFC");
}

export function intakeFeelingLength(feeling: string): number {
  return [...normalizeIntakeFeeling(feeling)].length;
}

export function isValidIntakeFeeling(feeling: string): boolean {
  const normalized = normalizeIntakeFeeling(feeling);
  return (
    [...normalized.trim()].length >= INTAKE_MIN_FEELING_LENGTH &&
    [...normalized].length <= INTAKE_MAX_FEELING_LENGTH
  );
}
