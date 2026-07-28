import { randomUUID } from "crypto";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { placeOrderSchema } from "@/lib/validators/checkout";
import { calculateCart } from "@/lib/cart/calculate-cart";
import { getAvailableInventory } from "@/lib/cart/inventory";
import { getOrCreateCart } from "@/lib/cart/getCart";
import { getShippingFee } from "@/lib/checkout/helpers";
import { couponCartItemInclude, couponWithRelationsInclude } from "@/lib/coupons/constants";
import { calculateCouponDiscount } from "@/lib/coupons/helpers";

type PlaceOrderInput = {
    userId: string;
    body: unknown;
};

function makeOrderNumber(prefix: string) {
    return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function roundMoney(value: number) {
    return Math.round(value * 100) / 100;
}

export async function placeOrder({
    userId,
    body,
}: PlaceOrderInput) {
    const parsed = placeOrderSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const cart = await getOrCreateCart(userId);

    const currentCart = await prisma.cart.findUnique({
        where: {
            id: cart.id,
        },
        include: {
            items: {
                include: couponCartItemInclude,
            },
        },
    });

    if (!currentCart || currentCart.items.length === 0) {
        throw new AppError(400, "Cart is empty.");
    }

    const [billingAddress, shippingAddress] = await Promise.all([
        prisma.address.findFirst({
            where: {
                id: parsed.data.billingAddressId,
                userId,
            },
        }),
        prisma.address.findFirst({
            where: {
                id: parsed.data.shippingAddressId,
                userId,
            },
        }),
    ]);

    if (!billingAddress || !shippingAddress) {
        throw new AppError(404, "Address not found.");
    }

    const summary = await calculateCart(cart.id);
    const shippingFee = getShippingFee(
        parsed.data.shippingMethod,
        summary.summary.subtotal
    );
    const couponCode = parsed.data.couponCode ?? null;

    const orderNumber = makeOrderNumber("ORD");

    const result = await prisma.$transaction(async (tx) => {
        const freshCart = await tx.cart.findUnique({
            where: {
                id: cart.id,
            },
            include: {
                items: {
                    include: couponCartItemInclude,
                },
            },
        });

        if (!freshCart || freshCart.items.length === 0) {
            throw new AppError(400, "Cart is empty.");
        }

        for (const item of freshCart.items) {
            const inventory =
                item.listingVariant?.inventory ??
                item.listing.inventory;

            if (!inventory) {
                throw new AppError(
                    400,
                    "Inventory not configured."
                );
            }

            const availableQuantity = getAvailableInventory(
                inventory.quantity,
                inventory.reservedQuantity
            );

            if (availableQuantity < item.quantity) {
                throw new AppError(
                    409,
                    `Only ${availableQuantity} item(s) available for ${item.product.name}.`
                );
            }
        }

        const sellerBuckets = new Map<
            string,
            typeof freshCart.items
        >();

        for (const item of freshCart.items) {
            const sellerId = item.listing.seller.id;
            const bucket = sellerBuckets.get(sellerId) ?? [];
            bucket.push(item);
            sellerBuckets.set(sellerId, bucket);
        }

        let couponEvaluation: {
            itemDiscountAmount: number;
            shippingDiscountAmount: number;
            discountAmount: number;
            eligibleSubtotal: number;
            eligibleSellerSubtotals: Map<string, number>;
        } | null = null;

        if (couponCode) {
            const coupon = await tx.coupon.findUnique({
                where: {
                    code: couponCode,
                },
                include: couponWithRelationsInclude,
            });

            if (!coupon) {
                throw new AppError(404, "Coupon not found.");
            }

            if (coupon.status !== "ACTIVE") {
                throw new AppError(400, "Coupon is not active.");
            }

            const now = new Date();

            if (coupon.startsAt && coupon.startsAt > now) {
                throw new AppError(400, "Coupon is not active yet.");
            }

            if (coupon.expiresAt && coupon.expiresAt < now) {
                throw new AppError(400, "Coupon has expired.");
            }

            if (
                coupon.usageLimit != null &&
                coupon.usedCount >= coupon.usageLimit
            ) {
                throw new AppError(400, "Coupon usage limit reached.");
            }

            const couponUsageCount = await tx.couponUsage.count({
                where: {
                    couponId: coupon.id,
                    userId,
                },
            });

            if (
                coupon.usagePerUser != null &&
                couponUsageCount >= coupon.usagePerUser
            ) {
                throw new AppError(
                    400,
                    "You have already used this coupon."
                );
            }

            if (coupon.minimumOrderAmount != null) {
                const minimumOrderAmount = Number(coupon.minimumOrderAmount);

                if (summary.summary.subtotal < minimumOrderAmount) {
                    throw new AppError(
                        400,
                        `Minimum order amount of PKR ${minimumOrderAmount} is required for this coupon.`
                    );
                }
            }

            if (coupon.scope === "SELLER" && !coupon.sellerId) {
                throw new AppError(
                    400,
                    "Coupon is not configured correctly."
                );
            }

            const evaluation = calculateCouponDiscount({
                coupon,
                items: freshCart.items,
                subtotal: summary.summary.subtotal,
                shippingMethod: parsed.data.shippingMethod,
            });

            if (evaluation.discountAmount <= 0) {
                throw new AppError(
                    400,
                    "Coupon does not apply to the current cart."
                );
            }

            couponEvaluation = evaluation;
        }

        const orderSubtotal = summary.summary.subtotal;
        const itemDiscountAmount = couponEvaluation?.itemDiscountAmount ?? 0;
        const shippingDiscountAmount =
            couponEvaluation?.shippingDiscountAmount ?? 0;
        const orderShippingAmount = roundMoney(
            Math.max(shippingFee - shippingDiscountAmount, 0)
        );
        const orderTotal =
            orderSubtotal -
            itemDiscountAmount +
            orderShippingAmount +
            summary.summary.tax;

        const sellerDiscounts = new Map<string, number>();

        if (couponEvaluation && couponEvaluation.itemDiscountAmount > 0) {
            const eligibleSellerIds = [
                ...couponEvaluation.eligibleSellerSubtotals.keys(),
            ];

            let allocatedDiscount = 0;

            eligibleSellerIds.forEach((sellerId, index) => {
                const eligibleSubtotal =
                    couponEvaluation.eligibleSellerSubtotals.get(sellerId) ?? 0;

                let sellerDiscount = roundMoney(
                    couponEvaluation.eligibleSubtotal > 0
                        ? couponEvaluation.itemDiscountAmount *
                              (eligibleSubtotal /
                                  couponEvaluation.eligibleSubtotal)
                        : 0
                );

                if (index === eligibleSellerIds.length - 1) {
                    sellerDiscount = roundMoney(
                        couponEvaluation.itemDiscountAmount - allocatedDiscount
                    );
                } else {
                    allocatedDiscount = roundMoney(
                        allocatedDiscount + sellerDiscount
                    );
                }

                sellerDiscounts.set(sellerId, sellerDiscount);
            });
        }

        const order = await tx.order.create({
            data: {
                userId,
                orderNumber,
                status: "PENDING",
                subtotal: orderSubtotal,
                shippingAmount: orderShippingAmount,
                discountAmount:
                    itemDiscountAmount + shippingDiscountAmount,
                taxAmount: summary.summary.tax,
                totalAmount: orderTotal,
                currency: "PKR",
                billingAddress: billingAddress,
                shippingAddress: shippingAddress,
                customerNote: parsed.data.customerNote ?? null,
            },
        });

        for (const [sellerId, items] of sellerBuckets.entries()) {
            const sellerSubtotal = items.reduce(
                (total, item) =>
                    total + Number(item.unitPrice) * item.quantity,
                0
            );
            const sellerDiscount = sellerDiscounts.get(sellerId) ?? 0;

            const sellerOrderNumber = makeOrderNumber("SO");

            const sellerOrder = await tx.sellerOrder.create({
                data: {
                    orderId: order.id,
                    sellerId,
                    sellerOrderNumber,
                    status: "PENDING",
                    subtotal: sellerSubtotal,
                    shippingAmount: 0,
                    discountAmount: sellerDiscount,
                    taxAmount: 0,
                    commissionAmount: 0,
                    sellerEarning: roundMoney(
                        sellerSubtotal - sellerDiscount
                    ),
                    totalAmount: roundMoney(
                        sellerSubtotal - sellerDiscount
                    ),
                },
            });

            for (const item of items) {
                const inventoryRecord =
                    item.listingVariant?.inventory ??
                    item.listing.inventory;

                if (!inventoryRecord) {
                    throw new AppError(
                        400,
                        "Inventory not configured."
                    );
                }

                const inventory = inventoryRecord;

                const quantityBefore = inventory.quantity;
                const quantityAfter =
                    inventory.quantity - item.quantity;

                await tx.inventory.update({
                    where: {
                        id: inventory.id,
                    },
                    data: {
                        quantity: quantityAfter,
                    },
                });

                await tx.inventoryMovement.create({
                    data: {
                        inventoryId: inventory.id,
                        type: "SALE",
                        quantity: item.quantity,
                        quantityBefore,
                        quantityAfter,
                        referenceType: "ORDER",
                        referenceId: order.id,
                        note: `Order ${orderNumber}`,
                    },
                });

                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        sellerOrderId: sellerOrder.id,
                        productId: item.product.id,
                        listingId: item.listing.id,
                        variantId: item.listingVariant?.variant?.id ?? null,
                        listingVariantId: item.listingVariant?.id ?? null,
                        productName: item.product.name,
                        sku: item.listingVariant?.variant?.sku ?? item.listing.sellerSku,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discountAmount: 0,
                        taxAmount: 0,
                        totalAmount:
                            Number(item.unitPrice) * item.quantity,
                        productSnapshot: {
                            product: item.product,
                            listing: {
                                id: item.listing.id,
                                sellerSku: item.listing.sellerSku,
                                price: Number(item.unitPrice),
                                compareAtPrice: item.listing.compareAtPrice
                                    ? Number(item.listing.compareAtPrice)
                                    : null,
                                condition: item.listing.condition,
                            },
                            variant: item.listingVariant
                                ? {
                                      id: item.listingVariant.id,
                                      price: Number(item.listingVariant.price),
                                      compareAtPrice: item.listingVariant.compareAtPrice
                                          ? Number(item.listingVariant.compareAtPrice)
                                          : null,
                                      variant: item.listingVariant.variant,
                                  }
                                : null,
                        },
                    },
                });
            }
        }

        await tx.payment.create({
            data: {
                orderId: order.id,
                method: parsed.data.paymentMethod,
                status: "PENDING",
                amount: orderTotal,
                currency: "PKR",
                metadata: {
                    shippingMethod: parsed.data.shippingMethod,
                    ...(couponCode ? { couponCode } : {}),
                },
            },
        });

        if (couponEvaluation && couponCode) {
            const coupon = await tx.coupon.findUniqueOrThrow({
                where: {
                    code: couponCode,
                },
                select: {
                    id: true,
                },
            });

            await tx.couponUsage.create({
                data: {
                    couponId: coupon.id,
                    userId,
                    orderId: order.id,
                    discountAmount: couponEvaluation.discountAmount,
                },
            });

            await tx.coupon.update({
                where: {
                    code: couponCode,
                },
                data: {
                    usedCount: {
                        increment: 1,
                    },
                },
            });
        }

        await tx.cartItem.deleteMany({
            where: {
                cartId: cart.id,
            },
        });

        await tx.cart.update({
            where: {
                id: cart.id,
            },
            data: {
                status: "CONVERTED",
            },
        });

        return tx.order.findUniqueOrThrow({
            where: {
                id: order.id,
            },
            include: {
                items: true,
                sellerOrders: true,
                payments: true,
            },
        });
    });

    return {
        status: 201,
        message: "Order placed successfully.",
        data: {
            order: result,
        },
    };
}
