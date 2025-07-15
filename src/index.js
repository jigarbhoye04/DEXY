import {
   InteractionType,
   InteractionResponseType,
   verifyKey,
} from "discord-interactions";
import { defineTermWithGemini } from "./services/geminiService.js";
import { askQuestionWithGemini } from "./services/geminiService.js";
import { generateAlternateTimeline } from "./services/geminiService.js";

// Helper for sending responses
function a(content) {
   return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
         content: content,
      },
   };
}

export default {
   async fetch(request, env) {
      if (request.method !== "POST") {
         return new Response("Expected POST", { status: 405 });
      }

      const signature = request.headers.get("x-signature-ed25519");
      const timestamp = request.headers.get("x-signature-timestamp");
      const body = await request.text();

      const isValidRequest = verifyKey(
         body,
         signature,
         timestamp,
         env.DISCORD_PUBLIC_KEY // You must set this secret!
      );

      if (!isValidRequest) {
         return new Response("Invalid request signature", { status: 401 });
      }

      const interaction = JSON.parse(body);

      if (interaction.type === InteractionType.PING) {
         return new Response(
            JSON.stringify({ type: InteractionResponseType.PONG }),
            {
               headers: { "Content-Type": "application/json" },
            }
         );
      }

      if (interaction.type === InteractionType.APPLICATION_COMMAND) {
         const commandName = interaction.data.name;

         try {
            switch (commandName) {
               case "ask": {
                  const question = interaction.data.options.find(
                     (opt) => opt.name === "question"
                  ).value;
                  const answer = await askQuestionWithGemini(question);
                  return new Response(
                     JSON.stringify({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                           embeds: [
                              {
                                 title: `❓ ${question.substring(0, 250)}`,
                                 description: answer.substring(0, 4000),
                                 color: 0x3498db,
                              },
                           ],
                        },
                     }),
                     { headers: { "Content-Type": "application/json" } }
                  );
               }
               case "define": {
                  const term = interaction.data.options.find(
                     (opt) => opt.name === "term"
                  ).value;
                  const definition = await defineTermWithGemini(term);
                  return new Response(
                     JSON.stringify({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                           embeds: [
                              {
                                 title: `📖 Definition: ${term}`,
                                 description: definition,
                                 color: 0x1abc9c,
                              },
                           ],
                        },
                     }),
                     { headers: { "Content-Type": "application/json" } }
                  );
               }
               case "whatif": {
                  const scenario = interaction.data.options.find(
                     (opt) => opt.name === "scenario"
                  ).value;
                  const timeline = await generateAlternateTimeline(scenario);
                  return new Response(
                     JSON.stringify({
                        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
                        data: {
                           embeds: [
                              {
                                 title: `⏳ What If: ${scenario.substring(
                                    0,
                                    250
                                 )}`,
                                 description: timeline,
                                 color: 0x8e44ad,
                              },
                           ],
                        },
                     }),
                     { headers: { "Content-Type": "application/json" } }
                  );
               }
               case "ping": {
                  return new Response(JSON.stringify(a("Pong!")), {
                     headers: { "Content-Type": "application/json" },
                  });
               }
               default:
                  return new Response(
                     JSON.stringify(a(`Unknown command: ${commandName}`)),
                     { headers: { "Content-Type": "application/json" } }
                  );
            }
         } catch (error) {
            console.error("Error handling command:", error);
            return new Response(
               JSON.stringify(
                  a("An error occurred while processing the command.")
               ),
               { headers: { "Content-Type": "application/json" } }
            );
         }
      }

      return new Response("Unsupported interaction type", { status: 400 });
   },
};
