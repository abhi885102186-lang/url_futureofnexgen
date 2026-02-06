
'use server';

/**
 * @fileOverview AI flow for analyzing uploaded documents (txt, pdf, doc) to extract relevant information.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeDocumentInputSchema = z.object({
  documentTextContent: z
    .string()
    .describe(
      "The extracted text content from a document (txt, pdf, or docx)."
    ),
  prompt: z.string().optional().describe('An optional prompt to guide the document analysis.'),
});
export type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;

const AnalyzeDocumentOutputSchema = z.object({
  analysis: z.string().describe('The analysis of the document content.'),
});
export type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;

export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeDocumentPrompt',
  input: {schema: AnalyzeDocumentInputSchema},
  output: {schema: AnalyzeDocumentOutputSchema},
  prompt: `You are an AI assistant with expertise in analyzing documents. Your primary goal is to identify any questions within the provided document content and answer them directly and thoroughly.

Follow these rules:
1.  **Analyze the Entire Document**: Read the complete "Document Content" below.
2.  **Identify and Answer Questions**: If you find any questions, especially mathematical or scientific ones, you MUST solve them. For technical questions, provide step-by-step solutions, including any formulas used.
3.  **Fallback to Summary**: If no questions are found in the document, you MUST provide a brief, one-paragraph summary of its content.
4.  **Use the User's Prompt**: The "Prompt" from the user is a specific instruction. Use it to focus your analysis. For example, if the user says "Solve question 2," you must find and solve only question 2. If the prompt is general (e.g., "What is this?"), analyze the entire document according to the rules above.
5.  **Be Direct**: Do not state that you cannot answer. Your task is to analyze and solve, or summarize.

User Prompt: {{{prompt}}}
Document Content: {{{documentTextContent}}}`,
});

const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
