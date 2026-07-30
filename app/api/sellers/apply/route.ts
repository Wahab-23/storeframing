import { NextRequest } from "next/server";
import { z } from "zod";

import { withApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { createSlug } from "@/lib/slug";
import { success, error } from "@/lib/api-response";
import { AppError } from "@/lib/errors";

const sellerApplicationSchema = z.object({
    shopName: z
        .string()
        .min(3, "Shop name must be at least 3 characters")
        .max(100, "Shop name cannot exceed 100 characters")
        .trim(),
    description: z
        .string()
        .max(1000, "Description cannot exceed 1000 characters")
        .optional(),
    businessPhone: z.string().min(7).max(20),
    businessEmail: z.email("Please provide a valid business email"),
});

export const POST = withApiHandler(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return error("Unauthorized", 401);
        }

        const body = await request.json();
        const validationResult = sellerApplicationSchema.safeParse(body);

        if (!validationResult.success) {
            return error(
                "Validation failed",
                400,
                validationResult.error.flatten().fieldErrors
            );
        }

        const { shopName, description, businessPhone, businessEmail } =
            validationResult.data;

        if (user.seller) {
            return error("You already have a seller profile", 409);
        }

        const baseSlug = createSlug(shopName);
        const existingShop = await prisma.seller.findUnique({
            where: {
                slug: baseSlug,
            },
        });

        if (existingShop) {
            return error("This shop name is already taken", 409);
        }

        const seller = await prisma.seller.create({
            data: {
                userId: user.id,
                shopName,
                slug: baseSlug,
                description,
                businessPhone,
                businessEmail,
                status: "PENDING",
                verificationStatus: "UNVERIFIED",
            },
        });

        return success(
            {
                seller,
            },
            "Seller application submitted successfully",
            201
        );
    } catch (err) {
        if (err instanceof AppError) {
            return error(err.message, err.status);
        }

        console.error("Seller application error:", err);
        return error("Something went wrong", 500);
    }
});
