import { prisma } from "@/lib/prisma";
import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret) {
    throw new Error("JWT_SECRET is not defined");
}

const secretKey = new TextEncoder().encode(secret);

export async function createAccessToken(payload: {
    userId: string;
}) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secretKey);
}

export async function verifyAccessToken(token: string) {
    const { payload } = await jwtVerify(token, secretKey);

    return payload as {
        userId: string;
    };
}

export async function userHasRole(
    userId: string,
    roleSlug: string
) {
    const roleAssignment =
        await prisma.userRoleAssignment.findFirst({
            where: {
                userId,
                role: {
                    slug: roleSlug,
                },
            },
            select: {
                id: true,
            },
        });

    return Boolean(roleAssignment);
}

export async function userHasPermission(
    userId: string,
    permissionSlug: string
) {
    const assignment =
        await prisma.userRoleAssignment.findFirst({
            where: {
                userId,
                role: {
                    permissions: {
                        some: {
                            permission: {
                                slug: permissionSlug,
                            },
                        },
                    },
                },
            },
            select: {
                id: true,
            },
        });

    return Boolean(assignment);
}