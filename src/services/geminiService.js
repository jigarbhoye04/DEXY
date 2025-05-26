import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/env.js";

if (!config.geminiApiKey) {
   throw new Error("GEMINI_API_KEY is not defined in the .env file.");
}

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({
   model: "gemini-2.5-flash-preview-05-20",
});

/**
 * Generates a summary for a given text using the Gemini API.
 * @param {string} textToSummarize - The text to be summarized.
 * @returns {Promise<string>} The summary text from Gemini.
 * @throws {Error} If the API call fails or returns no text.
 */
async function generateGeminiSummary(textToSummarize) {
   if (!textToSummarize || textToSummarize.trim() === "") {
      console.log("No text provided to summarize.");
      return "No content provided for summarization.";
   }

   const prompt = `Please summarize the following conversation concisely:\n\n${textToSummarize}, in simple terms.`;

   try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const summaryText = response.text();

      if (!summaryText || summaryText.trim() === "") {
         console.error("Gemini returned an empty summary.");
         throw new Error("Gemini returned an empty summary.");
      }
      return summaryText;
   } catch (error) {
      console.error("Error calling Gemini API:", error);
      if (error.message.includes("API key not valid")) {
         throw new Error(
            "Invalid Gemini API Key. Please check your .env file."
         );
      }
      throw new Error(`Failed to generate summary. Details: ${error.message}`);
   }
}

/**
 * Judges a debate using the Gemini API.
 * @param {{id: string, name: string}} debater1 - Info for debater 1.
 * @param {{id: string, name: string}} debater2 - Info for debater 2.
 * @param {Array<object>} statementsDebater1 - Array of statement objects for debater 1.
 * @param {Array<object>} statementsDebater2 - Array of statement objects for debater 2.
 * @returns {Promise<object>} The parsed JSON judgment from Gemini.
 */
async function judgeDebateWithGemini(
   debater1,
   debater2,
   statementsDebater1,
   statementsDebater2
) {
   let formattedTranscript = "";
   // Combine and sort all statements by timestamp to create a chronological transcript
   const allStatements = [
      ...statementsDebater1.map((s) => ({ ...s, debaterName: debater1.name })),
      ...statementsDebater2.map((s) => ({ ...s, debaterName: debater2.name })),
   ].sort((a, b) => a.timestamp - b.timestamp);

   allStatements.forEach((statement) => {
      formattedTranscript += `${statement.debaterName}: ${statement.content}\n`;
   });

   if (formattedTranscript.trim() === "") {
      return { error: "No statements were made in this debate to judge." };
   }

   const prompt = `
You are an impartial and analytical debate judge.
A debate has concluded between two participants: Debater 1 (${debater1.name}) and Debater 2 (${debater2.name}).
Below is their debate transcript:

Debate Transcript:
---
${formattedTranscript}
---

Based on the transcript, please provide your judgment.
Your response MUST be a JSON object with the following keys:
- "summary_debater1": "A brief summary of ${debater1.name}'s main arguments."
- "summary_debater2": "A brief summary of ${debater2.name}'s main arguments."
- "strengths_debater1": "Key strengths of ${debater1.name}'s performance."
- "weaknesses_debater1": "Areas for improvement for ${debater1.name}."
- "strengths_debater2": "Key strengths of ${debater2.name}'s performance."
- "weaknesses_debater2": "Areas for improvement for ${debater2.name}."
- "overall_assessment": "Your overall thoughts on the debate and who presented more compelling arguments."
- "winner_name": "A string indicating the winner ('${debater1.name}', '${debater2.name}', or 'Draw')."
- "score_debater1": An overall score for ${debater1.name} (0-10, can be float).
- "score_debater2": An overall score for ${debater2.name} (0-10, can be float).
- "reason_for_winner": "A brief justification for your choice of winner."

Ensure your analysis is fair and based solely on the provided statements.
Provide ONLY the JSON object in your response. Do not include any other text or markdown formatting like \`\`\`json.
`;

   try {
      console.log(
         `[GeminiService] Sending debate transcript for judging. Transcript length: ${formattedTranscript.length}`
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let rawText = response.text();

      // Attempt to parse the JSON
      const judgment = JSON.parse(rawText);
      console.log(
         "[GeminiService] Successfully parsed debate judgment from Gemini."
      );
      return judgment;
   } catch (error) {
      console.error(
         "[GeminiService] Error calling Gemini API for debate judging or parsing its response:",
         error
      );
      console.error(
         "[GeminiService] Raw response that failed parsing (if available):",
         error.rawResponse || rawText
      );
      throw new Error(
         `Failed to judge debate using Gemini API. Details: ${error.message}`
      );
   }
}

/**
 * Explains a given code snippet using the Gemini API.
 * @param {string} codeSnippet - The code snippet to explain.
 * @returns {Promise<string>} The explanation text from Gemini.
 * @throws {Error} If the API call fails or returns no text.
 */
async function explainCodeWithGemini(codeSnippet) {
   if (!codeSnippet || codeSnippet.trim() === "") {
      return "No code provided to explain.";
   }

   // Detect language or assume generic if not easily detectable.
   // For a simple MVP, we can let Gemini infer or specify common ones.
   const prompt = `
You are a helpful and experienced software development coach.
Please explain the following code snippet in plain English.
Break down what it does, its purpose, and how it works.
If possible, identify the programming language.
Be clear, concise, and beginner-friendly.

Code Snippet:
\`\`\`
${codeSnippet}
\`\`\`

Explanation:
`;

   try {
      console.log(
         `[GeminiService] Sending code snippet for explanation: ${codeSnippet.substring(
            0,
            100
         )}...`
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const explanationText = response.text();

      if (!explanationText || explanationText.trim() === "") {
         console.error(
            "[GeminiService] Gemini API returned an empty explanation for the code."
         );
         throw new Error("Gemini API returned an empty explanation.");
      }
      return explanationText;
   } catch (error) {
      console.error(
         "[GeminiService] Error calling Gemini API for code explanation:",
         error
      );
      throw new Error(
         `Failed to get code explanation from Gemini API. Details: ${error.message}`
      );
   }
}

/**
 * Explains a given GitHub issue using the Gemini API.
 * @param {string} issueTitle - The title of the GitHub issue.
 * @param {string} issueBody - The body/description of the GitHub issue.
 * @returns {Promise<string>} The explanation text from Gemini.
 * @throws {Error} If the API call fails or returns no text.
 */
async function explainGitHubIssueWithGemini(issueTitle, issueBody) {
   if (!issueTitle && !issueBody) {
      return "No issue title or body provided to explain.";
   }

   const prompt = `
You are a helpful software development assistant.
A user has provided the following GitHub issue details. Please explain this issue in plain English.
Focus on:
1. What is the core problem or feature request being described?
2. What might be the context or impact of this issue?
3. What general steps or considerations might be involved in addressing it?

Keep the explanation clear, concise, and understandable.

GitHub Issue Title:
${issueTitle}

GitHub Issue Body:
---
${issueBody}
---

Explanation:
`;

   try {
      console.log(
         `[GeminiService] Sending GitHub issue for explanation. Title: ${issueTitle}`
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const explanationText = response.text();

      if (!explanationText || explanationText.trim() === "") {
         console.error(
            "[GeminiService] Gemini API returned an empty explanation for the GitHub issue."
         );
         throw new Error(
            "Gemini API returned an empty explanation for the GitHub issue."
         );
      }
      return explanationText;
   } catch (error) {
      console.error(
         "[GeminiService] Error calling Gemini API for GitHub issue explanation:",
         error
      );
      throw new Error(
         `Failed to get GitHub issue explanation from Gemini API. Details: ${error.message}`
      );
   }
}

export {
   generateGeminiSummary,
   judgeDebateWithGemini,
   explainCodeWithGemini,
   explainGitHubIssueWithGemini,
};
