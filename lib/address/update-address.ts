import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { updateAddressSchema } from "@/lib/validators/address";

type UpdateAddressInput = {
    userId: string;
    addressId: string;
    body: unknown;
};

export async function updateAddress({ userId, addressId, body }: UpdateAddressInput) {
    const parsed = updateAddressSchema.safeParse(body);

    if (!parsed.success) {
        throw new AppError(400, "Validation failed.");
    }

    const existing = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId,
        },
        select: {
            id: true,
        },
    });

    if (!existing) {
        throw new AppError(404, "Address not found.");
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

        const address = await tx.address.update({
            where: {
                id: existing.id,
            },
            data: {
                ...(data.type !== undefined && { type: data.type }),
                ...(data.firstName !== undefined && { firstName: data.firstName }),
                ...(data.lastName !== undefined && { lastName: data.lastName }),
                ...(data.company !== undefined && {
                    company: data.company,
                }),
                ...(data.addressLine1 !== undefined && {
                    addressLine1: data.addressLine1,
                }),
                ...(data.addressLine2 !== undefined && {
                    addressLine2: data.addressLine2,
                }),
                ...(data.city !== undefined && {
                    city: data.city,
                }),
                ...(data.state !== undefined && {
                    state: data.state,
                }),
                ...(data.postalCode !== undefined && {
                    postalCode: data.postalCode,
                }),
                ...(data.countryCode !== undefined && {
                    countryCode: data.countryCode.toUpperCase(),
                }),
                ...(data.phone !== undefined && {
                    phone: data.phone,
                }),
                ...(data.isDefault !== undefined && {
                    isDefault: data.isDefault,
                }),
            },
        });

        return {
            status: 200,
            message: "Address updated successfully.",
            data: {
                address,
            },
        };
    });
}
