// ponytail: client-only stable ids for draft rows; server never sees this format.
export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
