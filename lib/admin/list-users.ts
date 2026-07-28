import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import {
    adminUsersQuerySchema,
} from "@/lib/validators/admin";
import { serializeAdminPagination } from "./dto";

type ListUsersInput = {
    query: unknown;
};

export async function listAdminUsers({ query }: ListUsersInput) {
    const parsed = adminUsersQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, status, search } = parsed.data;
    const where = {
        ...(status ? { status } : {}),
        ...(search
            ? {
                  OR: [
                      { email: { contains: search, mode: "insensitive" as const } },
                      { firstName: { contains: search, mode: "insensitive" as const } },
                      { lastName: { contains: search, mode: "insensitive" as const } },
                      { phone: { contains: search, mode: "insensitive" as const } },
                  ],
              }
            : {}),
    };

    const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                avatarUrl: true,
                status: true,
                createdAt: true,
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        status: true,
                        verificationStatus: true,
                    },
                },
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
        }),
        prisma.user.count({ where }),
    ]);

    return {
        status: 200,
        message: "Users fetched successfully.",
        data: {
            users,
            pagination: serializeAdminPagination(page, limit, total),
        },
    };
}
