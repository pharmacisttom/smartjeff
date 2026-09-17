import { afterEach, describe, expect, it, vi } from "vitest";
import { processOmiseCharge } from "./omise";

describe("Omise Payment Engine", () => {
  afterEach(() => { vi.unstubAllGlobals(); delete process.env.OMISE_SECRET_KEY; });

  it("maps an accepted provider charge", async () => {
    process.env.OMISE_SECRET_KEY = "skey_test";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: "chrg_1", amount: 350000, currency: "thb", paid: true, status: "successful",
      card: { last_digits: "4242", brand: "Visa" },
    }), { status: 200, headers: { "Content-Type": "application/json" } })));
    const result = await processOmiseCharge({ tenantId: "TNT-001", amount: 3500, token: "tokn_1", description: "Plan", email: "finance@company.com" });
    expect(result).toMatchObject({ status: "SUCCEEDED", amount: 3500, cardLast4: "4242" });
  });

  it("fails closed when provider credentials are absent", async () => {
    await expect(processOmiseCharge({ tenantId: "TNT-001", amount: 3500, token: "tokn_1", description: "Plan", email: "finance@company.com" }))
      .rejects.toThrow("OMISE_SECRET_KEY");
  });
});
