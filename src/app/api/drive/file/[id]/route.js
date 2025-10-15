import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import mammoth from "mammoth";

async function getFileContent(drive, fileId, mimeType) {
  let buffer;
  if (mimeType === "application/vnd.google-apps.document") {
    const response = await drive.files.export(
      {
        fileId,
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",        
      },
      { responseType: "arraybuffer" }
    );
    buffer = Buffer.from(response.data);
  } else {
    const response = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    buffer = Buffer.from(response.data);
  }

  if (
    mimeType === "application/vnd.google-apps.document" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    return buffer.toString("utf-8");
  }
}

function parseFileContent(content, fileName = "") {
  const nameMatch = fileName.match(/\(([^)]+)\)/);
  const dateMatch = fileName.match(/(\d{4})[\/\-_](\d{2})[\/\-_](\d{2})/);
  const timeMatch = fileName.match(/(\d{2})[:_](\d{2})\s*(PDT|UTC|GMT|EST|PST)?/i);
  const companyMatch = fileName.match(/^(.*?)\s*[_-]/);
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const summaryMatch = content.match(/Summary([\s\S]*?)(?=Details|Professional|$)/i);

  const interviewDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : "Unknown";

  const interviewTime = timeMatch
    ? `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3] ? timeMatch[3].toUpperCase() : ""}`.trim()
    : "Unknown";

  return {
    candidateName: nameMatch ? nameMatch[1].trim() : "Unknown",
    company: companyMatch ? companyMatch[1].trim() : "Unknown",
    email: emailMatch ? emailMatch[0] : "Unknown",
    interviewDate,
    interviewTime,
    summary: summaryMatch ? summaryMatch[1].trim() : "No summary found.",
    content: content,
  };
}

export async function GET(request, context) {
  const { params } = await context;
  const fileId = params.id;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "name,createdTime,mimeType,appProperties",
      supportsAllDrives: true,
    });

    const content = await getFileContent(
      drive,
      fileId,
      fileMetadata.data.mimeType
    );

    const parsedData = parseFileContent(content, fileMetadata.data.name);

    let webhookResponse = null;
    if (fileMetadata.data.appProperties?.webhookResponse) {
        try {
            webhookResponse = JSON.parse(fileMetadata.data.appProperties.webhookResponse);
        } catch (e) {
            console.error("Failed to parse webhookResponse", e);
        }
    }

    const response = {
      id: fileId,
      ...fileMetadata.data,
      status: fileMetadata.data.appProperties?.status || 'pending',
      webhookResponse: webhookResponse,
      ...parsedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      `❌ Error fetching file ${fileId} from Google Drive:`,
      JSON.stringify(error, null, 2)
    );
    return NextResponse.json(
      {
        error: `Error fetching file ${fileId} from Google Drive`,
        details: error.errors,
      },
      { status: error.code || 500 }
    );
  }
}
