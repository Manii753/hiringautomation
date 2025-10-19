import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('candidateId');

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

 
  const scope = 'chat:write,channels:read';

  
  const user_scope = 'chat:write,channels:read,groups:read,im:write,mpim:write';

  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&user_scope=${user_scope}&redirect_uri=${redirectUri}&state=${candidateId}`;

  return NextResponse.redirect(authUrl);
}
