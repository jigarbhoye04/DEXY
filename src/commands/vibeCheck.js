import { SlashCommandBuilder } from "discord.js";
import { analyzeSentiment } from "../services/sentimentService.js"; 

export default {
   data: new SlashCommandBuilder()
      .setName("vibecheck")
      .setDescription(
         "Analyzes the sentiment of recent messages in this channel."
      ),
   async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      try {
         const messageLimit = 20;
         const messages = await interaction.channel.messages.fetch({
            limit: messageLimit,
         });

         if (messages.size === 0) {
            await interaction.editReply(
               "No messages found to analyze in this channel."
            );
            return;
         }

         const userMessages = [];
         messages.reverse().forEach((msg) => {
            if (!msg.author.bot && msg.content) {
               userMessages.push(msg.content);
            }
         });

         if (userMessages.length === 0) {
            await interaction.editReply(
               "Found recent messages, but none from users with content to analyze."
            );
            return;
         }

         const conversationText = userMessages.join("\n");
         console.log(
            `Sending the following text to Gemini for sentiment analysis (vibecheck):\n${conversationText.substring(
               0,
               500
            )}...`
         );

         const sentimentResult = await analyzeSentiment(conversationText);

         console.log("Gemini Sentiment Analysis Result:", sentimentResult);

         await interaction.editReply(
            `Sentiment analysis complete! Score: ${sentimentResult.score}, Explanation: ${sentimentResult.explanation} (Details logged to console)`
         );
      } catch (error) {
         console.error("Error in vibecheck command execution:", error);
         let errorMessage =
            "Sorry, I encountered an error trying to analyze the vibe.";
         if (error.message.includes("Invalid Gemini API Key")) {
            errorMessage =
               "There seems to be an issue with the Gemini API Key configuration. Please contact the bot administrator.";
         } else if (error.message.includes("Failed to analyze sentiment")) {
            errorMessage = `Could not get a sentiment analysis from Gemini. ${error.message}`;
         } else if (error.code === 50013) {
            // DiscordAPIError: Missing Permissions
            errorMessage =
               "I seem to be missing permissions to read message history in this channel.";
         }
         await interaction.editReply(errorMessage);
      }
   },
};
