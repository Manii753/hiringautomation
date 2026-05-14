import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from "@/lib/auth";
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Candidate from '@/lib/models/Candidate';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!N8N_WEBHOOK_URL) {
    console.error('N8N_WEBHOOK_URL is not set');
    return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 });
  }

  const body = await request.json();
  const { id: fileId, status, managerComment,job, ...candidateData } = body;

  if (!fileId || !status) {
    return NextResponse.json({ error: 'Missing fileId or status' }, { status: 400 });
  }

  try {
    const jwtToken = await getToken({ req: request });
    if (!jwtToken?.accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 401 });
    }

    // 1. Update Google Drive file status
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: jwtToken.accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Pre-check: confirm the user has edit access to the Drive file before doing
    // anything irreversible (n8n call, DB write). Without canEdit, the final
    // appProperties update will 403 and leave the candidate in an inconsistent state.
    let canEdit = false;
    let ownerInfo = null;
    try {
      const fileMeta = await drive.files.get({
        fileId,
        fields: "capabilities(canEdit),owners(displayName,emailAddress)",
        supportsAllDrives: true,
      });
      canEdit = !!fileMeta.data.capabilities?.canEdit;
      ownerInfo = fileMeta.data.owners?.[0] || null;
    } catch (err) {
      console.error('Error checking Drive file permissions:', err);
      return NextResponse.json(
        { error: 'Could not verify access to this file', code: 'PERMISSION_CHECK_FAILED' },
        { status: err.code || 500 }
      );
    }

    if (!canEdit) {
      return NextResponse.json(
        {
          error: "You don't have edit access to this candidate's file. Please ask the file owner to grant you edit access.",
          code: 'NO_EDIT_ACCESS',
          owner: ownerInfo,
        },
        { status: 403 }
      );
    }

    // 2. Send data to n8n webhook
    const webhookResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...candidateData, status, job, managerComment }),
    });

    

    if (!webhookResponse.ok) {
      // Log n8n error, but don't fail the whole request
      console.error('Failed to send data to n8n webhook:', await webhookResponse.text());
      return NextResponse.json({ error: 'Failed to get response from webhook' }, { status: 502 });
    }

    

    const webhookData = await webhookResponse.json();

    await dbConnect();

    await Candidate.findOneAndUpdate(
      { fileId: fileId },
      { 
        managerComment: managerComment,
        webhookResponse: webhookData,
      },
      { upsert: true, new: true }
    );

    // 3. Update file with status
    await drive.files.update({
        fileId: fileId,
        requestBody: {
          appProperties: {
              status: status,
          },
        }
      });


    return NextResponse.json({ success: true, status: status, webhookData });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
