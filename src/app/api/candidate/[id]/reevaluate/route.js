import { google } from 'googleapis';
import { getServerSession } from 'next-auth/next';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Candidate from '@/lib/models/Candidate';

export async function POST(request, context) {
    const { id } = await context.params;
    const fileId = id;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const jwtToken = await getToken({ req: request });
        if (!jwtToken?.accessToken) {
            return NextResponse.json({ error: 'No access token available' }, { status: 401 });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: jwtToken.accessToken });
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Pre-check edit access before mutating DB or Drive — without canEdit
        // the appProperties update will 403 and leave DB cleared but Drive untouched.
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
