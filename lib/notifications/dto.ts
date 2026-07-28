import { NotificationItem } from "./types";

export function serializeNotification(notification: NotificationItem) {
    return {
        id: notification.id,
        type: notification.type,
        channel: notification.channel,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: notification.isRead,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
    };
}
