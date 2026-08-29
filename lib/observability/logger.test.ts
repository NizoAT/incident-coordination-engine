import { afterEach, describe, expect, it, vi } from "vitest";

import { log, logHttpRequest } from "./logger";

describe("observability logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("émet des logs JSON structurés", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    log("info", "test.event", { foo: "bar" });

    expect(infoSpy).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(infoSpy.mock.calls[0]?.[0]));
    expect(payload.level).toBe("info");
    expect(payload.msg).toBe("test.event");
    expect(payload.service).toBe("ice");
    expect(payload.foo).toBe("bar");
    expect(payload.ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("journalise les requêtes HTTP", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    logHttpRequest({ method: "GET", path: "/api/health", status: 503 });

    const payload = JSON.parse(String(infoSpy.mock.calls[0]?.[0]));
    expect(payload.msg).toBe("http.request");
    expect(payload.method).toBe("GET");
    expect(payload.path).toBe("/api/health");
    expect(payload.status).toBe(503);
  });
});
