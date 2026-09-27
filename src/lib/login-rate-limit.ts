// Per-process protection. The reverse proxy also limits login requests across workers.
const attempts = new Map<string, { count: number; until: number }>();
export function consumeLoginAttempt(key: string, now = Date.now()): boolean {
  for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id);
  const current = attempts.get(key);
  if (!current) {
    if (attempts.size >= 10000) return false;
    attempts.set(key, { count: 1, until: now + 60000 });
    return true;
  }
  current.count += 1;
  return current.count <= 10;
}
