import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/admin/require-permission";
import { withApiHandler } from "@/lib/api-handler";
import { AppError } from "@/lib/errors";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

function cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
        (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
        [[]]
    );
}

export const POST = withApiHandler(async (request: NextRequest, context: RouteContext) => {
    await requirePermission(request, "admin:products:write");
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            configurableOptions: {
                include: {
                    values: {
                        orderBy: { position: "asc" }
                    }
                },
                orderBy: { position: "asc" }
            }
        }
    });

    if (!product) {
        throw new AppError(404, "Product not found.");
    }

    if (!product.configurableOptions || product.configurableOptions.length === 0) {
        throw new AppError(400, "Please add at least one configurable option before generating matrix variants.");
    }

    // Filter options that have at least 1 value
    const validOptions = product.configurableOptions.filter(opt => opt.values.length > 0);
    if (validOptions.length === 0) {
        throw new AppError(400, "Configurable options must have option values to generate variants.");
    }

    // Extract arrays of values
    const optionValuesArrays = validOptions.map(opt => opt.values);
    const combinations = cartesianProduct(optionValuesArrays);

    const generatedVariants = await prisma.$transaction(async (tx) => {
        // Delete existing configurable variant links & variants for this product
        const existingVariants = await tx.productVariant.findMany({
            where: { productId: id },
            select: { id: true }
        });

        const variantIds = existingVariants.map(v => v.id);
        if (variantIds.length > 0) {
            await tx.productVariantConfigurableValue.deleteMany({
                where: { variantId: { in: variantIds } }
            });
            await tx.productVariant.deleteMany({
                where: { productId: id }
            });
        }

        const createdVariants = [];

        for (let i = 0; i < combinations.length; i++) {
            const combo = combinations[i];
            const name = combo.map(v => v.label).join(" / ");
            const skuSuffix = combo.map(v => v.value.toUpperCase().replace(/[^A-Z0-9]/g, "")).join("-");
            const sku = `${product.slug.toUpperCase()}-${skuSuffix || i + 1}`;

            // Total price delta calculation
            const priceDeltaSum = combo.reduce((sum, v) => sum + (v.priceDelta ? Number(v.priceDelta) : 0), 0);

            const variant = await tx.productVariant.create({
                data: {
                    productId: id,
                    name,
                    sku,
                    priceDelta: priceDeltaSum !== 0 ? priceDeltaSum : null,
                    configurableValues: {
                        create: combo.map(val => ({
                            optionValueId: val.id
                        }))
                    }
                },
                include: {
                    configurableValues: {
                        include: {
                            optionValue: {
                                include: {
                                    option: true
                                }
                            }
                        }
                    }
                }
            });

            createdVariants.push(variant);
        }

        return createdVariants;
    });

    return {
        data: generatedVariants,
        message: `Successfully generated ${generatedVariants.length} matrix variant combinations.`
    };
});
