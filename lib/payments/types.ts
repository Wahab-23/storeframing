import { Prisma } from "@/generated/prisma/client";

export type PaymentWithOrder = Prisma.PaymentGetPayload<{
    include: {
        order: {
            include: {
                payments: true;
                sellerOrders: true;
            };
        };
    };
}>;
