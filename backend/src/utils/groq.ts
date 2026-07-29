import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export const MODEL = 'llama-3.3-70b-versatile';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate a chat completion using Groq
 */
export async function generateResponse(
  messages: Message[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages,
    max_tokens: options?.maxTokens || 200,
    temperature: options?.temperature || 0.7,
    stream: false,
  });

  return completion.choices[0]?.message?.content || '';
}

/**
 * Generate a summary of a call transcript
 */
export async function generateCallSummary(transcript: string): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `Eres un asistente que resume conversaciones telefónicas de forma concisa.
      Extrae: motivo de la llamada, si se agendó cita (sí/no), datos de la cita si aplica, y resultado final.
      Responde en español, máximo 3 oraciones.`,
    },
    {
      role: 'user',
      content: `Resume esta conversación:\n\n${transcript}`,
    },
  ];

  return generateResponse(messages, { maxTokens: 300, temperature: 0.3 });
}

export { groq };
