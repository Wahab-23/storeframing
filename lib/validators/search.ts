import { z } from "zod";

export const searchQuerySchema = z.object({
    q: z.string().trim().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    filter: z.string().trim().min(1).max(500).optional(),
    sort: z.string().trim().min(1).max(500).optional(),
    facets: z.string().trim().min(1).max(500).optional(),
});
