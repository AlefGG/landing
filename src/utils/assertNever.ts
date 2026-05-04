/**
 * FE-TS-005: throw with a clear message when an exhaustive switch hits a
 * discriminant the type system thought was impossible. The `value: never`
 * parameter makes TypeScript fail the build at compile time if a new
 * union member is added without handling — so this throw should only
 * fire when an upstream `as never` cast bypasses the narrowing.
 */
export function assertNever(value: never, context?: string): never {
  throw new Error(
    `Unhandled discriminant${context ? ` in ${context}` : ""}: ${String(value)}`,
  );
}
