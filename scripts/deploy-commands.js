//run once to register/update commands.
import { REST, Routes } from "discord.js";
import config from "../src/config/env.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(__dirname, "../src", "commands");
const commandFiles = fs
   .readdirSync(commandsPath)
   .filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
   const filePath = path.join(commandsPath, file);
   // Use filePath directly for file URL
   const command = (await import(`file://${filePath}`)).default;
   if (command && "data" in command) {
      commands.push(command.data.toJSON());
      console.log(`Prepared command for deployment: ${command.data.name}`);
   } else {
      console.log(
         `[WARNING] The command at ${filePath} is missing a "data" property and cannot be deployed.`
      );
   }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(config.discordToken);

// and deploy your commands!
(async () => {
   try {
      console.log(
         `Started refreshing ${commands.length} application (/) commands.`
      );

      if (!process.env.GUILD_ID || !process.env.CLIENT_ID) {
         console.error(
            "Error: GUILD_ID or CLIENT_ID is not defined in .env file. Cannot deploy commands."
         );
         console.log(
            "Please add GUILD_ID (your test server ID) and CLIENT_ID (your bot's Application ID) to your .env file."
         );
         process.exit(1);
      }

      const data = await rest.put(
         Routes.applicationGuildCommands(
            process.env.CLIENT_ID,
            process.env.GUILD_ID
         ),
         { body: commands }
      );

      console.log(
         `Successfully reloaded ${data.length} application (/) commands for guild ${process.env.GUILD_ID}.`
      );
   } catch (error) {
      console.error(error);
   }
})();
