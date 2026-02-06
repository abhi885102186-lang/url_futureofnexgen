
'use server';
/**
 * @fileOverview Tools for providing real-time data to the AI assistant.
 *
 * - getCurrentDate - Returns the current date and time.
 * - getWeather - Returns the current weather for a given location (mock data).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const getCurrentDate = ai.defineTool(
  {
    name: 'getCurrentDate',
    description: 'Get the current date and time.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    return new Date().toLocaleString();
  }
);

export const getWeather = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Get the current weather for a specific location.',
    inputSchema: z.object({
      location: z.string().describe('The city and state, e.g., San Francisco, CA'),
    }),
    outputSchema: z.object({
        temperature: z.string(),
        conditions: z.string(),
    }),
  },
  async ({ location }) => {
    // In a real app, you would call a weather API here.
    // For this example, we'll return mock data.
    if (location.toLowerCase().includes('london')) {
        return {
            temperature: '15°C',
            conditions: 'Cloudy with a chance of rain',
        };
    } else if (location.toLowerCase().includes('tokyo')) {
        return {
            temperature: '28°C',
            conditions: 'Sunny and humid',
        };
    } else {
        return {
            temperature: '22°C',
            conditions: 'Pleasantly sunny',
        };
    }
  }
);
