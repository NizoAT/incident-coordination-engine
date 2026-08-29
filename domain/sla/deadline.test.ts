import { describe, expect, it } from "vitest";

import {
  SLA_WARNING_TAIL_RATIO,
  calculateSlaDeadline,
  calculateWarningAt,
  computeDisplaySlaStatus,
  formatRemainingMs,
  isEligibleForSlaBreach,
} from "./deadline";

describe("calculateSlaDeadline", () => {
  it("adds duration minutes to the start time", () => {
    const start = new Date("2026-01-01T12:00:00.000Z");
    const deadline = calculateSlaDeadline(start, 15);

    expect(deadline.toISOString()).toBe("2026-01-01T12:15:00.000Z");
  });
});

describe("calculateWarningAt", () => {
  it("marks warning in the last 25% of the SLA window", () => {
    const start = new Date("2026-01-01T12:00:00.000Z");
    const deadline = calculateSlaDeadline(start, 60);
    const warningAt = calculateWarningAt(deadline, 60);

    expect(warningAt.toISOString()).toBe("2026-01-01T12:45:00.000Z");
    expect(SLA_WARNING_TAIL_RATIO).toBe(0.25);
  });
});

describe("computeDisplaySlaStatus", () => {
  const start = new Date("2026-01-01T12:00:00.000Z");
  const deadline = calculateSlaDeadline(start, 60);

  it("returns ok before the warning window", () => {
    expect(
      computeDisplaySlaStatus("ok", deadline, 60, new Date("2026-01-01T12:30:00.000Z")),
    ).toBe("ok");
  });

  it("returns warning inside the last quarter of the window", () => {
    expect(
      computeDisplaySlaStatus("ok", deadline, 60, new Date("2026-01-01T12:50:00.000Z")),
    ).toBe("warning");
  });

  it("returns breached after the deadline even if not persisted yet", () => {
    expect(
      computeDisplaySlaStatus("ok", deadline, 60, new Date("2026-01-01T13:05:00.000Z")),
    ).toBe("breached");
  });

  it("keeps breached once persisted", () => {
    expect(
      computeDisplaySlaStatus(
        "breached",
        deadline,
        60,
        new Date("2026-01-01T12:30:00.000Z"),
      ),
    ).toBe("breached");
  });
});

describe("formatRemainingMs", () => {
  it("never returns negative values", () => {
    const deadline = new Date("2026-01-01T12:00:00.000Z");
    expect(formatRemainingMs(deadline, new Date("2026-01-01T13:00:00.000Z"))).toBe(
      0,
    );
  });
});

describe("isEligibleForSlaBreach", () => {
  it("only allows open incidents", () => {
    expect(isEligibleForSlaBreach("open")).toBe(true);
    expect(isEligibleForSlaBreach("acknowledged")).toBe(false);
    expect(isEligibleForSlaBreach("investigating")).toBe(false);
    expect(isEligibleForSlaBreach("resolved")).toBe(false);
  });
});
