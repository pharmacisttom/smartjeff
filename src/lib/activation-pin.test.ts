import { describe, expect, it } from "vitest";
import { generateActivationPin, getActivationPinState, hashActivationPin, verifyActivationPin } from "./activation-pin";

describe("activation PIN", () => {
  it("generates exactly six digits", () => {
    expect(generateActivationPin()).toMatch(/^\d{6}$/);
  });

  it("verifies only the correct PIN", async () => {
    const hash = await hashActivationPin("060619");
    expect(await verifyActivationPin(hash, "060619")).toBe(true);
    expect(await verifyActivationPin(hash, "060618")).toBe(false);
    expect(await verifyActivationPin(hash, "12345")).toBe(false);
  });

  const now = new Date("2026-09-28T00:00:00.000Z");
  const active = {
    activationPinHash: "hash",
    activationPinExpiresAt: new Date("2026-10-01T00:00:00.000Z"),
    activationPinUsedAt: null,
    activationPinAttempts: 0,
  };

  it("allows normal login when no PIN exists", () => {
    expect(getActivationPinState({ ...active, activationPinHash: null }, now)).toBe("NONE");
  });

  it("requires an active PIN", () => {
    expect(getActivationPinState(active, now)).toBe("ACTIVE");
  });

  it("blocks an expired PIN", () => {
    expect(getActivationPinState({ ...active, activationPinExpiresAt: now }, now)).toBe("EXPIRED");
  });

  it("blocks the fifth failed attempt", () => {
    expect(getActivationPinState({ ...active, activationPinAttempts: 5 }, now)).toBe("LOCKED");
  });

  it("does not require an already-used PIN", () => {
    expect(getActivationPinState({ ...active, activationPinUsedAt: now }, now)).toBe("USED");
  });

  it("does not require a consumed PIN after its hash is cleared", () => {
    expect(getActivationPinState({ ...active, activationPinHash: null, activationPinUsedAt: now }, now)).toBe("USED");
  });
});
