import { TokenData } from '../types';

export const mergeTokens = (
    sourceA: TokenData[],
    sourceB: TokenData[]
): TokenData[] => {
    const map = new Map<string, TokenData>();

    const processToken = (token: TokenData) => {
        const existing = map.get(token.token_address);
        if (!existing) {
            map.set(token.token_address, token);
        } else {
            // Strategy: Prioritize source with highest volume or default metrics?
            // Requirement: "prioritizing the source with the highest volume."
            if (token.volume_sol > existing.volume_sol) {
                map.set(token.token_address, token);
            }
            // If equal or less, keep existing.
            // We could also merge fields if one is missing data, but for now simple overwrite based on volume.
        }
    };

    sourceA.forEach(processToken);
    sourceB.forEach(processToken);

    return Array.from(map.values());
};
