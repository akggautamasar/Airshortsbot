// api/send-news.js
import TelegramBot from 'node-telegram-bot-api';

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHANNEL_ID;
const NEWS_API_URL = process.env.NEWS_API_URL || 'https://airshorts.vercel.app/news?category=all';

const bot = TOKEN ? new TelegramBot(TOKEN, { polling: false }) : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    if (!TOKEN || !CHAT_ID || !bot) {
        console.error("Critical: TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID is not set.");
        return res.status(500).send("Bot not configured. Check environment variables.");
    }

    try {
        console.log(`[${new Date().toISOString()}] Attempting to fetch news from: ${NEWS_API_URL}`);
        const newsResponse = await fetch(NEWS_API_URL);

        if (!newsResponse.ok) {
            const errorText = await newsResponse.text();
            console.error(`[${new Date().toISOString()}] Failed to fetch news: ${newsResponse.status} - ${errorText}`);
            return res.status(newsResponse.status).send(`Failed to fetch news: ${errorText}`);
        }

        const newsData = await newsResponse.json();

        if (!newsData || !newsData.data || newsData.data.length === 0) {
            console.log(`[${new Date().toISOString()}] No news found to post.`);
            return res.status(200).send('No news found to post.');
        }

        const latestNews = newsData.data[0];

        const htmlMessage = `&lt;b>${latestNews.title.replace(/\n/g, ' ')}&lt;/b>

${latestNews.content.replace(/\n/g, ' ').substring(0, 1000)}...

&lt;a href="${latestNews.readMoreUrl}">Read More&lt;/a>
Source: Inshorts by ${latestNews.author}
`;

            console.log(`[${new Date().toISOString()}] Sending news to channel ${CHAT_ID}. Title: "${latestNews.title}"`);
            await bot.sendMessage(CHAT_ID, htmlMessage, { parse_mode: 'HTML', disable_web_page_preview: false });
            console.log(`[${new Date().toISOString()}] News successfully posted to Telegram.`);

            res.status(200).send('News posted successfully to Telegram channel.');

        } catch (error) {
            console.error(`[${new Date().toISOString()}] Error in send-news handler:`, error);
            res.status(500).send('An error occurred while posting news.');
        }
    }
    ```
