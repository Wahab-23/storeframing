import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { withApiHandler } from "@/lib/api-handler";

const registerSchema = z.object({
    email: z
        .email("Please provide a valid email address")
        .transform((email) => email.toLowerCase().trim()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters long"),

    firstName: z
        .string()
        .min(2, "First name must be at least 2 characters long")
        .max(50),

    lastName: z
        .string()
        .min(2, "Last name must be at least 2 characters long")
        .max(50),

    phone: z
        .string()
        .min(7)
        .max(20)
        .optional(),
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const body = await request.json().catch(() => ({}));

    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
        return NextResponse.json(
            {
                success: false,
                message: "Validation failed",
                errors: validationResult.error.flatten().fieldErrors,
            },
            { status: 400 }
        );
    }

    const { email, password, firstName, lastName, phone } =
        validationResult.data;

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    if (existingUser) {
        return NextResponse.json(
            {
                success: false,
                message: "An account with this email already exists",
            },
            { status: 409 }
        );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const customerRole = await prisma.role.findFirst({
        where: {
            slug: "customer",
            sellerId: null,
        },
    });

    if (!customerRole) {
        return NextResponse.json(
            {
                success: false,
                message:
                    "Customer role has not been configured. Please run the database seed.",
            },
            { status: 500 }
        );
    }

    const user = await prisma.$transaction(async (tx) => {
        return tx.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                phone,
                roleAssignments: {
                    create: {
                        roleId: customerRole.id,
                    },
                },
                cart: {
                    create: {},
                },
                wishlist: {
                    create: {},
                },
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                status: true,
                createdAt: true,
                roleAssignments: {
                    select: {
                        role: {
                            select: {
                                slug: true,
                            },
                        },
                    },
                },
            },
        });
    });

    return NextResponse.json(
        {
            success: true,
            message: "Account created successfully",
            data: {
                user,
            },
        },
        { status: 201 }
    );
});
