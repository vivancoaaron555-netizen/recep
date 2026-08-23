import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { generateSystemPrompt } from '../utils/generateSystemPrompt';
import { generateResponse, generateCallSummary, Message } from '../utils/groq';
import { sendNewAppointmentEmail } from '../utils/email';
import { createNotification } from './notifications';
import { isCompanyAccessActive } from '../utils/access';
import { getCompanyPlan, countMinutesThisMonth } from '../utils/plans';

const router = Router();

/** Voz femenina por defecto (ElevenLabs — Sofia) para los asistentes de respaldo. */
const FALLBACK_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';

/**
 * Fallback assistant used when a company has no access or reached its plan limit.
 */
function unavailableAssistant(companyName: string) {
  return {
    assistant: {
      name: 'Sofia',
      model: {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        systemPrompt: `Eres Sofia, la recepcionista virtual de ${companyName}. El servicio de la empresa está actualmente inactivo porque la prueba gratuita terminó o el plan no está activo. Debes informar al cliente de forma amable y breve: "Lo sentimos, en este momento el servicio no está disponible. Por favor intenta de nuevo más tarde." No des más detalles. Responde siempre en español, en 1 o 2 frases cortas.`,
        maxTokens: 100,
        temperature: 0.5,
      },
      voice: {
        provider: '11labs',
        voiceId: FALLBACK_VOICE_ID,
      },
      language: 'es-ES',
      silenceTimeoutSeconds: 5,
      maxDurationSeconds: 60,
    },
  };
}

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

      console.log(`[vapi/webhook] assistant-request: caller=${callerNumber}, dialed=${vapiPhoneNumber}, phoneNumberId=${phoneNumberId}`);

      let phoneRecord: any = null;
      if (vapiPhoneNumber) {
        const { data } = await supabase
          .from('phone_numbers')
          .select('company_id')
          .eq('twilio_number', vapiPhoneNumber)
          .limit(1);
        if (data && data.length > 0) phoneRecord = data[0];
      }
      if (!phoneRecord && phoneNumberId) {
        const { data } = await supabase
          .from('phone_numbers')
          .select('company_id')
          .eq('twilio_number', phoneNumberId)
          .limit(1);
        if (data && data.length > 0) phoneRecord = data[0];
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

      // If no dedicated number found (shared/trial number), look up by caller's phone
      if (!company) {
        const { data: c } = await supabase
          .from('companies')
          .select('*')
          .eq('phone', callerNumber)
          .maybeSingle();
        if (c) {
          company = c;
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
        console.log(`[vapi/webhook] No company/assistant found for caller=${callerNumber}, dialed=${vapiPhoneNumber}. Using fallback.`);
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
              provider: '11labs',
              voiceId: FALLBACK_VOICE_ID,
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

      // Check if the company still has access (trial expired / canceled)
      const hasAccess = await isCompanyAccessActive(company.id);
      if (!hasAccess) {
        console.log(`[vapi/webhook] Company ${company.id} (${company.name}) has no access. Trial expired or plan canceled.`);
        return res.json(unavailableAssistant(company.name));
      }

      // Check monthly call limit by plan (in minutes)
      const planInfo = await getCompanyPlan(company.id);
      if (planInfo?.active && planInfo.limits.minutes !== Infinity) {
        const used = await countMinutesThisMonth(company.id);
        if (used >= planInfo.limits.minutes) {
          console.log(`[vapi/webhook] Company ${company.id} reached minute limit: ${used}/${planInfo.limits.minutes}`);
          return res.json(unavailableAssistant(company.name));
        }
      }

      console.log(`[vapi/webhook] Serving assistant "${assistant.name}" for company "${company.name}" (${company.id})`);

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
          // Preferimos la voz configurada por la empresa; si no está o es
          // inválida, usamos Sofía (femenina ElevenLabs) como fallback para
          // nunca quedar con la voz por defecto de Vapi (masculina).
          voice: {
            provider: '11labs',
            voiceId: (assistant.voice_id as string) || FALLBACK_VOICE_ID,
          },
          language: assistant.language || 'es',
          silenceTimeoutSeconds: 20,
          maxDurationSeconds: 600,
          backgroundSound: 'office',
          backgroundDenoisingEnabled: true,
          metadata: {
            companyId: company.id,
          },
        },
      });
    }

    // ── function-call: Handle tool calls (createAppointment) ─────────────────
    if (messageType === 'function-call') {
      const functionName = body?.message?.functionCall?.name;
      const params = body?.message?.functionCall?.parameters || {};

      if (functionName === 'createAppointment') {
        const callerPhone = body?.message?.call?.customer?.number || '';
        let companyId = body?.message?.call?.metadata?.companyId;

        if (!companyId && callerPhone) {
          const { data: companyByPhone } = await supabase
            .from('companies')
            .select('id')
            .eq('phone', callerPhone)
            .maybeSingle();
          if (companyByPhone) companyId = companyByPhone.id;
        }

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

          // Send notification + email
          if (appointment) {
            const title = 'Nueva cita agendada por llamada';
            const message = `${params.name} agendó ${params.service} para el ${params.date}`;
            await createNotification(companyId, 'appointment', title, message, { appointment_id: appointment.id });
            sendNewAppointmentEmail(companyId, {
              patient_name: params.name,
              patient_phone: params.phone,
              service: params.service,
              date: params.date,
            }).catch(e => console.error('[email] Error sending:', e));
          }

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
      const recordingUrl = call?.artifact?.recordingUrl || call?.recordingUrl || '';
      const dialedNumber = call?.phoneNumber?.number || call?.phoneNumberId || '';

      console.log(`[vapi/webhook] end-of-call-report: from=${phoneFrom}, to=${dialedNumber}, duration=${durationSeconds}s`);

      // Find company by metadata, then by phone_numbers table, then by caller's phone
      let companyId = call?.metadata?.companyId;

      if (!companyId && dialedNumber) {
        const { data: phoneMatch } = await supabase
          .from('phone_numbers')
          .select('company_id')
          .eq('twilio_number', dialedNumber)
          .limit(1);
        if (phoneMatch && phoneMatch.length > 0) companyId = phoneMatch[0].company_id;
      }

      if (!companyId && phoneFrom) {
        const { data: companyByPhone } = await supabase
          .from('companies')
          .select('id')
          .eq('phone', phoneFrom)
          .maybeSingle();
        if (companyByPhone) companyId = companyByPhone.id;
      }

      if (companyId && transcript) {
        // Generate AI summary
        const summary = await generateCallSummary(transcript);

        // Check if appointment was created during this call
        const appointmentCreated = transcript.toLowerCase().includes('cita creada') ||
          transcript.toLowerCase().includes('agendado');

        const { error: insertError } = await supabase.from('calls').insert({
          company_id: companyId,
          phone_from: phoneFrom,
          phone_to: dialedNumber,
          duration_seconds: durationSeconds,
          transcript,
          summary,
          recording_url: recordingUrl,
          appointment_created: appointmentCreated,
          vapi_call_id: call?.id,
          status: 'completed',
        });

        if (insertError) {
          console.error('[vapi/webhook] Failed to save call:', insertError);
        } else {
          console.log(`[vapi/webhook] Call saved for company ${companyId}`);
        }
      } else {
        console.log(`[vapi/webhook] Call NOT saved: companyId=${companyId}, hasTranscript=${!!transcript}`);
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
