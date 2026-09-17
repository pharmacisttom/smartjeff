import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer sk_')) {
    return NextResponse.json(
      { error: 'Unauthorized. Valid SMARTO API Key required.' },
      { status: 401 }
    );
  }

  const sampleEmployees = [
    { id: 'EMP-001', name: 'สมชาย สายซิ่ง', role: 'DRIVER', site: 'มาบตาพุด', status: 'ACTIVE' },
    { id: 'EMP-002', name: 'วิภา ตรงเวลา', role: 'ACCOUNTANT', site: 'สำนักงานใหญ่', status: 'ACTIVE' },
  ];

  return NextResponse.json({
    object: 'list',
    data: sampleEmployees,
    has_more: false,
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer sk_')) {
    return NextResponse.json(
      { error: 'Unauthorized. Valid SMARTO API Key required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    return NextResponse.json(
      {
        id: `EMP-${Date.now()}`,
        name: body.name,
        role: body.role || 'USER',
        site: body.site || 'MAIN',
        created_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
