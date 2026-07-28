import { prisma } from "@/lib/prisma";

type MarkAllNotificationsReadInput = {
    userId: string;
};

export async function markAllNotificationsRead({
    userId,
}: MarkAllNotificationsReadInput) {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    });

    return {
        status: 200,
        message: "Notifications marked as read.",
        data: {
            updatedCount: result.count,
        },
    };
}
