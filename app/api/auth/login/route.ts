import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createAccessToken } from "@/lib/auth";

const loginSchema = z.object({
    email: z
        .email("Please provide a valid email address")
        .transform((email) => email.toLowerCase().trim()),

    password: z.string().min(1, "Please provide a password"),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validationResult = loginSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password",
                },
                { status: 400 }
            );
        }

        const { email, password } = validationResult.data;

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
            include: {
                roleAssignments: {
                    include: {
                        role: true,
                    },
                },
            },
        });

        if (!user || user.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password",
                },
                { status: 401 }
            );
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid email or password",
                },
                { status: 401 }
            );
        }

        const accessToken = await createAccessToken({
            userId: user.id,
        });

        const response = NextResponse.json(
            {
                success: true,
                message: "Login successful",
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        roles: user.roleAssignments.map(
                            (assignment) => assignment.role.slug
                        ),
                    },
                },
            },
            { status: 200 }
        );

        response.cookies.set({
            name: "access_token",
            value: accessToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);

        return NextResponse.json(
            {
                success: false,
                message: "Something went wrong while logging in",
            },
            { status: 500 }
        );
    }
}