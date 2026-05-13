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
    token = user?.manatalAccessToken || null;
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: 'No Manatal token available.' }, { status: 400 });
  }

  try {
    const response = await fetch('https://api.manatal.com/open/v3/organizations/', {
      headers: { Authorization: `Token ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.detail ||
        (typeof errorData === 'string' ? errorData : 'Failed to verify Manatal token.');
      return NextResponse.json({ ok: false, error: message }, { status: 200 });
    }

    const data = await response.json();
    const org = data?.results?.[0];
    if (!org) {
      return NextResponse.json(
        { ok: false, error: 'No organizations found for this Manatal token.' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      organization: {
        name: org.name ?? null,
        website: org.website ?? null,
        country: org.country ?? null,
      },
    });
  } catch (error) {
    console.error('Error verifying Manatal token:', error);
    return NextResponse.json(
      { ok: false, error: 'Error contacting Manatal.' },
      { status: 502 }
    );
  }
}
