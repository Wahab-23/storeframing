import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { adminUserStatusSchema } from "@/lib/validators/admin-moderation";

type ModerateUserInput = {
    adminId: string;
    userId: string;
    body: unknown;
};

export async function moderateUser({
    adminId,
    userId,
    body,
}: ModerateUserInput) {
    const parsed = adminUserStatusSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const targetUser = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
        },
    });

    if (!targetUser) {
        throw new AppError(404, "User not found.");
    }

    if (targetUser.status === parsed.data.status) {
        return {
            status: 200,
            message: "User status is already up to date.",
            data: {
                user: targetUser,
            },
        };
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
            where: {
                id: userId,
            },
            data: {
                status: parsed.data.status,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action:
                    parsed.data.status === "SUSPENDED"
                        ? "SUSPEND"
                        : "RESTORE",
                entityType: "USER",
                entityId: userId,
                oldData: {
                    status: targetUser.status,
                },
                newData: {
                    status: parsed.data.status,
                },
            },
        });

        await tx.notification.create({
            data: {
                userId: userId,
                type: "SYSTEM",
                channel: "IN_APP",
                title:
                    parsed.data.status === "SUSPENDED"
                        ? "Account suspended"
                        : "Account restored",
                message:
                    parsed.data.status === "SUSPENDED"
                        ? "Your account has been suspended by an administrator."
                        : "Your account has been restored by an administrator.",
                data: {
                    userId,
                    status: parsed.data.status,
                },
            },
        });

        return updated;
    });

    return {
        status: 200,
        message: "User status updated successfully.",
        data: {
            user: updatedUser,
        },
    };
}
