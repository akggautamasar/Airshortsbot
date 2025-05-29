// api/telegram-webhook.js
import TelegramBot from 'node-telegram-bot-api';

// --- Diagnostic Logs - START ---
console.log('TELEGRAM_WEBHOOK_FUNCTION_STARTING (File loaded)');
console.log('Checking Environment Variables:');
console.log('  TELEGRAM_BOT_TOKEN is set:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('  NEWS_API_URL_BASE is set:', !!process.env.NEWS_API_URL_BASE);
// --- Diagnostic Logs - END ---

// Environment Variables (These must be set on Vercel under Project Settings -> Environment Variables)
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const NEWS_API_BASE_URL = process.env.NEWS_API_URL_BASE;

// Initialize bot (no polling, as we'll use webhooks for incoming updates)
const bot = TELEGRAM_BOT_TOKEN ? new TelegramBot(TELEGRAM_BOT_TOKEN) : null;

// --- Diagnostic Logs - START ---
console.log('Bot initialization result (is "bot" object valid?):', !!bot); // Will log 'true' or 'false'
// --- Diagnostic Logs - END ---

// This is the main serverless function handler that Vercel will call
export default async function handler(req, res) {
    console.log('--- Handler Function Invoked ---'); // Log when the handler function starts

    if (req.method !== 'POST') {
        console.log('Method not POST, returning 405.');
        return res.status(405).send('Method Not Allowed');
    }

    if (!bot) {
        console.error("TELEGRAM_BOT_TOKEN is not set or bot failed to initialize. Cannot process update.");
        return res.status(500).send("Bot not configured.");
    }

    try {
        const update = req.body;
        console.log('Received Telegram update:', JSON.stringify(update, null, 2));

        bot.processUpdate(update);

        res.status(200).send('OK');

    } catch (error) {
        console.error('Error processing Telegram webhook in handler:', error);
        res.status(500).send('Error processing update.');
    }
}

// --- Bot Command Handlers ---
// It's CRUCIAL these are only added if 'bot' is a valid object.
// If 'bot' is null/undefined here, 'bot.onText' would cause an immediate crash.
if (bot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        console.log(`Command /start received from chat ${chatId}`);
        await bot.sendMessage(chatId, "Hello! I'm your AirShorts news bot. Send me a command like /news or /news <category> to get the latest headlines. Try /news all, /news technology, or /news sports!");
    });

    bot.onText(/\/news(?:\s+(.+))?/, async (msg, match) => {
        const chatId = msg.chat.id;
        let category = match[1] ? match[1].toLowerCase().trim() : 'all';
        console.log(`Command /news received from chat ${chatId} for category: ${category}`);

        await bot.sendMessage(chatId, `Fetching latest news for category: *${category}*...`, { parse_mode: 'Markdown' });

        const allowedCategories = [
            'all', 'national', 'business', 'sports', 'world', 'politics',
            'technology', 'startup', 'entertainment', 'miscellaneous',
            'hatke', 'science', 'automobile'
        ];

        if (!allowedCategories.includes(category)) {
            console.log(`Invalid category: ${category}`);
            await bot.sendMessage(chatId, `Sorry, "${category}" is not a valid category. Please try one of these: \n\`${allowedCategories.join('`, `')}\`.`, { parse_mode: 'Markdown' });
            return;
        }

        if (!NEWS_API_BASE_URL) {
            console.error("NEWS_API_URL_BASE environment variable is not set in news handler.");
            await bot.sendMessage(chatId, "Bot configuration error: News API URL is not set. Please inform the bot administrator.");
            return;
        }

        try {
            const newsApiUrl = `${NEWS_API_BASE_URL}?category=${encodeURIComponent(category)}`;
            console.log(`Attempting to fetch news from: ${newsApiUrl}`); // This is the line that wasn't appearing
            const newsResponse = await fetch(newsApiUrl);

            if (!newsResponse.ok) {
                const errorText = await newsResponse.text();
                console.error(`Failed to fetch news from AirShorts API: ${newsResponse.status} - ${errorText}`);
                await bot.sendMessage(chatId, "Sorry, I'm having trouble fetching news right now from the source. Please try again later.");
                return;
            }

            const newsData = await newsResponse.json();

            if (!newsData || !newsData.data || newsData.data.length === 0) {
                console.log(`No news data found for category: ${category}`);
                await bot.sendMessage(chatId, `No news found for category: *${category}*. Please try another category or check back later.`, { parse_mode: 'Markdown' });
                return;
            }

            const latestNews = newsData.data[0];

            const htmlMessage = `
<b>${latestNews.title ? latestNews.title.replace(/\n/g, ' ').trim() : 'No Title Available'}</b>

${latestNews.content ? latestNews.content.replace(/\n/g, ' ').substring(0, 1000).trim() : 'No content available.'}${latestNews.content && latestNews.content.length > 1000 ? '...' : ''}

<a href="${latestNews.readMoreUrl}">Read More</a>
Source: Inshorts by ${latestNews.author ? latestNews.author.trim() : 'Unknown Author'}
`;

            await bot.sendMessage(chatId, htmlMessage, { parse_mode: 'HTML', disable_web_page_preview: false });
            console.log(`News for '${category}' successfully sent to chat ${chatId}.`);

        } catch (error) {
            console.error('Error in /news command handler (catch block):', error);
            await bot.sendMessage(chatId, "An unexpected error occurred while processing your request.");
        }
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        if (!msg.text || msg.text.startsWith('/')) {
            return;
        }
        console.log(`Unhandled message received from chat ${chatId}: "${msg.text}"`);
        await bot.sendMessage(chatId, "I'm not sure how to respond to that. Try sending /news or /news <category> (e.g., /news technology).");
    });
} else {
    // This block will execute if bot initialization failed
    console.error("Bot command handlers were NOT registered because the Telegram bot token is missing or invalid.");
}
