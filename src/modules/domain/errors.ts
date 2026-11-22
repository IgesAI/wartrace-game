export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "ROUND_LOCKED"
  | "ROUND_NOT_OPEN"
  | "OUT_OF_SEQUENCE"
  | "RUN_COMPLETE"
  | "NO_DAILY"
  | "RATE_LIMITED"
  | "PUBLISH_BLOCKED"
  | "INTERNAL";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}
