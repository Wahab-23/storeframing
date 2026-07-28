import { Prisma } from "@/generated/prisma/client";

export type SellerWalletWithSeller = Prisma.SellerWalletGetPayload<{
    include: {
        seller: {
            select: {
                id: true;
                shopName: true;
                slug: true;
                status: true;
            };
        };
    };
}>;

export type SellerWalletTransactionItem = Prisma.SellerWalletTransactionGetPayload<{
    select: {
        id: true;
        type: true;
        amount: true;
        balanceAfter: true;
        referenceType: true;
        referenceId: true;
        description: true;
        createdAt: true;
    };
}>;

export type WithdrawalItem = Prisma.WithdrawalGetPayload<{
    select: {
        id: true;
        amount: true;
        status: true;
        payoutAccountSnapshot: true;
        transactionReference: true;
        adminNotes: true;
        processedAt: true;
        createdAt: true;
        updatedAt: true;
    };
}>;
