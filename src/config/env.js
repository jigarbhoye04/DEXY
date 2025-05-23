import dotenv from 'dotenv';
dotenv.config();

const config = {
    discordToken: process.env.DISCORD_TOKEN,
    geminiApiKey: process.env.GEMINI_API_KEY,
};

// Validate essential configuration
if (!config.discordToken) {
    console.error("Error: DISCORD_TOKEN is not defined in .env file.");
    process.exit(1);
}
if (!config.geminiApiKey) {
    console.error("Error: GEMINI_API_KEY is not defined in .env file.");
    process.exit(1);
}

export default config; 