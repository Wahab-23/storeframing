import { withApiHandler } from "@/lib/api-handler";
import { getCategoryTree } from "@/lib/categories/manage";

export const GET = withApiHandler(async () => {
    return getCategoryTree({
        activeOnly: true,
    });
});
