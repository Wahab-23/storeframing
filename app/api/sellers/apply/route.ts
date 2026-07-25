import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/getCurrentUser";

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

    businessPhone: z
        .string()
        .min(7)
        .max(20),

    businessEmail: z
        .email("Please provide a valid business email"),
});

function createSlug(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser(request);

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const body = await request.json();

        const validationResult =
            sellerApplicationSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Validation failed",
                    errors:
                        validationResult.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const {
            shopName,
            description,
            businessPhone,
            businessEmail,
        } = validationResult.data;

        if (user.seller) {
            return NextResponse.json(
                {
                    success: false,
                    message: "You already have a seller profile",
                },
                { status: 409 }
            );
        }

        const baseSlug = createSlug(shopName);

        const existingShop = await prisma.seller.findUnique({
            where: {
                slug: baseSlug,
            },
        });

        if (existingShop) {
            return NextResponse.json(
                {
                    success: false,
                    message: "This shop name is already taken",
                },
                { status: 409 }
            );
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

        return NextResponse.json(
            {
                success: true,
                message: "Seller application submitted successfully",
                data: {
                    seller,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Seller application error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong",
            },
            { status: 500 }
        );
    }
}