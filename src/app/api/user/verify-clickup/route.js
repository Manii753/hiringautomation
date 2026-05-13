import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let bodyToken = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body.token === 'string' && body.token.trim()) {
      bodyToken = body.token.trim();
    }
  } catch {
    // ignore — no body is fine
  }

  let token = bodyToken;
  if (!token) {
    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    token = user?.clickUpAccessToken || null;
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: 'No ClickUp token available.' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.clickup.com/api/v2/user', {
      headers: { Authorization: token },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: errorData.err || 'Failed to verify ClickUp token.' },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      ok: true,
      user: {
        id: data?.user?.id ?? null,
        username: data?.user?.username ?? null,
        email: data?.user?.email ?? null,
      },
    });
  } catch (error) {
    console.error('Error verifying ClickUp token:', error);
    return NextResponse.json(
      { ok: false, error: 'Error contacting ClickUp.' },
      { status: 502 }
    );
  }
}
