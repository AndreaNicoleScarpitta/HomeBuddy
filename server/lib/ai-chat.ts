import OpenAI from "openai";
import { storage } from "../storage";
import { logInfo, logError } from "./logger";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const SYSTEM_PROMPT = `You are Home Buddy, a friendly and knowledgeable home maintenance assistant. Your role is to help homeowners with maintenance tasks, repairs, and home care guidance.

Key behaviors:
1. SAFETY FIRST: Always warn about electrical, gas, structural, or other safety concerns. Recommend professionals for dangerous tasks.
2. Classify tasks as: DIY-Safe (homeowner can do safely), Caution (doable but requires care), or Pro-Only (needs licensed professional)
3. Provide cost estimates when possible (use ranges like "$50-100" for materials)
4. Suggest urgency: Now (immediate), Soon (this month), Later (this quarter), Monitor (keep an eye on)
5. Be encouraging and supportive - homeownership is challenging and you're here to help
6. Keep responses concise but thorough
7. Ask clarifying questions when needed (home age, location, specific symptoms)

For budget-related questions:
- Be non-judgmental about finances
- Suggest affordable alternatives when possible
- Break down costs into smaller, manageable steps
- Acknowledge that home maintenance takes time to build up

Always respond in a warm, helpful tone that makes homeowners feel confident they can handle their home maintenance.`;

export async function getAIResponse(
  homeId: number,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    const home = await storage.getHomeById(homeId);
    
    let contextMessage = "";
    if (home) {
      contextMessage = `\n\nContext about this user's home:
- Address: ${home.city || "Unknown"}, ${home.state || "Unknown area"}
- Year Built: ${home.builtYear || "Unknown"}
- Square Footage: ${home.sqFt || "Unknown"} sq ft
- Type: ${home.type || "Unknown"}`;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + contextMessage },
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    logInfo("ai-chat", "Sending request to OpenAI", { homeId, messageCount: messages.length });

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_completion_tokens: 1024,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    
    logInfo("ai-chat", "Received response from OpenAI", { homeId, responseLength: assistantMessage.length });

    return assistantMessage;
  } catch (error) {
    logError("ai-chat", error);
    throw new Error("Failed to get AI response. Please try again later.");
  }
}

export async function streamAIResponse(
  homeId: number,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  onChunk: (content: string) => void,
  onDone: () => void
): Promise<string> {
  try {
    const home = await storage.getHomeById(homeId);
    
    let contextMessage = "";
    if (home) {
      contextMessage = `\n\nContext about this user's home:
- Address: ${home.city || "Unknown"}, ${home.state || "Unknown area"}
- Year Built: ${home.builtYear || "Unknown"}
- Square Footage: ${home.sqFt || "Unknown"} sq ft
- Type: ${home.type || "Unknown"}`;
    }

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT + contextMessage },
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_completion_tokens: 1024,
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }

    onDone();
    return fullResponse;
  } catch (error) {
    logError("ai-chat.stream", error);
    throw new Error("Failed to get AI response. Please try again later.");
  }
}
