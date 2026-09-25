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
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided." },
        { status: 400 }
      );
    }

    // Validate folder name to avoid directory traversal
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const allowedFolders = ["logos", "banners", "documents", "general", "products", "brands", "categories"];
    const targetFolder = allowedFolders.includes(safeFolder) ? safeFolder : "general";

    // Validate file size (15MB limit)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, message: "File exceeds maximum size limit of 15MB." },
        { status: 400 }
      );
    }

    // Allowed mime types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|svg|pdf|doc|docx)$/i)) {
      return NextResponse.json(
        { success: false, message: "Invalid file format. Supported: JPG, PNG, WEBP, SVG, PDF, DOCX." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename
    const originalExt = path.extname(file.name).toLowerCase() || ".bin";
    const baseName = path.basename(file.name, originalExt).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    const uniqueName = `${Date.now()}_${baseName}${originalExt}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", targetFolder);
    await mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, uniqueName);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${targetFolder}/${uniqueName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        filename: file.name,
        storedName: uniqueName,
        size: file.size,
        type: file.type,
      },
      message: "File uploaded successfully.",
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
