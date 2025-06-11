# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Phase 7: Event Commentator (In Progress)**
    - `src/services/geminiService.js`:
        - `generateCommentaryWithGemini(originalMessageContent, messageAuthorUsername, commentaryStyle)` function to generate real-time commentary based on a message and style, with instructions for Gemini to output "NO_COMMENT" if no commentary is warranted. (Task 7.2)
    - `src/bot.js` (`Events.MessageCreate` handler):
        - For messages in channels watched by the commentator, calls `generateCommentaryWithGemini`. (Task 7.2)
        - Posts the AI-generated commentary back to the channel.
        - Implemented a cooldown mechanism (`COMMENTARY_COOLDOWN_MS`) using `lastCommentary` and `updateLastCommentaryTime` from `memoryStore.js` to prevent spamming.
    - `src/state/memoryStore.js`:
        - `updateLastCommentaryTime(channelId)` function to update the timestamp of the last commentary in a watched channel. (Task 7.2)

### Changed
- Updated commentary generation to include a 10-15 word limit.

### Fixed
- Fixed commentary length to adhere to 10-15 word limit.
- Added error handling for commentary generation failures, ensuring the bot does not crash and provides user feedback.

---
## [0.5.0] - 2025-05-26 - Dev Coach Completion

This version marks the completion of the Dev Coach module.

### Added
- **Phase 5: Dev Coach**
    - `src/commands/devCoach.js`:
        - Main command `/devcoach` with subcommands `explaincode` and `explainissue`. (Task 5.1, 5.3)
        - `/devcoach explaincode` takes a code snippet string and uses Gemini to provide an explanation. (Task 5.2)
        - `/devcoach explainissue` takes a GitHub issue URL, fetches issue details, and uses Gemini to explain the issue. (Task 5.3)
        - Uses Discord embeds for displaying explanations for both code and GitHub issues.
    - `src/services/geminiService.js`:
        - `explainCodeWithGemini(codeSnippet)` function to get explanations for arbitrary code. (Task 5.2)
        - `explainGitHubIssueWithGemini(issueTitle, issueBody)` function to get explanations for GitHub issue content. (Task 5.3)
    - `src/services/githubService.js`: (Task 5.3)
        - `parseGitHubIssueUrl(issueUrl)` to extract owner, repo, and issue number.
        - `getGitHubIssueDetails(owner, repo, issueNumber)` to fetch issue title and body via GitHub API using `axios`.
        - Basic error handling for GitHub API requests (404s, 403s).

### Changed
- **Commands**:
    - The `/explain` command was refactored into `/devcoach explaincode` as part of grouping Dev Coach functionalities under a main `/devcoach` command. (Task 5.3)

### Fixed
- 

---
## [0.4.0] - 2025-05-26 - Debate Referee Completion

This version marks the completion of the Debate Referee module.

### Added
- **Phase 4: Debate Referee**
    - `src/state/memoryStore.js`:
        - Stores debater names along with IDs. (Task 4.3)
        - `endDebate(channelId)` function now returns the data of the ended debate. (Task 4.3)
        - `addDebateStatement(channelId, debaterId, statementContent)` function records messages from designated debaters. (Task 4.2)
    - `src/commands/debateReferee.js`:
        - `/debate start` subcommand initiates debates, storing debater info (ID and username) in `memoryStore`. (Task 4.1, updated in 4.3)
        - `/debate end` subcommand to conclude an active debate. (Task 4.3)
    - `src/services/geminiService.js`:
        - `judgeDebateWithGemini(...)` function formats the debate transcript, sends it to Gemini with a detailed judging prompt, and expects a structured JSON response (summaries, strengths, weaknesses, scores, winner). (Task 4.3)
        - Enhanced `judgeDebateWithGemini` to handle cases with no statements or one-sided participation. (Task 4.3 refinement)
    - `src/bot.js`:
        - `Events.MessageCreate` handler records messages from registered debaters during an active debate and reacts with '✍️'. (Task 4.2)
    - **Debate Display & UX:**
        - `/debate end` now displays the Gemini-generated judgment in a comprehensive Discord embed, including winner, scores, summaries, strengths, and weaknesses for each debater. (Task 4.4)
        - Helper function `truncateText` in `debateReferee.js` to prevent exceeding Discord embed field limits. (Task 4.4)

### Changed
- **Interaction Replies:**
    - Updated all ephemeral replies in `debateReferee.js` to use `flags: [MessageFlags.Ephemeral]` addressing Discord.js deprecation warnings. (Task 4.4)

### Fixed
- Addressed Discord.js deprecation warning for `ephemeral` option in interaction responses by switching to `flags: [MessageFlags.Ephemeral]` in `debateReferee.js`. (Task 4.4)

## [0.3.0] - 2025-05-24 - Vibe Analyzer Completion

This version marks the completion of the Vibe Analyzer module.

### Added
- **Phase 3: Vibe Analyzer**
    - `vibeCheck.js` command (`/vibecheck`) to analyze channel sentiment. (Task 3.1)
    - `services/sentimentService.js` using Google Gemini API to perform sentiment analysis and return a score with explanation. (Task 3.2)
    - User-friendly embed display for `/vibecheck` results, including dynamic emojis, colors, and detailed analysis. (Task 3.3)
    - Helper function `getVibePresentation` in `vibeCheck.js` for dynamic embed styling based on sentiment score.
- **Project Management:**
    - This `CHANGELOG.md` file for tracking project changes.

### Changed
- **Commands (`vibeCheck.js`):**
    - `/vibecheck` replies are now public by default for the main report.
    - Error messages for `/vibecheck` use `MessageFlags.Ephemeral` for privacy and to address deprecation warnings. (Task 3.3)
- **Dependencies/Setup:**
    - `discord.js` `MessageFlags` now used for ephemeral messages, replacing the deprecated direct `ephemeral: true` option in interaction replies.

### Fixed
- Addressed `discord.js` deprecation warning for `ephemeral` option in interaction responses by switching to `flags: [MessageFlags.Ephemeral]`.

---

## [0.2.0] - 2025-05-20 - Second Brain Module Completion

This version marks the completion of the initial Second Brain (summarization) module.

### Added
- **Phase 2: Second Brain Module**
    - `secondBrain.js` command (`/summarize`) for summarizing recent channel messages. (Task 2.1)
    - Functionality to fetch recent messages from the channel for `/summarize`. (Task 2.2)
    - `services/geminiService.js` to interface with Google Gemini API (`gemini-pro` model) for generating summaries. (Task 2.3)
    - `/summarize` command now replies with an AI-generated summary formatted in a Discord embed. (Task 2.4)
    - Basic error handling for API calls and message fetching.
    - Messages are processed in chronological order for summarization.

### Changed
- **Commands (`secondBrain.js`):**
    - `/summarize` replies are now public by default.
    - Error messages for `/summarize` are ephemeral.
- **Dependencies:**
    - Confirmed usage of `@google/generative-ai` for Gemini API access.

---

## [0.1.0] - 2025-05-15 - Base Setup & Ping Command

This version established the foundational structure of the bot and initial command handling.

### Added
- **Phase 1: Base Setup**
    - Initial project setup with `package.json`. (Task 1.1)
    - Core dependencies: `discord.js`, `dotenv`, `@google/generative-ai`, `axios`. (Task 1.2, revised for Gemini)
    - Basic bot skeleton in `src/bot.js` capable of logging into Discord. (Task 1.3)
    - `.env` file setup and `src/config/env.js` for loading environment variables (Discord Token, Gemini API Key). (Task 1.4)
    - Project structure includes `src/commands`, `src/config`, `src/services`.
    - Basic command handler in `bot.js` to load and execute slash commands.
    - `ping.js` command (`/ping`) that replies with "Pong!". (Task 1.5)
    - `scripts/deploy-commands.js` for registering slash commands with Discord.
    - `.gitignore` file.

### Changed
- **Project Configuration:**
    - Switched from OpenAI to Google Gemini (`@google/generative-ai`) for all AI functionalities. (User Decision post Task 1.2)
    - Adopted ES Modules (`import`/`export` syntax) project-wide, including `"type": "module"` in `package.json`. (User Decision during Task 1.4)
- **Configuration (`src/config/env.js`):**
    - Stricter validation for `DISCORD_TOKEN` and `GEMINI_API_KEY`.
    - Added `CLIENT_ID` and `GUILD_ID` awareness for command deployment.

### Fixed
- Ensured dynamic imports for command loading in `bot.js` and `deploy-commands.js` use correct `file://` URLs for ESM.