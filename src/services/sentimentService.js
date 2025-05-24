import { GoogleGenerativeAI } from "@google/generative-ai";
import config from "../config/env.js";

if (!config.geminiApiKey) {
   throw new Error(
      "GEMINI_API_KEY is not defined. Please check your .env file."
   );
}

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({
   model: "gemini-2.5-flash-preview-05-20",
});

/**
 * Analyzes the sentiment of a given text using the Gemini API.
 * @param {string} textToAnalyze - The text whose sentiment is to be analyzed.
 * @returns {Promise<object>} An object containing sentiment score and explanation.
 *                           Example: { score: 0.5, explanation: "The messages are generally upbeat." }
 * @throws {Error} If the API call fails or returns an unexpected format.
 */
async function analyzeSentiment(textToAnalyze) {
   if (!textToAnalyze || textToAnalyze.trim() === "") {
      console.log("No text provided for sentiment analysis.");
      return { score: 0, explanation: "No text provided for analysis." };
   }

   const prompt = `
Analyze the sentiment of the following messages. Provide a sentiment score from -1.0 (very negative) to 1.0 (very positive),
and a brief one to two-sentence explanation for the sentiment.
Format your response as a JSON object with two keys: "score" (float) and "explanation" (string).

Example JSON output:
{
  "score": 0.7,
  "explanation": "The general sentiment is positive, with users expressing agreement and enthusiasm."
}

Messages to analyze:
---
${textToAnalyze}
---
Please provide only the JSON object in your response.
`;

   try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      let rawText = response.text();

      const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```|({[\s\S]*})/); //removes ```json ... ``` or captures the direct JSON object
      if (jsonMatch) {
         rawText = jsonMatch[1] || jsonMatch[2]; // Get the content within ```json ... ``` or the direct object
      }

      const sentimentData = JSON.parse(rawText);

      if (
         typeof sentimentData.score !== "number" ||
         typeof sentimentData.explanation !== "string"
      ) {
         console.error(
            "Gemini API returned an unexpected JSON structure for sentiment:",
            rawText
         );
         throw new Error(
            "Sentiment analysis result from Gemini was not in the expected format."
         );
      }
      return sentimentData;
   } catch (error) {
      console.error(
         "Error calling Gemini API for sentiment analysis or parsing its response:",
         error
      );
      if (error.message.includes("API key not valid")) {
         throw new Error("Invalid Gemini API Key for sentiment analysis.");
      }
      throw new Error(
         `Failed to analyze sentiment using Gemini API. Details: ${error.message}`
      );
   }
}

export { analyzeSentiment };
