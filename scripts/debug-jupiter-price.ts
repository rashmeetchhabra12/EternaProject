import httpClient from './src/utils/httpClient';

async function debugJupiterPrice() {
    try {
        const ids = 'So11111111111111111111111111111111111111112'; // SOL
        const url = `https://api.jup.ag/price/v2?ids=${ids}&vsToken=So11111111111111111111111111111111111111112`;
        console.log('Fetching:', url);
        const response = await httpClient.get(url);
        console.log('Status:', response.status);
        console.log('Data:', JSON.stringify(response.data, null, 2));
    } catch (e: any) {
        console.log('Error:', e.message);
    }
}

debugJupiterPrice();
