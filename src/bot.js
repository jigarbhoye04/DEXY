import { Client, GatewayIntentBits } from 'discord.js';
import config from './config/env.js'; 

// Create a new Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ]
});

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log('Ready!');
    if (client.user) {
        console.log(`Logged in as ${client.user.tag}!`);
    }
});

// Log in to Discord with your client's token
client.login(config.DISCORD_TOKEN)
    .catch(err => {
        console.error("Failed to login:", err);
        if (err.message.includes("Privileged Intents")) {
            console.error("Please ensure all necessary Privileged Gateway Intents are enabled for your bot in the Discord Developer Portal.");
        }
        process.exit(1); // Exit if login fails
    });