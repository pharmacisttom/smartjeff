export async function sendEmailDigest(recipients: string[], subject: string, htmlBody: string) {
  const endpoint = process.env.EMAIL_API_URL;
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!endpoint || !apiKey || !from) return { success: false, status: 503, message: "Email provider is not configured" };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to: recipients, subject, html: htmlBody }),
  });
  return { success: response.ok, status: response.status, message: response.ok ? "Email accepted by provider" : `Email provider rejected request (${response.status})` };
}
