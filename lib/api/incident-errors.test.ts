import { describe, expect, it } from "vitest";

import { mapPatchIncidentError } from "@/lib/api/incident-errors";
import {
  PatchForbiddenError,
  VersionConflictError,
} from "@/lib/incidents/patch";
import { TransitionError } from "@/lib/incidents/transitions";

describe("mapPatchIncidentError envelope v1", () => {
  it("409 VERSION_CONFLICT avec details", async () => {
    const error = new VersionConflictError({
      details: { expectedVersion: 3, currentVersion: 4 },
    });
    const response = mapPatchIncidentError(error);
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error.code).toBe("VERSION_CONFLICT");
    expect(body.error.details).toEqual({
      expectedVersion: 3,
      currentVersion: 4,
    });
  });

  it("403 FORBIDDEN", async () => {
    const response = mapPatchIncidentError(new PatchForbiddenError());
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("422 transition invalide", async () => {
    const response = mapPatchIncidentError(
      new TransitionError("open", "resolved"),
    );
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.code).toBe("UNPROCESSABLE_ENTITY");
  });
});
