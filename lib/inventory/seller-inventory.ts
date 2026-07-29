import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import {
    inventoryAdjustmentSchema,
    inventoryMovementsQuerySchema,
    updateInventorySchema,
} from "@/lib/validators/inventory";
import { getSellerContext } from "@/lib/wallet/get-seller-context";

type SellerListingInventoryInput = {
    userId: string;
    listingId: string;
};

type SellerInventoryUpdateInput = {
    userId: string;
    listingId: string;
    body: unknown;
};

type SellerInventoryAdjustmentInput = {
    userId: string;
    listingId: string;
    body: unknown;
};

type SellerInventoryMovementsInput = {
    userId: string;
    listingId: string;
    query: unknown;
};

export async function getSellerListingInventory({
    userId,
    listingId,
}: SellerListingInventoryInput) {
    const seller = await getSellerContext(userId);

    const listing = await prisma.sellerListing.findFirst({
        where: {
            id: listingId,
            sellerId: seller.id,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });

    if (!listing) {
        throw new AppError(404, "Listing not found.");
    }

    const inventory = await prisma.inventory.findUnique({
        where: {
            listingId: listing.id,
        },
        select: {
            id: true,
            quantity: true,
            reservedQuantity: true,
            lowStockThreshold: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!inventory) {
        throw new AppError(404, "Inventory record not found.");
    }

    return {
        status: 200,
        message: "Inventory fetched successfully.",
        data: {
            inventory,
            availableQuantity: Math.max(
                inventory.quantity - inventory.reservedQuantity,
                0
            ),
        },
    };
}

export async function updateSellerListingInventory({
    userId,
    listingId,
    body,
}: SellerInventoryUpdateInput) {
    const seller = await getSellerContext(userId);
    const parsed = updateInventorySchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const listing = await prisma.sellerListing.findFirst({
        where: {
            id: listingId,
            sellerId: seller.id,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });

    if (!listing) {
        throw new AppError(404, "Listing not found.");
    }

    const inventory = await prisma.inventory.findUnique({
        where: {
            listingId: listing.id,
        },
        select: {
            id: true,
            quantity: true,
            reservedQuantity: true,
            lowStockThreshold: true,
        },
    });

    if (!inventory) {
        throw new AppError(404, "Inventory record not found.");
    }

    if (parsed.data.quantity < inventory.reservedQuantity) {
        throw new AppError(
            400,
            "Quantity cannot be lower than reserved quantity."
        );
    }

    const updatedInventory = await prisma.inventory.update({
        where: {
            id: inventory.id,
        },
        data: {
            quantity: parsed.data.quantity,
            ...(parsed.data.lowStockThreshold !== undefined && {
                lowStockThreshold: parsed.data.lowStockThreshold,
            }),
        },
        select: {
            id: true,
            quantity: true,
            reservedQuantity: true,
            lowStockThreshold: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return {
        status: 200,
        message: "Inventory updated successfully.",
        data: {
            inventory: updatedInventory,
        },
    };
}

export async function adjustSellerListingInventory({
    userId,
    listingId,
    body,
}: SellerInventoryAdjustmentInput) {
    const seller = await getSellerContext(userId);
    const parsed = inventoryAdjustmentSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const listing = await prisma.sellerListing.findFirst({
        where: {
            id: listingId,
            sellerId: seller.id,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });

    if (!listing) {
        throw new AppError(404, "Listing not found.");
    }

    const inventory = await prisma.inventory.findUnique({
        where: {
            listingId: listing.id,
        },
        select: {
            id: true,
            quantity: true,
            reservedQuantity: true,
        },
    });

    if (!inventory) {
        throw new AppError(404, "Inventory record not found.");
    }

    const isStockIncrease =
        parsed.data.type === "INBOUND" || parsed.data.type === "RETURN";
    const isStockDecrease = parsed.data.type === "DAMAGE";

    const newQuantity = isStockIncrease
        ? inventory.quantity + parsed.data.quantity
        : isStockDecrease
            ? inventory.quantity - parsed.data.quantity
            : parsed.data.quantity;

    if (newQuantity < inventory.reservedQuantity) {
        throw new AppError(
            400,
            "Adjustment would reduce stock below reserved quantity."
        );
    }

    if (newQuantity < 0) {
        throw new AppError(400, "Inventory quantity cannot be negative.");
    }

    const result = await prisma.$transaction(async (tx) => {
        const updatedInventory = await tx.inventory.update({
            where: {
                id: inventory.id,
            },
            data: {
                quantity: newQuantity,
            },
            select: {
                id: true,
                quantity: true,
                reservedQuantity: true,
                lowStockThreshold: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        const movement = await tx.inventoryMovement.create({
            data: {
                inventoryId: inventory.id,
                type: parsed.data.type,
                quantity: parsed.data.quantity,
                quantityBefore: inventory.quantity,
                quantityAfter: newQuantity,
                referenceType: "MANUAL_ADJUSTMENT",
                referenceId: listing.id,
                note: parsed.data.note,
            },
            select: {
                id: true,
                type: true,
                quantity: true,
                quantityBefore: true,
                quantityAfter: true,
                referenceType: true,
                referenceId: true,
                note: true,
                createdAt: true,
            },
        });

        return {
            inventory: updatedInventory,
            movement,
        };
    });

    return {
        status: 200,
        message: "Inventory adjusted successfully.",
        data: result,
    };
}

export async function listSellerInventoryMovements({
    userId,
    listingId,
    query,
}: SellerInventoryMovementsInput) {
    const seller = await getSellerContext(userId);
    const parsed = inventoryMovementsQuerySchema.safeParse(query);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const listing = await prisma.sellerListing.findFirst({
        where: {
            id: listingId,
            sellerId: seller.id,
            deletedAt: null,
        },
        select: {
            id: true,
        },
    });

    if (!listing) {
        throw new AppError(404, "Listing not found.");
    }

    const { page, limit, type, from, to } = parsed.data;
    const where = {
        inventory: {
            listingId: listing.id,
        },
        ...(type ? { type } : {}),
        ...((from || to)
            ? {
                  createdAt: {
                      ...(from ? { gte: new Date(from) } : {}),
                      ...(to ? { lte: new Date(to) } : {}),
                  },
              }
            : {}),
    };

    const [movements, total] = await prisma.$transaction([
        prisma.inventoryMovement.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                type: true,
                quantity: true,
                quantityBefore: true,
                quantityAfter: true,
                referenceType: true,
                referenceId: true,
                note: true,
                createdAt: true,
            },
        }),
        prisma.inventoryMovement.count({ where }),
    ]);

    return {
        status: 200,
        message: "Inventory movements fetched successfully.",
        data: {
            movements,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        },
    };
}
