import { Prisma } from "@/generated/prisma/client";

import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import {
    sellerProductRevisionApprovalSchema,
    sellerProductRevisionPatchSchema,
    sellerProductSubmissionDraftSchema,
    sellerProductSubmissionSubmitSchema,
} from "@/lib/validators/product-workflow";

type SubmissionStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "PENDING_REVIEW"
    | "UNDER_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "RESUBMITTED";

type RevisionStatus =
    | "DRAFT"
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED"
    | "PUBLISHED";

type PaginationQuery = {
    page?: number;
    limit?: number;
};

type CreateSellerSubmissionInput = {
    sellerId: string;
    body: unknown;
};

type UpdateSellerSubmissionInput = {
    sellerId: string;
    submissionId: string;
    body: unknown;
};

type SubmitSellerSubmissionInput = {
    sellerId: string;
    submissionId: string;
};

type ReviewSellerSubmissionInput = {
    adminId: string;
    submissionId: string;
    reason?: string;
};

type CreateSellerRevisionInput = {
    sellerId: string;
    productId: string;
    body: unknown;
};

type UpdateSellerRevisionInput = {
    sellerId: string;
    revisionId: string;
    body: unknown;
};

type SubmitSellerRevisionInput = {
    sellerId: string;
    revisionId: string;
};

type ReviewSellerRevisionInput = {
    adminId: string;
    revisionId: string;
    reason?: string;
};

type NestedCategoryInput = {
    categoryId: string;
};

type NestedImageInput = {
    url: string;
    altText?: string | null;
    sortOrder?: number;
    isPrimary?: boolean;
};

type NestedAttributeInput = {
    attributeId: string;
    attributeValueId?: string | null;
    textValue?: string | null;
    integerValue?: number | null;
    decimalValue?: number | null;
    booleanValue?: boolean | null;
    dateValue?: Date | string | null;
    jsonValue?: Prisma.InputJsonValue | null;
};

type NestedVariantInput = {
    name: string;
    sku: string;
    price?: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    quantity?: number;
    lowStockThreshold?: number;
    attributes?: NestedAttributeInput[];
};

type WorkflowPayload = {
    name: string;
    slug: string;
    description?: string | null;
    shortDescription?: string | null;
    brandId?: string | null;
    productType?: "SIMPLE" | "VARIABLE" | "DIGITAL" | "VIRTUAL" | "SERVICE" | "BUNDLE";
    modelNumber?: string | null;
    manufacturer?: string | null;
    countryOfOrigin?: string | null;
    sellerSku?: string | null;
    price: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    condition?: "NEW" | "USED" | "REFURBISHED" | "OPEN_BOX";
    warrantyTitle?: string | null;
    warrantyDescription?: string | null;
    quantity?: number;
    lowStockThreshold?: number;
    categories?: NestedCategoryInput[];
    images?: NestedImageInput[];
    attributes?: NestedAttributeInput[];
    variants?: NestedVariantInput[];
};

type ListingVariantCreateData = {
    variantId: string;
    price: Prisma.Decimal;
    compareAtPrice: Prisma.Decimal | null;
    costPrice: Prisma.Decimal | null;
    inventory: {
        create: {
            quantity: number;
            lowStockThreshold: number;
        };
    };
};

function toJson(payload: Record<string, unknown>) {
    return payload as Prisma.InputJsonValue;
}

function getSubmissionDraftPayload(body: unknown) {
    const parsed = sellerProductSubmissionDraftSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    return parsed.data;
}

function getSubmissionApprovalPayload(payload: unknown, message = "Validation failed.") {
    const parsed = sellerProductSubmissionSubmitSchema.safeParse(payload);

    if (!parsed.success) {
        throw new AppError(400, message);
    }

    return parsed.data as WorkflowPayload;
}

function getRevisionPayloadInput(payload: unknown) {
    const parsed = sellerProductRevisionPatchSchema.safeParse(payload);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    if (Object.keys(parsed.data).length === 0) {
        throw new AppError(400, "At least one field must be provided.");
    }

    return parsed.data;
}

function getRevisionApprovalPayload(
    product: {
        name: string;
        slug: string;
        description: string | null;
        shortDescription: string | null;
        brandId: string | null;
        productType: string;
        modelNumber: string | null;
        manufacturer: string | null;
        countryOfOrigin: string | null;
    },
    listing: {
        sellerSku: string | null;
        price: number;
        compareAtPrice: number | null;
        costPrice: number | null;
        condition: string;
        warrantyTitle: string | null;
        warrantyDescription: string | null;
        description: string | null;
        quantity: number;
        lowStockThreshold: number;
    },
    payload: unknown
) {
    const parsed = sellerProductRevisionPatchSchema.safeParse(payload);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const merged = {
        ...product,
        ...listing,
        ...parsed.data,
    };

    const approval = sellerProductRevisionApprovalSchema.safeParse(merged);

    if (!approval.success) {
        throw new AppError(400, "Revision payload is incomplete.");
    }

    return approval.data as WorkflowPayload;
}

function buildListingUpdateData(payload: WorkflowPayload): Record<string, unknown> {
    return {
        ...(payload.sellerSku !== undefined
            ? { sellerSku: payload.sellerSku }
            : {}),
        ...(payload.price !== undefined
            ? { price: new Prisma.Decimal(payload.price) }
            : {}),
        ...(payload.compareAtPrice !== undefined
            ? {
                  compareAtPrice:
                      payload.compareAtPrice === null
                          ? null
                          : new Prisma.Decimal(payload.compareAtPrice),
              }
            : {}),
        ...(payload.costPrice !== undefined
            ? {
                  costPrice:
                      payload.costPrice === null
                          ? null
                          : new Prisma.Decimal(payload.costPrice),
              }
            : {}),
        ...(payload.condition !== undefined
            ? { condition: payload.condition }
            : {}),
        ...(payload.warrantyTitle !== undefined
            ? { warrantyTitle: payload.warrantyTitle }
            : {}),
        ...(payload.warrantyDescription !== undefined
            ? { warrantyDescription: payload.warrantyDescription }
            : {}),
        ...(payload.description !== undefined
            ? { description: payload.description }
            : {}),
    };
}

function buildListingVariantCreateData(
    payload: WorkflowPayload,
    variants: Array<{ id: string; sku: string }>
): ListingVariantCreateData[] {
    if (!payload.variants?.length) {
        return [];
    }

    const variantMap = new Map(
        variants.map((variant) => [variant.sku, variant.id] as const)
    );

    return payload.variants.map((variant) => {
        const variantId = variantMap.get(variant.sku);

        if (!variantId) {
            throw new AppError(
                400,
                `Variant ${variant.sku} is missing from the approved product.`
            );
        }

        if (variant.price === undefined) {
            throw new AppError(
                400,
                `Variant ${variant.sku} must include a price.`
            );
        }

        return {
            variantId,
            price: new Prisma.Decimal(variant.price),
            compareAtPrice:
                variant.compareAtPrice === undefined
                    ? null
                    : variant.compareAtPrice === null
                        ? null
                        : new Prisma.Decimal(variant.compareAtPrice),
            costPrice:
                variant.costPrice === undefined
                    ? null
                    : variant.costPrice === null
                        ? null
                        : new Prisma.Decimal(variant.costPrice),
            inventory: {
                create: {
                    quantity: variant.quantity ?? 0,
                    lowStockThreshold: variant.lowStockThreshold ?? 5,
                },
            },
        };
    });
}

async function getNextRevisionNumber(productId: string) {
    const latest = await prisma.productRevision.findFirst({
        where: {
            productId,
        },
        orderBy: {
            revisionNumber: "desc",
        },
        select: {
            revisionNumber: true,
        },
    });

    return (latest?.revisionNumber ?? 0) + 1;
}

export async function listSellerProductSubmissions({
    sellerId,
    page = 1,
    limit = 20,
    status,
}: PaginationQuery & { sellerId: string; status?: SubmissionStatus }) {
    const where = {
        sellerId,
        ...(status ? { status } : {}),
    };

    const [submissions, total] = await prisma.$transaction([
        prisma.productSubmission.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                status: true,
                rejectionReason: true,
                submittedAt: true,
                reviewedAt: true,
                createdAt: true,
                updatedAt: true,
                productId: true,
                payload: true,
            },
        }),
        prisma.productSubmission.count({ where }),
    ]);

    return { submissions, total };
}

export async function createSellerProductSubmissionDraft({
    sellerId,
    body,
}: CreateSellerSubmissionInput) {
    const payload = getSubmissionDraftPayload(body);

    const submission = await prisma.productSubmission.create({
        data: {
            sellerId,
            title:
                typeof payload.name === "string" && payload.name.trim()
                    ? payload.name.trim()
                    : null,
            payload: toJson(payload),
            status: "DRAFT",
        },
        select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return submission;
}

export async function updateSellerProductSubmissionDraft({
    sellerId,
    submissionId,
    body,
}: UpdateSellerSubmissionInput) {
    const submission = await prisma.productSubmission.findFirst({
        where: {
            id: submissionId,
            sellerId,
        },
        select: {
            id: true,
            status: true,
            payload: true,
        },
    });

    if (!submission) {
        throw new AppError(404, "Submission not found.");
    }

    if (!["DRAFT", "REJECTED", "RESUBMITTED"].includes(submission.status)) {
        throw new AppError(
            409,
            "Only draft or rejected submissions can be edited."
        );
    }

    const patch = getSubmissionDraftPayload(body);
    const nextPayload = {
        ...(submission.payload as Record<string, unknown>),
        ...patch,
    };

    const updated = await prisma.productSubmission.update({
        where: {
            id: submission.id,
        },
        data: {
            payload: toJson(nextPayload),
            title:
                typeof nextPayload.name === "string" &&
                nextPayload.name.trim()
                    ? nextPayload.name.trim()
                    : undefined,
            status:
                submission.status === "REJECTED"
                    ? "RESUBMITTED"
                    : "DRAFT",
        },
        select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            payload: true,
        },
    });

    return updated;
}

export async function submitSellerProductSubmission({
    sellerId,
    submissionId,
}: SubmitSellerSubmissionInput) {
    const submission = await prisma.productSubmission.findFirst({
        where: {
            id: submissionId,
            sellerId,
        },
        select: {
            id: true,
            status: true,
            payload: true,
        },
    });

    if (!submission) {
        throw new AppError(404, "Submission not found.");
    }

    if (!["DRAFT", "REJECTED", "RESUBMITTED"].includes(submission.status)) {
        throw new AppError(409, "Submission is not editable.");
    }

    getSubmissionApprovalPayload(submission.payload);

    return prisma.productSubmission.update({
        where: {
            id: submission.id,
        },
        data: {
            status: "PENDING_REVIEW",
            submittedAt: new Date(),
        },
        select: {
            id: true,
            title: true,
            status: true,
            submittedAt: true,
            updatedAt: true,
        },
    });
}

export async function approveSellerProductSubmission({
    adminId,
    submissionId,
}: ReviewSellerSubmissionInput) {
    const submission = await prisma.productSubmission.findUnique({
        where: {
            id: submissionId,
        },
        select: {
            id: true,
            sellerId: true,
            status: true,
            payload: true,
            seller: {
                select: {
                    id: true,
                    userId: true,
                    status: true,
                    shopName: true,
                },
            },
        },
    });

    if (!submission) {
        throw new AppError(404, "Submission not found.");
    }

    if (!["PENDING_REVIEW", "UNDER_REVIEW", "SUBMITTED"].includes(submission.status)) {
        throw new AppError(409, "Submission is not ready for approval.");
    }

    if (submission.seller.status !== "ACTIVE") {
        throw new AppError(403, "Only active sellers can publish products.");
    }

    const payload = getSubmissionApprovalPayload(submission.payload);
    const compareAtPrice =
        payload.compareAtPrice !== undefined ? payload.compareAtPrice : null;

    if (compareAtPrice !== null && compareAtPrice <= payload.price) {
        throw new AppError(
            400,
            "Compare-at price must be higher than selling price."
        );
    }

    return prisma.$transaction(async (tx) => {
        const existingProduct = await tx.product.findUnique({
            where: {
                slug: payload.slug,
            },
            select: {
                id: true,
            },
        });

        if (existingProduct) {
            throw new AppError(409, "Product slug already exists.");
        }

        const product = await tx.product.create({
            data: {
                name: payload.name,
                slug: payload.slug,
                description: payload.description ?? null,
                shortDescription: payload.shortDescription ?? null,
                brandId: payload.brandId ?? null,
                productType: payload.productType ?? "SIMPLE",
                status: "ACTIVE",
                visibility: "VISIBLE",
                ownershipType: "SELLER_EXCLUSIVE",
                ownerSellerId: submission.sellerId,
                createdById: submission.seller.userId,
            },
            select: {
                id: true,
            },
        });

        if (payload.categories?.length) {
            await tx.productCategory.createMany({
                data: payload.categories.map((category) => ({
                    productId: product.id,
                    categoryId: category.categoryId,
                })),
            });
        }

        if (payload.images?.length) {
            await tx.productImage.createMany({
                data: payload.images.map((image) => ({
                    productId: product.id,
                    url: image.url,
                    altText: image.altText ?? null,
                    sortOrder: image.sortOrder ?? 0,
                    isPrimary: image.isPrimary ?? false,
                })),
            });
        }

        if (payload.attributes?.length) {
            await tx.productAttributeValue.createMany({
                data: payload.attributes.map((attribute) => ({
                    productId: product.id,
                    attributeId: attribute.attributeId,
                    attributeValueId: attribute.attributeValueId ?? null,
                    textValue: attribute.textValue ?? null,
                    integerValue:
                        attribute.integerValue === undefined
                            ? null
                            : attribute.integerValue,
                    decimalValue:
                        attribute.decimalValue === undefined
                            ? null
                            : attribute.decimalValue,
                    booleanValue:
                        attribute.booleanValue === undefined
                            ? null
                            : attribute.booleanValue,
                    dateValue:
                        attribute.dateValue === undefined
                            ? null
                            : attribute.dateValue,
                    jsonValue:
                        attribute.jsonValue === undefined
                            ? Prisma.DbNull
                            : attribute.jsonValue === null
                                ? Prisma.JsonNull
                                : attribute.jsonValue,
                })),
            });
        }

        const productVariants: Array<{ id: string; sku: string }> = [];

        if (payload.variants?.length) {
            for (const variant of payload.variants) {
                const createdVariant = await tx.productVariant.create({
                    data: {
                        productId: product.id,
                        name: variant.name,
                        sku: variant.sku,
                    },
                    select: {
                        id: true,
                        sku: true,
                    },
                });

                productVariants.push(createdVariant);

                if (variant.attributes?.length) {
                    await tx.variantAttributeValue.createMany({
                        data: variant.attributes.map((attribute) => ({
                            variantId: createdVariant.id,
                            attributeId: attribute.attributeId,
                            attributeValueId:
                                attribute.attributeValueId ?? null,
                            textValue: attribute.textValue ?? null,
                            integerValue:
                                attribute.integerValue === undefined
                                    ? null
                                    : attribute.integerValue,
                            decimalValue:
                                attribute.decimalValue === undefined
                                    ? null
                                    : attribute.decimalValue,
                            booleanValue:
                                attribute.booleanValue === undefined
                                    ? null
                                    : attribute.booleanValue,
                            dateValue:
                                attribute.dateValue === undefined
                                    ? null
                                    : attribute.dateValue,
                            jsonValue:
                                attribute.jsonValue === undefined
                                    ? Prisma.DbNull
                                    : attribute.jsonValue === null
                                        ? Prisma.JsonNull
                                        : attribute.jsonValue,
                        })),
                    });
                }
            }
        }

        const listing = await tx.sellerListing.create({
            data: {
                sellerId: submission.sellerId,
                productId: product.id,
                sellerSku: payload.sellerSku ?? null,
                price: new Prisma.Decimal(payload.price),
                compareAtPrice:
                    compareAtPrice === null
                        ? null
                        : new Prisma.Decimal(compareAtPrice),
                costPrice:
                    payload.costPrice === undefined || payload.costPrice === null
                        ? null
                        : new Prisma.Decimal(payload.costPrice),
                condition: payload.condition ?? "NEW",
                warrantyTitle: payload.warrantyTitle ?? null,
                warrantyDescription: payload.warrantyDescription ?? null,
                description: payload.description ?? null,
                status: "ACTIVE",
                inventory: {
                    create: {
                        quantity: payload.quantity ?? 0,
                        lowStockThreshold: payload.lowStockThreshold ?? 5,
                    },
                },
            },
            select: {
                id: true,
                price: true,
                status: true,
            },
        });

        if (payload.variants?.length) {
            const listingVariantData = buildListingVariantCreateData(
                payload,
                productVariants
            );

            for (const variant of listingVariantData) {
                await tx.sellerListingVariant.create({
                    data: {
                        listingId: listing.id,
                        variantId: variant.variantId,
                        price: variant.price,
                        compareAtPrice: variant.compareAtPrice,
                        costPrice: variant.costPrice,
                        ...(variant.inventory
                            ? {
                                  inventory: variant.inventory,
                              }
                            : {}),
                    },
                });
            }
        }

        const updatedSubmission = await tx.productSubmission.update({
            where: {
                id: submission.id,
            },
            data: {
                status: "APPROVED",
                reviewedAt: new Date(),
                reviewedById: adminId,
                productId: product.id,
                rejectionReason: null,
            },
            select: {
                id: true,
                status: true,
                reviewedAt: true,
                reviewedById: true,
                productId: true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "APPROVE",
                entityType: "PRODUCT",
                entityId: product.id,
                newData: {
                    submissionId: submission.id,
                    listingId: listing.id,
                },
            },
        });

        if (submission.seller.userId) {
            await tx.notification.create({
                data: {
                    userId: submission.seller.userId,
                    type: "SYSTEM",
                    channel: "IN_APP",
                    title: "Product submission approved",
                    message: "Your product submission has been approved.",
                    data: {
                        submissionId: submission.id,
                        productId: product.id,
                        listingId: listing.id,
                    },
                },
            });
        }

        return {
            submission: updatedSubmission,
            product,
            listing,
        };
    });
}

export async function rejectSellerProductSubmission({
    adminId,
    submissionId,
    reason,
}: ReviewSellerSubmissionInput) {
    const submission = await prisma.productSubmission.findUnique({
        where: {
            id: submissionId,
        },
        select: {
            id: true,
            status: true,
            sellerId: true,
            seller: {
                select: {
                    userId: true,
                },
            },
        },
    });

    if (!submission) {
        throw new AppError(404, "Submission not found.");
    }

    if (!["PENDING_REVIEW", "UNDER_REVIEW", "SUBMITTED"].includes(submission.status)) {
        throw new AppError(409, "Submission is not ready for rejection.");
    }

    return prisma.$transaction(async (tx) => {
        const updatedSubmission = await tx.productSubmission.update({
            where: {
                id: submission.id,
            },
            data: {
                status: "REJECTED",
                reviewedAt: new Date(),
                reviewedById: adminId,
                rejectionReason: reason ?? "Rejected by administrator.",
            },
            select: {
                id: true,
                status: true,
                reviewedAt: true,
                reviewedById: true,
                rejectionReason: true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "REJECT",
                entityType: "PRODUCT",
                entityId: submission.id,
                newData: {
                    reason: updatedSubmission.rejectionReason,
                },
            },
        });

        if (submission.seller.userId) {
            await tx.notification.create({
                data: {
                    userId: submission.seller.userId,
                    type: "SYSTEM",
                    channel: "IN_APP",
                    title: "Product submission rejected",
                    message: updatedSubmission.rejectionReason ?? "Your product submission was rejected.",
                    data: {
                        submissionId: submission.id,
                    },
                },
            });
        }

        return updatedSubmission;
    });
}

export async function listSellerProductRevisions({
    sellerId,
    productId,
    page = 1,
    limit = 20,
    status,
}: PaginationQuery & { sellerId: string; productId: string; status?: RevisionStatus }) {
    const where = {
        productId,
        product: {
            ownerSellerId: sellerId,
        },
        ...(status ? { status } : {}),
    };

    const [revisions, total] = await prisma.$transaction([
        prisma.productRevision.findMany({
            where,
            orderBy: {
                createdAt: "desc",
            },
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                revisionNumber: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                reviewedAt: true,
                publishedAt: true,
                rejectedReason: true,
                payload: true,
            },
        }),
        prisma.productRevision.count({ where }),
    ]);

    return { revisions, total };
}

export async function createSellerProductRevision({
    sellerId,
    productId,
    body,
}: CreateSellerRevisionInput) {
    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            ownerSellerId: sellerId,
            ownershipType: "SELLER_EXCLUSIVE",
            deletedAt: null,
        },
        select: {
            id: true,
            pendingRevisionId: true,
        },
    });

    if (!product) {
        throw new AppError(404, "Product not found.");
    }

    if (product.pendingRevisionId) {
        throw new AppError(409, "A revision is already pending for this product.");
    }

    const patch = getRevisionPayloadInput(body);
    const revisionNumber = await getNextRevisionNumber(product.id);

    return prisma.productRevision.create({
        data: {
            productId: product.id,
            revisionNumber,
            status: "DRAFT",
            payload: toJson(patch),
        },
        select: {
            id: true,
            revisionNumber: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            payload: true,
        },
    });
}

export async function updateSellerProductRevision({
    sellerId,
    revisionId,
    body,
}: UpdateSellerRevisionInput) {
    const revision = await prisma.productRevision.findFirst({
        where: {
            id: revisionId,
            product: {
                ownerSellerId: sellerId,
                ownershipType: "SELLER_EXCLUSIVE",
            },
        },
        select: {
            id: true,
            status: true,
            payload: true,
        },
    });

    if (!revision) {
        throw new AppError(404, "Revision not found.");
    }

    if (!["DRAFT", "REJECTED"].includes(revision.status)) {
        throw new AppError(409, "Only draft or rejected revisions can be edited.");
    }

    const patch = getRevisionPayloadInput(body);
    const nextPayload = {
        ...(revision.payload as Record<string, unknown>),
        ...patch,
    };

    return prisma.productRevision.update({
        where: {
            id: revision.id,
        },
        data: {
            payload: toJson(nextPayload),
            status: revision.status === "REJECTED" ? "DRAFT" : "DRAFT",
        },
        select: {
            id: true,
            revisionNumber: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            payload: true,
        },
    });
}

export async function submitSellerProductRevision({
    sellerId,
    revisionId,
}: SubmitSellerRevisionInput) {
    const revision = await prisma.productRevision.findFirst({
        where: {
            id: revisionId,
            product: {
                ownerSellerId: sellerId,
                ownershipType: "SELLER_EXCLUSIVE",
            },
        },
        select: {
            id: true,
            status: true,
            payload: true,
            product: {
                select: {
                    id: true,
                    pendingRevisionId: true,
                    name: true,
                    slug: true,
                    description: true,
                    shortDescription: true,
                    brandId: true,
                    productType: true,
                    modelNumber: true,
                    manufacturer: true,
                    countryOfOrigin: true,
                    listings: {
                        where: {
                            deletedAt: null,
                        },
                        take: 1,
                        select: {
                            id: true,
                            sellerSku: true,
                            price: true,
                            compareAtPrice: true,
                            costPrice: true,
                            condition: true,
                            warrantyTitle: true,
                            warrantyDescription: true,
                            description: true,
                            inventory: {
                                select: {
                                    quantity: true,
                                    lowStockThreshold: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!revision) {
        throw new AppError(404, "Revision not found.");
    }

    if (!["DRAFT", "REJECTED"].includes(revision.status)) {
        throw new AppError(409, "Revision is not editable.");
    }

    if (revision.product.pendingRevisionId && revision.product.pendingRevisionId !== revision.id) {
        throw new AppError(409, "A different revision is already pending for this product.");
    }

    const currentListing = revision.product.listings[0];

    if (!currentListing) {
        throw new AppError(404, "Listing not found.");
    }

    getRevisionApprovalPayload(
        {
            name: revision.product.name,
            slug: revision.product.slug,
            description: revision.product.description,
            shortDescription: revision.product.shortDescription,
            brandId: revision.product.brandId,
            productType: revision.product.productType,
            modelNumber: revision.product.modelNumber,
            manufacturer: revision.product.manufacturer,
            countryOfOrigin: revision.product.countryOfOrigin,
        },
        {
            sellerSku: currentListing.sellerSku,
            price: Number(currentListing.price),
            compareAtPrice:
                currentListing.compareAtPrice === null
                    ? null
                    : Number(currentListing.compareAtPrice),
            costPrice:
                currentListing.costPrice === null
                    ? null
                    : Number(currentListing.costPrice),
            condition: currentListing.condition,
            warrantyTitle: currentListing.warrantyTitle,
            warrantyDescription: currentListing.warrantyDescription,
            description: currentListing.description,
            quantity: currentListing.inventory?.quantity ?? 0,
            lowStockThreshold: currentListing.inventory?.lowStockThreshold ?? 5,
        },
        revision.payload
    );

    return prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
            where: {
                id: revision.product.id,
            },
            data: {
                pendingRevisionId: revision.id,
            },
            select: {
                id: true,
                pendingRevisionId: true,
            },
        });

        const updatedRevision = await tx.productRevision.update({
            where: {
                id: revision.id,
            },
            data: {
                status: "PENDING_REVIEW",
            },
            select: {
                id: true,
                revisionNumber: true,
                status: true,
                updatedAt: true,
            },
        });

        return {
            product: updatedProduct,
            revision: updatedRevision,
        };
    });
}

export async function approveSellerProductRevision({
    adminId,
    revisionId,
}: ReviewSellerRevisionInput) {
    const revision = await prisma.productRevision.findUnique({
        where: {
            id: revisionId,
        },
        select: {
            id: true,
            status: true,
            payload: true,
            product: {
                select: {
                    id: true,
                    pendingRevisionId: true,
                    publishedRevisionId: true,
                    ownerSellerId: true,
                    name: true,
                    slug: true,
                    description: true,
                    shortDescription: true,
                    brandId: true,
                    productType: true,
                    modelNumber: true,
                    manufacturer: true,
                    countryOfOrigin: true,
                    listings: {
                        where: {
                            deletedAt: null,
                        },
                        take: 1,
                        select: {
                            id: true,
                            sellerSku: true,
                            price: true,
                            compareAtPrice: true,
                            costPrice: true,
                            condition: true,
                            warrantyTitle: true,
                            warrantyDescription: true,
                            description: true,
                            inventory: {
                                select: {
                                    quantity: true,
                                    lowStockThreshold: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!revision) {
        throw new AppError(404, "Revision not found.");
    }

    if (!["PENDING_REVIEW", "UNDER_REVIEW"].includes(revision.status)) {
        throw new AppError(409, "Revision is not ready for approval.");
    }

    const currentListing = revision.product.listings[0];

    if (!currentListing) {
        throw new AppError(404, "Listing not found.");
    }

    const merged = getRevisionApprovalPayload(
        {
            name: revision.product.name,
            slug: revision.product.slug,
            description: revision.product.description,
            shortDescription: revision.product.shortDescription,
            brandId: revision.product.brandId,
            productType: revision.product.productType,
            modelNumber: revision.product.modelNumber,
            manufacturer: revision.product.manufacturer,
            countryOfOrigin: revision.product.countryOfOrigin,
        },
        {
            sellerSku: currentListing.sellerSku,
            price: Number(currentListing.price),
            compareAtPrice:
                currentListing.compareAtPrice === null
                    ? null
                    : Number(currentListing.compareAtPrice),
            costPrice:
                currentListing.costPrice === null
                    ? null
                    : Number(currentListing.costPrice),
            condition: currentListing.condition,
            warrantyTitle: currentListing.warrantyTitle,
            warrantyDescription: currentListing.warrantyDescription,
            description: currentListing.description,
            quantity: currentListing.inventory?.quantity ?? 0,
            lowStockThreshold: currentListing.inventory?.lowStockThreshold ?? 5,
        },
        revision.payload
    );

    return prisma.$transaction(async (tx) => {
        const updatedProduct = await tx.product.update({
            where: {
                id: revision.product.id,
            },
            data: {
                name: merged.name,
                slug: merged.slug,
                description: merged.description ?? null,
                shortDescription: merged.shortDescription ?? null,
                brandId: merged.brandId ?? null,
                productType: merged.productType ?? revision.product.productType,
                modelNumber: merged.modelNumber ?? null,
                manufacturer: merged.manufacturer ?? null,
                countryOfOrigin: merged.countryOfOrigin ?? null,
                pendingRevisionId: null,
                publishedRevisionId: revision.id,
            },
            select: {
                id: true,
            },
        });

        if (merged.categories?.length) {
            await tx.productCategory.deleteMany({
                where: {
                    productId: revision.product.id,
                },
            });

            await tx.productCategory.createMany({
                data: merged.categories.map((category) => ({
                    productId: revision.product.id,
                    categoryId: category.categoryId,
                })),
            });
        }

        if (merged.images?.length) {
            await tx.productImage.deleteMany({
                where: {
                    productId: revision.product.id,
                },
            });

            await tx.productImage.createMany({
                data: merged.images.map((image) => ({
                    productId: revision.product.id,
                    url: image.url,
                    altText: image.altText ?? null,
                    sortOrder: image.sortOrder ?? 0,
                    isPrimary: image.isPrimary ?? false,
                })),
            });
        }

        if (merged.attributes?.length) {
            await tx.productAttributeValue.deleteMany({
                where: {
                    productId: revision.product.id,
                },
            });

            await tx.productAttributeValue.createMany({
                data: merged.attributes.map((attribute) => ({
                    productId: revision.product.id,
                    attributeId: attribute.attributeId,
                    attributeValueId: attribute.attributeValueId ?? null,
                    textValue: attribute.textValue ?? null,
                    integerValue:
                        attribute.integerValue === undefined
                            ? null
                            : attribute.integerValue,
                    decimalValue:
                        attribute.decimalValue === undefined
                            ? null
                            : attribute.decimalValue,
                    booleanValue:
                        attribute.booleanValue === undefined
                            ? null
                            : attribute.booleanValue,
                    dateValue:
                        attribute.dateValue === undefined
                            ? null
                            : attribute.dateValue,
                    jsonValue:
                        attribute.jsonValue === undefined
                            ? Prisma.DbNull
                            : attribute.jsonValue === null
                                ? Prisma.JsonNull
                                : attribute.jsonValue,
                })),
            });
        }

        const productVariants: Array<{ id: string; sku: string }> = [];

        if (merged.variants?.length) {
            await tx.productVariant.deleteMany({
                where: {
                    productId: revision.product.id,
                },
            });

            for (const variant of merged.variants) {
                const createdVariant = await tx.productVariant.create({
                    data: {
                        productId: revision.product.id,
                        name: variant.name,
                        sku: variant.sku,
                    },
                    select: {
                        id: true,
                        sku: true,
                    },
                });

                productVariants.push(createdVariant);

                if (variant.attributes?.length) {
                    await tx.variantAttributeValue.createMany({
                        data: variant.attributes.map((attribute) => ({
                            variantId: createdVariant.id,
                            attributeId: attribute.attributeId,
                            attributeValueId:
                                attribute.attributeValueId ?? null,
                            textValue: attribute.textValue ?? null,
                            integerValue:
                                attribute.integerValue === undefined
                                    ? null
                                    : attribute.integerValue,
                            decimalValue:
                                attribute.decimalValue === undefined
                                    ? null
                                    : attribute.decimalValue,
                            booleanValue:
                                attribute.booleanValue === undefined
                                    ? null
                                    : attribute.booleanValue,
                            dateValue:
                                attribute.dateValue === undefined
                                    ? null
                                    : attribute.dateValue,
                            jsonValue:
                                attribute.jsonValue === undefined
                                    ? Prisma.DbNull
                                    : attribute.jsonValue === null
                                        ? Prisma.JsonNull
                                        : attribute.jsonValue,
                        })),
                    });
                }
            }
        }

        const updatedListing = await tx.sellerListing.update({
            where: {
                sellerId_productId: {
                    sellerId: revision.product.ownerSellerId as string,
                    productId: revision.product.id,
                },
            },
            data: {
                ...buildListingUpdateData(merged),
                status: "ACTIVE",
            },
            select: {
                id: true,
                sellerId: true,
                price: true,
                compareAtPrice: true,
                costPrice: true,
                condition: true,
                status: true,
            },
        });

        if (merged.variants?.length) {
            const listingVariantData = buildListingVariantCreateData(
                merged,
                productVariants
            );

            for (const variant of listingVariantData) {
                await tx.sellerListingVariant.create({
                    data: {
                        listingId: updatedListing.id,
                        variantId: variant.variantId,
                        price: variant.price,
                        compareAtPrice: variant.compareAtPrice,
                        costPrice: variant.costPrice,
                        ...(variant.inventory
                            ? {
                                  inventory: variant.inventory,
                              }
                            : {}),
                    },
                });
            }
        }

        const updatedRevision = await tx.productRevision.update({
            where: {
                id: revision.id,
            },
            data: {
                status: "APPROVED",
                reviewedById: adminId,
                reviewedAt: new Date(),
                publishedAt: new Date(),
            },
            select: {
                id: true,
                revisionNumber: true,
                status: true,
                reviewedById: true,
                reviewedAt: true,
                publishedAt: true,
            },
        });

        await tx.auditLog.create({
            data: {
                userId: adminId,
                action: "APPROVE",
                entityType: "PRODUCT",
                entityId: revision.product.id,
                newData: {
                    revisionId: revision.id,
                },
            },
        });

        return {
            product: updatedProduct,
            listing: updatedListing,
            revision: updatedRevision,
        };
    });
}

export async function rejectSellerProductRevision({
    adminId,
    revisionId,
    reason,
}: ReviewSellerRevisionInput) {
    const revision = await prisma.productRevision.findUnique({
        where: {
            id: revisionId,
        },
        select: {
            id: true,
            status: true,
            productId: true,
            product: {
                select: {
                    id: true,
                    pendingRevisionId: true,
                },
            },
        },
    });

    if (!revision) {
        throw new AppError(404, "Revision not found.");
    }

    if (!["PENDING_REVIEW", "UNDER_REVIEW"].includes(revision.status)) {
        throw new AppError(409, "Revision is not ready for rejection.");
    }

    return prisma.$transaction(async (tx) => {
        const updatedRevision = await tx.productRevision.update({
            where: {
                id: revision.id,
            },
            data: {
                status: "REJECTED",
                reviewedById: adminId,
                reviewedAt: new Date(),
                rejectedReason: reason ?? "Rejected by administrator.",
            },
            select: {
                id: true,
                revisionNumber: true,
                status: true,
                reviewedById: true,
                reviewedAt: true,
                rejectedReason: true,
            },
        });

        if (revision.product.pendingRevisionId === revision.id) {
            await tx.product.update({
                where: {
                    id: revision.product.id,
                },
                data: {
                    pendingRevisionId: null,
                },
                select: {
                    id: true,
                },
            });
        }

        return updatedRevision;
    });
}
