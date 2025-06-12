import {
   SlashCommandBuilder,
   MessageFlags,
   PermissionFlagsBits,
   EmbedBuilder,
} from "discord.js";
import {
   watchChannel,
   unwatchChannel,
   getWatchedChannelConfig,
} from "../state/memoryStore.js";
import { generateStoryRecap } from "../services/geminiService.js";

const MAX_RECAP_MESSAGES = 50;
const MAX_EMBED_DESCRIPTION = 4000;

function truncateText(text, maxLength = MAX_EMBED_DESCRIPTION) {
   if (typeof text !== "string") text = String(text);
   if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "...";
   }
   return text;
}

export default {
   data: new SlashCommandBuilder()
      .setName("commentator")
      .setDescription("Manages event commentary for a channel.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
      .addSubcommand((subcommand) =>
         subcommand
            .setName("watch")
            .setDescription("Starts event commentary in this channel.")
            .addStringOption((option) =>
               option
                  .setName("style")
                  .setDescription(
                     "The commentary style (e.g., funny, serious). Default: default"
                  )
                  .setRequired(false)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName("unwatch")
            .setDescription("Stops event commentary in this channel.")
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName("status")
            .setDescription(
               "Checks if event commentary is active in this channel."
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName("recap")
            .setDescription(
               `Generates a story-style recap of up to ${MAX_RECAP_MESSAGES} messages.`
            )
            .addIntegerOption((option) =>
               option
                  .setName("messages")
                  .setDescription(
                     `Number of messages to recap (max ${MAX_RECAP_MESSAGES}). Default: 25`
                  )
                  .setMinValue(5)
                  .setMaxValue(MAX_RECAP_MESSAGES)
                  .setRequired(false)
            )
      ),

   async execute(interaction) {
      if (!interaction.isChatInputCommand()) return;

      const subcommand = interaction.options.getSubcommand();
      const channelId = interaction.channelId;

      if (subcommand === "recap") {
         await interaction.deferReply({ ephemeral: false }); // Public defer for recap
      } else {
         // watch, unwatch, status
         await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
      }

      try {
         if (subcommand === "watch") {
            const style = interaction.options.getString("style") || "default";
            if (watchChannel(channelId, style)) {
               await interaction.editReply(
                  `🎙️ Okay, I'll start commentating with style '${style}'!`
               );
            } else {
               const currentConfig = getWatchedChannelConfig(channelId);
               await interaction.editReply(
                  `I'm already commentating (style: '${
                     currentConfig?.style || "unknown"
                  }'). Use \`/commentator unwatch\` first.`
               );
            }
         } else if (subcommand === "unwatch") {
            if (unwatchChannel(channelId)) {
               await interaction.editReply(
                  "Okay, I will no longer commentate here. 🎤"
               );
            } else {
               await interaction.editReply(
                  "I wasn't commentating here anyway."
               );
            }
         } else if (subcommand === "status") {
            const config = getWatchedChannelConfig(channelId);
            if (config) {
               await interaction.editReply(
                  `Watching with style: '${config.style}'.`
               );
            } else {
               await interaction.editReply("Not watching this channel.");
            }
         } else if (subcommand === "recap") {
            const numMessagesToFetch =
               interaction.options.getInteger("messages") || 25;
            const messages = await interaction.channel.messages.fetch({
               limit: numMessagesToFetch,
            });

            if (messages.size === 0) {
               await interaction.editReply({
                  content: "No messages found to recap.",
               });
               return;
            }

            const formattedMessages = [];
            messages.reverse().forEach((msg) => {
               if (!msg.author.bot && msg.content) {
                  formattedMessages.push(
                     `${msg.author.username}: ${msg.content}`
                  );
               }
            });

            if (formattedMessages.length === 0) {
               await interaction.editReply({
                  content: "No suitable user messages found for a recap.",
               });
               return;
            }

            const recapText = await generateStoryRecap(formattedMessages);
            const recapEmbed = new EmbedBuilder()
               .setColor(0x5865f2)
               .setTitle(`📜 Event Recap: The Story So Far...`)
               .setDescription(truncateText(recapText, MAX_EMBED_DESCRIPTION))
               .setFooter({
                  text: `Recap of ~${formattedMessages.length} messages.`,
               })
               .setTimestamp();
            await interaction.editReply({ embeds: [recapEmbed] });
         }
      } catch (error) {
         console.error(`Error executing /commentator ${subcommand}:`, error);
         // Ensure the reply exists before trying to edit, especially if defer failed or was conditional
         if (!interaction.replied && !interaction.deferred) {
            // If it was never deferred or replied to, try a fresh reply
            // This case should be rare with the current deferral logic.
            await interaction.reply({
               content: "An unexpected error occurred.",
               flags: [MessageFlags.Ephemeral],
            });
         } else {
            // If deferred or replied, edit the existing reply.
            await interaction.editReply({
               content: "An error occurred while processing your request.",
               flags: [MessageFlags.Ephemeral],
            });
         }
      }
   },
};
