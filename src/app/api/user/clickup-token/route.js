import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.log("Unauthorized");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
  }

  await dbConnect();

  try {
    const { clickUpAccessToken } = await request.json();
    console.log(clickUpAccessToken);

    if (!clickUpAccessToken) {
      return NextResponse.json({ error: 'ClickUp access token is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { clickUpAccessToken: clickUpAccessToken },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    session.user.clickUpAccessToken = clickUpAccessToken;

    return NextResponse.json({ message: 'ClickUp access token successfully', user: user });
    
  } catch (error) {
    console.error('Error updating ClickUp access token:', error);
    return NextResponse.json({ error: 'Failed to update ClickUp access token' }, { status: 500 });
  }
}
