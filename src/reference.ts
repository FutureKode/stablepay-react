export const STABLEPAY_PREFIX = "stablepay:";

export function encodeStablePayReference(reference: string): string {
  const trimmed = reference.trim();

  if (!trimmed) {
    throw new Error("StablePay reference is required");
  }

  if (trimmed.startsWith(STABLEPAY_PREFIX)) {
    return trimmed;
  }

  return `${STABLEPAY_PREFIX}${trimmed}`;
}

export function isStablePayReference(reference: string): boolean {
  return reference.startsWith(STABLEPAY_PREFIX);
}

export function decodeStablePayReference(reference: string): string | null {
  if (!isStablePayReference(reference)) return null;
  return reference.slice(STABLEPAY_PREFIX.length);
}
