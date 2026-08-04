// app/api/images/[...filename]/route.ts

import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Helper function to get content type based on file extension
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();

  const contentTypes: { [key: string]: string } = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
  };

  return contentTypes[ext] || "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ filename: string | string[] }> }
) {
  const { filename } = await context.params;

  // Ensure filename is an array (catch-all param can be string or string[])
  const filenameArray = Array.isArray(filename) ? filename : [filename];

  // Join array → full relative path
  const relativePath = filenameArray.join("/");

  // Prevent directory traversal attacks
  if (!relativePath || relativePath.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  // Validate file extension (only allow image files)
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".bmp",
    ".tiff",
    ".tif",
  ];
  const fileExtension = path.extname(relativePath).toLowerCase();

  if (!allowedExtensions.includes(fileExtension)) {
    return NextResponse.json(
      { error: "Invalid image file type" },
      { status: 400 }
    );
  }

  // Resolve file inside /public
  const filePath = path.join(process.cwd(), "public", relativePath);

  try {
    await fs.promises.access(filePath); // check if file exists
    const fileBuffer = await fs.promises.readFile(filePath);
    const contentType = getContentType(relativePath);

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(
          relativePath
        )}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Image not found", { status: 404 });
  }
}
