import { prisma } from "@/lib/prisma";

import { getCachedPermissions, setCachedPermissions } from "./permission-cache";

export async function getAdminPermissions(userId: string) {
    const cached = getCachedPermissions(userId);

    if (cached) {
        return cached;
    }

    const assignments = await prisma.userRoleAssignment.findMany({
        where: {
            userId,
        },
        select: {
            role: {
                select: {
                    slug: true,
                    permissions: {
                        select: {
                            permission: {
                                select: {
                                    slug: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    const values = Array.from(
        new Set(assignments.flatMap((assignment) => assignment.role.permissions.map((permission) => permission.permission.slug)))
    );
    setCachedPermissions(userId, values);
    return values;
}

