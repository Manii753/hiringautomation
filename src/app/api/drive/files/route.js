import { google } from 'googleapis'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  console.log("DRIVE SESSION",session)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })

  try {
    // 1️⃣ Find the folder by name
    const folderName = 'Meet Recordings'
    const folderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
      fields: 'files(id, name)',
    })

    if (!folderRes.data.files.length) {
      console.log("folder not found")
      return NextResponse.json({ error: `Folder "${folderName}" not found.` }, { status: 404 })
    }

    const folderId = folderRes.data.files[0].id

    // 2️⃣ Get all files inside that folder
    const filesRes = await drive.files.list({
      q: `'${folderId}' in parents 
          and trashed=false 
          and (mimeType='application/pdf' 
            or mimeType='application/vnd.google-apps.document' 
            or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            or mimeType='text/plain') 
          and name contains 'interview'
          and name contains 'notes by gemini'`,
      fields: 'files(id, name, mimeType, createdTime,appProperties)',
    });


    return NextResponse.json(filesRes.data.files)
  } catch (error) {
    console.error('Error fetching files from Google Drive:', error)
    return NextResponse.json({ error: 'Error fetching files from Google Drive' }, { status: 500 })
  }
}
