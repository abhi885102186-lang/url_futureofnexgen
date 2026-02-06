
'use server';

/**
 * @fileOverview This file defines the Genkit flow for voice-based assistant functionality.
 *
 * It includes:
 * - `voiceBasedAssistant`: A function to process user voice input and return a response.
 * - `VoiceBasedAssistantInput`: The input type for the voiceBasedAssistant function.
 * - `VoiceBasedAssistantOutput`: The output type for the voiceBasedAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const VoiceBasedAssistantInputSchema = z.object({
  history: z.array(VoiceMessageSchema).describe('The conversation history.'),
  voiceCommand: z
    .string()
    .describe('The latest voice command from the user as a string.'),
});
export type VoiceBasedAssistantInput = z.infer<typeof VoiceBasedAssistantInputSchema>;

const VoiceBasedAssistantOutputSchema = z.object({
  responseText: z
    .string()
    .describe('The response text from the AI based on the voice command.'),
});
export type VoiceBasedAssistantOutput = z.infer<typeof VoiceBasedAssistantOutputSchema>;

export async function voiceBasedAssistant(input: VoiceBasedAssistantInput): Promise<VoiceBasedAssistantOutput> {
  return voiceBasedAssistantFlow(input);
}

const voiceBasedAssistantPrompt = ai.definePrompt({
  name: 'voiceBasedAssistantPrompt',
  input: {schema: VoiceBasedAssistantInputSchema},
  output: {schema: VoiceBasedAssistantOutputSchema},
  prompt: `You are Nexus, a highly advanced AI voice assistant. You are having a real-time, human-like conversation. Your primary goal is to be helpful, engaging, and natural.

Core Principles:
1.  **Detect Language and Respond**: You MUST first detect the language of the user's latest command. Your response MUST be in the same language as the user's command.
2.  **Natural Conversation**: Respond as a human would. Be concise but clear. Your tone should be friendly and conversational.
3.  **Interpret Intent**: Users may not speak perfectly. You MUST analyze their speech, correct for any apparent errors (e.g., "tell me about steak curry" should be interpreted as "tell me about Stephen Curry"), and respond to their likely intent. If the intent is unclear, ask for clarification.
4.  **No Artificial Limits**: You are a powerful AI. Do not claim to have limitations unless absolutely necessary. If a user asks you to count to a high number, begin counting. If they ask for a long story, start telling it. The user can interrupt you if they want you to stop.
5.  **Context is Key**: Analyze the entire conversation history to maintain context and provide relevant follow-up responses. Avoid repeating yourself.
6.  **Be Proactive**: After your primary response, you MUST provide a "Suggestions" section with three short, relevant, and numbered follow-up questions the user might ask. This helps guide the conversation.

Example Interaction (if user speaks in English):
User: "who is the president of usa"
You: "The current president of the United States is Joe Biden.
Suggestions:
1.  How old is he?
2.  What is his political party?
3.  Who was the president before him?"

Example Interaction (if user speaks in Hindi):
User: "bharat ka pradhan mantri kaun hai"
You: "भारत के वर्तमान प्रधान मंत्री नरेंद्र मोदी हैं।
सुझाव:
1. उनकी उम्र क्या है?
2. उनकी राजनीतिक पार्टी कौन सी है?
3. उनसे पहले प्रधान मंत्री कौन थे?"

Now, begin. Analyze the history and the user's latest command and provide your response in the detected language.

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

User's latest command: {{{voiceCommand}}}`,
});

const voiceBasedAssistantFlow = ai.defineFlow(
  {
    name: 'voiceBasedAssistantFlow',
    inputSchema: VoiceBasedAssistantInputSchema,
    outputSchema: VoiceBasedAssistantOutputSchema,
  },
  async input => {
    const {output} = await voiceBasedAssistantPrompt(input);
    return output!;
  }
);
