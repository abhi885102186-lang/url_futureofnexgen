
'use server';

/**
 * @fileOverview Image analysis flow.
 *
 * - analyzeUploadedImage - Analyzes an uploaded image and extracts relevant information.
 * - AnalyzeUploadedImageInput - The input type for the analyzeUploadedImage function.
 * - AnalyzeUploadedImageOutput - The return type for the analyzeUploadedImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUploadedImageInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().optional().describe('An optional prompt to guide the image analysis.'),
});
export type AnalyzeUploadedImageInput = z.infer<typeof AnalyzeUploadedImageInputSchema>;

const AnalyzeUploadedImageOutputSchema = z.object({
  analysisResult: z.string().describe('The AI analysis result of the image.'),
});
export type AnalyzeUploadedImageOutput = z.infer<typeof AnalyzeUploadedImageOutputSchema>;

export async function analyzeUploadedImage(input: AnalyzeUploadedImageInput): Promise<AnalyzeUploadedImageOutput> {
  return analyzeUploadedImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUploadedImagePrompt',
  input: {schema: AnalyzeUploadedImageInputSchema},
  output: {schema: AnalyzeUploadedImageOutputSchema},
  prompt: `You are an AI assistant with expertise in analyzing images. Your primary goal is to identify any questions within the provided image and answer them directly and thoroughly.

Follow these rules:
1.  **Analyze the Entire Image**: Read all text and understand all diagrams in the "Image" below.
2.  **Identify and Answer Questions**: If you find any questions, especially mathematical or scientific ones, you MUST solve them. For technical questions, provide step-by-step solutions, including any formulas used.
3.  **Fallback to Summary**: If no questions are found in the image, you MUST provide a brief, one-paragraph summary of its content.
4.  **Use the User's Prompt**: The "Prompt" from the user is a specific instruction. Use it to focus your analysis. For example, if the user says "Solve the question at the top," you must find and solve that specific question. If the prompt is general (e.g., "What is this?"), analyze the entire image according to the rules above.
5.  **Be Direct**: Do not state that you cannot answer. Your task is to analyze and solve, or summarize.

User Prompt: {{{prompt}}}
Image: {{media url=imageDataUri}}
  `,
});

const analyzeUploadedImageFlow = ai.defineFlow(
  {
    name: 'analyzeUploadedImageFlow',
    inputSchema: AnalyzeUploadedImageInputSchema,
    outputSchema: AnalyzeUploadedImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
