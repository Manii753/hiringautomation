import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import mammoth from "mammoth";

/**
 * Reads the actual file content from Google Drive
 * Supports both .docx and .txt formats
 */
async function getFileContent(drive, fileId, mimeType) {
  const response = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "arraybuffer" } // get raw binary data
  );

  const buffer = Buffer.from(response.data);

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    // ✅ Convert DOCX to readable text
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    // ✅ Handle plain text or similar formats
    return buffer.toString("utf-8");
  }
}

/**
 * Extracts structured data from file content + filename
 */
function parseFileContent(content, fileName = "") {
  const nameMatch = fileName.match(/\(([^)]+)\)/);
  const dateMatch = fileName.match(/(\d{4}_\d{2}_\d{2})/);
  const timeMatch = fileName.match(/(\d{2}_\d{2} PDT)/);
  const detailsMatch = content.match(/Details([\s\S]*?)(?=Suggested next steps|📖 Transcript|$)/i);
  const nextStepsMatch = content.match(/Suggested next steps([\s\S]*?)(?=📖 Transcript|$)/i);
  const companyMatch = fileName.match(/^(.*?)\s*[_-]/);
  const emailMatch = content.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const transcriptMatch = content.match(/Transcript([\s\S]*?)(?=Summary|$)/i);

  // Try to extract a readable "Summary" section if it exists
  const summaryMatch = content.match(
    /Summary([\s\S]*?)(?=Details|Professional|$)/i
  );

  return {
    candidateName: nameMatch ? nameMatch[1].trim() : "Unknown",
    company: companyMatch ? companyMatch[1].trim() : "Unknown",
    email: emailMatch ? emailMatch[0] : "Unknown",
    interviewDate: dateMatch
      ? dateMatch[1].replace(/_/g, "-")
      : "Unknown",

    interviewTime: timeMatch
      ? timeMatch[1].replace("_", ":")
      : "Unknown",
    summary: summaryMatch ? summaryMatch[1].trim() : "No summary found.",
    details: detailsMatch ? detailsMatch[1].trim() : "No details found.",
    nextSteps: nextStepsMatch ? nextStepsMatch[1].trim() : "No next steps found.",
    transcript: transcriptMatch ? transcriptMatch[1].trim() : "No transcript found.",
  };
}

/**
 * GET /api/drive/file/[id]
 * Fetches and parses a single file from Google Drive
 */
export async function GET(request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: session.accessToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const fileId = params.id;

  try {
    // First get metadata (to know mimeType)
    const fileMetadata = await drive.files.get({
      fileId,
      fields: "name,createdTime,mimeType",
    });

    // Then download the actual content
    const content = await getFileContent(
      drive,
      fileId,
      fileMetadata.data.mimeType
    );

    // Parse and structure the data
    const parsedData = parseFileContent(content, fileMetadata.data.name);

    const response = {
      id: fileId,
      ...fileMetadata.data,
      ...parsedData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`❌ Error fetching file ${fileId} from Google Drive:`, error);
    return NextResponse.json(
      { error: `Error fetching file ${fileId} from Google Drive` },
      { status: 500 }
    );
  }
}
