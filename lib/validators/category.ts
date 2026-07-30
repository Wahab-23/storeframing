import { z } from "zod";

const seoSchema = z.object({
    metaTitle: z.string().trim().max(255).nullable().optional(),
    metaDescription: z.string().trim().max(5000).nullable().optional(),
    metaKeywords: z.string().trim().max(5000).nullable().optional(),
    canonicalUrl: z.string().trim().max(2048).nullable().optional(),
    ogTitle: z.string().trim().max(255).nullable().optional(),
    ogDescription: z.string().trim().max(5000).nullable().optional(),
    ogImageUrl: z.string().trim().max(2048).nullable().optional(),
    twitterTitle: z.string().trim().max(255).nullable().optional(),
    twitterDescription: z.string().trim().max(5000).nullable().optional(),
    twitterImageUrl: z.string().trim().max(2048).nullable().optional(),
    robots: z.string().trim().max(255).nullable().optional(),
});

const categoryAttributeSchema = z.object({
    attributeId: z.string().cuid2(),
    isRequired: z.boolean().optional(),
    isFilterable: z.boolean().optional(),
    isVariant: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
});

const categoryBaseSchema = z.object({
    name: z.string().trim().min(1).max(255),
    slug: z.string().trim().min(1).max(255).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    imageUrl: z.string().trim().max(2048).nullable().optional(),
    parentId: z.string().cuid2().nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    seo: seoSchema.nullable().optional(),
    attributes: z.array(categoryAttributeSchema).optional(),
});

export const adminCategoryListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    parentId: z.string().cuid2().nullable().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    search: z.string().trim().min(1).max(255).optional(),
});

export const adminCategoryCreateSchema = categoryBaseSchema.refine(
    (value) => value.name.length > 0,
    {
        message: "Category name is required.",
        path: ["name"],
    }
);

export const adminCategoryUpdateSchema = categoryBaseSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    {
        message: "At least one field is required.",
    }
);

export const adminCategoryMoveSchema = z.object({
    parentId: z.string().cuid2().nullable(),
    sortOrder: z.number().int().optional(),
});

export const adminCategoryReorderSchema = z.object({
    items: z
        .array(
            z.object({
                id: z.string().cuid2(),
                sortOrder: z.number().int(),
            })
        )
        .min(1),
});

export type CategorySeoInput = z.infer<typeof seoSchema>;
export type CategoryAttributeInput = z.infer<typeof categoryAttributeSchema>;
export type AdminCategoryCreateInput = z.infer<
    typeof adminCategoryCreateSchema
>;
export type AdminCategoryUpdateInput = z.infer<
    typeof adminCategoryUpdateSchema
>;
