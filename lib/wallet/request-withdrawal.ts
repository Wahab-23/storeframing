import { Prisma } from "@/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { withdrawWalletSchema } from "@/lib/validators/wallet";

import { getSellerContext } from "./get-seller-context";
import {
    serializeWithdrawal,
    serializeWallet,
    serializeWalletTransaction,
} from "./dto";

type RequestWithdrawalInput = {
    userId: string;
    body: unknown;
};

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

export async function requestWithdrawal({
    userId,
    body,
}: RequestWithdrawalInput) {
    const seller = await getSellerContext(userId);
    const parsed = withdrawWalletSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const amount = roundMoney(parsed.data.amount);

    const defaultPayoutAccount = await prisma.sellerPayoutAccount.findFirst({
        where: {
            sellerId: seller.id,
            isDefault: true,
        },
        select: {
            id: true,
            provider: true,
            accountName: true,
            accountNumber: true,
            bankName: true,
            branchName: true,
            isDefault: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!defaultPayoutAccount) {
        throw new AppError(
            400,
            "No default payout account found for this seller."
        );
    }

    const result = await prisma.$transaction(async (tx) => {
        const wallet = await tx.sellerWallet.upsert({
            where: {
                sellerId: seller.id,
            },
            update: {},
            create: {
                sellerId: seller.id,
            },
        });

        if (Number(wallet.withdrawableBalance) < amount) {
            throw new AppError(
                409,
                "Insufficient withdrawable balance."
            );
        }

        const updatedWallet = await tx.sellerWallet.update({
            where: {
                sellerId: seller.id,
            },
            data: {
                withdrawableBalance: {
                    decrement: amount,
                },
                pendingBalance: {
                    increment: amount,
                },
            },
            include: {
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        slug: true,
                        status: true,
                    },
                },
            },
        });

        const payoutAccountSnapshot = {
            id: defaultPayoutAccount.id,
            provider: defaultPayoutAccount.provider,
            accountName: defaultPayoutAccount.accountName,
            accountNumber: defaultPayoutAccount.accountNumber,
            bankName: defaultPayoutAccount.bankName,
            branchName: defaultPayoutAccount.branchName,
            isDefault: defaultPayoutAccount.isDefault,
            isVerified: defaultPayoutAccount.isVerified,
        };

        const withdrawal = await tx.withdrawal.create({
            data: {
                sellerId: seller.id,
                amount,
                status: "PENDING",
                payoutAccountSnapshot: payoutAccountSnapshot as Prisma.InputJsonValue,
            },
            select: {
                id: true,
                amount: true,
                status: true,
                payoutAccountSnapshot: true,
                transactionReference: true,
                adminNotes: true,
                processedAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const transaction = await tx.sellerWalletTransaction.create({
            data: {
                sellerId: seller.id,
                sellerWalletId: updatedWallet.id,
                type: "WITHDRAWAL",
                amount,
                balanceAfter: roundMoney(
                    Number(updatedWallet.withdrawableBalance)
                ),
                referenceType: "WITHDRAWAL",
                referenceId: withdrawal.id,
                description: "Withdrawal request created.",
            },
            select: {
                id: true,
                type: true,
                amount: true,
                balanceAfter: true,
                referenceType: true,
                referenceId: true,
                description: true,
                createdAt: true,
            },
        });

        return {
            wallet: updatedWallet,
            withdrawal,
            transaction,
        };
    });

    return {
        status: 201,
        message: "Withdrawal request created successfully.",
        data: {
            wallet: serializeWallet(result.wallet),
            withdrawal: serializeWithdrawal(result.withdrawal),
            transaction: serializeWalletTransaction(result.transaction),
        },
    };
}
