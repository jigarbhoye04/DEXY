import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import config from "./config/env.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import {
   getActiveDebate,
   addDebateStatement,
   getWatchedChannelConfig,
} from "./state/memoryStore.js";

// --- Command Loading ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
   ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
   .readdirSync(commandsPath)
   .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
   const filePath = path.join(commandsPath, file);
   // Use filePath directly for file URL
   const command = (await import(`file://${filePath}`)).default; //file url for dynamic imports and all

   if (command && "data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
   } else {
      console.log(
         `[Warning] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
   }
}

// --- Event Handlers ---
client.once(Events.ClientReady, (c) => {
   // c is the client instance
   console.log(`Ready!`);
   if (c.user) {
      console.log(`Logged in as ${c.user.tag}`);
   }
});

client.on(Events.InteractionCreate, async (interaction) => {
   if (!interaction.isChatInputCommand()) return;

   const command = interaction.client.commands.get(interaction.commandName);
   if (!command) {
      console.error(
         `No command matching ${interaction.commandName} was found.`
      );
      await interaction.reply({
         content: "Error: Command not found.",
         flags: [MessageFlags.Ephemeral],
      });
      return;
   }

   try {
      await command.execute(interaction);
   } catch (error) {
      console.error(
         `Error executing command ${interaction.commandName}:`,
         error
      );
      // interaction.replied or interaction.deferred should exists before trying to use followUp
      if (interaction.replied || interaction.deferred) {
         await interaction.followUp({
            content: "There was an error while executing this command!",
            flags: [MessageFlags.Ephemeral],
         });
      } else {
         await interaction.reply({
            content: "There was an error while executing this command!",
            flags: [MessageFlags.Ephemeral],
         });
      }
   }
});

// event handler for MessageCreate to capture debate statements
client.on(Events.MessageCreate, async (message) => {
   // Ignore messages from bots or system messages
   if (message.author.bot || message.system) return;

   const channelId = message.channelId;
   const authorId = message.author.id;

   // Check if there's an active debate in this channel
   const debate = getActiveDebate(channelId);

   if (debate) {
      // Check if the message author is one of the debaters
      if (authorId === debate.debater1Id || authorId === debate.debater2Id) {
         // Record the statement
         const recorded = addDebateStatement(
            channelId,
            authorId,
            message.content
         );
         if (recorded) {
            // react to the message to indicate it's been recorded
            try {
               await message.react("✍️");
            } catch (reactError) {
               console.warn(
                  `Failed to react to message ${message.id}: ${reactError.message}. Missing permissions?`
               );
            }
         }
      }
   }

   // --- Event Commentator Handling ---
   const watchedChannelConf = getWatchedChannelConfig(channelId);
   if (watchedChannelConf) {
      console.log(
         `[Commentator] Message in watched channel (${channelId}) by ${message.author.username}: "${message.content}"`
      );
   }
});

client.login(config.discordToken).catch((err) => {
   console.error("Failed to login:", err.message);
   if (err.message.includes("Privileged Intents")) {
      console.error(
         "Please ensure all necessary Privileged Gateway Intents are enabled for your bot in the Discord Developer Portal."
      );
   }
   process.exit(1);
});
