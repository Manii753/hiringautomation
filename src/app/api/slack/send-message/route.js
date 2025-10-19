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
  const user = await User.findOne({ email: session.user.email });

  if (!user || !user.slackAccessToken) {
    return NextResponse.json({ error: 'Slack not connected' }, { status: 400 });
  }

  const { webhookResponse, channel } = await request.json();

  if (!webhookResponse) {
    return NextResponse.json({ error: 'Missing webhookResponse' }, { status: 400 });
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.slackAccessToken}`,
      },
      body: JSON.stringify({
        channel: channel || user.slackChannel || 'general', // Fallback to 'general'
        text: 'Webhook Response',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*AI Evaluation Summary*',
            },
          },
          {
            type: 'divider',
          },
          ...Object.entries(webhookResponse).map(([key, value]) => ({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${key}:*\n${value}`,
            },
          })),
        ],
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Slack API error:', data.error);
      return NextResponse.json({ error: `Slack API error: ${data.error}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending message to Slack:', error);
    return NextResponse.json({ error: 'Failed to send message to Slack' }, { status: 500 });
  }
}
