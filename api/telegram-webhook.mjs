// ... (inside the bot.onText(/\/news/ ... ) handler)

    console.log(`Command /news received from chat ${chatId} for category: ${category}`);

    // --- NEW DIAGNOSTIC LOGS START ---
    console.log('DEBUG: 1. Before sending "Fetching latest news..." message.');
    // --- NEW DIAGNOSTIC LOGS END ---
    await bot.sendMessage(chatId, `Fetching latest news for category: *${category}*...`, { parse_mode: 'Markdown' });
    // --- NEW DIAGNOSTIC LOGS START ---
    console.log('DEBUG: 2. After sending "Fetching latest news..." message. Before category validation.');
    // --- NEW DIAGNOSTIC LOGS END ---

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

    // --- NEW DIAGNOSTIC LOGS START ---
    console.log('DEBUG: 3. All pre-fetch checks passed. Preparing for fetch block.');
    // --- NEW DIAGNOSTIC LOGS END ---

    try {
        const newsApiUrl = `${NEWS_API_BASE_URL}?category=${encodeURIComponent(category)}`;
        console.log(`Attempting to fetch news from: ${newsApiUrl}`);
        const newsResponse = await fetch(newsApiUrl);

        // ... (rest of your fetch success/error handling code)

    } catch (error) {
        console.error('Error in /news command handler (catch block):', error);
        await bot.sendMessage(chatId, "An unexpected error occurred while processing your request.");
    }
});
