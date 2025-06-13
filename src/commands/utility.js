import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import os from 'os'; 
import { uptime } from 'process'; 

function formatUptime(seconds) {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    let uptimeString = '';
    if (d > 0) uptimeString += `${d}d `;
    if (h > 0) uptimeString += `${h}h `;
    if (m > 0) uptimeString += `${m}m `;
    if (s > 0) uptimeString += `${s}s`;
    return uptimeString.trim() || '0s';
}

export default {
    data: new SlashCommandBuilder()
        .setName('utility')
        .setDescription('Utility and diagnostic commands for the bot.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Displays the bot\'s current status, uptime, and memory usage.')
        )
    ,
    async execute(interaction) {
        if (!interaction.isChatInputCommand()) return;

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'status') {
            await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

            const botUptime = formatUptime(uptime());
            const systemUptime = formatUptime(os.uptime());
            const memoryUsage = process.memoryUsage();
            const totalMemory = os.totalmem();
            const freeMemory = os.freemem();

            const statusEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('⚙️ Bot Status')
                .addFields(
                    { name: 'Bot Uptime', value: botUptime, inline: true },
                    { name: 'System Uptime', value: systemUptime, inline: true },
                    { name: 'Discord API Ping', value: `${interaction.client.ws.ping}ms`, inline: true },
                    { name: 'Memory Usage (RSS)', value: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: 'heapTotal', value: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: 'heapUsed', value: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`, inline: true },
                    { name: 'Total System Memory', value: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`, inline: true },
                    { name: 'Free System Memory', value: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`, inline: true },
                    { name: 'Node.js Version', value: process.version, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: `Bot ID: ${interaction.client.user.id}` });

            await interaction.editReply({ embeds: [statusEmbed] });
        }
    },
};