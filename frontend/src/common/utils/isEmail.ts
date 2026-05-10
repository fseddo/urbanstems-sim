// Loose `x@y.z` typo guard. Strict RFC 5322 over-rejects real addresses;
// genuine deliverability is the backend's problem.
export const isEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
