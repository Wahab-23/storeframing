import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createSlug } from "@/lib/slug";
import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const updateSellerSchema = z.object({
    shopName: z.string().min(3).max(100).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    logoUrl: z.string().url().nullable().optional(),
    bannerUrl: z.string().url().nullable().optional(),
    businessEmail: z.string().email().nullable().optional(),
    businessPhone: z.string().min(7).max(20).nullable().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return error("Unauthorized", 401);
        }

        if (!user.seller) {
            return error("Seller profile not found", 404);
        }

        return success(
            {
                seller: user.seller,
            },
            "Seller profile fetched successfully"
        );
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return error("Unauthorized", 401);
        }

        if (!user.seller) {
            return error("Seller profile not found", 404);
        }

        if (user.seller.status !== "ACTIVE") {
            return error("Only active sellers can update their shop", 403);
        }

        const body = await request.json();
        const validationResult = updateSellerSchema.safeParse(body);

        if (!validationResult.success) {
            return error(
                "Validation failed",
                400,
                validationResult.error.flatten().fieldErrors
            );
        }

        const data = validationResult.data;
        let slug: string | undefined;

        if (data.shopName) {
            slug = createSlug(data.shopName);

            const existingSeller = await prisma.seller.findFirst({
                where: {
                    slug,
                    id: {
                        not: user.seller.id,
                    },
                },
                select: {
                    id: true,
                },
            });

            if (existingSeller) {
                return error("This shop name is already taken", 409);
            }
        }

        const seller = await prisma.seller.update({
            where: {
                id: user.seller.id,
            },
            data: {
                ...(data.shopName !== undefined && {
                    shopName: data.shopName,
                }),
                ...(slug !== undefined && {
                    slug,
                }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
                ...(data.logoUrl !== undefined && {
                    logoUrl: data.logoUrl,
                }),
                ...(data.bannerUrl !== undefined && {
                    bannerUrl: data.bannerUrl,
                }),
                ...(data.businessEmail !== undefined && {
                    businessEmail: data.businessEmail,
                }),
                ...(data.businessPhone !== undefined && {
                    businessPhone: data.businessPhone,
                }),
            },
        });

        return success(
            {
                seller,
            },
            "Seller profile updated successfully"
        );
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error(err);
        return error("Something went wrong", 500);
    }
}
