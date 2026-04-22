// landing/src/services/errors.ts
export type ErrorKind =
  | "network"
  | "auth"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "rateLimit"
  | "validation"
  | "server"
  | "unknown";

export type NormalizedError = {
  kind: ErrorKind;
  status: number | null;
  fieldErrors?: Record<string, string>;
  detail?: string;
};
