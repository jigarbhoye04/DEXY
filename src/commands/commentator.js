import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import {
   watchChannel,
   unwatchChannel,
   getWatchedChannelConfig,
} from "../state/memoryStore.js";

export default {
   data: new SlashCommandBuilder()
      .setName("commentator")
      .setDescription("Manages the event in for a channel.")
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels) //only those who can manage channels.
      .addSubcommand((subcommand) =>
         subcommand
            .setName("watch")
            .setDescription("Starts watching a channel for event commentary.")
            .addStringOption((option) =>
               option
                  .setName("style")
                  .setDescription(
                     "The commentary style (e.g., funny, serious, analytical). Default: default"
                  )
                  .setRequired(false)
                  .setAutocomplete(true)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName("unwatch")
            .setDescription("Stops watching a channel for event commentary.")
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName("status")
            .setDescription(
               "Checks if the channel is being watched for event commentary."
            )
      ),

   async execute(interaction) {
      if (!interaction.isChatInputCommand()) return;

      const subcommand = interaction.options.getSubcommand();
      const channelId = interaction.channelId;

      await interaction.deferReply({
         flags: [InteractionFlags.Ephemeral],
      });

      if (subcommand === "watch") {
         const style = interaction.options.getString("style") || "default";
         if (watchChannel(channelId, style)) {
            await interaction.editReply(
               `🎙️ Okay, I'll start commentating on events in this channel with a '${style}' style!`
            );
         } else {
            const currentConfig = getWatchedChannelConfig(channelId);
            await interaction.editReply(
               `I'm already commentating on this channel (style: '${currentConfig.style}'). Use \`/commentator unwatch\` to stop watching.`
            );
         }
      } else if (subcommand === "unwatch") {
         if (unwatchChannel(channelId)) {
            await interaction.editReply(
               "Okay, I will no longer commentate on events in this channel. 🎤"
            );
         } else {
            await interaction.editReply(
               "I wasn't commentating in this channel anyway."
            );
         }
      } else if (subcommand === "status") {
         const config = getWatchedChannelConfig(channelId);
         if (config) {
            await interaction.editReply(
               `I am currently watching this channel for event commentary with style: '${config.style}'.`
            );
         } else {
            await interaction.editReply(
               "I am not currently watching this channel for event commentary."
            );
         }
      }
   },
};
