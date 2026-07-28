import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { notificationsQuerySchema } from "@/lib/validators/notification";

import { serializeNotification } from "./dto";

type GetNotificationsInput = {
    userId: string;
    query: unknown;
};

export async function getNotifications({
    userId,
    query,
}: GetNotificationsInput) {
    const parsed = notificationsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const { page, limit, unreadOnly } = parsed.data;
    const where = {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await prisma.$transaction([
        prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                type: true,
                channel: true,
                title: true,
                message: true,
                data: true,
                isRead: true,
                readAt: true,
                createdAt: true,
            },
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
        status: 200,
        message: "Notifications fetched successfully.",
        data: {
            notifications: notifications.map(serializeNotification),
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
            },
        },
    };
}
