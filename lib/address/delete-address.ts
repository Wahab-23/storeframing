import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

type DeleteAddressInput = {
    userId: string;
    addressId: string;
};

export async function deleteAddress({ userId, addressId }: DeleteAddressInput) {
    const address = await prisma.address.findFirst({
        where: {
            id: addressId,
            userId,
        },
        select: {
            id: true,
            isDefault: true,
        },
    });

    if (!address) {
        throw new AppError(404, "Address not found.");
    }

    return prisma.$transaction(async (tx) => {
        await tx.address.delete({
            where: {
                id: address.id,
            },
        });

        if (address.isDefault) {
            const nextDefault = await tx.address.findFirst({
                where: {
                    userId,
                },
                orderBy: {
                    createdAt: "asc",
                },
                select: {
                    id: true,
                },
            });

            if (nextDefault) {
                await tx.address.update({
                    where: {
                        id: nextDefault.id,
                    },
                    data: {
                        isDefault: true,
                    },
                });
            }
        }

        return {
            status: 200,
            message: "Address deleted successfully.",
            data: {
                deletedAddressId: address.id,
            },
        };
    });
}
