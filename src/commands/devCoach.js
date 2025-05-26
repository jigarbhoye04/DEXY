import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from "discord.js";
import {
   explainCodeWithGemini,
   explainGitHubIssueWithGemini,
} from "../services/geminiService.js";
import {
   parseGitHubIssueUrl,
   getGitHubIssueDetails,
} from "../services/githubService.js"; 

const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_FIELD_LENGTH = 1020;

function truncateText(text, maxLength = MAX_DESCRIPTION_LENGTH) {
   if (typeof text !== "string") text = String(text);
   if (text.length > maxLength) {
      return text.substring(0, maxLength - 3) + "...";
   }
   return text;
}

export default {
   data: new SlashCommandBuilder()
      .setName("devcoach") // Changed main command name to group subcommands
      .setDescription("Developer coaching utilities.")
      .addSubcommand((subcommand) =>
         subcommand
            .setName("explaincode") // Renamed from 'explain' to be specific
            .setDescription("Explains a piece of code provided by the user.")
            .addStringOption((option) =>
               option
                  .setName("code")
                  .setDescription("The code snippet you want explained.")
                  .setRequired(true)
            )
      )
      .addSubcommand(
         (
            subcommand // New subcommand for GitHub issues
         ) =>
            subcommand
               .setName("explainissue")
               .setDescription("Explains a GitHub issue from a URL.")
               .addStringOption((option) =>
                  option
                     .setName("url")
                     .setDescription("The full URL of the GitHub issue.")
                     .setRequired(true)
               )
      ),
   async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      if (subcommand === "explaincode") {
         const codeSnippet = interaction.options.getString("code");
         try {
            const explanation = await explainCodeWithGemini(codeSnippet);
            const embed = new EmbedBuilder()
               .setColor(0x3498db)
               .setTitle("💻 Code Explanation")
               .addFields({
                  name: "Your Code Snippet",
                  value: `\`\`\`\n${truncateText(
                     codeSnippet,
                     MAX_FIELD_LENGTH - 10
                  )}\n\`\`\``,
               })
               .setDescription(truncateText(explanation))
               .setFooter({ text: "Explained by Google Gemini" })
               .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
         } catch (error) {
            console.error("Error getting code explanation:", error);
            await interaction.editReply({
               content: `Sorry, I encountered an error trying to explain the code: ${error.message}`,
            });
         }
      } else if (subcommand === "explainissue") {
         const issueUrl = interaction.options.getString("url");
         const parsedUrl = parseGitHubIssueUrl(issueUrl);

         if (!parsedUrl) {
            await interaction.editReply({
               content:
                  "Invalid GitHub issue URL format. Please provide a valid URL (e.g., https://github.com/owner/repo/issues/123).",
            });
            return;
         }

         try {
            const issueDetails = await getGitHubIssueDetails(
               parsedUrl.owner,
               parsedUrl.repo,
               parsedUrl.issueNumber
            );
            const explanation = await explainGitHubIssueWithGemini(
               issueDetails.title,
               issueDetails.body
            );

            const embed = new EmbedBuilder()
               .setColor(0x2ecc71) // A green color for issues
               .setTitle(
                  `🔍 GitHub Issue Explanation: ${truncateText(
                     issueDetails.title,
                     200
                  )}`
               )
               .setURL(issueDetails.url)
               .addFields(
                  {
                     name: "Issue",
                     value: `[${parsedUrl.owner}/${parsedUrl.repo}#${parsedUrl.issueNumber}](${issueDetails.url})`,
                     inline: true,
                  }
                  // { name: 'Issue Body (Preview)', value: `\`\`\`\n${truncateText(issueDetails.body, MAX_FIELD_LENGTH - 10)}\n\`\`\`` }
               )
               .setDescription(truncateText(explanation))
               .setFooter({ text: "Explained by Google Gemini & GitHub API" })
               .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
         } catch (error) {
            console.error("Error getting GitHub issue explanation:", error);
            await interaction.editReply({
               content: `Sorry, I encountered an error: ${error.message}`,
            });
         }
      }
   },
};
