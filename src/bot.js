import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import config from "./config/env.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

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
   //file path for dynamic url imports
   const fileUrl = path.toNamespacedPath(filePath);
   const command = (await import(`file://${fileUrl}`)).default; //file url for dynamic imports and all

   if (command && "data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
   } else {
      console.log(
         `[Warning] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
   }
}

// ---Event Handlers ---
client.once(Events.ClientReady, (x) => {
   console.log(`Ready!`);
   if (x.user) {
      console.log(`Logged in as ${x.user.tag}`);
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
         ephemeral: true,
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
      if (interaction.replied || interaction.deferred) {
         await interaction.followUp({
            content: "There was an error while executing this command!",
            ephemeral: true,
         });
      } else {
         await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
         });
      }
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
