import { describe, it, expect } from "vitest";
import { resolveAttendanceConflict } from "./conflict-resolver";

describe("Conflict Resolver tests", () => {
  it("detects exact duplicate photoHash or localId and returns SKIP_DUPLICATE", () => {
    const incoming = {
      localId: "uuid-123",
      employeeId: "emp-1",
      photoHash: "hash-abc",
      timestamp: Date.now(),
      type: "CHECK_IN",
    };

    const existing = [
      { localId: "uuid-123", photoHash: "hash-abc", timestamp: Date.now(), type: "CHECK_IN" },
    ];

    const result = resolveAttendanceConflict(incoming, existing);
    expect(result.action).toBe("SKIP_DUPLICATE");
  });

  it("returns CREATE for new unique check-in", () => {
    const incoming = {
      localId: "uuid-999",
      employeeId: "emp-1",
      photoHash: "hash-xyz",
      timestamp: Date.now(),
      type: "CHECK_IN",
    };

    const result = resolveAttendanceConflict(incoming, []);
    expect(result.action).toBe("CREATE");
  });
});
