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
      throw new Error(
         `Failed to generate summary. Details: ${error.message}`
      );
   }
}

export { generateGeminiSummary };
