import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ theme: string; path: string[] }> }
) {
  try {
    const { theme, path: urlPath } = await params;
    
    // Validate inputs
    if (!theme || !urlPath || urlPath.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Sanitize theme name (alphanumeric, dashes, underscores only)
    if (!/^[a-zA-Z0-9-_]+$/.test(theme)) {
      return new NextResponse("Invalid theme name", { status: 400 });
    }

    // Construct file path
    // Target: themes/[theme]/[...path]
    const filePath = path.join(
      process.cwd(),
      "themes",
      theme,
      ...urlPath
    );

    // Security check: ensure the resolved path is within the intended theme directory
    const themeBaseDir = path.join(process.cwd(), "themes", theme);
    // Resolve relative paths to absolute to prevent traversal attacks like '..'
    const absoluteFilePath = path.resolve(filePath);
    const absoluteThemeBaseDir = path.resolve(themeBaseDir);

    if (!absoluteFilePath.startsWith(absoluteThemeBaseDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!fs.existsSync(absoluteFilePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Check if it's a file, not a directory
    const stat = fs.statSync(absoluteFilePath);
    if (!stat.isFile()) {
      return new NextResponse("Not a file", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(absoluteFilePath);
    
    // Determine content type
    const ext = path.extname(absoluteFilePath).toLowerCase();
    let contentType = "application/octet-stream";
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
      ".ttf": "font/ttf",
      ".otf": "font/otf",
    };
    
    if (mimeTypes[ext]) {
      contentType = mimeTypes[ext];
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving theme asset:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
