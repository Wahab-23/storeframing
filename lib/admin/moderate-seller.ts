import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { adminSellerStatusSchema } from "@/lib/validators/admin-moderation";

type ModerateSellerInput = {
    adminId: string;
    sellerId: string;
    body: unknown;
};

export async function moderateSeller({
    adminId,
    sellerId,
    body,
}: ModerateSellerInput) {
    const parsed = adminSellerStatusSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const seller = await prisma.seller.findUnique({
        where: {
            id: sellerId,
        },
        select: {
            id: true,
            status: true,
            userId: true,
        },
    });

    if (!seller) {
        throw new AppError(404, "Seller not found.");
    }

    if (seller.status === parsed.data.status) {
        return {
            status: 200,
            message: "Seller status is already up to date.",
            data: {
                seller,
            },
        };
    }

    const updatedSeller = await prisma.$transaction(async (tx) => {
        const updated = await tx.seller.update({
            where: {
                id: sellerId,
            },
            data: {
                status: parsed.data.status,
            },
            select: {
                id: true,
                status: true,
                userId: true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action:
                    parsed.data.status === "SUSPENDED"
                        ? "SUSPEND"
                        : "RESTORE",
                entityType: "SELLER",
                entityId: sellerId,
                oldData: {
                    status: seller.status,
                },
                newData: {
                    status: parsed.data.status,
                },
            },
        });

        await tx.notification.create({
            data: {
                userId: seller.userId,
                type: "SELLER",
                channel: "IN_APP",
                title:
                    parsed.data.status === "SUSPENDED"
                        ? "Seller account suspended"
                        : "Seller account restored",
                message:
                    parsed.data.status === "SUSPENDED"
                        ? "Your seller account has been suspended by an administrator."
                        : "Your seller account has been restored by an administrator.",
                data: {
                    sellerId,
                    status: parsed.data.status,
                },
            },
        });

        return updated;
    });

    return {
        status: 200,
        message: "Seller status updated successfully.",
        data: {
            seller: updatedSeller,
        },
    };
}
