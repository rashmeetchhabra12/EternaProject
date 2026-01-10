import httpClient from './src/utils/httpClient';

async function debugJupiter() {
    try {
        const url = 'https://lite-api.jup.ag/tokens/v2/search?query=SOL';
        console.log('Fetching:', url);
        const response = await httpClient.get(url);
        console.log('Status:', response.status);
        console.log('Data keys:', Object.keys(response.data));
        if (Array.isArray(response.data)) {
            console.log('Data is array of length:', response.data.length);
            console.log('First item:', response.data[0]);
        } else if (response.data.tokens) {
            console.log('Data.tokens length:', response.data.tokens.length);
            console.log('First token:', response.data.tokens[0]);
        } else {
            console.log('Data structure unknown:', JSON.stringify(response.data).substring(0, 200));
        }
    } catch (e: any) {
        console.log('Error:', e.message);
        if (e.response) {
            console.log('Response data:', e.response.data);
        }
    }
}

debugJupiter();
