import {
    SellerWalletWithSeller,
    SellerWalletTransactionItem,
    WithdrawalItem,
} from "./types";

export function serializeWallet(wallet: SellerWalletWithSeller) {
    return {
        id: wallet.id,
        sellerId: wallet.sellerId,
        balance: Number(wallet.balance),
        pendingBalance: Number(wallet.pendingBalance),
        withdrawableBalance: Number(wallet.withdrawableBalance),
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
        seller: wallet.seller,
    };
}

export function serializeWalletTransaction(
    transaction: SellerWalletTransactionItem
) {
    return {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        balanceAfter: Number(transaction.balanceAfter),
        referenceType: transaction.referenceType,
        referenceId: transaction.referenceId,
        description: transaction.description,
        createdAt: transaction.createdAt,
    };
}

export function serializeWithdrawal(withdrawal: WithdrawalItem) {
    return {
        id: withdrawal.id,
        amount: Number(withdrawal.amount),
        status: withdrawal.status,
        payoutAccountSnapshot: withdrawal.payoutAccountSnapshot,
        transactionReference: withdrawal.transactionReference,
        adminNotes: withdrawal.adminNotes,
        processedAt: withdrawal.processedAt,
        createdAt: withdrawal.createdAt,
        updatedAt: withdrawal.updatedAt,
    };
}
