import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { createAddressSchema } from "@/lib/validators/address";

type CreateAddressInput = {
    userId: string;
    body: unknown;
};

export async function createAddress({ userId, body }: CreateAddressInput) {
    const parsed = createAddressSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const data = parsed.data;

    return prisma.$transaction(async (tx) => {
        if (data.isDefault) {
            await tx.address.updateMany({
                where: {
                    userId,
                },
                data: {
                    isDefault: false,
                },
            });
        }

        const address = await tx.address.create({
            data: {
                userId,
                type: data.type ?? "OTHER",
                firstName: data.firstName,
                lastName: data.lastName,
                company: data.company ?? null,
                addressLine1: data.addressLine1,
                addressLine2: data.addressLine2 ?? null,
                city: data.city,
                state: data.state ?? null,
                postalCode: data.postalCode ?? null,
                countryCode: data.countryCode.toUpperCase(),
                phone: data.phone ?? null,
                isDefault: data.isDefault ?? false,
            },
        });

        return {
            status: 201,
            message: "Address created successfully.",
            data: {
                address,
            },
        };
    });
}
