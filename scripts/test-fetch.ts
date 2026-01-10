import { fetchDexScreener, fetchJupiter } from './src/services/fetcher';

async function test() {
    console.log('Testing DexScreener Fetch...');
    try {
        const dexData = await fetchDexScreener('SOL');
        console.log(`DexScreener returned ${dexData.length} tokens.`);
        if (dexData.length > 0) {
            console.log('Sample:', dexData[0].token_name, dexData[0].price_sol, 'SOL');
        }
    } catch (e) {
        console.error('DexScreener failed:', e);
    }

    console.log('Testing Jupiter Fetch...');
    try {
        const jupData = await fetchJupiter('SOL');
        console.log(`Jupiter returned ${jupData.length} tokens.`);
        if (jupData.length > 0) {
            console.log('Sample:', jupData[0].token_name, jupData[0].price_sol, 'SOL');
        }
    } catch (e) {
        console.error('Jupiter failed:', e);
    }
}

test();
