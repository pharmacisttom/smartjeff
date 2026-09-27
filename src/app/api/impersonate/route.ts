import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth-jwt';

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['SUPERADMIN']);
  if ('error' in auth) return auth.error;
  // Impersonation must not mint unsigned pseudo-tokens.
  return NextResponse.json({ error: 'Impersonation is not configured' }, { status: 501 });
}
