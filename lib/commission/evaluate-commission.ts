import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import { roundMoney } from "@/lib/pricing/rounding";

type EvaluateCommissionInput = {
    sellerId: string;
    categoryIds: string[];
    productIds: string[];
    sellerSubtotal: number;
};

export async function evaluateCommission({
    sellerId,
    categoryIds,
    productIds,
    sellerSubtotal,
}: EvaluateCommissionInput) {
    const seller = await prisma.seller.findUnique({
        where: {
            id: sellerId,
        },
        select: {
            sellerGroupId: true,
            commissionRate: true,
        },
    });

    if (!seller) {
        throw new AppError(404, "Seller not found.");
    }

    if (seller.commissionRate != null) {
        const commissionAmount = roundMoney(
            sellerSubtotal * (Number(seller.commissionRate) / 100)
        );

        return {
            source: "SELLER_RATE" as const,
            ruleId: null as string | null,
            commissionType: "PERCENTAGE" as const,
            commissionRate: Number(seller.commissionRate),
            fixedAmount: null as number | null,
            commissionAmount,
        };
    }

    const now = new Date();
    const scopeConditions = [
        { sellerId },
        ...(seller.sellerGroupId
            ? [{ sellerGroupId: seller.sellerGroupId }]
            : []),
        ...(categoryIds.length > 0
            ? [{ categoryId: { in: categoryIds } }]
            : []),
        ...(productIds.length > 0
            ? [{ productId: { in: productIds } }]
            : []),
    ];

    const rules = await prisma.commissionRule.findMany({
        where: {
            isActive: true,
            OR: scopeConditions,
        },
        orderBy: [
            {
                priority: "desc",
            },
            {
                id: "asc",
            },
        ],
        select: {
            id: true,
            sellerId: true,
            sellerGroupId: true,
            categoryId: true,
            productId: true,
            commissionType: true,
            percentage: true,
            fixedAmount: true,
            minimumOrderAmount: true,
            maximumOrderAmount: true,
            startAt: true,
            endAt: true,
            priority: true,
        },
    });

    const rule = rules.find(
        (item) =>
            item.commissionType &&
            (!item.startAt || item.startAt <= now) &&
            (!item.endAt || item.endAt >= now) &&
            (item.minimumOrderAmount == null ||
                sellerSubtotal >= Number(item.minimumOrderAmount)) &&
            (item.maximumOrderAmount == null ||
                sellerSubtotal <= Number(item.maximumOrderAmount))
    );

    if (!rule) {
        return {
            source: "DEFAULT" as const,
            ruleId: null as string | null,
            commissionType: null as "PERCENTAGE" | "FIXED_AMOUNT" | null,
            commissionRate: null as number | null,
            fixedAmount: null as number | null,
            commissionAmount: 0,
        };
    }

    if (
        rule.commissionType === "PERCENTAGE" &&
        rule.percentage != null &&
        rule.fixedAmount == null
    ) {
        return {
            source: "RULE" as const,
            ruleId: rule.id,
            commissionType: "PERCENTAGE" as const,
            commissionRate: Number(rule.percentage),
            fixedAmount: null as number | null,
            commissionAmount: roundMoney(
                sellerSubtotal * (Number(rule.percentage) / 100)
            ),
        };
    }

    if (
        rule.commissionType === "FIXED_AMOUNT" &&
        rule.fixedAmount != null &&
        rule.percentage == null
    ) {
        return {
            source: "RULE" as const,
            ruleId: rule.id,
            commissionType: "FIXED_AMOUNT" as const,
            commissionRate: null as number | null,
            fixedAmount: Number(rule.fixedAmount),
            commissionAmount: roundMoney(
                Math.min(Number(rule.fixedAmount), sellerSubtotal)
            ),
        };
    }

    throw new AppError(500, "Commission rule is misconfigured.");
}
