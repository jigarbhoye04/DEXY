import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from "discord.js";
import { askQuestion } from "../services/geminiService.js";

const MAX_QUESTION_LENGTH_IN_TITLE = 200;
const MAX_ANSWER_LENGTH = 4000;

function truncateText(text, maxLength) {
   if (typeof text !== "string") text = String(text);
   if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "...";
   }
   return text;
}

export default {
   data: new SlashCommandBuilder()
      .setName("ask")
      .setDescription("Asks the AI a general knowledge question.")
      .addStringOption((option) =>
         option
            .setName("question")
            .setDescription("The question you want to ask.")
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(500)
      ),
   async execute(interaction) {
      const question = interaction.options.getString("question");
      if (!question || question.length < 5 || question.length > 500) {
         return interaction.reply({
            content:
               "Please provide a valid question between 5 and 500 characters.",
            flags: [MessageFlags.Ephemeral],
         });
      }
      await interaction.deferReply({ ephemeral: false });

      try {
         const answer = await askQuestion(question);

         const answerEmbed = new EmbedBuilder()
            .setColor(0x3498db) // A nice, informative blue
            .setTitle(
               `❓ ${truncateText(question, MAX_QUESTION_LENGTH_IN_TITLE)}`
            )
            .setDescription(truncateText(answer, MAX_ANSWER_LENGTH));

         await interaction.editReply({ embeds: [answerEmbed] });
      } catch (error) {
         console.error(
            `Error processing /ask command for question "${question}":`,
            error
         );
         await interaction.editReply({
            content: `Sorry, I couldn't get an answer for that right now. Error: ${error.message}`,
            flags: [MessageFlags.Ephemeral],
         });
      }
   },
};
