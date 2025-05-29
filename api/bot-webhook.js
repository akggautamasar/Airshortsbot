// api/bot-webhook.js
import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch'; // Vercel's Node.js runtime has `fetch` globally

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Base URL for your news API
const BASE_NEWS_API_URL = 'https://airshorts.vercel.app/news';

// Initialize bot outside the handler for reuse
const bot = TOKEN ? new TelegramBot(TOKEN, { polling: false }) : null;

// List of supported categories from your API
