import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import {
   startDebate,
   getActiveDebate,
   endDebate,
} from "../state/memoryStore.js";
import { judgeDebateWithGemini } from "../services/geminiService.js";

const MAX_FIELD_LENGTH = 1020; // Max length for embed field values (Discord limit is 1024)

function truncateText(text, maxLength = MAX_FIELD_LENGTH) {
   if (typeof text !== "string") text = String(text);
   if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "...";
   }
   return text;
}

export default {
   data: new SlashCommandBuilder()
      .setName("debate")
      .setDescription("Manages debates in the channel.")
      .addSubcommand((subcommand) =>
         subcommand
            .setName("start")
            .setDescription("Starts a new debate between two users.")
            .addUserOption((option) =>
               option
                  .setName("debater1")
                  .setDescription("The first debater.")
                  .setRequired(true)
            )
            .addUserOption((option) =>
               option
                  .setName("debater2")
                  .setDescription("The second debater.")
                  .setRequired(true)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName("end")
            .setDescription(
               "Ends the current debate in this channel and requests judging."
            )
      ),

   async execute(interaction) {
      if (!interaction.isChatInputCommand()) return;

      const subcommand = interaction.options.getSubcommand();
      const channelId = interaction.channelId;

      if (subcommand === "start") {
         const debater1User = interaction.options.getUser("debater1");
         const debater2User = interaction.options.getUser("debater2");

         if (!debater1User || !debater2User) {
            await interaction.reply({
               content: "Both debaters must be specified.",
               flags: [MessageFlags.Ephemeral],
            });
            return;
         }
         if (debater1User.id === debater2User.id) {
            await interaction.reply({
               content: "Debaters cannot be the same person!",
               flags: [MessageFlags.Ephemeral],
            });
            return;
         }
         if (debater1User.bot || debater2User.bot) {
            await interaction.reply({
               content: "Bots cannot participate in debates.",
               flags: [MessageFlags.Ephemeral],
            });
            return;
         }

         if (getActiveDebate(channelId)) {
            await interaction.reply({
               content:
                  "A debate is already active in this channel. Please end it before starting a new one.",
               flags: [MessageFlags.Ephemeral],
            });
            return;
         }

         const debateStarted = startDebate(
            channelId,
            { id: debater1User.id, name: debater1User.username },
            { id: debater2User.id, name: debater2User.username }
         );

         if (debateStarted) {
            await interaction.reply(
               `Alright, a new debate has begun! 🎤\n\n**Debater 1:** ${debater1User.username}\n**Debater 2:** ${debater2User.username}\n\nDebaters, please make your opening statements! The bot will track your messages.`
            );
         } else {
            await interaction.reply({
               content:
                  "Failed to start the debate. Another might be active or an error occurred.",
               flags: [MessageFlags.Ephemeral],
            });
         }
      } else if (subcommand === "end") {
         const activeDebate = getActiveDebate(channelId);

         if (!activeDebate) {
            await interaction.reply({
               content: "There is no active debate in this channel to end.",
               flags: [MessageFlags.Ephemeral],
            });
            return;
         }

         await interaction.deferReply({
            content: "Ending debate and sending to the judges... 🧑‍⚖️",
            ephemeral: false,
         });

         const debater1Info = activeDebate.debater1;
         const debater2Info = activeDebate.debater2;
         const statementsD1 = activeDebate.statements[debater1Info.id] || [];
         const statementsD2 = activeDebate.statements[debater2Info.id] || [];

         try {
            const judgment = await judgeDebateWithGemini(
               debater1Info,
               debater2Info,
               statementsD1,
               statementsD2
            );
            endDebate(channelId); // End debate in memory store

            const judgmentEmbed = new EmbedBuilder()
               .setColor(0x00ae86) // A neutral/judging color
               .setTitle("🏆 Debate Judged! 🏆")
               .setTimestamp();

            if (judgment.error) {
               // Handle error case from GeminiService (e.g., no statements)
               judgmentEmbed.setDescription(judgment.error).setColor(0xff0000); // Red for error
            } else {
               judgmentEmbed
                  .setDescription(
                     truncateText(
                        `**Overall Assessment:** ${
                           judgment.overall_assessment ||
                           "No overall assessment provided."
                        }\n\n**Reason for Winner:** ${
                           judgment.reason_for_winner || "N/A"
                        }`
                     )
                  )
                  .addFields(
                     {
                        name: "⚖️ Winner",
                        value: judgment.winner_name || "Undetermined",
                        inline: false,
                     },
                     {
                        name: `--- ${truncateText(debater1Info.name, 200)} ---`,
                        value: "\u200B",
                     }, // \u200B is a zero-width space for spacing
                     {
                        name: "Score",
                        value: `${
                           judgment.score_debater1 !== undefined
                              ? judgment.score_debater1.toFixed(1)
                              : "N/A"
                        }/10`,
                        inline: true,
                     },
                     {
                        name: "Summary of Arguments",
                        value: truncateText(
                           judgment.summary_debater1 || "No summary."
                        ),
                        inline: true,
                     },
                     {
                        name: "Strengths",
                        value: truncateText(
                           judgment.strengths_debater1 || "N/A"
                        ),
                        inline: false,
                     },
                     {
                        name: "Weaknesses",
                        value: truncateText(
                           judgment.weaknesses_debater1 || "N/A"
                        ),
                        inline: false,
                     },

                     {
                        name: `--- ${truncateText(debater2Info.name, 200)} ---`,
                        value: "\u200B",
                     },
                     {
                        name: "Score",
                        value: `${
                           judgment.score_debater2 !== undefined
                              ? judgment.score_debater2.toFixed(1)
                              : "N/A"
                        }/10`,
                        inline: true,
                     },
                     {
                        name: "Summary of Arguments",
                        value: truncateText(
                           judgment.summary_debater2 || "No summary."
                        ),
                        inline: true,
                     },
                     {
                        name: "Strengths",
                        value: truncateText(
                           judgment.strengths_debater2 || "N/A"
                        ),
                        inline: false,
                     },
                     {
                        name: "Weaknesses",
                        value: truncateText(
                           judgment.weaknesses_debater2 || "N/A"
                        ),
                        inline: false,
                     }
                  )
                  .setFooter({ text: "Judged by Google Gemini" });
            }
            await interaction.editReply({ embeds: [judgmentEmbed] });
         } catch (error) {
            console.error(
               "Error during debate judging display process:",
               error
            );
            endDebate(channelId); // Ensure debate is ended even if display fails
            await interaction.editReply({
               content: `The debate has ended, but there was an error displaying the judgment: ${error.message}. Please check bot logs.`,
               flags: [MessageFlags.Ephemeral],
            });
         }
      }
   },
};
