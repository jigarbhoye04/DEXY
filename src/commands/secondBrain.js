import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { generateGeminiSummary } from "../services/geminiService.js";

export default {
   data: new SlashCommandBuilder()
      .setName("summarize")
      .setDescription(
         "Summarizes recent messages in this channel using Gemini AI."
      ),
   async execute(interaction) {
      // Defer reply - making it public so everyone can see the summary
      await interaction.deferReply();

      try {
         const messageLimit = 30;
         const messages = await interaction.channel.messages.fetch({
            limit: messageLimit,
         });

         if (messages.size === 0) {
            await interaction.editReply(
               "No messages found to summarize in this channel."
            );
            return;
         }

         const messageContents = [];
         messages.reverse().forEach((msg) => {
            if (!msg.author.bot && msg.content) {
               messageContents.push(`${msg.author.username}: ${msg.content}`);
            }
         });

         if (messageContents.length === 0) {
            await interaction.editReply(
               "Found recent messages, but none suitable for summarization (e.g., only bot messages or empty content)."
            );
            return;
         }

         const conversationText = messageContents.join("\n");

         const summaryText = await generateGeminiSummary(conversationText);

         // NOTE: 
         // Discord message character limit is 2000 for embeds, 2000 for regular content.
         // For embeds, description limit is 4096, but total embed chars also limited.

         const summaryEmbed = new EmbedBuilder()
            .setColor(0x0099ff) // Blue color
            .setTitle(`Summary of the last ~${messageContents.length} messages`)
            .setDescription(
               summaryText.length > 4000
                  ? summaryText.substring(0, 4000) + "\n..."
                  : summaryText
            ) // Truncate if too long for embed description
            .setTimestamp()
            .setFooter({ text: "AI Generated Insights" });

         await interaction.editReply({ embeds: [summaryEmbed] });
      } catch (error) {
         console.error("Error in summarize command execution:", error);
         let errorMessage =
            "Sorry, I encountered an error trying to summarize messages.";
         if (error.message.includes("Invalid Gemini API Key")) {
            errorMessage =
               "There seems to be an issue with the Gemini API Key configuration. Please contact the bot administrator.";
         } else if (
            error.message.includes("Failed to generate summary from Gemini API")
         ) {
            errorMessage = `Could not get a summary from Gemini. Details: ${error.message.replace(
               "Failed to generate summary from Gemini API. Details: ",
               ""
            )}`;
         } else if (error.code === 50013) {
            // DiscordAPIError: Missing Permissions
            errorMessage =
               "I seem to be missing permissions to read message history in this channel.";
         }
         // If an error occurs, the reply should be ephemeral so it doesn't clutter the chat.
         await interaction.editReply({
            content: errorMessage,
            ephemeral: true,
         });
      }
   },
};
