import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { adminProductStatusSchema } from "@/lib/validators/admin-moderation";

type ModerateProductInput = {
    adminId: string;
    productId: string;
    body: unknown;
};

export async function moderateProduct({
    adminId,
    productId,
    body,
}: ModerateProductInput) {
    const parsed = adminProductStatusSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const product = await prisma.product.findUnique({
        where: {
            id: productId,
        },
        select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            visibility: true,
            createdById: true,
        },
    });

    if (!product) {
        throw new AppError(404, "Product not found.");
    }

    const nextStatus = parsed.data.status ?? product.status;
    const nextVisibility = parsed.data.visibility ?? product.visibility;

    if (
        nextStatus === product.status &&
        nextVisibility === product.visibility
    ) {
        return {
            status: 200,
            message: "Product is already up to date.",
            data: {
                product,
            },
        };
    }

    const updatedProduct = await prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
            where: {
                id: productId,
            },
            data: {
                ...(parsed.data.status && {
                    status: parsed.data.status,
                }),
                ...(parsed.data.visibility && {
                    visibility: parsed.data.visibility,
                }),
            },
            select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                visibility: true,
                createdById: true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "UPDATE",
                entityType: "PRODUCT",
                entityId: productId,
                oldData: {
                    status: product.status,
                    visibility: product.visibility,
                },
                newData: {
                    status: updated.status,
                    visibility: updated.visibility,
                },
            },
        });

        if (product.createdById) {
            await tx.notification.create({
                data: {
                    userId: product.createdById,
                    type: "SYSTEM",
                    channel: "IN_APP",
                    title: "Product moderation update",
                    message:
                        "Your product has been reviewed by an administrator.",
                    data: {
                        productId,
                        status: updated.status,
                        visibility: updated.visibility,
                    },
                },
            });
        }

        return updated;
    });

    return {
        status: 200,
        message: "Product updated successfully.",
        data: {
            product: updatedProduct,
        },
    };
}
