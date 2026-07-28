export function getAvailableInventory(
    quantity: number,
    reservedQuantity: number
) {
    return Math.max(
        quantity - reservedQuantity,
        0
    );
}