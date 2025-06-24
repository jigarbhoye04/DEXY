import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from "discord.js";
import { generateAlternateTimeline } from "../services/geminiService.js";

const MAX_SCENARIO_LENGTH = 250;
const MAX_TIMELINE_LENGTH = 1000;

function truncateText(text, maxLength) {
    if (typeof text !== "string") text = String(text);
    if (text.length > maxLength) {
        return text.substring(0, maxLength - 3) + "...";
    }
    return text;
}

export default {
    data: new SlashCommandBuilder()
        .setName("whatif")
        .setDescription("Explores an alternate timeline based on your scenario.")
        .addStringOption((option) =>
            option
                .setName("scenario")
                .setDescription("The historical change or event to simulate.")
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000)
        ),
    async execute(interaction) {
        const scenario = interaction.options.getString("scenario");

        await interaction.deferReply({ ephemeral: false });

        try {
            const alternateTimeline = await generateAlternateTimeline(scenario);

            const timelineEmbed = new EmbedBuilder()
                .setColor(0x8E44AD)
                .setTitle(`⏳ What If: ${truncateText(scenario, MAX_SCENARIO_LENGTH)}`)
                .setDescription(truncateText(alternateTimeline, MAX_TIMELINE_LENGTH))
                .setFooter({ text: "what-if-what? :)" })
                .setTimestamp();

            await interaction.editReply({ embeds: [timelineEmbed] });
        } catch (error) {
            console.error(`Error processing /whatif for scenario "${scenario}":`, error);
            await interaction.editReply({
                content: `Sorry, I encountered an error exploring that timeline. Error: ${error.message}`,
                flags: [MessageFlags.Ephemeral],
            });
        }
    },
};