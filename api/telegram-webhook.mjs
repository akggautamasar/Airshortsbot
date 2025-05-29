// api/telegram-webhook.js
import TelegramBot from 'node-telegram-bot-api';
// Environment Variables (set these on Vercel)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const NEWS_API_BASE_URL = process.env.NEWS_API_URL_BASE || 'https://airshorts.vercel.app/news'; // Base URL for category-wise news
// Initialize bot (no polling, as we'll use webhooks)
const bot = TELEGRAM_BOT_TOKEN ? new TelegramBot(TELEGRAM_BOT_TOKEN) : null;
export default async function handler(req, res) {
    // Ensure it's a POST request from Telegram
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }
    if (!bot) {
        console.error("TELEGRAM_BOT_TOKEN is not set.");
        return res.status(500).send("Bot not configured.");
    }
    try {
        // Process the incoming update from Telegram
        const update = req.body;
        console.log('Received Telegram update:', JSON.stringify(update, null, 2));
        // Use bot.processUpdate to handle the webhook payload
        // This will trigger 'message' or 'command' listeners
        bot.processUpdate(update);
        // Respond quickly to Telegram to acknowledge receipt
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing Telegram webhook:', error);
        res.status(500).send('Error processing update.');
    }
}
// --- Bot Command Handlers ---
// Handler for the /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, "Hello! I'm your news bot. Send me a command like /news or /news <category> to get the latest headlines. Try /news all, /news technology, or /news sports!");
});
// Handler for the /news command with optional category
bot.onText(/\/news(?:\s+(.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    let category = match[1] ? match[1].toLowerCase().trim() : 'all'; // Default to 'all'
    await bot.sendMessage(chatId, `Fetching latest news for category: *${category}*...`, { parse_mode: 'Markdown' });
    // Basic validation for categories (optional, but good practice)
    const allowedCategories = [
        'all', 'national', 'business', 'sports', 'world', 'politics',
        'technology', 'startup', 'entertainment', 'miscellaneous',
        'hatke', 'science', 'automobile'
    ];
    if (!allowedCategories.includes(category)) {
        await bot.sendMessage(chatId, `Sorry, "${category}" is not a valid category. Please try one of these: ${allowedCategories.join(', ')}.`);
        return;
    }
    try {
        const newsApiUrl = `<span class="math-inline">\{NEWS\_API\_BASE\_URL\}?category\=</span>{category}`;
        console.log(`Fetching news from: ${newsApiUrl}`);
        const newsResponse = await fetch(newsApiUrl);
        if (!newsResponse.ok) {
            const errorText = await newsResponse.text();
            console.error(`Failed to fetch news from AirShorts API: ${newsResponse.status} - ${errorText}`);
            await bot.sendMessage(chatId, "Sorry, I'm having trouble fetching news right now. Please try again later.");
            return;
        }
        const newsData = await newsResponse.json();
        if (!newsData || !newsData.data || newsData.data.length === 0) {
            await bot.sendMessage(chatId, `No news found for category: *${category}*.`, { parse_mode: 'Markdown' });
            return;
        }
        const latestNews = newsData.data[0]; // Get the most recent article
        const htmlMessage = `
