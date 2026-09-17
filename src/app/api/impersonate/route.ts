import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tenantId, userId, adminUser } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
    }

    const impersonationToken = `imp_${Buffer.from(JSON.stringify({ tenantId, userId, adminUser, timestamp: Date.now() })).toString('base64url')}`;

    return NextResponse.json({
      success: true,
      tenantId,
      impersonationToken,
      redirectUrl: `/admin/dashboard?impersonate_token=${impersonationToken}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
