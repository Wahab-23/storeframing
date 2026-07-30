import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

export type SiteSettingsInput = {
    siteName?: string | null;
    siteUrl?: string | null;
    defaultTitle?: string | null;
    titleTemplate?: string | null;
    defaultMetaDescription?: string | null;
    defaultOgImageUrl?: string | null;
    defaultTwitterImageUrl?: string | null;
    robots?: string | null;
    organizationJson?: Prisma.InputJsonValue | null;
    socialLinksJson?: Prisma.InputJsonValue | null;
};

export function normalizeSiteSettingsInput(input: SiteSettingsInput) {
    return Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined)
    ) as SiteSettingsInput;
}

export async function getSiteSettings() {
    const settings = await prisma.siteSetting.findFirst({
        orderBy: {
            updatedAt: "desc",
        },
    });

    return {
        status: 200,
        message: "Site settings fetched successfully.",
        data: {
            settings,
        },
    };
}

export async function updateSiteSettings(input: SiteSettingsInput, updatedByUserId?: string) {
    const normalized = normalizeSiteSettingsInput(input);

    if (Object.keys(normalized).length === 0) {
        throw new AppError(400, "No settings were provided.");
    }

    const existing = await prisma.siteSetting.findFirst();

    const { organizationJson, socialLinksJson, ...restNormalized } = normalized;

    const data: Prisma.SiteSettingUncheckedUpdateInput = {
        ...restNormalized,
        ...(organizationJson !== undefined
            ? { organizationJson: organizationJson === null ? Prisma.DbNull : (organizationJson as Prisma.InputJsonValue) }
            : {}),
        ...(socialLinksJson !== undefined
            ? { socialLinksJson: socialLinksJson === null ? Prisma.DbNull : (socialLinksJson as Prisma.InputJsonValue) }
            : {}),
        ...(updatedByUserId ? { updatedByUserId } : {}),
    };

    if (existing) {
        await prisma.siteSetting.update({
            where: { id: existing.id },
            data,
        });
    } else {
        await prisma.siteSetting.create({
            data: data as Prisma.SiteSettingUncheckedCreateInput,
        });
    }

    return getSiteSettings();
}
