import { Prisma } from "@/generated/prisma/client";

export type NotificationItem = Prisma.NotificationGetPayload<{
    select: {
        id: true;
        type: true;
        channel: true;
        title: true;
        message: true;
        data: true;
        isRead: true;
        readAt: true;
        createdAt: true;
    };
}>;
