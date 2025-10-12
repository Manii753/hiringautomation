
import { google } from 'googleapis'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  try {
    const response = await drive.files.list({
      q: "(name contains 'Interview' or name contains 'Transcript') and (mimeType = 'text/plain' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or mimeType = 'application/pdf')",
      fields: 'files(id, name, createdTime, mimeType)',
    })

    return NextResponse.json(response.data.files)
  } catch (error) {
    console.error('Error fetching files from Google Drive:', error)
    return NextResponse.json({ error: 'Error fetching files from Google Drive' }, { status: 500 })
  }
}
