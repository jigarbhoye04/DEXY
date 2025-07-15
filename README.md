# Dexy - AI-Powered Discord Bot

Dexy is a versatile and intelligent Discord bot powered by Google's Gemini AI. It's designed to bring a range of interactive and utility features to your Discord server, from lively debate moderation to providing a "second brain" for your community. Dexy is built to be deployed as a serverless application on Cloudflare Workers for scalability and efficiency.

## Features

Dexy offers a variety of commands, each leveraging AI to provide a unique experience:

*   **`/ping`**: A simple command to check if the bot is online and responsive.
*   **`/commentator`**: Provides running commentary on conversations in a channel, with different personality styles.
*   **`/debatereferee`**: Moderates a formal debate between two users, keeping track of statements and declaring a winner.
*   **`/devcoach`**: Acts as a software development coach, offering guidance and advice on coding problems.
*   **`/secondbrain`**: Functions as a community knowledge base, answering questions and defining terms.
*   **`/vibecheck`**: Analyzes the sentiment of the chat to gauge the overall "vibe" of the conversation.
*   **`/whatif`**: Explores alternate timelines and scenarios based on user prompts.
*   **`/utility`**: A collection of helpful utility commands.

## Tech Stack

*   **[Discord.js](https://discord.js.org/)**: The primary library for interacting with the Discord API.
*   **[Google Gemini AI](https://ai.google.dev/)**: Powers the bot's intelligent features.
*   **[Cloudflare Workers](https://workers.cloudflare.com/)**: For serverless deployment.
*   **[Wrangler](https://developers.cloudflare.com/workers/wrangler/)**: The CLI for managing Cloudflare Workers.

## Getting Started

There are two main ways to run Dexy: locally for development and testing, or deployed on Cloudflare Workers for production use.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or higher)
*   A Discord Bot Token, Client ID, and Guild ID. You can get these by creating a new application in the [Discord Developer Portal](https://discord.com/developers/applications).
*   A Google Gemini API Key. You can obtain one from the [Google AI Studio](https://aistudio.google.com/app/apikey).

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/dexy.git
    cd dexy
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Then, fill in the required values in the `.env` file:
    ```
    DISCORD_TOKEN="your-discord-bot-token"
    CLIENT_ID="your-discord-client-id"
    GUILD_ID="your-discord-server-id"
    GEMINI_API_KEY="your-gemini-api-key"
    ```

4.  **Deploy commands to Discord:**
    Before starting the bot, you need to register its slash commands with Discord.
    ```bash
    node scripts/deploy-commands.js
    ```

5.  **Start the bot:**
    ```bash
    npm start
    ```
    Your bot should now be online and ready to use in your Discord server.

### Cloudflare Workers Deployment

Dexy is designed to be deployed as a serverless application on Cloudflare Workers.

1.  **Install Wrangler CLI:**
    ```bash
    npm install -g wrangler
    ```

2.  **Login to Cloudflare:**
    ```bash
    wrangler login
    ```

3.  **Configure `wrangler.toml`:**
    The `wrangler.toml` file is already configured for deployment. You may need to adjust the `name` and `compatibility_date` fields if you wish.

4.  **Set up secrets:**
    You need to add your environment variables as secrets to your Cloudflare Worker.
    ```bash
    wrangler secret put DISCORD_TOKEN
    wrangler secret put CLIENT_ID
    wrangler secret put GUILD_ID
    wrangler secret put GEMINI_API_KEY
    ```
    You will be prompted to enter the value for each secret.

5.  **Deploy the bot:**
    ```bash
    npm run deploy
    ```
    This will deploy your bot to Cloudflare Workers. You will also need to set the interactions endpoint URL in your Discord application's settings to the URL of your deployed worker.

## Project Structure

```
.
├── scripts/
│   └── deploy-commands.js  # Deploys slash commands to Discord
├── src/
│   ├── commands/            # Slash command definitions
│   ├── services/            # Services for interacting with external APIs (Gemini, etc.)
│   ├── state/               # In-memory data storage
│   ├── bot.js               # Main bot logic (for local development)
│   └── index.js             # Entry point for Cloudflare Workers
├── .env.example             # Example environment variables
├── package.json
└── wrangler.toml            # Cloudflare Workers configuration
```

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
