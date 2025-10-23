import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { slackChannel } = await request.json();

    if (!slackChannel) {
      return NextResponse.json({ error: 'Slack channel is required' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { slackChannel: slackChannel },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Slack channel updated successfully', user: user });
  } catch (error) {
    console.error('Error updating Slack channel:', error);
    return NextResponse.json({ error: 'Failed to update Slack channel' }, { status: 500 });
  }
}
