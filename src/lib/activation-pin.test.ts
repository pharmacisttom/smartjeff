import { describe, expect, it } from "vitest";
import { generateActivationPin, hashActivationPin, verifyActivationPin } from "./activation-pin";

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
});
