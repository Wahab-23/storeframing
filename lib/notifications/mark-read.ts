import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { serializeNotification } from "./dto";

type MarkNotificationReadInput = {
    userId: string;
    id: string;
};

export async function markNotificationRead({
    userId,
    id,
}: MarkNotificationReadInput) {
    const notification = await prisma.notification.findFirst({
        where: {
            id,
            userId,
        },
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
    });

    if (!notification) {
        throw new AppError(404, "Notification not found.");
    }

    if (notification.isRead) {
        return {
            status: 200,
            message: "Notification already marked as read.",
            data: {
                notification: serializeNotification(notification),
            },
        };
    }

    const updated = await prisma.notification.update({
        where: {
            id,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
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
    });

    return {
        status: 200,
        message: "Notification marked as read.",
        data: {
            notification: serializeNotification(updated),
        },
    };
}
