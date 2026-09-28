export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function demoMockResult(channel: string) {
  return { success: true, status: 200, message: `[DEMO] ${channel} request simulated; no external side effect was sent` };
}
