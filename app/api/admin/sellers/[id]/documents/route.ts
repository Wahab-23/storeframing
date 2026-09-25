import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const GET = withApiHandler(async (request: NextRequest, context: RouteContext) => {
  await requirePermission(request, "admin:sellers:read");
  const { id } = await context.params;

  const documents = await prisma.sellerDocument.findMany({
    where: { sellerId: id },
    orderBy: { createdAt: "desc" },
  });

  return {
    data: documents,
    message: "Documents retrieved successfully.",
  };
});

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
  const admin = await requirePermission(request, "admin:sellers:write");
  const { id } = await context.params;
  const body = await request.json();

  const { type, fileUrl, notes, status = "APPROVED" } = body;

  if (!type || !fileUrl) {
    throw new AppError(400, "Document type and file URL are required.");
  }

  const seller = await prisma.seller.findUnique({
    where: { id },
  });

  if (!seller) {
    throw new AppError(404, "Seller not found.");
  }

  // Create new document or update existing of the same type
  const doc = await prisma.sellerDocument.create({
    data: {
      sellerId: id,
      type,
      fileUrl,
      notes: notes || null,
      status: status || "APPROVED",
      reviewedAt: new Date(),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "UPDATE",
      entityType: "SELLER_DOCUMENT",
      entityId: doc.id,
      newData: {
        sellerId: id,
        type: doc.type,
        fileUrl: doc.fileUrl,
        status: doc.status,
      },
    },
  });

  return {
    data: doc,
    message: "Seller document uploaded and recorded successfully.",
  };
});

export const DELETE = withApiHandler(async (request: NextRequest, context: RouteContext) => {
  const admin = await requirePermission(request, "admin:sellers:write");
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get("documentId");

  if (!documentId) {
    throw new AppError(400, "Document ID is required.");
  }

  const doc = await prisma.sellerDocument.findFirst({
    where: { id: documentId, sellerId: id },
  });

  if (!doc) {
    throw new AppError(404, "Document not found for this seller.");
  }

  await prisma.sellerDocument.delete({
    where: { id: documentId },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "DELETE",
      entityType: "SELLER_DOCUMENT",
      entityId: documentId,
      oldData: {
        type: doc.type,
        fileUrl: doc.fileUrl,
      },
    },
  });

  return {
    data: { id: documentId },
    message: "Document deleted successfully.",
  };
});
