// api/test-fetch.js
import fetch from 'node-fetch'; // Even though Node.js 20 has native fetch, explicitly importing node-fetch ensures compatibility

const NEWS_API_URL_BASE = process.env.NEWS_API_URL_BASE; // Ensure this env var is correct in Vercel!

export default async function handler(req, res) {
    console.log('--- Test Fetch Function Invoked ---');
    console.log('NEWS_API_URL_BASE in test-fetch:', NEWS_API_URL_BASE);

    if (!NEWS_API_URL_BASE) {
        console.error('NEWS_API_URL_BASE is not set for test-fetch!');
        return res.status(500).send('API URL not configured.');
    }

    const testUrl = `${NEWS_API_URL_BASE}?category=all`;
    console.log(`Attempting to fetch from: ${testUrl}`);

    try {
        const response = await fetch(testUrl);
        console.log(`Fetch completed! Status: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fetch NOT OK. Status: ${response.status}, Error: ${errorText}`);
            return res.status(response.status).send(`Fetch failed with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Fetch successful! Received data (first 100 chars):', JSON.stringify(data).substring(0, 100));
        res.status(200).json({ status: 'success', data: data.data });

    } catch (error) {
        console.error('Error during fetch operation:', error);
        res.status(500).send(`Error fetching data: ${error.message}`);
    } finally {
        console.log('--- Test Fetch Function Finished ---');
    }
}
