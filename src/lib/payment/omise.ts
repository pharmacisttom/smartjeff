export interface ChargeOptions { tenantId: string; amount: number; token: string; description: string; email: string }
export interface ChargeResult { chargeId: string; amount: number; currency: string; status: "SUCCEEDED" | "PENDING" | "FAILED"; cardLast4?: string; cardBrand?: string; paidAt: string }

export async function processOmiseCharge(opts: ChargeOptions): Promise<ChargeResult> {
  const secret = process.env.OMISE_SECRET_KEY;
  if (!secret) throw new Error("OMISE_SECRET_KEY is not configured");
  if (!Number.isFinite(opts.amount) || opts.amount <= 0) throw new Error("Charge amount must be positive");
  const form = new URLSearchParams({ amount: String(Math.round(opts.amount * 100)), currency: "thb", card: opts.token,
    description: opts.description, "metadata[tenantId]": opts.tenantId, "metadata[email]": opts.email });
  const response = await fetch("https://api.omise.co/charges", { method: "POST", headers: {
    Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  }, body: form, cache: "no-store" });
  const charge = await response.json() as { id?: string; amount?: number; currency?: string; paid?: boolean; status?: string; failure_message?: string; card?: { last_digits?: string; brand?: string } };
  if (!response.ok || !charge.id) throw new Error(charge.failure_message || `Omise rejected charge (${response.status})`);
  return { chargeId: charge.id, amount: (charge.amount ?? 0) / 100, currency: (charge.currency || "thb").toUpperCase(),
    status: charge.paid ? "SUCCEEDED" : charge.status === "failed" ? "FAILED" : "PENDING",
    cardLast4: charge.card?.last_digits, cardBrand: charge.card?.brand, paidAt: new Date().toISOString() };
}
