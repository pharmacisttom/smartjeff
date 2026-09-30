/**
 * Longdo Map Error Boundary & Custom Exception Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

export class LongdoMapError extends Error {
  public readonly code: string;
  public readonly status?: number;
  public readonly details?: any;

  constructor(message: string, code: string = "LONGDO_ERROR", status?: number, details?: any) {
    super(message);
    this.name = "LongdoMapError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class LongdoQuotaExceededError extends LongdoMapError {
  constructor(message: string = "Longdo API Quota Warning Threshold Reached") {
    super(message, "LONGDO_QUOTA_EXCEEDED", 429);
    this.name = "LongdoQuotaExceededError";
  }
}

export class LongdoKeyMissingError extends LongdoMapError {
  constructor(keyType: "BROWSER" | "SERVER") {
    super(
      `Longdo ${keyType} API Key is not configured in environment variables (${keyType === "BROWSER" ? "NEXT_PUBLIC_LONGDO_MAP_KEY" : "LONGDO_API_KEY"}).`,
      "LONGDO_KEY_MISSING",
      401
    );
    this.name = "LongdoKeyMissingError";
  }
}

export function handleLongdoApiError(error: unknown, fallbackMessage: string): LongdoMapError {
  if (error instanceof LongdoMapError) {
    return error;
  }
  const message = error instanceof Error ? error.message : fallbackMessage;
  return new LongdoMapError(message, "LONGDO_API_FAILURE", 500, error);
}
