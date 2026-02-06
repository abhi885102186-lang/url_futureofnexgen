'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-uploaded-document.ts';
import '@/ai/flows/voice-based-assistant.ts';
import '@/ai/flows/analyze-uploaded-image.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/translate-text.ts';
import '@/ai/flows/generate-image.ts';
import '@/ai/flows/real-time-data-tools.ts';
import '@/ai/flows/analyze-uploaded-pdf.ts';
