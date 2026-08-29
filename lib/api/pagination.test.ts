import { describe, expect, it } from "vitest";

import { parsePagination } from "./pagination";

describe("parsePagination", () => {
  it("défaut page=1 pageSize=20", () => {
    expect(parsePagination(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 20,
    });
  });

  it("clamp pageSize à 100", () => {
    expect(parsePagination(new URLSearchParams("page=2&pageSize=500"))).toEqual({
      page: 2,
      pageSize: 100,
    });
  });
});
