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

  const data = await request.json();

  if (!data) {
    return NextResponse.json({ error: 'Missing webhookResponse' }, { status: 400 });
  }

  try {
    const response = await fetch(process.env.N8N_SENDTO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: user.slackAccessToken, 
        clickUpToken:user.clickUpAccessToken,
        data, 
        manatalToken:user.manatalAccessToken,
      }),
    });

    

    if (!response.ok) {
      // Log n8n error, but don't fail the whole request
      console.error('Failed to send data to n8n webhook:', await response.text());
      return NextResponse.json({ error: 'Failed to get response from webhook' }, { status: 502 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending message to Slack:', error);
    return NextResponse.json({ error: 'Failed to send message to Slack' }, { status: 500 });
  }
}
