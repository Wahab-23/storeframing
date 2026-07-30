import { CommissionType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CommissionTargetInput = {
    sellerId: string;
    sellerGroupId?: string | null;
    categoryId?: string | null;
    productId?: string | null;
    orderAmount: number;
};

export type CalculatedCommissionResult = {
    ruleId: string | null;
    commissionType: CommissionType;
    rate: number; // Percentage or fixed amount value
    calculatedCommission: number;
    netSellerEarning: number;
};

/**
 * Calculates commission according to precedence:
 * Product Rule -> Seller Group Rule -> Seller Rule -> Category Rule -> Global Rule
 */
export async function calculateCommission(
    input: CommissionTargetInput,
    tx?: Prisma.TransactionClient
): Promise<CalculatedCommissionResult> {
    const db = tx ?? prisma;
    const now = new Date();

    const rules = await db.commissionRule.findMany({
        where: {
            isActive: true,
            AND: [
                { OR: [{ startAt: null }, { startAt: { lte: now } }] },
                { OR: [{ endAt: null }, { endAt: { gte: now } }] },
                { OR: [{ minimumOrderAmount: null }, { minimumOrderAmount: { lte: input.orderAmount } }] },
                { OR: [{ maximumOrderAmount: null }, { maximumOrderAmount: { gte: input.orderAmount } }] },
            ],
        },
        orderBy: [{ priority: "desc" }],
    });

    let matchedRule: (typeof rules)[0] | undefined;

    // 1. Product Rule
    if (input.productId) {
        matchedRule = rules.find((r) => r.productId === input.productId);
    }

    // 2. Seller Group Rule
    if (!matchedRule && input.sellerGroupId) {
        matchedRule = rules.find((r) => r.sellerGroupId === input.sellerGroupId);
    }

    // 3. Seller Rule
    if (!matchedRule) {
        matchedRule = rules.find((r) => r.sellerId === input.sellerId);
    }

    // 4. Category Rule
    if (!matchedRule && input.categoryId) {
        matchedRule = rules.find((r) => r.categoryId === input.categoryId);
    }

    // 5. Global Rule
    if (!matchedRule) {
        matchedRule = rules.find(
            (r) => !r.productId && !r.sellerGroupId && !r.sellerId && !r.categoryId
        );
    }

    if (!matchedRule) {
        // Fallback default: 10% percentage commission
        const fallbackRate = 10;
        const commissionAmount = Math.round(input.orderAmount * (fallbackRate / 100) * 100) / 100;
        return {
            ruleId: null,
            commissionType: "PERCENTAGE",
            rate: fallbackRate,
            calculatedCommission: commissionAmount,
            netSellerEarning: Math.max(0, input.orderAmount - commissionAmount),
        };
    }

    let calculatedCommission = 0;
    let rate = 0;

    if (matchedRule.commissionType === "PERCENTAGE") {
        rate = matchedRule.percentage ? Number(matchedRule.percentage) : 0;
        calculatedCommission = Math.round(input.orderAmount * (rate / 100) * 100) / 100;
    } else {
        rate = matchedRule.fixedAmount ? Number(matchedRule.fixedAmount) : 0;
        calculatedCommission = Math.min(input.orderAmount, rate);
    }

    const netSellerEarning = Math.max(0, input.orderAmount - calculatedCommission);

    return {
        ruleId: matchedRule.id,
        commissionType: matchedRule.commissionType,
        rate,
        calculatedCommission,
        netSellerEarning,
    };
}
