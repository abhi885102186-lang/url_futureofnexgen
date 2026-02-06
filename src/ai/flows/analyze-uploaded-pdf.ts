
'use server';

/**
 * @fileOverview AI flow for analyzing uploaded PDF documents to extract relevant information.
 *
 * - analyzeUploadedPdf - A function that handles the PDF analysis process.
 * - AnalyzeUploadedPdfInput - The input type for the analyzeUploadedPdf function.
 * - AnalyzeUploadedPdfOutput - The return type for the analyzeUploadedPdf function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeUploadedPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
  prompt: z.string().optional().describe('An optional prompt to guide the document analysis.'),
});
export type AnalyzeUploadedPdfInput = z.infer<typeof AnalyzeUploadedPdfInputSchema>;

const AnalyzeUploadedPdfOutputSchema = z.object({
  analysis: z.string().describe('The analysis of the PDF content.'),
});
export type AnalyzeUploadedPdfOutput = z.infer<typeof AnalyzeUploadedPdfOutputSchema>;

export async function analyzeUploadedPdf(input: AnalyzeUploadedPdfInput): Promise<AnalyzeUploadedPdfOutput> {
  return analyzeUploadedPdfFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeUploadedPdfPrompt',
  input: {schema: AnalyzeUploadedPdfInputSchema},
  output: {schema: AnalyzeUploadedPdfOutputSchema},
  prompt: `You are an AI assistant with expertise in analyzing PDF documents. Your primary goal is to identify any questions within the provided PDF and answer them directly and thoroughly.

Follow these rules:
1.  **Analyze the Entire Document**: Read all text and understand all diagrams in the "Document Content" below.
2.  **Identify and Answer Questions**: If you find any questions, especially mathematical or scientific ones, you MUST solve them. For technical questions, provide step-by-step solutions, including any formulas used.
3.  **Fallback to Summary**: If no questions are found in the document, you MUST provide a brief, one-paragraph summary of its content.
4.  **Use the User's Prompt**: The "Prompt" from the user is a specific instruction. Use it to focus your analysis. For example, if the user says "Solve question 2," you must find and solve only question 2. If the prompt is general (e.g., "What is this?"), analyze the entire document according to the rules above.
5.  **Be Direct**: Do not state that you cannot answer. Your task is to analyze and solve, or summarize.

User Prompt: {{{prompt}}}
Document Content: {{media url=pdfDataUri}}`,
});

const analyzeUploadedPdfFlow = ai.defineFlow(
  {
    name: 'analyzeUploadedPdfFlow',
    inputSchema: AnalyzeUploadedPdfInputSchema,
    outputSchema: AnalyzeUploadedPdfOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
