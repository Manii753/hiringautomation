import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import dbConnect from "@/lib/dbConnect";
import Candidate from "@/lib/models/Candidate";
import { file } from "googleapis/build/src/apis/file";

async function getFileContent(drive, fileId, mimeType) {
  let buffer;
  if (mimeType === "application/vnd.google-apps.document") {
    const response = await drive.files.export(
      {
        fileId,
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    return buffer.toString("utf-8");
  }
  console.log("buffer---------------------------------------", buffer);
}


function extractJobPosition(filename) {
  // Check for VinAudit or AutoScale (case-insensitive)
  if (/vinaudit|autoscale/i.test(filename)) {
    return "Not found";
  }

  // Match everything before " Interview ("
  const match = filename.match(/^(.*?)\s+Interview\s*\(/i);
  return match ? match[1].trim() : "Not found";
}
  
function parseFileContent(content, fileName = "") {
  const nameMatch = fileName.match(/\(([^)]+)\)/);
  const dateMatch = fileName.match(/(\d{4})[\/\-_](\d{2})[\/\-_](\d{2})/);
  const timeMatch = fileName.match(/(\d{2})[:_](\d{2})\s*(PDT|UTC|GMT|EST|PST)?/i);
  const companyMatch = fileName.match(/^(.*?)\s*[_-]/);
  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const summaryMatch = content.match(/Summary([\s\S]*?)(?=Details|Professional|$)/i);
  const positionMatch = extractJobPosition(fileName);

  const interviewDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : "Unknown";

  const interviewTime = timeMatch
    ? `${timeMatch[1]}:${timeMatch[2]} ${timeMatch[3] ? timeMatch[3].toUpperCase() : ""}`.trim()
    : "Unknown";

  return {
    candidateName: nameMatch ? nameMatch[1].trim() : "Unknown",
    company: companyMatch ? companyMatch[1].trim() : "Unknown",
    positionMatch: positionMatch,
    email: emailMatch ? emailMatch[0] : "Unknown",
    interviewDate,
    interviewTime,
    summary: summaryMatch ? summaryMatch[1].trim() : "No summary found.",
    content,
  };
}

export async function GET(request, context) {
  const { id } = await context.params;
  const fileId = id;

  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  try {
    // 1️⃣ Get the target file (Notes by Gemini)
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "name,createdTime,mimeType,appProperties,parents",
      supportsAllDrives: true,
    });

    

    // 2️⃣ Get file content and parse it
    const content = await getFileContent(drive, fileId, fileMetadata.data.mimeType);
    const parsedData = parseFileContent(content, fileMetadata.data.name);
    

    const folderId = fileMetadata.data.parents?.[0];

    // 4️⃣ Search for matching recording only inside that folder
    const baseName = fileMetadata.data.name.replace(/ - Notes by Gemini/i, "").trim();

    let matchingRecording = null;

    if (folderId) {
      const recordingSearch = await drive.files.list({
        q: `'${folderId}' in parents and name contains '${baseName}' and name contains 'Recording' and trashed=false`,
        fields: "files(id, name, mimeType)",
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      matchingRecording = recordingSearch.data.files?.[0] || null;

      
    }

    // 5️⃣ Fetch Candidate data from DB
    await dbConnect();
    const candidate = await Candidate.findOne({ fileId });

    // 6️⃣ Prepare final response
    const response = {
      id: fileId,
      ...fileMetadata.data,
      status: fileMetadata.data.appProperties?.status || "pending",
      webhookResponse: candidate?.webhookResponse || null,
      managerComment: candidate?.managerComment || "",
      ...parsedData,
      recordingId: matchingRecording ? matchingRecording.id : null,
      recordingName: matchingRecording ? matchingRecording.name : null,
      recordingLink: matchingRecording
        ? `https://drive.google.com/file/d/${matchingRecording.id}/view`
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`❌ Error fetching file ${fileId} from Google Drive:`, JSON.stringify(error, null, 2));
    return NextResponse.json(
      {
        error: `Error fetching file ${fileId} from Google Drive`,
        details: error.errors,
      },
      { status: error.code || 500 }
    );
  }
}

export async function PATCH(request, context) {
    const { params } = context;
    const fileId = params.id;

    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        await dbConnect();

        const candidate = await Candidate.findOne({ fileId });

        if (!candidate) {
            return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
        }

        // Only update fields that are actually present in the request body
        if ('webhookResponse' in body) {
            candidate.webhookResponse = body.webhookResponse;
        }
        if ('managerComment' in body) {
            candidate.managerComment = body.managerComment;
        }
        if ('email' in body) {
            // Update email in Google Drive appProperties
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: session.accessToken });
            const drive = google.drive({ version: "v3", auth: oauth2Client });
            await drive.files.update({
                fileId,
                appProperties: { email: body.email },
            });
        }

        await candidate.save();

        return NextResponse.json(candidate);
    } catch (error) {
        console.error(`Error updating candidate ${fileId}:`, error);
        return NextResponse.json(
            { error: `Error updating candidate ${fileId}` },
            { status: 500 }
        );
    }
}