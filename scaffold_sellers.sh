#!/bin/bash

mkdir -p app/api/admin/sellers/approvals
cat << 'ROUTE' > app/api/admin/sellers/approvals/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:approvals:read");
    const approvals = await prisma.seller.findMany({
        where: { verificationStatus: "PENDING" },
        orderBy: { createdAt: "desc" }
    });
    return { data: approvals };
});
ROUTE

mkdir -p app/api/admin/sellers/verification
cat << 'ROUTE' > app/api/admin/sellers/verification/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:verification:read");
    const verifications = await prisma.sellerDocument.findMany({
        where: { status: "PENDING" },
        include: { seller: { select: { storeName: true } } },
        orderBy: { createdAt: "desc" }
    });
    return { data: verifications };
});

export const POST = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:verification:write");
    const body = await request.json();
    const verification = await prisma.sellerDocument.update({
        where: { id: body.documentId },
        data: { status: body.status, adminNotes: body.notes }
    });
    return { data: verification };
});
ROUTE

mkdir -p app/api/admin/sellers/performance
cat << 'ROUTE' > app/api/admin/sellers/performance/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:performance:read");
    const performance = await prisma.seller.findMany({
        select: { id: true, storeName: true, rating: true, totalSales: true },
        orderBy: { rating: "desc" },
        take: 100
    });
    return { data: performance };
});
ROUTE

mkdir -p app/api/admin/sellers/staff
cat << 'ROUTE' > app/api/admin/sellers/staff/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler(async (request: NextRequest) => {
    await requirePermission(request, "sellers:staff:read");
    // Depending on schema, it might be a SellerStaff model or User with role SELLER_STAFF
    // We will just return a placeholder for now
    return { data: [] };
});
ROUTE

