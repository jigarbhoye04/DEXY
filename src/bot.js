import {
   Client,
   GatewayIntentBits,
   Collection,
   Events,
   MessageFlags,
} from "discord.js";
import config from "./config/env.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
   getActiveDebate,
   addDebateStatement,
   getWatchedChannelConfig,
   updateLastCommentaryTime,
} from "./state/memoryStore.js";
import { generateCommentary } from "./services/geminiService.js";

const COMMENTARY_COOLDOWN_MS = 30000;

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
   const commandModule = await import(`file://${filePath}`);
   const command = commandModule.default;

   if (command && "data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
   } else {
      console.log(
         `[WARNING] Command at ${filePath} missing "data" or "execute".`
      );
   }
}

client.once(Events.ClientReady, (c) => {
   console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
   if (!interaction.isChatInputCommand()) return;

   const command = interaction.client.commands.get(interaction.commandName);
   if (!command) {
      console.error(`No command matching ${interaction.commandName} found.`);
      try {
         if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
               content: "Error: Command not found.",
               flags: [MessageFlags.Ephemeral],
            });
         } else {
            await interaction.reply({
               content: "Error: Command not found.",
               flags: [MessageFlags.Ephemeral],
            });
         }
      } catch (e) {
         console.error("Error sending 'Command not found' reply:", e);
      }
      return;
   }

   try {
      await command.execute(interaction);
   } catch (error) {
      console.error(
         `Error executing command ${interaction.commandName}:`,
         error
      );
      try {
         if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
               content: "There was an error executing this command!",
               flags: [MessageFlags.Ephemeral],
            });
         } else {
            await interaction.reply({
               content: "There was an error executing this command!",
               flags: [MessageFlags.Ephemeral],
            });
         }
      } catch (e) {
         console.error("Error sending execution error reply:", e);
      }
   }
});

client.on(Events.MessageCreate, async (message) => {
   if (message.author.bot || message.system) return;

   const channelId = message.channelId;
   const authorId = message.author.id;

   const activeDebate = getActiveDebate(channelId);
   if (activeDebate) {
      if (
         authorId === activeDebate.debater1.id ||
         authorId === activeDebate.debater2.id
      ) {
         const recorded = addDebateStatement(
            channelId,
            authorId,
            message.content
         );
         if (recorded) {
            try {
               await message.react("✍️");
            } catch (reactError) {
               // console.warn(`Failed to react (debate): ${reactError.message}`);
            }
         }
      }
   }

   const watchedChannelConf = getWatchedChannelConfig(channelId);
   if (watchedChannelConf) {
      const now = Date.now();
      if (
         now - (watchedChannelConf.lastCommentary || 0) <
         COMMENTARY_COOLDOWN_MS
      ) {
         return;
      }
      try {
         const commentary = await generateCommentary(
            message.content,
            message.author.username,
            watchedChannelConf.style
         );
         if (commentary) {
            await message.channel.send(`🎙️ **Dexy's Take:** ${commentary}`);
            updateLastCommentaryTime(channelId);
         }
      } catch (error) {
         console.error(
            `[Commentator] Failed to generate/send commentary for ${channelId}:`,
            error
         );
      }
   }
});

client.login(config.discordToken).catch((err) => {
   console.error("Failed to login:", err.message);
   if (err.message.includes("Privileged Intents")) {
      console.error(
         "Ensure Privileged Gateway Intents are enabled in Discord Dev Portal."
      );
   }
   process.exit(1);
});
