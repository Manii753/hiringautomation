import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function GET(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  await dbConnect();

  try {
    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.manatalAccessToken) {
      return NextResponse.json({ error: 'Manatal access token not found' }, { status: 404 });
    }

    const response = await fetch(`https://api.manatal.com/open/v3/candidates/?email=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Token ${user.manatalAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Manatal API Error:", response.status, errorText);
        // Don't leak full error text if sensitive, but for debugging it's useful.
        return NextResponse.json({ error: `Manatal API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ data });

  } catch (error) {
    console.error('Error fetching Manatal candidate:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
