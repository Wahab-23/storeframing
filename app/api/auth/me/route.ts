import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get("access_token")?.value;

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        const payload = await verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                status: true,

                roleAssignments: {
                    select: {
                        role: {
                            select: {
                                slug: true,
                            },
                        },
                    },
                },

                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        status: true,
                        verificationStatus: true,
                    },
                },
            },
        });

        if (!user || user.status !== "ACTIVE") {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized",
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                user,
            },
        });
    } catch {
        return NextResponse.json(
            {
                success: false,
                message: "Unauthorized",
            },
            { status: 401 }
        );
    }
}