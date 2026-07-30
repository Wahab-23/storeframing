import { Prisma } from "@/generated/prisma/client";

import { AppError, ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { createSlug } from "@/lib/slug";
import {
    AdminCategoryCreateInput,
    AdminCategoryUpdateInput,
    CategoryAttributeInput,
    CategorySeoInput,
} from "@/lib/validators/category";

type CategoryClient = Prisma.TransactionClient | typeof prisma;

type CategoryTreeNode = {
    id: string;
    parentId: string | null;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
    sortOrder: number;
    seo?: {
        metaTitle: string | null;
        metaDescription: string | null;
        canonicalUrl: string | null;
        ogImageUrl: string | null;
        twitterImageUrl: string | null;
        robots: string | null;
    } | null;
    children: CategoryTreeNode[];
};

const categoryTreeSelect = {
    id: true,
    parentId: true,
    name: true,
    slug: true,
    description: true,
    imageUrl: true,
    isActive: true,
    sortOrder: true,
    seo: {
        select: {
            metaTitle: true,
            metaDescription: true,
            canonicalUrl: true,
            ogImageUrl: true,
            twitterImageUrl: true,
            robots: true,
        },
    },
} as const;

const categoryDetailSelect = {
    id: true,
    parentId: true,
    name: true,
    slug: true,
    description: true,
    imageUrl: true,
    isActive: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
    parent: {
        select: {
            id: true,
            name: true,
            slug: true,
        },
    },
    seo: {
        select: {
            id: true,
            metaTitle: true,
            metaDescription: true,
            metaKeywords: true,
            canonicalUrl: true,
            ogTitle: true,
            ogDescription: true,
            ogImageUrl: true,
            twitterTitle: true,
            twitterDescription: true,
            twitterImageUrl: true,
            robots: true,
        },
    },
    attributes: {
        orderBy: {
            sortOrder: "asc",
        },
        select: {
            id: true,
            attributeId: true,
            isRequired: true,
            isFilterable: true,
            isVariant: true,
            sortOrder: true,
            attribute: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    type: true,
                    scope: true,
                },
            },
        },
    },
} as const;

function buildTreeNode(
    category: {
        id: string;
        parentId: string | null;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        seo: {
            metaTitle: string | null;
            metaDescription: string | null;
            canonicalUrl: string | null;
            ogImageUrl: string | null;
            twitterImageUrl: string | null;
            robots: string | null;
        } | null;
    },
    children: CategoryTreeNode[]
): CategoryTreeNode {
    return {
        id: category.id,
        parentId: category.parentId,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
        seo: category.seo,
        children,
    };
}

function buildCategoryTree(
    categories: Array<{
        id: string;
        parentId: string | null;
        name: string;
        slug: string;
        description: string | null;
        imageUrl: string | null;
        isActive: boolean;
        sortOrder: number;
        seo: {
            metaTitle: string | null;
            metaDescription: string | null;
            canonicalUrl: string | null;
            ogImageUrl: string | null;
            twitterImageUrl: string | null;
            robots: string | null;
        } | null;
    }>,
    options?: {
        allowOrphansAsRoots?: boolean;
    }
) {
    const nodes = new Map<string, CategoryTreeNode>();
    const childrenByParent = new Map<string | null, CategoryTreeNode[]>();

    for (const category of categories) {
        const node = buildTreeNode(category, []);
        nodes.set(category.id, node);

        const group = childrenByParent.get(category.parentId) ?? [];
        group.push(node);
        childrenByParent.set(category.parentId, group);
    }

    const sortNodes = (items: CategoryTreeNode[]) =>
        items.sort((left, right) => {
            if (left.sortOrder !== right.sortOrder) {
                return left.sortOrder - right.sortOrder;
            }

            return left.name.localeCompare(right.name);
        });

    for (const group of childrenByParent.values()) {
        sortNodes(group);
    }

    const buildBranch = (node: CategoryTreeNode): CategoryTreeNode => ({
        ...node,
        children: sortNodes(
            (childrenByParent.get(node.id) ?? []).map((child) =>
                buildBranch(child)
            )
        ),
    });

    const rootNodes =
        childrenByParent.get(null) ??
        (options?.allowOrphansAsRoots
            ? categories
                  .filter((category) => category.parentId !== null)
                  .filter((category) => !nodes.has(category.parentId as string))
                  .map((category) => nodes.get(category.id)!)
            : []);

    return sortNodes(rootNodes.map((node) => buildBranch(node)));
}

function buildBreadcrumbs(
    categories: Array<{
        id: string;
        parentId: string | null;
        name: string;
        slug: string;
    }>,
    categoryId: string
) {
    const byId = new Map(categories.map((category) => [category.id, category]));
    const breadcrumbs: Array<{ id: string; name: string; slug: string }> = [];
    let current = byId.get(categoryId) ?? null;

    while (current) {
        breadcrumbs.unshift({
            id: current.id,
            name: current.name,
            slug: current.slug,
        });

        current = current.parentId ? byId.get(current.parentId) ?? null : null;
    }

    return breadcrumbs;
}

async function getUniqueCategorySlug(
    tx: CategoryClient,
    name: string,
    slug?: string,
    currentId?: string
) {
    if (slug) {
        const explicitSlug = createSlug(slug);

        if (!explicitSlug) {
            throw new AppError(400, "Category slug is required.");
        }

        const conflict = await tx.category.findFirst({
            where: {
                slug: explicitSlug,
                ...(currentId ? { id: { not: currentId } } : {}),
            },
            select: {
                id: true,
            },
        });

        if (conflict) {
            throw new ConflictError("Category slug already exists.");
        }

        return explicitSlug;
    }

    const baseSlug = createSlug(name);

    if (!baseSlug) {
        throw new AppError(400, "Category slug is required.");
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
        const existing = await tx.category.findFirst({
            where: {
                slug: candidate,
                ...(currentId ? { id: { not: currentId } } : {}),
            },
            select: {
                id: true,
            },
        });

        if (!existing) {
            return candidate;
        }

        candidate = `${baseSlug}-${suffix}`;
        suffix += 1;
    }
}

function toSeoCreateData(seo: CategorySeoInput) {
    return {
        metaTitle: seo.metaTitle ?? null,
        metaDescription: seo.metaDescription ?? null,
        metaKeywords: seo.metaKeywords ?? null,
        canonicalUrl: seo.canonicalUrl ?? null,
        ogTitle: seo.ogTitle ?? null,
        ogDescription: seo.ogDescription ?? null,
        ogImageUrl: seo.ogImageUrl ?? null,
        twitterTitle: seo.twitterTitle ?? null,
        twitterDescription: seo.twitterDescription ?? null,
        twitterImageUrl: seo.twitterImageUrl ?? null,
        robots: seo.robots ?? null,
    };
}

function toAttributeData(attributes: CategoryAttributeInput[], categoryId: string) {
    return attributes.map((attribute) => ({
        categoryId,
        attributeId: attribute.attributeId,
        isRequired: attribute.isRequired ?? false,
        isFilterable: attribute.isFilterable ?? false,
        isVariant: attribute.isVariant ?? false,
        sortOrder: attribute.sortOrder ?? 0,
    }));
}

async function assertValidParent(
    tx: CategoryClient,
    categoryId: string | null | undefined,
    parentId: string | null | undefined
) {
    if (!parentId) {
        return;
    }

    if (categoryId && parentId === categoryId) {
        throw new AppError(400, "A category cannot be its own parent.");
    }

    const allCategories = await tx.category.findMany({
        select: {
            id: true,
            parentId: true,
        },
    });

    const byId = new Map(allCategories.map((category) => [category.id, category]));
    let current = byId.get(parentId) ?? null;

    if (!current) {
        throw new NotFoundError("Parent category not found.");
    }

    while (current) {
        if (categoryId && current.parentId === categoryId) {
            throw new AppError(
                400,
                "A category cannot be moved beneath one of its descendants."
            );
        }

        current = current.parentId ? byId.get(current.parentId) ?? null : null;
    }
}

async function readCategoryCounts(tx: CategoryClient, categoryId: string) {
    const [children, products, couponCategories, commissionRules] =
        await Promise.all([
            tx.category.count({
                where: {
                    parentId: categoryId,
                },
            }),
            tx.productCategory.count({
                where: {
                    categoryId,
                },
            }),
            tx.couponCategory.count({
                where: {
                    categoryId,
                },
            }),
            tx.commissionRule.count({
                where: {
                    categoryId,
                },
            }),
        ]);

    return {
        children,
        products,
        couponCategories,
        commissionRules,
    };
}

async function getCategoryDetail(tx: CategoryClient, categoryId: string) {
    const category = await tx.category.findUnique({
        where: {
            id: categoryId,
        },
        select: categoryDetailSelect,
    });

    if (!category) {
        throw new NotFoundError("Category not found.");
    }

    return category;
}

export async function listCategories(params: {
    query: {
        page: number;
        limit: number;
        parentId?: string | null;
        isActive?: boolean;
        search?: string;
    };
}) {
    const { page, limit, parentId, isActive, search } = params.query;

    const where = {
        ...(parentId !== undefined
            ? {
                  parentId,
              }
            : {}),
        ...(isActive !== undefined
            ? {
                  isActive,
              }
            : {}),
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: "insensitive" as const } },
                      { slug: { contains: search, mode: "insensitive" as const } },
                  ],
              }
            : {}),
    };

    const [categories, total] = await prisma.$transaction([
        prisma.category.findMany({
            where,
            orderBy: [
                {
                    sortOrder: "asc",
                },
                {
                    name: "asc",
                },
            ],
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                parentId: true,
                name: true,
                slug: true,
                description: true,
                imageUrl: true,
                isActive: true,
                sortOrder: true,
                createdAt: true,
                updatedAt: true,
                parent: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                seo: {
                    select: {
                        id: true,
                        metaTitle: true,
                        metaDescription: true,
                        canonicalUrl: true,
                    },
                },
            },
        }),
        prisma.category.count({ where }),
    ]);

    return {
        status: 200,
        message: "Categories fetched successfully.",
        data: {
            categories,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        },
    };
}

export async function getCategoryTree(params?: { activeOnly?: boolean }) {
    const categories = await prisma.category.findMany({
        where: params?.activeOnly ? { isActive: true } : undefined,
        orderBy: [
            {
                sortOrder: "asc",
            },
            {
                name: "asc",
            },
        ],
        select: categoryTreeSelect,
    });

    return {
        status: 200,
        message: "Category tree fetched successfully.",
        data: {
            categories: buildCategoryTree(categories, {
                allowOrphansAsRoots: !params?.activeOnly,
            }),
        },
    };
}

export async function getCategoryBySlug(slug: string) {
    const category = await prisma.category.findFirst({
        where: {
            slug,
            isActive: true,
        },
        select: categoryDetailSelect,
    });

    if (!category) {
        throw new NotFoundError("Category not found.");
    }

    const ancestors = await prisma.category.findMany({
        select: {
            id: true,
            parentId: true,
            name: true,
            slug: true,
        },
    });

    const breadcrumbs = buildBreadcrumbs(ancestors, category.id);

    const children = await prisma.category.findMany({
        where: {
            parentId: category.id,
            isActive: true,
        },
        orderBy: [
            {
                sortOrder: "asc",
            },
            {
                name: "asc",
            },
        ],
        select: {
            id: true,
            parentId: true,
            name: true,
            slug: true,
            description: true,
            imageUrl: true,
            isActive: true,
            sortOrder: true,
        },
    });

    return {
        status: 200,
        message: "Category fetched successfully.",
        data: {
            category,
            breadcrumbs,
            children,
        },
    };
}

export async function getAdminCategoryById(categoryId: string) {
    return prisma.$transaction(async (tx) => {
        const [category, counts, ancestors] = await Promise.all([
            getCategoryDetail(tx, categoryId),
            readCategoryCounts(tx, categoryId),
            tx.category.findMany({
                select: {
                    id: true,
                    parentId: true,
                    name: true,
                    slug: true,
                },
            }),
        ]);

        return {
            status: 200,
            message: "Category fetched successfully.",
            data: {
                category,
                breadcrumbs: buildBreadcrumbs(ancestors, category.id),
                counts,
            },
        };
    });
}

export async function createCategory(
    input: AdminCategoryCreateInput
) {
    return prisma.$transaction(async (tx) => {
        await assertValidParent(tx, null, input.parentId);

        const slug = await getUniqueCategorySlug(
            tx,
            input.name,
            input.slug
        );

        const category = await tx.category.create({
            data: {
                name: input.name,
                slug,
                description: input.description ?? null,
                imageUrl: input.imageUrl ?? null,
                parentId: input.parentId ?? null,
                isActive: input.isActive ?? true,
                sortOrder: input.sortOrder ?? 0,
                ...(input.seo
                    ? {
                          seo: {
                              create: toSeoCreateData(input.seo),
                          },
                      }
                    : {}),
            },
            select: {
                id: true,
            },
        });

        if (input.attributes?.length) {
            await tx.categoryAttribute.createMany({
                data: toAttributeData(input.attributes, category.id),
            });
        }

        return getCategoryDetail(tx, category.id);
    });
}

export async function updateCategory(
    categoryId: string,
    input: AdminCategoryUpdateInput
) {
    return prisma.$transaction(async (tx) => {
        const existing = await tx.category.findUnique({
            where: {
                id: categoryId,
            },
            select: {
                id: true,
                slug: true,
                parentId: true,
            },
        });

        if (!existing) {
            throw new NotFoundError("Category not found.");
        }

        const nextParentId =
            input.parentId === undefined ? existing.parentId : input.parentId;
        await assertValidParent(tx, categoryId, nextParentId);

        const nextSlug =
            input.slug === undefined
                ? existing.slug
                : await getUniqueCategorySlug(tx, input.name ?? "", input.slug, categoryId);

        const updateData: Prisma.CategoryUpdateInput = {
            ...(input.name !== undefined ? { name: input.name } : {}),
            slug: nextSlug,
            ...(input.description !== undefined
                ? { description: input.description }
                : {}),
            ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
            ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
            ...(input.sortOrder !== undefined
                ? { sortOrder: input.sortOrder }
                : {}),
            ...(input.seo !== undefined
                ? input.seo === null
                    ? {
                          seo: {
                              delete: true,
                          },
                      }
                    : {
                          seo: {
                              upsert: {
                                  create: toSeoCreateData(input.seo),
                                  update: toSeoCreateData(input.seo),
                              },
                          },
                      }
                : {}),
        };

        await tx.category.update({
            where: {
                id: categoryId,
            },
            data: updateData,
        });

        if (input.attributes !== undefined) {
            await tx.categoryAttribute.deleteMany({
                where: {
                    categoryId,
                },
            });

            if (input.attributes.length > 0) {
                await tx.categoryAttribute.createMany({
                    data: toAttributeData(input.attributes, categoryId),
                });
            }
        }

        return getCategoryDetail(tx, categoryId);
    });
}

export async function moveCategory(
    categoryId: string,
    input: { parentId: string | null; sortOrder?: number }
) {
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
            where: {
                id: categoryId,
            },
            select: {
                id: true,
            },
        });

        if (!category) {
            throw new NotFoundError("Category not found.");
        }

        await assertValidParent(tx, categoryId, input.parentId);

        await tx.category.update({
            where: {
                id: categoryId,
            },
            data: {
                parentId: input.parentId,
                ...(input.sortOrder !== undefined
                    ? { sortOrder: input.sortOrder }
                    : {}),
            },
        });

        return getCategoryDetail(tx, categoryId);
    });
}

export async function reorderCategories(
    items: Array<{ id: string; sortOrder: number }>
) {
    return prisma.$transaction(async (tx) => {
        const categories = await tx.category.findMany({
            where: {
                id: {
                    in: items.map((item) => item.id),
                },
            },
            select: {
                id: true,
                parentId: true,
            },
        });

        if (categories.length !== items.length) {
            throw new NotFoundError("One or more categories were not found.");
        }

        const firstParentId = categories[0]?.parentId ?? null;

        for (const category of categories) {
            if (category.parentId !== firstParentId) {
                throw new AppError(
                    400,
                    "All reordered categories must share the same parent."
                );
            }
        }

        await Promise.all(
            items.map((item) =>
                tx.category.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        sortOrder: item.sortOrder,
                    },
                })
            )
        );

        return {
            status: 200,
            message: "Categories reordered successfully.",
            data: {
                parentId: firstParentId,
            },
        };
    });
}

export async function archiveCategory(categoryId: string) {
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
            where: {
                id: categoryId,
            },
            select: {
                id: true,
                isActive: true,
            },
        });

        if (!category) {
            throw new NotFoundError("Category not found.");
        }

        await tx.category.update({
            where: {
                id: categoryId,
            },
            data: {
                isActive: false,
            },
        });

        return {
            status: 200,
            message: category.isActive
                ? "Category archived successfully."
                : "Category is already archived.",
        };
    });
}

export async function restoreCategory(categoryId: string) {
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
            where: {
                id: categoryId,
            },
            select: {
                id: true,
            },
        });

        if (!category) {
            throw new NotFoundError("Category not found.");
        }

        await tx.category.update({
            where: {
                id: categoryId,
            },
            data: {
                isActive: true,
            },
        });

        return {
            status: 200,
            message: "Category restored successfully.",
        };
    });
}

export async function deleteCategorySafely(categoryId: string) {
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findUnique({
            where: {
                id: categoryId,
            },
            select: {
                id: true,
                isActive: true,
            },
        });

        if (!category) {
            throw new NotFoundError("Category not found.");
        }

        const counts = await readCategoryCounts(tx, categoryId);
        const hasDependencies =
            counts.children > 0 ||
            counts.products > 0 ||
            counts.couponCategories > 0 ||
            counts.commissionRules > 0;

        if (hasDependencies) {
            await tx.category.update({
                where: {
                    id: categoryId,
                },
                data: {
                    isActive: false,
                },
            });

            return {
                status: 200,
                message:
                    "Category was archived instead of deleted because it is still referenced.",
                data: {
                    archived: true,
                },
            };
        }

        await tx.category.delete({
            where: {
                id: categoryId,
            },
        });

        return {
            status: 200,
            message: "Category deleted successfully.",
            data: {
                archived: false,
            },
        };
    });
}
