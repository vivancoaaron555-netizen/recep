import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { generateSystemPrompt } from '../utils/generateSystemPrompt';
import { generateResponse, generateCallSummary, Message } from '../utils/groq';

const router = Router();

/**
 * POST /api/vapi/webhook
 * Handles Vapi call events. Vapi sends a POST with the call object and
 * a "message" field containing the conversation turn.
 *
 * Vapi webhook types:
 * - assistant-request: Vapi asks which assistant to use (dynamic assistant)
 * - function-call: when assistant calls a tool (e.g., createAppointment)
 * - end-of-call-report: sent after call ends with transcript
 * - transcript: real-time transcript updates
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const messageType = body?.message?.type;

    console.log('[vapi/webhook] Event type:', messageType);

    // ── assistant-request: Return dynamic assistant config ───────────────────
    if (messageType === 'assistant-request') {
      const callerNumber = body?.message?.call?.customer?.number || '';

      // Try to find company by phone number (Vapi sends number string, Twilio sends ID)
      const vapiPhoneNumber = body?.message?.call?.phoneNumber?.number || '';
      const phoneNumberId = body?.message?.call?.phoneNumberId || '';

      let phoneRecord: any = null;
      if (vapiPhoneNumber) {
        const { data } = await supabase
          .from('phone_numbers')
          .select('company_id')
          .eq('twilio_number', vapiPhoneNumber)
          .maybeSingle();
        phoneRecord = data;
      }
      if (!phoneRecord && phoneNumberId) {
        const { data } = await supabase
          .from('phone_numbers')
          .select('company_id')
          .eq('twilio_number', phoneNumberId)
          .maybeSingle();
        phoneRecord = data;
      }

      let company: any = null;
      let assistant: any = null;

      if (phoneRecord) {
        const { data: c } = await supabase
          .from('companies')
          .select('*')
          .eq('id', phoneRecord.company_id)
          .single();
        company = c;

        if (company) {
          const { data: a } = await supabase
            .from('assistants')
            .select('*')
            .eq('company_id', company.id)
            .eq('active', true)
            .single();
          assistant = a;
        }
      }

      if (!company || !assistant) {
        // Fallback generic assistant
        return res.json({
          assistant: {
            name: 'Sofia',
            model: {
              provider: 'groq',
              model: 'llama-3.3-70b-versatile',
              systemPrompt: 'Eres Sofia, una recepcionista virtual que SOLO habla español. Respondes SIEMPRE en español, sin importar el idioma en que te hablen. Saluda cordialmente, pregunta el nombre del cliente y en qué puedes ayudarle. Las respuestas deben ser breves y naturales.',
              maxTokens: 200,
              temperature: 0.7,
            },
            voice: {
              provider: 'elevenlabs',
              voiceId: 'g5CIjZEefAph4nQFVsP1',
            },
            language: 'es-ES',
            silenceTimeoutSeconds: 10,
            maxDurationSeconds: 300,
            backgroundSound: 'office',
            backgroundDenoisingEnabled: true,
            endCallPhrases: ['adiós', 'gracias', 'que tengas buen día', 'hasta luego'],
          },
        });
      }

      const systemPrompt = generateSystemPrompt(assistant, company);

      return res.json({
        assistant: {
          name: assistant.name,
          model: {
            provider: 'groq',
            model: 'llama-3.1-70b-versatile',
            systemPrompt,
            maxTokens: 200,
            temperature: 0.7,
          },
          voice: {
            provider: 'elevenlabs',
            voiceId: assistant.voice_id,
          },
          language: assistant.language || 'es',
          silenceTimeoutSeconds: 20,
          maxDurationSeconds: 600,
          backgroundSound: 'office',
          backgroundDenoisingEnabled: true,
        },
      });
    }

    // ── function-call: Handle tool calls (createAppointment) ─────────────────
    if (messageType === 'function-call') {
      const functionName = body?.message?.functionCall?.name;
      const params = body?.message?.functionCall?.parameters || {};

      if (functionName === 'createAppointment') {
        const companyId = body?.message?.call?.metadata?.companyId;

        if (companyId && params.name && params.phone && params.service && params.date) {
          const { data: appointment } = await supabase
            .from('appointments')
            .insert({
              company_id: companyId,
              patient_name: params.name,
              patient_phone: params.phone,
              service: params.service,
              date: new Date(params.date).toISOString(),
              status: 'pending',
              source: 'call',
              notes: params.notes || '',
            })
            .select()
            .single();

          return res.json({
            result: `Cita creada exitosamente para ${params.name} el ${params.date} para ${params.service}.`,
          });
        }
      }

      return res.json({ result: 'Función procesada' });
    }

    // ── end-of-call-report: Save call record ─────────────────────────────────
    if (messageType === 'end-of-call-report') {
      const call = body?.message?.call;
      const transcript = body?.message?.transcript || '';
      const durationSeconds = Math.round(body?.message?.durationSeconds || 0);
      const phoneFrom = call?.customer?.number || 'unknown';

      // Find company by phone number or metadata
      const companyId = call?.metadata?.companyId;

      if (companyId && transcript) {
        // Generate AI summary
        const summary = await generateCallSummary(transcript);

        // Check if appointment was created during this call
        const appointmentCreated = transcript.toLowerCase().includes('cita creada') ||
          transcript.toLowerCase().includes('agendado');

        await supabase.from('calls').insert({
          company_id: companyId,
          phone_from: phoneFrom,
          phone_to: call?.phoneNumberId || '',
          duration_seconds: durationSeconds,
          transcript,
          summary,
          appointment_created: appointmentCreated,
          vapi_call_id: call?.id,
          status: 'completed',
        });
      }

      return res.json({ received: true });
    }

    // For all other event types, acknowledge
    return res.json({ received: true });
  } catch (err) {
    console.error('[vapi/webhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
