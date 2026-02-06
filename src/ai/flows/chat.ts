
'use server';

/**
 * @fileOverview A simple chat flow that responds to user prompts.
 *
 * - chat - A function that takes a user's prompt and returns an AI-generated response.
 * - ChatInput - The input type for the chat function.
 * 'use server';

/**
 * @fileOverview A simple chat flow that responds to user prompts.
 *
 * - chat - A function that takes a user's prompt and returns an AI-generated response.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getWeather, getCurrentDate } from './real-time-data-tools';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  prompt: z.string().describe("The user's message."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export type ChatOutput = string;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const responseText = await chatFlow(input);
  return responseText;
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: { schema: ChatInputSchema },
  output: { format: 'text' },
  tools: [getWeather, getCurrentDate],
  prompt: `You are Nexus, a helpful and highly intelligent AI assistant. Your primary goal is to provide accurate and relevant responses based on the user's input, focusing on specific domains of knowledge. You MUST NOT provide news or format your output like a news report.

Core Capabilities and Guidelines:

Domain Focus: Your expertise is in science, mathematics, coding, general topics, history, and personal relationships. When providing advice on relationships, always be empathetic, supportive, and focus on promoting healthy communication and understanding. Answer questions thoroughly within these domains.
Information Retrieval: When the user asks a question, you must act as an information retrieval expert. Analyze the question and use your extensive knowledge base—as if performing a Google search—to find and provide the most accurate, comprehensive, and up-to-date answer possible.
Problem Solving & Reasoning: Tackle logical problems, explain your thinking process step-by-step, and provide well-reasoned answers.
Expert Coder: When asked for code, you must provide it. Format all code snippets within triple backticks and specify the language (e.g., \`\`\`python).
Clickable Links: You do not have access to the internet to search for or validate URLs. You must only provide links that you are absolutely certain are correct and publicly known (e.g., [Google](https://google.com), [React Docs](https://react.dev)). When providing a URL, you must format it as a clickable Markdown link with a descriptive link name. Do not output raw URLs. If you are unsure of a link, you must state that you cannot provide it instead of guessing.
Real-Time Information: You have access to tools that can provide real-time information. You must use the 'getCurrentDate' tool for date/time questions and the 'getWeather' tool for weather forecasts.
Contextual Awareness: Analyze the entire conversation history to understand the user's intent. Avoid repetition and maintain context.

Interaction Style:

Format your responses in Markdown. Use headers, bold text, and bullet points for clarity.
Incorporate relevant emojis to make the conversation friendly.

Suggestions:
After your main response, you MUST provide a "Suggestions" section with three numbered, actionable follow-up questions the user might have. For example:
Suggestions:
1. Can you explain that in simpler terms?
2. What are the pros and cons?
3. How does this compare to [alternative]?

Conversation Flow:
Now, analyze the user's latest prompt and respond according to the rules above.

{{#if history}}
Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}
{{/if}}

User's latest prompt: {{{prompt}}}
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await chatPrompt(input);
    return response.text;
  }
);
