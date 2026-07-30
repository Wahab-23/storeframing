import { roundMoney } from "./rounding";

export function allocateProportionally(
    total: number,
    weights: number[]
) {
    if (weights.length === 0) {
        return [];
    }

    const normalizedTotal = roundMoney(total);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    if (totalWeight <= 0) {
        return weights.map(() => 0);
    }

    const allocations = weights.map((weight, index) => {
        if (index === weights.length - 1) {
            return 0;
        }

        return roundMoney((normalizedTotal * weight) / totalWeight);
    });

    const allocated = allocations.reduce((sum, amount) => sum + amount, 0);
    allocations[allocations.length - 1] = roundMoney(
        normalizedTotal - allocated
    );

    return allocations;
}

