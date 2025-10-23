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

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const candidateId = url.searchParams.get('state');


  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,

      }),
    });

    const data = await response.json();
    

    if (!data.ok) {
      console.error('Slack OAuth error:', data.error);
      return NextResponse.json({ error: `Slack OAuth error: ${data.error}` }, { status: 500 });
    }

    const { authed_user, team } = data;
    const access_token = data.authed_user.access_token;
    


    await dbConnect();
    await User.findOneAndUpdate(
      { email: session.user.email },
      {
        slackAccessToken: access_token,
        slackUserId: authed_user.id,
        slackTeamId: team.id,
      },
      { new: true, upsert: true }
    );

    const baseUrl = process.env.NEXTAUTH_URL
    const redirectUrl = candidateId === 'home' ? `${baseUrl}/` : `${baseUrl}/candidate/${candidateId}`;

    // Redirect user to the candidate page or a success page
    return NextResponse.redirect(redirectUrl);

  } catch (error) {
    console.error('Error during Slack OAuth callback:', error);
    return NextResponse.json({ error: 'Failed to process Slack OAuth callback' }, { status: 500 });
  }
}
