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
    const { manatalAccessToken } = await request.json();

    if (!manatalAccessToken) {
      return NextResponse.json({ error: 'Manatal access token is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { manatalAccessToken: manatalAccessToken },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Manatal access token added successfully', user: user });
    
  } catch (error) {
    console.error('Error updating Manatal access token:', error);
    return NextResponse.json({ error: 'Failed to update Manatal access token' }, { status: 500 });
  }
}
