import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth";

export async function getCurrentUser(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;

    if (!token) {
        return null;
    }

    try {
        const payload = await verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId,
            },
            include: {
                roleAssignments: {
                    include: {
                        role: true,
                    },
                },
                seller: true,
            },
        });

        if (!user || user.status !== "ACTIVE") {
            return null;
        }

        return user;
    } catch {
        return null;
    }
}