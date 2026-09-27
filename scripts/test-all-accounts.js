async function main() {
  const origin = process.env.DEMO_TEST_URL || 'http://127.0.0.1:3000';
  if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Local demo only');
  for (const role of ['ADMIN', 'MANAGER', 'USER']) {
    const identifier = process.env[`DEMO_${role}_EMAIL`];
    const password = process.env[`DEMO_${role}_PASSWORD`];
    if (!identifier || !password) throw new Error(`Missing DEMO_${role} credentials`);
    const response = await fetch(`${origin}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password }),
    });
    if (!response.ok) throw new Error(`${role} login failed (${response.status})`);
    console.log(`${role}: PASS`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
