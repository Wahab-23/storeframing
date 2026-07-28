import { z } from "zod";

export const notificationsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    unreadOnly: z
        .preprocess((value) => {
            if (value === "true") {
                return true;
            }

            if (value === "false") {
                return false;
            }

            return undefined;
        }, z.boolean())
        .optional()
        .default(false),
});

export const markNotificationReadSchema = z.object({
    id: z.string().cuid2(),
});

export const markAllNotificationsReadSchema = z.object({});
