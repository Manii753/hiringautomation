import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
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
    // 1. Update Google Drive file status
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

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

    // 3. Update file with status and webhook response
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
