export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

export function log(
  level: LogLevel,
  message: string,
  fields: LogFields = {},
): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: "ice",
    ...fields,
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export function logHttpRequest(fields: {
  method: string;
  path: string;
  status?: number;
  durationMs?: number;
}): void {
  log("info", "http.request", fields);
}
