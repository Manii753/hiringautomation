import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Candidate from '@/lib/models/Candidate';

export async function POST(request, context) {
    const { params } = await context;
    const fileId = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Update database
        await dbConnect();
        const candidate = await Candidate.findOneAndUpdate(
            { fileId },
            { $set: { webhookResponse: null, managerComment: '' } },
            { new: true }
        );

        if (!candidate) {
            return NextResponse.json({ error: 'Candidate not found in DB' }, { status: 404 });
        }

        // Update Google Drive file properties
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: session.accessToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

       

        

        await drive.files.update({
            fileId: fileId,
            requestBody: {
            appProperties: {
                status: 'pending',
            },
            }
        });

        return NextResponse.json({ message: 'Candidate set for re-evaluation.' });

    } catch (error) {
        console.error(`Error during re-evaluation for file ${fileId}:`, error);
        return NextResponse.json(
            { error: 'Failed to set for re-evaluation.' },
            { status: 500 }
        );
    }
}
