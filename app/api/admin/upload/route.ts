import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/admin/require-permission";
import { AppError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    // Ensure admin authorization
    await requirePermission(request, [
      "admin:sellers:write",
      "catalogue:brands:write",
      "admin:brands:write",
      "admin:categories:write",
      "catalogue:categories:write",
      "admin:products:write",
    ]);

    const formData = await request.formData();
    const folder = (formData.get("folder") as string) || "general";
    
    // Support both multi-file ("files" or multiple "file") and single file ("file")
    const rawFiles = [...formData.getAll("files"), ...formData.getAll("file")].filter(
      (f): f is File => f instanceof File && f.size > 0
    );

    if (rawFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: "No files provided." },
        { status: 400 }
      );
    }

    // Validate folder name to avoid directory traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const allowedFolders = ["logos", "banners", "documents", "general", "products", "brands", "categories"];
    const targetFolder = allowedFolders.includes(safeFolder) ? safeFolder : "general";

    const MAX_SIZE = 15 * 1024 * 1024; // 15MB limit per file
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const uploadsDir = path.join(process.cwd(), "public", "uploads", targetFolder);
    await mkdir(uploadsDir, { recursive: true });

    const uploadResults = await Promise.all(
      rawFiles.map(async (file) => {
        if (file.size > MAX_SIZE) {
          throw new AppError(400, `File "${file.name}" exceeds maximum size limit of 15MB.`);
        }

        const isAllowedType =
          allowedTypes.includes(file.type) ||
          file.name.match(/\.(jpg|jpeg|png|webp|svg|gif|pdf|doc|docx)$/i);

        if (!isAllowedType) {
          throw new AppError(
            400,
            `File "${file.name}" has an unsupported format. Supported: JPG, PNG, WEBP, SVG, GIF, PDF, DOCX.`
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename & guarantee zero collision using UUID
        const originalExt = path.extname(file.name).toLowerCase() || ".bin";
        const baseName = path
          .basename(file.name, originalExt)
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 40);
        const uniqueId = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
        const uniqueName = `${Date.now()}_${uniqueId}_${baseName}${originalExt}`;

        const filePath = path.join(uploadsDir, uniqueName);
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${targetFolder}/${uniqueName}`;

        return {
          url: publicUrl,
          filename: file.name,
          storedName: uniqueName,
          size: file.size,
          type: file.type,
        };
      })
    );

    // Return first item for legacy single-file callers, plus full files array
    const primaryResult = uploadResults[0];

    return NextResponse.json({
      success: true,
      data: {
        ...primaryResult,
        files: uploadResults,
      },
      message:
        uploadResults.length === 1
          ? "File uploaded successfully."
          : `${uploadResults.length} files uploaded successfully.`,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to upload file." },
      { status: 500 }
    );
  }
}
