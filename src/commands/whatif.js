import { SlashCommandBuilder,MessageFlags } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("whatif")
        .setDescription("An alt. timeline")
        .addStringOption(option =>
            option.setName("scenario")
                .setDescription("Describe the alternate scenario")
                .setRequired(true)
                .setMinLength(10)
                .setMaxLength(1000)
        ),

        async execute(interaction){
            const scenario = interaction.options.getString("scenario");
            await interaction.reply({
                content: `What if... ${scenario}?`,
                flags: [MessageFlags.Ephemeral] 
            })
        }
}