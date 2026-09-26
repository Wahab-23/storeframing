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
    description: z.string().trim().max(50000).nullable().optional(),
    imageUrl: z.string().trim().max(2048).nullable().optional(),
    bannerUrl: z.string().trim().max(2048).nullable().optional(),
    iconUrl: z.string().trim().max(2048).nullable().optional(),
    displayMode: z.string().trim().max(50).nullable().optional(),
    includeInMenu: z.boolean().optional(),
    customLayout: z.string().trim().max(100).nullable().optional(),
    parentId: z.string().nullable().optional().transform((val) => (val === "" ? null : val)),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    seo: seoSchema.nullable().optional(),
    attributes: z.array(categoryAttributeSchema).optional(),
    blockIds: z.array(z.string()).optional(),
    productIds: z.array(z.string()).optional(),
});

export const adminCategoryListQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    parentId: z
        .string()
        .optional()
        .transform((val) => {
            if (val === undefined) return undefined;
            if (val === "null" || val === "root" || val === "") return null;
            return val;
        })
        .nullable(),
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
