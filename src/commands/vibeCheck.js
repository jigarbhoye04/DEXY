import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { analyzeSentiment } from "../services/sentimentService.js";

function getVibePresentation(score) {
   if (score > 0.6)
      return {
         emoji: "🎉",
         color: 0x00ff00,
         description:
            "Amazing vibes! Everyone's super positive and enthusiastic!",
      };
   if (score > 0.2)
      return {
         emoji: "😊",
         color: 0xadff2f,
         description: "Good vibes! Things are looking positive and pleasant.",
      };
   if (score > -0.2)
      return {
         emoji: "🤔",
         color: 0xffff00,
         description: "Mixed vibes. Some ups and downs, or pretty neutral.",
      };
   if (score > -0.6)
      return {
         emoji: "😟",
         color: 0xff8c00,
         description:
            "Hmm, vibes are a bit down. A little negativity or concern detected.",
      };
   return {
      emoji: "😥",
      color: 0xff0000,
      description:
         "Oh dear, the vibes are quite negative right now. Lots of concern or unhappiness.",
   };
}

export default {
   data: new SlashCommandBuilder()
      .setName("vibecheck")
      .setDescription(
         "Analyzes the sentiment of recent messages to check the channel vibe."
      ),
   async execute(interaction) {
      await interaction.deferReply(); //public

      try {
         const messageLimit = 30;
         const messages = await interaction.channel.messages.fetch({
            limit: messageLimit,
         });

         if (messages.size === 0) {
            await interaction.editReply({
               content: "No messages found to analyze in this channel.",
               flags: [MessageFlags.Ephemeral],
            }); // Error message ephemeral(due to warning -- cause it was deprecated)
            return;
         }

         const userMessages = [];
         messages.reverse().forEach((msg) => {
            if (!msg.author.bot && msg.content) {
               userMessages.push(msg.content);
            }
         });

         if (userMessages.length === 0) {
            await interaction.editReply({
               content:
                  "Found recent messages, but none from users with content to analyze.",
               flags: [MessageFlags.Ephemeral],
            });
            return;
         }

         const conversationText = userMessages.join("\n");
         const sentimentResult = await analyzeSentiment(conversationText);

         const vibeLook = getVibePresentation(sentimentResult.score);

         const vibeEmbed = new EmbedBuilder()
            .setColor(vibeLook.color)
            .setTitle(`${vibeLook.emoji} Channel Vibe Check!`)
            .setDescription(vibeLook.description)
            .addFields(
               {
                  name: "Sentiment Score",
                  value: `${sentimentResult.score.toFixed(2)} / 1.00`,
                  inline: true,
               },
               {
                  name: "Based on",
                  value: `${userMessages.length} recent message(s)`,
                  inline: true,
               },
               {
                  name: "AI Analysis",
                  value:
                     sentimentResult.explanation.length > 1020
                        ? sentimentResult.explanation.substring(0, 1020) + "..."
                        : sentimentResult.explanation,
               }
            )
            .setTimestamp()
            .setFooter({ text: "Vibe" });

         await interaction.editReply({ embeds: [vibeEmbed] });
      } catch (error) {
         console.error("Error in vibecheck command execution:", error);
         await interaction.editReply({
            content: "An error occurred.",
            flags: [MessageFlags.Ephemeral],
         });
      }
   },
};
