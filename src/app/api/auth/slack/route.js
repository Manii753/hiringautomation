import { NextResponse } from 'next/server';

export async function GET(request) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;
  const scope = 'chat:write,channels:read'; // Add necessary scopes

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}`;

  return NextResponse.redirect(authUrl);
}
