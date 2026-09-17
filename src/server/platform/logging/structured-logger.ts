import crypto from "crypto";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";

export interface LogPayload {
  timestamp?: string;
  level: LogLevel;
  service: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  route?: string;
  message: string;
  errorCode?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

// Regex patterns and field names for sensitive log masking
const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /totp/i,
  /api[_-]?key/i,
  /authorization/i,
  /bank[_-]?account/i,
  /salary/i,
  /id[_-]?card/i,
  /credit[_-]?card/i,
  /ssn/i,
  /bearer/i,
];

export function maskSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "string") {
    // Mask potential token/JWT or password looking strings
    if (/bearer\s+[a-zA-Z0-9._-]+/i.test(obj)) {
      return obj.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [MASKED_TOKEN]");
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof val === "object" && val !== null) {
        sanitized[key] = maskSensitiveData(val);
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  return obj;
}

export class StructuredLogger {
  private service: string;

  constructor(service: string = "smartjeff-platform") {
    this.service = service;
  }

  public log(payload: LogPayload): string {
    const entry = {
      timestamp: payload.timestamp || new Date().toISOString(),
      level: payload.level,
      service: payload.service || this.service,
      requestId: payload.requestId || `req_${crypto.randomUUID().substring(0, 8)}`,
      correlationId: payload.correlationId,
      userId: payload.userId,
      route: payload.route,
      message: payload.message,
      errorCode: payload.errorCode,
      stack: payload.stack,
      metadata: payload.metadata ? maskSensitiveData(payload.metadata) : undefined,
    };

    const serialized = JSON.stringify(entry);
    
    // In node environment, output to stdout/stderr
    if (payload.level === "ERROR" || payload.level === "FATAL") {
      console.error(serialized);
    } else if (payload.level === "WARN") {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }

    return serialized;
  }

  public debug(message: string, meta?: Record<string, any>) {
    return this.log({ level: "DEBUG", service: this.service, message, metadata: meta });
  }

  public info(message: string, meta?: Record<string, any>) {
    return this.log({ level: "INFO", service: this.service, message, metadata: meta });
  }

  public warn(message: string, meta?: Record<string, any>) {
    return this.log({ level: "WARN", service: this.service, message, metadata: meta });
  }

  public error(message: string, errorCode?: string, error?: Error, meta?: Record<string, any>) {
    return this.log({
      level: "ERROR",
      service: this.service,
      message,
      errorCode,
      stack: error?.stack,
      metadata: meta,
    });
  }

  public fatal(message: string, errorCode?: string, error?: Error, meta?: Record<string, any>) {
    return this.log({
      level: "FATAL",
      service: this.service,
      message,
      errorCode,
      stack: error?.stack,
      metadata: meta,
    });
  }
}

export const platformLogger = new StructuredLogger("smartjeff-core");
