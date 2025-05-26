// Simple in-memory store for active debates, keyed by channel ID
const activeDebates = {}; // e.g., { 'channelId123': { debater1Id: 'userA', debater2Id: 'userB', statements: {} } }
/**
 * Starts a new debate in a specific channel with two debaters.
 * @param {string} channelId - The ID of the channel where the debate is starting.
 * @param {object} debater1 - Object with id and username for debater 1. e.g. { id: 'userId', name: 'username1' }
 * @param {object} debater2 - Object with id and username for debater 2. e.g. { id: 'userId', name: 'username2' }
 * @returns {boolean} True if the debate was started successfully, false if a debate is already active.
 */
function startDebate(channelId, debater1, debater2) {
    if (activeDebates[channelId]) {
        return false;
    }
    activeDebates[channelId] = {
        debater1: { id: debater1.id, name: debater1.name },
        debater2: { id: debater2.id, name: debater2.name },
        statements: {
            [debater1.id]: [],
            [debater2.id]: []
        },
        startTime: Date.now()
    };
    console.log(`[MemoryStore] Debate started in channel ${channelId} between ${debater1.name} (ID: ${debater1.id}) and ${debater2.name} (ID: ${debater2.id})`);
    return true;
}

function getActiveDebate(channelId) {
    return activeDebates[channelId];
}

function addDebateStatement(channelId, debaterId, statementContent) {
    const debate = getActiveDebate(channelId);
    if (!debate) {
        return false;
    }

    if (debate.statements[debaterId]) {
        debate.statements[debaterId].push({
            content: statementContent,
            timestamp: Date.now()
        });
        console.log(`[MemoryStore] Statement added for debater ${debaterId} in channel ${channelId}: "${statementContent.substring(0, 50)}..."`);
        return true;
    } else {
        return false;
    }
}

function endDebate(channelId) {
    if (activeDebates[channelId]) {
        const endedDebateData = { ...activeDebates[channelId] }; // Copy data before deleting
        delete activeDebates[channelId];
        console.log(`[MemoryStore] Debate ended in channel ${channelId}. Data preserved for potential use.`);
        return endedDebateData; // Return the data of the debate that just ended
    }
    return null;
}

export { startDebate, getActiveDebate, addDebateStatement, endDebate };